/**
 * Timing for practice.
 *
 * A chord sheet carries no tempo — it says which chords and roughly where in
 * the words they change, never how fast. So timing has to come from two
 * places: a tempo the player sets, and how long each chord lasts relative to
 * its neighbours, which *can* be estimated from the sheet.
 *
 * The estimate uses horizontal spacing: a chord sitting over twenty characters
 * of lyric sounds about twice as long as one sitting over ten. That is a rough
 * proxy — it assumes the sheet was typed with the chords roughly aligned to the
 * words — but it is free, and much better than assuming every chord is equal.
 */

/** Durations that read as musical, so estimates land on plausible values. */
const QUANTISE = [1, 2, 3, 4, 6, 8];

const nearest = (value, options) =>
  options.reduce((best, o) => (Math.abs(o - value) < Math.abs(best - value) ? o : best), options[0]);

/**
 * Beats per chord, estimated from how much lyric each one covers.
 * `steps` are the practice steps ({ chord, lineIndex, segIndex }), `lines` the
 * parsed sheet. Returns one beat count per step.
 */
export function estimateBeats(steps, lines, baseBeats = 4) {
  const widths = steps.map((step) => {
    const line = lines[step.lineIndex];
    const seg = line && line.segments && line.segments[step.segIndex];
    // Fall back to the base length when there is no lyric to measure against.
    if (!seg) return null;
    const len = (seg.text || '').length;
    return len > 0 ? len : null;
  });

  const known = widths.filter((w) => w !== null).sort((a, b) => a - b);
  if (!known.length) return steps.map(() => baseBeats);
  const median = known[Math.floor(known.length / 2)] || 1;

  return widths.map((w) => {
    if (w === null) return baseBeats;
    const scaled = (w / median) * baseBeats;
    return nearest(Math.max(1, Math.min(8, scaled)), QUANTISE);
  });
}

/** Fixed-length alternative — predictable, and usually right for strumming. */
export function fixedBeats(steps, beats = 4) {
  return steps.map(() => beats);
}

/**
 * A metronome with a lookahead scheduler.
 *
 * setTimeout is far too jittery to place clicks on, so the timer only decides
 * *what* to schedule; the audio clock decides when it actually sounds.
 */
export function createMetronome(ctx, { beatsPerBar = 4, onBeat } = {}) {
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD = 0.12;

  let timer = null;
  let nextNoteTime = 0;
  let beat = 0;
  let bpm = 80;
  let running = false;
  let muted = false;

  function click(time, accent) {
    if (muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1600 : 900;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.35 : 0.2, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  function schedule() {
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const accent = beat % beatsPerBar === 0;
      click(nextNoteTime, accent);
      if (onBeat) onBeat({ beat, time: nextNoteTime, accent });
      nextNoteTime += 60 / bpm;
      beat++;
    }
  }

  return {
    start(startBpm) {
      if (running) return;
      bpm = startBpm || bpm;
      running = true;
      beat = 0;
      nextNoteTime = ctx.currentTime + 0.1;
      timer = setInterval(schedule, LOOKAHEAD_MS);
    },
    stop() {
      running = false;
      if (timer) clearInterval(timer);
      timer = null;
    },
    setBpm(value) { bpm = value; },
    setMuted(value) { muted = value; },
    get bpm() { return bpm; },
    get running() { return running; },
    /** Audio-clock time the given beat index falls on. */
    timeOfBeat(index) { return nextNoteTime + (index - beat) * (60 / bpm); },
  };
}

/**
 * Tap tempo: average the gaps between recent taps, discarding a stale run so
 * a pause between attempts does not poison the average.
 */
export function createTapTempo({ maxGapMs = 2500, minTaps = 2 } = {}) {
  let taps = [];
  return {
    tap() {
      const now = performance.now();
      if (taps.length && now - taps[taps.length - 1] > maxGapMs) taps = [];
      taps.push(now);
      if (taps.length > 8) taps.shift();
      if (taps.length < minTaps) return null;

      const gaps = [];
      for (let i = 1; i < taps.length; i++) gaps.push(taps[i] - taps[i - 1]);
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const bpm = Math.round(60000 / mean);
      return bpm >= 30 && bpm <= 240 ? bpm : null;
    },
    reset() { taps = []; },
  };
}

/** Turn per-chord beat counts into a schedule of start/end times in beats. */
export function buildSchedule(beatsPerChord) {
  let at = 0;
  return beatsPerChord.map((beats) => {
    const entry = { startBeat: at, beats, endBeat: at + beats };
    at += beats;
    return entry;
  });
}

/** How a played chord sat against its window. */
export function rateTiming(offsetBeats, tolerance = 0.35) {
  if (Math.abs(offsetBeats) <= tolerance) return 'onTime';
  return offsetBeats < 0 ? 'early' : 'late';
}
