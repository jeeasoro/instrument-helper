/**
 * Sound for the MIDI path.
 *
 * A MIDI *controller* has no sound of its own — it sends note numbers and
 * nothing else — so without this, playing into the app is silent. That is fine
 * for a digital piano with speakers and useless for everything else.
 *
 * The sound is synthesised rather than sampled. A sampled piano is unarguably
 * better, but the good free ones are tens of megabytes and the alternative is
 * pulling them from a CDN at runtime; this project has no dependencies and no
 * build step, and both options would end that. What is here instead is additive
 * synthesis with the acoustics written down: a struck string's partials are
 * stretched slightly sharp, the high ones die first, a harder strike excites
 * more of them, and two or three strings per note beat against each other.
 * Those four facts are most of what makes a piano recognisable.
 *
 * What it does not model is the body resonance and sympathetic ringing of a
 * real instrument, which is the honest gap between this and a sampled piano.
 */

import { midiToFreq } from './notes.js';
import { t } from './i18n.js';

const STORAGE_VOICE = 'instrument-helper.synthVoice';
const STORAGE_VOLUME = 'instrument-helper.synthVolumeDb';
const STORAGE_SUSTAIN = 'instrument-helper.synthSustain';

export const MIN_VOLUME_DB = -40;
export const MAX_VOLUME_DB = 6;
export const DEFAULT_VOLUME_DB = -8;

/**
 * Notes sounding at once before the oldest is let go. A pedalled passage can
 * pile up indefinitely otherwise, and each note is a dozen oscillators.
 */
const MAX_NOTES = 14;

const dbToLinear = (db) => Math.pow(10, db / 20);

/* ----------------------------------------------------------------- voices */

/**
 * Decay times, in seconds, as a function of pitch. Bass strings ring for half a
 * minute and the top octave is gone in a second — a single decay setting for
 * the whole keyboard is the most obvious tell of a synthesised piano.
 */
const decayCurve = (atA0, halveEvery) => (midi) =>
  atA0 * Math.pow(2, -(midi - 21) / halveEvery);

