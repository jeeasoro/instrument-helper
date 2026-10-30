/**
 * Chord recognition by chroma template matching.
 *
 * Full polyphonic transcription — working out every individual note in a
 * strummed chord — is an open research problem. Recognising *which chord* was
 * played is a much smaller one: fold the spectrum into twelve pitch-class bins,
 * discard octave information entirely, and compare the shape against a set of
 * chord templates. That is robust enough for a strummed guitar and cheap enough
 * to run continuously.
 */

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MIN_HZ = 75;     // just below the open low E
const MAX_HZ = 2200;   // above this is mostly harmonics and string noise
const FLOOR_DB = -72;  // bins quieter than this carry no useful information
const SHARPEN = 1.8;   // exponent applied to the chroma — see chromaFromSpectrum
const COMPLEXITY_PENALTY = 0.055;  // per extra note, biasing toward simple triads

/**
 * `complexity` breaks ties toward simpler chords. A major triad's notes are a
 * subset of several richer chords, so without this every G reads as G6 or Em7.
 */
export const CHORD_TYPES = [
  { suffix: '', intervals: [0, 4, 7], complexity: 0 },
  { suffix: 'm', intervals: [0, 3, 7], complexity: 0 },
  { suffix: '7', intervals: [0, 4, 7, 10], complexity: 1 },
  { suffix: 'm7', intervals: [0, 3, 7, 10], complexity: 1 },
  { suffix: 'maj7', intervals: [0, 4, 7, 11], complexity: 1 },
  { suffix: 'sus4', intervals: [0, 5, 7], complexity: 1 },
  { suffix: 'sus2', intervals: [0, 2, 7], complexity: 1 },
  { suffix: 'dim', intervals: [0, 3, 6], complexity: 2 },
];

function buildTemplates() {
  const out = [];
  for (let root = 0; root < 12; root++) {
    for (const type of CHORD_TYPES) {
      const vector = new Float32Array(12);
      // The root and fifth dominate a guitar voicing because they get doubled
      // across strings, so weight them above the colour tones.
      type.intervals.forEach((iv, idx) => {
        vector[(root + iv) % 12] = idx === 0 ? 1.0 : idx === 2 ? 0.9 : 0.75;
      });
      let norm = 0;
      for (const v of vector) norm += v * v;
      norm = Math.sqrt(norm) || 1;
      for (let i = 0; i < 12; i++) vector[i] /= norm;

      out.push({
        name: NAMES[root] + type.suffix,
        root,
        suffix: type.suffix,
        complexity: type.complexity,
        intervals: type.intervals,
        vector,
      });
    }
  }
  return out;
}

export const TEMPLATES = buildTemplates();

/**
 * Fold an FFT magnitude spectrum into 12 pitch classes.
 *
 * `range` narrows the bins considered, which is instrument-specific: a guitar's
 * chord voicings live between the open low E and about 2 kHz, while a piano
 * reaches an octave lower and needs the window opened to match.
 */
export function chromaFromSpectrum(freqData, sampleRate, fftSize, out, range) {
  const chroma = out || new Float32Array(12);
  chroma.fill(0);

  const lowHz = (range && range.minHz) || MIN_HZ;
  const highHz = (range && range.maxHz) || MAX_HZ;
  const binHz = sampleRate / fftSize;
  const minBin = Math.max(1, Math.floor(lowHz / binHz));
  const maxBin = Math.min(freqData.length - 1, Math.ceil(highHz / binHz));

  let energy = 0;
  for (let b = minBin; b <= maxBin; b++) {
    const db = freqData[b];
    if (db < FLOOR_DB) continue;

    const freq = b * binHz;
    const midi = 69 + 12 * Math.log2(freq / 440);
    const nearest = Math.round(midi);
    // Bins landing between two semitones are smearing, not signal.
    if (Math.abs(midi - nearest) > 0.35) continue;

    const mag = Math.pow(10, db / 20);
    chroma[((nearest % 12) + 12) % 12] += mag;
    energy += mag;
  }

  if (energy > 0) {
    // Sharpen before normalising. Harmonic bleed leaves a little energy in
    // nearly every pitch class, and a diffuse chroma flatters templates with
    // more notes in them — which is how a plain G comes out as Gmaj7.
    let total = 0;
    for (let i = 0; i < 12; i++) {
      chroma[i] = Math.pow(chroma[i] / energy, SHARPEN);
      total += chroma[i];
    }
    if (total > 0) for (let i = 0; i < 12; i++) chroma[i] /= total;
  }
  return { chroma, energy };
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  for (let i = 0; i < 12; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
  }
  na = Math.sqrt(na);
  return na > 0 ? dot / na : 0;
}

