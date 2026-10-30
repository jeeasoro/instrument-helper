/**
 * AudioWorklet pitch detector using the YIN algorithm.
 *
 * Runs coarse-to-fine: YIN over a 2:1 decimated copy of the frame (cheap, and
 * the reduced bandwidth suppresses the high harmonics that cause octave errors
 * on wound guitar strings), then a narrow full-rate refinement pass around the
 * coarse period so sub-sample precision isn't lost to the decimation.
 *
 * Everything is preallocated — no allocation happens on the audio thread.
 */

// Defaults are the guitar's; `processorOptions` overrides them per instrument.
// The search range is not cosmetic — it sets `maxLag`, and the difference
// function is O(maxLag × frameSize), so widening it downward for a piano costs
// real time on the audio thread.
const MIN_FREQ = 65;    // below drop-D (73.4 Hz), which is below open low E (82.4 Hz)
const MAX_FREQ = 1400;  // a little above high E at the 24th fret (1318.5 Hz)
const REFINE_SPAN = 4;  // full-rate lags searched either side of the coarse estimate

class PitchProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = options.processorOptions || {};

    this.frameSize = opts.frameSize || 2048;
    this.hopSize = opts.hopSize || 512;
    this.threshold = opts.threshold ?? 0.12;
    // Deliberately low. The low E arrives quieter than every other string once
    // the mic's own bass rolloff is accounted for, and an aggressive RMS gate
    // silently drops it. Rejection is the clarity gate's job, not this one's.
    this.rmsGate = opts.rmsGate ?? 0.0015;

    this.sr = sampleRate;
    this.decSize = this.frameSize >> 1;
    const decRate = this.sr / 2;

    const minFreq = opts.minFreq || MIN_FREQ;
    const maxFreq = opts.maxFreq || MAX_FREQ;
    this.maxLag = Math.min(Math.floor(decRate / minFreq), this.decSize >> 1);
    this.minLag = Math.max(2, Math.floor(decRate / maxFreq));

    this.ring = new Float32Array(this.frameSize);
    this.dec = new Float32Array(this.decSize);
    this.diff = new Float32Array(this.maxLag + 1);
    this.cmnd = new Float32Array(this.maxLag + 1);
    this.refineBuf = new Float32Array(REFINE_SPAN * 2 + 2);

    this.filled = 0;
    this.sinceHop = 0;

    this.port.onmessage = (e) => {
      if (e.data && e.data.type === 'config') {
        if (typeof e.data.threshold === 'number') this.threshold = e.data.threshold;
        if (typeof e.data.rmsGate === 'number') this.rmsGate = e.data.rmsGate;
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;

    const n = channel.length;
    this.ring.copyWithin(0, n);
    this.ring.set(channel, this.frameSize - n);
    this.filled = Math.min(this.filled + n, this.frameSize);
    this.sinceHop += n;

    if (this.filled >= this.frameSize && this.sinceHop >= this.hopSize) {
      this.sinceHop = 0;
      this.port.postMessage(this.analyze());
    }
    return true;
  }

  analyze() {
    const ring = this.ring;
    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < this.frameSize; i++) {
      const v = ring[i];
      sumSq += v * v;
      const a = v < 0 ? -v : v;
      if (a > peak) peak = a;
    }
    const rms = Math.sqrt(sumSq / this.frameSize);

    if (rms < this.rmsGate) {
      return { frequency: 0, clarity: 0, rms, peak };
    }

    // 2:1 decimation with pair averaging (a crude but adequate anti-alias,
    // on top of the lowpass already applied in the graph).
    const dec = this.dec;
    for (let i = 0, j = 0; i < this.decSize; i++, j += 2) {
      dec[i] = (ring[j] + ring[j + 1]) * 0.5;
    }

    const coarse = this.yin(dec, this.decSize);
    if (!coarse) {
      return { frequency: 0, clarity: 0, rms, peak };
    }

    const tau = this.refine(coarse.tau * 2);
    return { frequency: this.sr / tau, clarity: coarse.clarity, rms, peak };
  }

  /** Standard YIN steps 1-4 over `buf`. Returns { tau, clarity } or null. */
  yin(buf, n) {
    const d = this.diff;
    const cmnd = this.cmnd;
    const maxLag = this.maxLag;

    // Step 1: difference function.
    d[0] = 0;
    for (let tau = 1; tau <= maxLag; tau++) {
      let sum = 0;
      const lim = n - tau;
      for (let i = 0; i < lim; i++) {
        const delta = buf[i] - buf[i + tau];
        sum += delta * delta;
      }
      d[tau] = sum;
    }

    // Step 2: cumulative mean normalised difference.
    cmnd[0] = 1;
    let running = 0;
    for (let tau = 1; tau <= maxLag; tau++) {
      running += d[tau];
      cmnd[tau] = running > 0 ? (d[tau] * tau) / running : 1;
    }

    // Step 3: absolute threshold — first dip below it, walked down to its floor.
    let tau = -1;
    for (let t = this.minLag; t <= maxLag; t++) {
      if (cmnd[t] < this.threshold) {
        while (t + 1 <= maxLag && cmnd[t + 1] < cmnd[t]) t++;
        tau = t;
        break;
      }
    }
    if (tau < 0) return null;

    // Step 4: parabolic interpolation around the minimum.
    let interpolated = tau;
    if (tau > this.minLag && tau < maxLag) {
      const s0 = cmnd[tau - 1];
      const s1 = cmnd[tau];
      const s2 = cmnd[tau + 1];
      const den = s0 - 2 * s1 + s2;
      if (den !== 0) interpolated = tau + (0.5 * (s0 - s2)) / den;
    }

    return {
      tau: interpolated,
      clarity: Math.max(0, Math.min(1, 1 - cmnd[tau])),
    };
  }

  /** Narrow full-rate search around `approxTau` to recover decimated precision. */
  refine(approxTau) {
    const ring = this.ring;
    const n = this.frameSize;
    const vals = this.refineBuf;

    const lo = Math.max(2, Math.round(approxTau) - REFINE_SPAN);
    const hi = Math.min((n >> 1) - 1, lo + REFINE_SPAN * 2);

    let bestIdx = 0;
    let bestVal = Infinity;
    for (let tau = lo; tau <= hi; tau++) {
      let sum = 0;
      const lim = n - tau;
      for (let i = 0; i < lim; i++) {
        const delta = ring[i] - ring[i + tau];
        sum += delta * delta;
      }
      const idx = tau - lo;
      vals[idx] = sum;
      if (sum < bestVal) {
        bestVal = sum;
        bestIdx = idx;
      }
    }

    let tau = lo + bestIdx;
    if (bestIdx > 0 && bestIdx < hi - lo) {
      const s0 = vals[bestIdx - 1];
      const s1 = vals[bestIdx];
      const s2 = vals[bestIdx + 1];
      const den = s0 - 2 * s1 + s2;
      if (den !== 0) tau += (0.5 * (s0 - s2)) / den;
    }
    return tau;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