export const VOICES = {
  grand: {
    id: 'grand',
    maxPartials: 14,
    /** Partial k starts at 1/k^tilt. Lower tilt is a brighter instrument. */
    tilt: 1.15,
    /** How much faster partial k decays than the fundamental. */
    partialDecay: 0.5,
    decayAt: decayCurve(26, 19),
    // Stiff strings do not vibrate at exact multiples: partial k sits at
    // k·f0·√(1 + B·k²), a little sharp, and B grows towards the treble where
    // the strings are shortest. This is the same stretch that makes tuners
    // deliberately stretch a piano's tuning, and it is audible as warmth.
    //
    // Calibrated against the figure a tuner would quote: with this B, the 14th
    // partial of middle C lands about 19 cents sharp, which is a good grand.
    // The first guess here was nearly double that and read as clangy — past
    // roughly a quarter-tone the stretch stops sounding warm and starts
    // sounding out of tune.
    inharmonicity: (midi) => 0.00007 * Math.pow(2, (midi - 48) / 18),
    // Three strings per note, but only across the lowest partials: that is
    // where the beating between them is audible, and detuning the whole
    // spectrum would triple the oscillator count for nothing.
    unison: { voices: 3, cents: 1.4, upTo: 3 },
    // The long tail. A struck string does not decay as one exponential: it
    // loses energy fast through the bridge at first ("prompt sound"), then
    // hangs on far longer in a second, weakly-coupled polarisation
    // ("aftersound"). Modelled as one exponential, middle C was gone in three
    // seconds; on a real grand it is still there after ten.
    aftersound: { level: 0.17, decayScale: 4.5, upTo: 5, cents: 6 },
    attack: 0.004,
    release: 0.22,
    sustainLevel: 0,
    hammer: 0.30,
    velocity: { sensitive: true, curve: 1.6, brightness: 1.0 },
    reverbSend: 0.20,
    level: 0.9,
  },

  upright: {
    id: 'upright',
    maxPartials: 11,
    tilt: 1.4,
    partialDecay: 0.75,
    decayAt: decayCurve(17, 17),
    // Shorter, thicker strings in a smaller case: about twice as inharmonic as
    // the grand above, which is most of why an upright sounds boxier.
    inharmonicity: (midi) => 0.00013 * Math.pow(2, (midi - 48) / 18),
    unison: { voices: 2, cents: 2.4, upTo: 3 },
    aftersound: { level: 0.11, decayScale: 3.2, upTo: 4, cents: 9 },
    attack: 0.005,
    release: 0.18,
    sustainLevel: 0,
    hammer: 0.38,
    velocity: { sensitive: true, curve: 1.5, brightness: 0.9 },
    reverbSend: 0.12,
    level: 0.95,
  },

  rhodes: {
    id: 'rhodes',
    // A tine, not a string: a near-sine fundamental with a bell struck on top,
    // which is why the spectrum is a few specific partials rather than a run.
    harmonics: [
      { h: 1, gain: 1.0, decay: 1.0 },
      { h: 2, gain: 0.10, decay: 0.8 },
      { h: 4, gain: 0.40, decay: 0.35 },
      { h: 8, gain: 0.10, decay: 0.2 },
      { h: 14, gain: 0.05, decay: 0.12 },
    ],
    decayAt: decayCurve(11, 26),
    inharmonicity: () => 0,
    unison: { voices: 1, cents: 0, upTo: 0 },
    attack: 0.006,
    release: 0.28,
    sustainLevel: 0,
    hammer: 0.16,
    velocity: { sensitive: true, curve: 1.9, brightness: 1.5 },
    reverbSend: 0.22,
    level: 1.0,
  },

  organ: {
    id: 'organ',
    // Drawbar stops: octaves and fifths above the fundamental, and no decay at
    // all. An organ pipe sounds until you take your finger off.
    harmonics: [
      { h: 1, gain: 1.0 }, { h: 2, gain: 0.55 }, { h: 3, gain: 0.32 },
      { h: 4, gain: 0.42 }, { h: 6, gain: 0.18 }, { h: 8, gain: 0.16 },
    ],
    decayAt: () => 30,
    inharmonicity: () => 0,
    unison: { voices: 2, cents: 0.8, upTo: 2 },
    attack: 0.02,
    release: 0.07,
    sustainLevel: 1,
    hammer: 0,
    // A pipe organ's key is a valve: it is open or shut. How hard you hit it
    // changes nothing, and pretending otherwise would teach the wrong touch.
    velocity: { sensitive: false, curve: 1, brightness: 0 },
    reverbSend: 0.34,
    level: 0.55,
  },

  strings: {
    id: 'strings',
    // Bowed, not struck: the energy keeps arriving, so nothing decays and the
    // spectrum stays bright for as long as the note is held. `partialDecay: 0`
    // is the whole difference — every partial lasts as long as the fundamental.
    maxPartials: 12,
    tilt: 1.0,
    partialDecay: 0,
    decayAt: () => 30,
    inharmonicity: () => 0,
    // Wide detuning across three voices per partial: a section is many players
    // who are never quite in unison, and that is most of the sound.
    unison: { voices: 3, cents: 6, upTo: 4 },
    attack: 0.14,
    release: 0.55,
    sustainLevel: 0.8,
    hammer: 0,
    velocity: { sensitive: true, curve: 1.3, brightness: 0.7 },
    reverbSend: 0.4,
    // Sustained voices need a higher level than struck ones to *peak* the
    // same: a piano's 0.24 is one instant at the strike, while this holds.
    level: 0.50,
  },

  pad: {
    id: 'pad',
    // Not an imitation of anything — a soft sustained tone for hearing a line
    // clearly. Slow in, slow out, and it holds until the key comes up.
    harmonics: [
      { h: 1, gain: 1.0 }, { h: 2, gain: 0.42 }, { h: 3, gain: 0.16 },
      { h: 4, gain: 0.20 }, { h: 5, gain: 0.07 }, { h: 6, gain: 0.09 },
    ],
    decayAt: () => 30,
    inharmonicity: () => 0,
    unison: { voices: 3, cents: 4, upTo: 3 },
    attack: 0.35,
    release: 0.9,
    sustainLevel: 0.85,
    hammer: 0,
    velocity: { sensitive: true, curve: 1.2, brightness: 0.6 },
    reverbSend: 0.45,
    level: 0.68,
  },

  nylon: {
    id: 'nylon',
    // A plucked string, which differs from a struck one mostly in the attack:
    // no hammer thump, and the upper partials start weaker because a fingertip
    // is a far softer, wider contact than a felt hammer.
    maxPartials: 13,
    tilt: 1.3,
    partialDecay: 0.6,
    decayAt: decayCurve(9, 20),
    inharmonicity: (midi) => 0.00003 * Math.pow(2, (midi - 48) / 20),
    unison: { voices: 1, cents: 0, upTo: 0 },
    aftersound: { level: 0.12, decayScale: 3, upTo: 4, cents: 4 },
    attack: 0.006,
    release: 0.2,
    sustainLevel: 0,
    hammer: 0.10,
    velocity: { sensitive: true, curve: 1.5, brightness: 0.9 },
    reverbSend: 0.22,
    level: 1.0,
  },

  musicbox: {
    id: 'musicbox',
    // A comb tooth is a free-free bar, and a bar's partials are nowhere near
    // whole multiples — they sit at roughly 1 : 2.76 : 5.40 : 8.93. Those
    // ratios are the entire reason a music box does not sound like a piano.
    harmonics: [
      { h: 1, gain: 1.0, decay: 1.0 },
      { h: 2.756, gain: 0.30, decay: 0.5 },
      { h: 5.404, gain: 0.12, decay: 0.28 },
      { h: 8.933, gain: 0.05, decay: 0.16 },
    ],
    decayAt: decayCurve(14, 22),
    inharmonicity: () => 0,
    unison: { voices: 1, cents: 0, upTo: 0 },
    attack: 0.002,
    release: 0.25,
    sustainLevel: 0,
    hammer: 0.12,
    velocity: { sensitive: true, curve: 1.4, brightness: 0.5 },
    reverbSend: 0.34,
    level: 0.85,
  },

  vibraphone: {
    id: 'vibraphone',
    // Vibraphone bars are undercut so the first two overtones land on exact
    // 4× and 10× — deliberately tuned, unlike the music box above. The wobble
    // is the instrument's motorised discs opening and closing the resonators.
    harmonics: [
      { h: 1, gain: 1.0, decay: 1.0 },
      { h: 4, gain: 0.24, decay: 0.55 },
      { h: 10, gain: 0.07, decay: 0.3 },
    ],
    decayAt: decayCurve(22, 24),
    inharmonicity: () => 0,
    unison: { voices: 1, cents: 0, upTo: 0 },
    tremolo: { rate: 5.2, depth: 0.34 },
    attack: 0.003,
    release: 0.3,
    sustainLevel: 0,
    hammer: 0.08,
    velocity: { sensitive: true, curve: 1.3, brightness: 0.4 },
    reverbSend: 0.32,
    level: 0.95,
  },

  celesta: {
    id: 'celesta',
    // Also a struck bar, so the same 1 : 2.76 : 5.40 family as the music box —
    // but felt hammers and a resonator box under each bar, which means a much
    // stronger fundamental, a softer attack and a far longer ring.
    harmonics: [
      { h: 1, gain: 1.0, decay: 1.0 },
      { h: 2.756, gain: 0.16, decay: 0.45 },
      { h: 4, gain: 0.09, decay: 0.55 },
      { h: 5.404, gain: 0.05, decay: 0.25 },
    ],
    decayAt: decayCurve(26, 20),
    inharmonicity: () => 0,
    unison: { voices: 1, cents: 0, upTo: 0 },
    attack: 0.006,
    release: 0.3,
    sustainLevel: 0,
    hammer: 0.07,
    velocity: { sensitive: true, curve: 1.4, brightness: 0.45 },
    reverbSend: 0.36,
    level: 0.9,
  },

  harp: {
    id: 'harp',
    // A long, thin, slack string plucked well away from its end: a full
    // harmonic series, very little stiffness, and a ring measured in seconds.
    maxPartials: 16,
    tilt: 1.1,
    partialDecay: 0.45,
    decayAt: decayCurve(20, 21),
    inharmonicity: (midi) => 0.00002 * Math.pow(2, (midi - 48) / 20),
    unison: { voices: 1, cents: 0, upTo: 0 },
    aftersound: { level: 0.14, decayScale: 3.5, upTo: 4, cents: 3 },
    attack: 0.004,
    release: 0.3,
    sustainLevel: 0,
    hammer: 0.09,
    velocity: { sensitive: true, curve: 1.4, brightness: 0.85 },
    reverbSend: 0.34,
    level: 0.85,
  },

  flute: {
    id: 'flute',
    // Nearly a sine with a little second harmonic — and the rest of what makes
    // it recognisable is not harmonic at all, but the breath passing the edge.
    // That is the `breath` layer: filtered noise that sustains with the note.
    harmonics: [
      { h: 1, gain: 1.0 }, { h: 2, gain: 0.20 }, { h: 3, gain: 0.06 },
      { h: 4, gain: 0.03 }, { h: 5, gain: 0.015 },
    ],
    decayAt: () => 30,
    inharmonicity: () => 0,
    unison: { voices: 1, cents: 0, upTo: 0 },
    breath: { level: 0.055, q: 1.6, ratio: 2.4 },
    tremolo: { rate: 5.4, depth: 0.06 },
    attack: 0.09,
    release: 0.16,
    sustainLevel: 0.92,
    hammer: 0,
    velocity: { sensitive: true, curve: 1.1, brightness: 0.9 },
    reverbSend: 0.34,
    level: 0.62,
  },

  oboe: {
    id: 'oboe',
    // A conical bore gives the whole harmonic series, and the reed plus the
    // bore's resonance push the strength up into the 2nd–5th rather than the
    // fundamental. That inverted balance is why an oboe cuts through
    // an orchestra at a fraction of the power.
    harmonics: [
      { h: 1, gain: 0.55 }, { h: 2, gain: 1.0 }, { h: 3, gain: 0.85 },
      { h: 4, gain: 0.60 }, { h: 5, gain: 0.42 }, { h: 6, gain: 0.22 },
      { h: 7, gain: 0.14 }, { h: 8, gain: 0.08 },
    ],
    decayAt: () => 30,
    inharmonicity: () => 0,
    unison: { voices: 1, cents: 0, upTo: 0 },
    breath: { level: 0.02, q: 2.2, ratio: 3.2 },
    tremolo: { rate: 5.6, depth: 0.07 },
    attack: 0.05,
    release: 0.12,
    sustainLevel: 0.9,
    hammer: 0,
    velocity: { sensitive: true, curve: 1.2, brightness: 0.85 },
    reverbSend: 0.3,
    level: 0.3,
  },

  clarinet: {
    id: 'clarinet',
    // A cylindrical pipe stopped at one end resonates the odd harmonics and
    // barely the even ones. That imbalance is the clarinet's whole character,
    // and it costs nothing to model: give the evens almost no gain.
    harmonics: [
      { h: 1, gain: 1.0 }, { h: 2, gain: 0.05 }, { h: 3, gain: 0.55 },
      { h: 4, gain: 0.04 }, { h: 5, gain: 0.28 }, { h: 6, gain: 0.03 },
      { h: 7, gain: 0.14 }, { h: 9, gain: 0.06 },
    ],
    decayAt: () => 30,
    inharmonicity: () => 0,
    unison: { voices: 1, cents: 0, upTo: 0 },
    tremolo: { rate: 4.8, depth: 0.05 },
    attack: 0.07,
    release: 0.14,
    sustainLevel: 0.9,
    hammer: 0,
    velocity: { sensitive: true, curve: 1.2, brightness: 0.8 },
    reverbSend: 0.3,
    level: 0.58,
  },

  harpsichord: {
    id: 'harpsichord',
    maxPartials: 16,
    tilt: 0.8,
    partialDecay: 0.35,
    decayAt: decayCurve(9, 24),
    inharmonicity: (midi) => 0.00004 * Math.pow(2, (midi - 48) / 20),
    unison: { voices: 2, cents: 3.5, upTo: 3 },
    attack: 0.002,
    release: 0.09,
    sustainLevel: 0,
    hammer: 0.5,
    // Plucked by a quill, so the string is displaced by the same amount however
    // hard the key goes down. Dynamics on a harpsichord come from how many
    // notes you hold, not from touch.
    velocity: { sensitive: false, curve: 1, brightness: 0 },
    reverbSend: 0.26,
    level: 0.7,
  },
};