/**
 * Best-matching chords for a chroma vector, best first.
 * `confidence` is the winner's margin over the runner-up, which is a better
 * signal than the raw score: templates overlap heavily, so a high score with a
 * close rival means "some chord in this family", not "this chord".
 */
export function matchChord(chroma, limit = 3) {
  const scored = TEMPLATES.map((tpl) => ({
    name: tpl.name,
    root: tpl.root,
    suffix: tpl.suffix,
    score: cosine(chroma, tpl.vector) - tpl.complexity * COMPLEXITY_PENALTY,
  })).sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit);
  const confidence = top.length > 1 ? top[0].score - top[1].score : top[0].score;
  return { best: top[0], alternatives: top.slice(1), confidence, all: top };
}

const PC_INDEX = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6,
  Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

/** Map any chord name onto the nearest template we actually model. */
export function templateFor(name) {
  const m = /^([A-G][#b]?)(.*)$/.exec(String(name || '').trim());
  if (!m) return null;
  const root = PC_INDEX[m[1]];
  if (root === undefined) return null;

  let quality = m[2].split('/')[0].toLowerCase();
  // Colour tones we do not model collapse onto the triad they are built on.
  if (/^(add\d+|6|9|11|13|maj9|)$/.test(quality)) quality = '';
  else if (/^(m|min)$/.test(quality)) quality = 'm';
  else if (/^(m|min)(6|9|11|add\d+)$/.test(quality)) quality = 'm';
  else if (/^(maj7|M7)$/.test(quality)) quality = 'maj7';
  else if (/^(m7|min7)$/.test(quality)) quality = 'm7';
  else if (/^7$/.test(quality)) quality = '7';
  else if (/^sus4?$/.test(quality)) quality = 'sus4';
  else if (/^sus2$/.test(quality)) quality = 'sus2';
  else if (/^(dim|o)\d*$/.test(quality)) quality = 'dim';
  else quality = '';

  return TEMPLATES.find((tpl) => tpl.root === root && tpl.suffix === quality) || null;
}

/**
 * How well a chroma matches one specific expected chord.
 *
 * This is the question practice mode actually needs, and it is much easier
 * than open classification: "is this a G?" avoids ever having to separate G
 * from Gmaj7, because both answer yes to the thing the learner cares about.
 */
export function scoreAgainst(chroma, expectedName) {
  const tpl = templateFor(expectedName);
  if (!tpl) return null;
  return { score: cosine(chroma, tpl.vector), template: tpl };
}

/**
 * How well a chroma matches an arbitrary set of notes.
 *
 * The chord version above can only ask about the chords it has templates for.
 * A pasted piano sheet is note-level — three notes that may not spell any named
 * chord at all — so the template is built on the spot from the pitch classes.
 */
export function scoreAgainstNotes(chroma, midis) {
  if (!midis || !midis.length) return 0;
  const vector = new Float32Array(12);
  for (const midi of midis) vector[((midi % 12) + 12) % 12] = 1;
  let norm = 0;
  for (const v of vector) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < 12; i++) vector[i] /= norm;
  return cosine(chroma, vector);
}

/** Do two chord names mean the same grip? Handles enharmonics and B/Bb. */
export function sameChord(a, b) {
  if (!a || !b) return false;
  const norm = (n) => {
    const m = /^([A-G][#b]?)(.*)$/.exec(String(n).trim());
    if (!m) return String(n).trim().toLowerCase();
    const pcIndex = {
      C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6,
      Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
    }[m[1]];
    // Ignore an added bass note; the grip is what matters here.
    let quality = m[2].split('/')[0].toLowerCase();
    if (quality === 'maj' || quality === 'M') quality = '';
    if (quality === 'min') quality = 'm';
    return `${pcIndex}:${quality}`;
  };
  return norm(a) === norm(b);
}

/**
 * Attach a live chord detector to an audio source.
 * Returns { read(), disconnect() } — `read` gives the current chroma and match.
 *
 * `options.audio` and `options.chroma` come from `instrumentConfig()`, so the
 * filters follow the instrument rather than being fixed to a guitar's range.
 */
export function createChordDetector(ctx, source, options = {}) {
  const audio = options.audio || {};
  const range = options.chroma || null;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = options.fftSize || 8192;
  analyser.smoothingTimeConstant = options.smoothing ?? 0.5;

  // Separate analyser for loudness. The spectrum one is time-smoothed, which
  // is right for a stable chroma and wrong for judging how loud you are now.
  const levelAnalyser = ctx.createAnalyser();
  levelAnalyser.fftSize = 2048;
  levelAnalyser.smoothingTimeConstant = 0;

  // Manual input gain, first in the chain so everything downstream — the level
  // meter included — reflects what the analysis actually sees.
  const inputGain = ctx.createGain();
  inputGain.gain.value = options.gainLinear ?? 1;

  // 45 Hz for a guitar, not 70. A highpass close to the open low E at 82.4 Hz
  // attenuates the fundamental that carries the root of every E-shaped chord —
  // the same mistake that hid the low E from the tuner. Mains hum is removed by
  // the notch instead, which does not touch the guitar's range.
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = audio.highpass ?? 45;

  const notch = ctx.createBiquadFilter();
  notch.type = 'notch';
  notch.frequency.value = options.mainsHz || 50;
  // Narrow for a piano: G1 and G#1 sit either side of 50 Hz, so the guitar's
  // wide notch would remove two real notes rather than just hum.
  notch.Q.value = audio.notchQ ?? 8;

  source.connect(inputGain);
  inputGain.connect(highpass);
  highpass.connect(notch);
  notch.connect(analyser);
  notch.connect(levelAnalyser);

  // A silent sink guarantees the graph is pulled. An analyser with no output
  // connection is processed in most browsers, but not reliably in all of them.
  const sink = ctx.createGain();
  sink.gain.value = 0;
  analyser.connect(sink).connect(ctx.destination);

  const freqData = new Float32Array(analyser.frequencyBinCount);
  const timeData = new Float32Array(levelAnalyser.fftSize);
  const chromaBuf = new Float32Array(12);

  return {
    analyser,
    read() {
      levelAnalyser.getFloatTimeDomainData(timeData);
      let sumSq = 0;
      let peak = 0;
      for (let i = 0; i < timeData.length; i++) {
        const s = timeData[i];
        sumSq += s * s;
        const a = s < 0 ? -s : s;
        if (a > peak) peak = a;
      }
      const rms = Math.sqrt(sumSq / timeData.length);

      analyser.getFloatFrequencyData(freqData);
      const { chroma, energy } = chromaFromSpectrum(
        freqData, ctx.sampleRate, analyser.fftSize, chromaBuf, range);

      if (energy <= 0) {
        return { chroma, energy, rms, peak, best: null, confidence: 0, alternatives: [] };
      }
      return { chroma, energy, rms, peak, ...matchChord(chroma) };
    },
    /** Change the input gain without tearing down the graph. */
    setGainLinear(value) {
      inputGain.gain.value = value;
    },
    disconnect() {
      try {
        source.disconnect(highpass);
        highpass.disconnect();
        notch.disconnect();
        analyser.disconnect();
        sink.disconnect();
      } catch { /* already torn down */ }
    },
  };
}