/**
 * Grouped for the picker: eleven voices in one flat list is a wall, and the
 * groups say something real about how each is made — struck, plucked, a bar
 * being hit, or something that holds until you let go.
 */
export const VOICE_GROUPS = [
  { id: 'keys', voices: ['grand', 'upright', 'rhodes', 'harpsichord'] },
  { id: 'plucked', voices: ['nylon', 'harp'] },
  { id: 'tuned', voices: ['celesta', 'musicbox', 'vibraphone'] },
  { id: 'wind', voices: ['flute', 'oboe', 'clarinet'] },
  { id: 'sustained', voices: ['strings', 'pad', 'organ'] },
];
export const VOICE_IDS = VOICE_GROUPS.flatMap((g) => g.voices);

/**
 * How long notes are allowed to ring, on top of whatever the voice does.
 *
 * A struck note dying away is realistic and, when you are trying to hear a line
 * you cannot yet play, unhelpful — the notes are gone before you have read the
 * next ones. `decay` stretches the fall; `hold` goes further and stops the note
 * falling at all until the key comes up, which turns any voice into something
 * you can lean on.
 */
export const SUSTAIN_MODES = {
  normal: { decay: 1, hold: 0 },
  long: { decay: 2.5, hold: 0 },
  longer: { decay: 5, hold: 0 },
  hold: { decay: 5, hold: 0.32 },
};
export const SUSTAIN_IDS = ['normal', 'long', 'longer', 'hold'];

/* ------------------------------------------------------------------ setup */

/**
 * A short synthetic room. Decaying noise is a crude impulse response and a
 * completely convincing one at this length — without it every note sounds like
 * an oscillator rather than an instrument standing somewhere.
 */
function buildRoom(ctx, seconds = 1.9, falloff = 2.6) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      // A few ms of silence first, so the reverb reads as a room rather than
      // as part of the note's own attack.
      const predelay = i < ctx.sampleRate * 0.012 ? 0 : 1;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, falloff) * predelay;
    }
  }
  return buffer;
}

/** One second of white noise, reused for every hammer strike. */
function buildNoise(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function loadVoiceId() {
  const stored = localStorage.getItem(STORAGE_VOICE);
  if (stored === 'none' || VOICES[stored]) return stored;
  return 'grand';
}

export function loadSustainId() {
  const stored = localStorage.getItem(STORAGE_SUSTAIN);
  return stored && SUSTAIN_MODES[stored] ? stored : 'normal';
}

export function loadVolumeDb() {
  // `Number(null)` is 0, and 0 is finite — so testing the converted value lets
  // a missing setting masquerade as a stored 0 dB. Check for the key first.
  const stored = localStorage.getItem(STORAGE_VOLUME);
  if (stored === null) return DEFAULT_VOLUME_DB;
  const raw = Number(stored);
  if (!Number.isFinite(raw)) return DEFAULT_VOLUME_DB;
  return Math.min(MAX_VOLUME_DB, Math.max(MIN_VOLUME_DB, raw));
}

/* ------------------------------------------------------------------ synth */

/**
 * Build the partial list for one note.
 *
 * Two things vary per note rather than per voice. The partial count is capped
 * so nothing is generated above hearing — a note at 2 kHz has no useful 14th
 * partial — and the balance tilts with velocity, because a harder hammer
 * excites the upper partials disproportionately. That tilt is what makes a
 * loud note sound *harder* and not merely louder, and it is the difference
 * between a piano and a volume knob.
 */
function buildPartials(voice, midi, velocity, sampleRate) {
  const f0 = midiToFreq(midi);
  const ceiling = sampleRate * 0.45;
  const decay = voice.decayAt(midi);
  const B = voice.inharmonicity(midi);
  const out = [];

  const push = (h, gain, decayScale) => {
    const ratio = h * Math.sqrt(1 + B * h * h);
    if (f0 * ratio > ceiling) return;
    out.push({ ratio, gain, decay: decay * decayScale });
  };

  if (voice.harmonics) {
    for (const p of voice.harmonics) {
      const bright = Math.pow(velocity, voice.velocity.brightness * (p.h - 1) / 8);
      push(p.h, p.gain * bright, p.decay ?? 1);
    }
    return out;
  }

  const maxK = Math.min(voice.maxPartials, Math.max(1, Math.floor(ceiling / f0)));
  for (let k = 1; k <= maxK; k++) {
    let gain = Math.pow(k, -voice.tilt);
    // Hammers strike about a seventh of the way along the string precisely so
    // the seventh partial — a flat, sour minor seventh — is barely excited.
    if (k % 7 === 0) gain *= 0.22;
    const bright = Math.pow(velocity, voice.velocity.brightness * (k - 1) / voice.maxPartials);
    push(k, gain * bright, 1 / (1 + (k - 1) * voice.partialDecay));
  }
  return out;
}

/**
 * A polyphonic synth on its own audio context.
 *
 * Its own, deliberately: the analysis context is opened and closed every time
 * you press start, and the sound should not stop with it — you want to hear
 * the chord preview whether or not the app is currently listening.
 */
export function createSynth() {
  let ctx = null;
  let master = null;
  let dry = null;
  let wet = null;
  let noise = null;
  let voiceId = loadVoiceId();
  let volumeDb = loadVolumeDb();
  let sustainId = loadSustainId();

  /** midi note -> { nodes, gains, release, startedAt } */
  const sounding = new Map();
  let order = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    ctx = new AudioContext({ latencyHint: 'interactive' });

    master = ctx.createGain();
    master.gain.value = dbToLinear(volumeDb);

    // A gentle limiter, not an effect: with the sustain pedal down a dozen
    // notes can be ringing at once, and their peaks add up.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 6;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.2;

    const reverb = ctx.createConvolver();
    reverb.buffer = buildRoom(ctx);

    dry = ctx.createGain();
    dry.gain.value = 1;
    wet = ctx.createGain();
    wet.gain.value = 1;

    dry.connect(master);
    wet.connect(reverb).connect(master);
    master.connect(limiter).connect(ctx.destination);

    noise = buildNoise(ctx);
    return ctx;
  }

  function currentVoice() {
    return VOICES[voiceId] || null;
  }

  /** Fade a note out and schedule its oscillators to stop. */
  function damp(note, when, seconds) {
    for (const gain of note.gains) {
      const p = gain.gain;
      if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(when);
      else {
        p.cancelScheduledValues(when);
        p.setValueAtTime(p.value, when);
      }
      p.setTargetAtTime(0, when, Math.max(0.01, seconds / 4));
    }
    for (const osc of note.nodes) {
      try { osc.stop(when + seconds + 0.05); } catch { /* already stopped */ }
    }
  }

  function releaseNote(midi, when) {
    const note = sounding.get(midi);
    if (!note) return;
    sounding.delete(midi);
    damp(note, when, note.release);
  }

  return {
    get voiceId() { return voiceId; },
    get volumeDb() { return volumeDb; },
    get enabled() { return voiceId !== 'none'; },

    setVoice(id) {
      voiceId = VOICES[id] ? id : 'none';
      localStorage.setItem(STORAGE_VOICE, voiceId);
      if (voiceId === 'none') this.allOff();
    },

    get sustainId() { return sustainId; },

    setSustain(id) {
      sustainId = SUSTAIN_MODES[id] ? id : 'normal';
      localStorage.setItem(STORAGE_SUSTAIN, sustainId);
    },

    setVolumeDb(db) {
      volumeDb = Math.min(MAX_VOLUME_DB, Math.max(MIN_VOLUME_DB, db));
      localStorage.setItem(STORAGE_VOLUME, String(volumeDb));
      if (master) master.gain.value = dbToLinear(volumeDb);
    },

    /** Called on a user gesture, so the context is allowed to start. */
    prime() {
      if (voiceId !== 'none') ensure();
    },

    noteOn(midi, velocity = 90) {
      const voice = currentVoice();
      if (!voice) return;
      const audio = ensure();
      const now = audio.currentTime;

      // Re-striking a ringing note damps it first, exactly as the real action
      // does — the hammer cannot hit a string it is already resting against.
      if (sounding.has(midi)) releaseNote(midi, now);
      while (sounding.size >= MAX_NOTES) {
        let oldest = null;
        for (const [key, note] of sounding) {
          if (!oldest || note.startedAt < sounding.get(oldest).startedAt) oldest = key;
        }
        releaseNote(oldest, now);
      }

      const vel = voice.velocity.sensitive
        ? Math.pow(Math.min(127, Math.max(1, velocity)) / 127, voice.velocity.curve)
        : 0.62;
      const f0 = midiToFreq(midi);
      const partials = buildPartials(voice, midi, vel, audio.sampleRate);

      // Declared before anything that pushes to them. These were below the
      // tremolo block, which put `nodes.push(lfo)` in its temporal dead zone —
      // so `noteOn` threw for every voice that wobbles, and only those.
      const nodes = [];
      const gains = [];

      // Tremolo, where the voice asks for it. An oscillator connected to an
      // AudioParam *adds* to it, so a gain sitting at 1 with a ±0.34 sine on
      // its param swings between 0.66 and 1.34 — the vibraphone's rotating
      // discs, or a clarinet's much gentler breath.
      let wobble = null;
      if (voice.tremolo) {
        wobble = audio.createGain();
        wobble.gain.value = 1;
        const lfo = audio.createOscillator();
        lfo.frequency.value = voice.tremolo.rate;
        const depth = audio.createGain();
        depth.gain.value = voice.tremolo.depth;
        lfo.connect(depth).connect(wobble.gain);
        lfo.start(now);
        nodes.push(lfo);
      }

      const bus = audio.createGain();
      // Every partial starts at phase zero, so they add constructively at the
      // very onset — one note can peak near the sum of its partial gains. This
      // leaves room for a four-note chord to do the same before the limiter has
      // to work; the volume slider makes up the difference.
      bus.gain.value = voice.level * vel * 0.22;
      // The tremolo sits after the bus so it shapes the whole note, and before
      // the reverb send so the room hears the wobble too.
      const out = wobble ? (bus.connect(wobble), wobble) : bus;
      out.connect(dry);
      const send = audio.createGain();
      send.gain.value = voice.reverbSend;
      out.connect(send).connect(wet);

      // The sustain setting stretches the fall and, at its longest, stops the
      // note falling to silence at all — see SUSTAIN_MODES.
      const sustain = SUSTAIN_MODES[sustainId] || SUSTAIN_MODES.normal;
      const holdAt = Math.max(voice.sustainLevel, sustain.hold);

      /** One sine at `freq`, with the voice's attack and an exponential fall. */
      const addOscillator = (freq, detuneCents, peak, decaySeconds) => {
        const osc = audio.createOscillator();
        osc.frequency.value = freq;
        if (detuneCents) osc.detune.value = detuneCents;

        const gain = audio.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peak, now + voice.attack);
        if (holdAt > 0) {
          // Settle to a floor and stay there until the key is released. For a
          // struck voice this is unnatural on purpose: it is what makes a line
          // audible while you are still reading the next bar.
          gain.gain.setTargetAtTime(peak * holdAt, now + voice.attack,
            voice.sustainLevel > 0 ? 0.08 : Math.max(0.15, decaySeconds / 8));
        } else {
          // setTargetAtTime is an exponential fall; τ = decay/6 puts the note
          // near silence after roughly the decay time quoted for the voice.
          gain.gain.setTargetAtTime(0, now + voice.attack,
            (decaySeconds * sustain.decay) / 6);
        }

        osc.connect(gain).connect(bus);
        osc.start(now);
        nodes.push(osc);
        gains.push(gain);
      };

      for (const partial of partials) {
        // Only the lowest partials get the multi-string treatment: that is
        // where the beating between a note's two or three strings is audible,
        // and tripling the whole spectrum would triple the cost for nothing.
        const copies = partial.ratio <= voice.unison.upTo ? voice.unison.voices : 1;
        for (let u = 0; u < copies; u++) {
          const detune = copies > 1 ? (u - (copies - 1) / 2) * voice.unison.cents * 2 : 0;
          addOscillator(f0 * partial.ratio, detune, partial.gain / copies, partial.decay);
        }

        // The aftersound: the same partial again, quiet and much longer, which
        // is what keeps a piano ringing after its initial brightness has gone.
        const after = voice.aftersound;
        if (after && partial.ratio <= after.upTo) {
          // Slightly detuned on purpose: the second polarisation is not at
          // quite the same frequency, and the slow beat between the two is
          // what keeps a held note alive rather than merely fading.
          addOscillator(f0 * partial.ratio, after.cents,
            partial.gain * after.level, partial.decay * after.decayScale);
        }
      }

      // The thump of the hammer itself: broadband, brief, and pitched around
      // the note. Without it every attack sounds like a fade-in.
      if (voice.hammer > 0) {
        const src = audio.createBufferSource();
        src.buffer = noise;
        src.playbackRate.value = 1;
        const band = audio.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = Math.min(audio.sampleRate * 0.4, f0 * 6);
        band.Q.value = 0.7;
        const knock = audio.createGain();
        const level = voice.hammer * vel * 0.5;
        knock.gain.setValueAtTime(0, now);
        knock.gain.linearRampToValueAtTime(level, now + 0.001);
        knock.gain.setTargetAtTime(0, now + 0.001, 0.012);
        src.connect(band).connect(knock).connect(bus);
        src.start(now, Math.random() * 0.5);
        src.stop(now + 0.16);
        nodes.push(src);
      }

      // Breath. A flute is barely more than a sine plus the sound of air across
      // an edge, and that half is not harmonic at all — no stack of partials
      // will produce it. Filtered noise, held for as long as the note, will.
      if (voice.breath) {
        const src = audio.createBufferSource();
        src.buffer = noise;
        src.loop = true;
        const band = audio.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = Math.min(audio.sampleRate * 0.4, f0 * voice.breath.ratio);
        band.Q.value = voice.breath.q;
        const air = audio.createGain();
        const level = voice.breath.level * vel;
        air.gain.setValueAtTime(0, now);
        // Slightly ahead of the tone: you hear the air start before the note
        // speaks, which is most of why a wind attack sounds like breath.
        air.gain.linearRampToValueAtTime(level, now + voice.attack * 0.6);
        src.connect(band).connect(air).connect(bus);
        src.start(now, Math.random() * 0.5);
        nodes.push(src);
        gains.push(air);
      }

      sounding.set(midi, { nodes, gains, release: voice.release, startedAt: order++ });
    },

    noteOff(midi) {
      if (!ctx) return;
      releaseNote(midi, ctx.currentTime);
    },

    /**
     * Play a set of notes as one gesture, for previewing a chord.
     * Slightly spread in time, because a hand does not land perfectly flat and
     * a perfectly simultaneous chord sounds synthetic.
     */
    playChord(midis, { velocity = 82, hold = 1.5, spread = 0.012 } = {}) {
      const voice = currentVoice();
      if (!voice || !midis || !midis.length) return;
      ensure();
      const sorted = [...midis].sort((a, b) => a - b);
      sorted.forEach((midi, i) => {
        setTimeout(() => this.noteOn(midi, velocity), i * spread * 1000);
      });
      setTimeout(() => {
        for (const midi of sorted) this.noteOff(midi);
      }, hold * 1000);
    },

    allOff() {
      if (!ctx) return;
      const now = ctx.currentTime;
      for (const midi of [...sounding.keys()]) releaseNote(midi, now);
    },

    /** How many notes are ringing — used by the diagnostics readout. */
    get soundingCount() { return sounding.size; },
  };
}

let shared = null;

/** One synth for the page. Created on first use, which is always a gesture. */
export function getSynth() {
  if (!shared) shared = createSynth();
  return shared;
}

/**
 * Wire up a voice picker and a volume slider. Both the tuner and the practice
 * page carry the same pair, and both write to the same stored setting, so one
 * choice of sound follows you around the app the way the microphone gain does.
 */
export function attachSoundControls({ select, slider, readout, sustain }) {
  if (select) {
    const rebuild = () => {
      const keep = select.value || loadVoiceId();
      select.innerHTML = '';
      select.append(new Option(t('synth.none'), 'none'));
      for (const group of VOICE_GROUPS) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = t(`synth.group.${group.id}`);
        for (const id of group.voices) optgroup.append(new Option(t(`synth.${id}`), id));
        select.append(optgroup);
      }
      select.value = keep;
    };
    rebuild();
    window.addEventListener('languagechange', rebuild);
    select.addEventListener('change', () => {
      const synth = getSynth();
      synth.setVoice(select.value);
      synth.prime();
    });
  }

  if (sustain) {
    const rebuild = () => {
      const keep = sustain.value || loadSustainId();
      sustain.innerHTML = '';
      for (const id of SUSTAIN_IDS) sustain.append(new Option(t(`synth.sustain.${id}`), id));
      sustain.value = keep;
    };
    rebuild();
    window.addEventListener('languagechange', rebuild);
    sustain.addEventListener('change', () => getSynth().setSustain(sustain.value));
  }

  if (slider) {
    const show = (db) => {
      if (readout) readout.textContent = `${db > 0 ? '+' : ''}${db} dB`;
    };
    slider.min = String(MIN_VOLUME_DB);
    slider.max = String(MAX_VOLUME_DB);
    slider.step = '1';
    slider.value = String(loadVolumeDb());
    show(Number(slider.value));
    slider.addEventListener('input', () => {
      const db = Number(slider.value);
      show(db);
      getSynth().setVolumeDb(db);
    });
  }
}
