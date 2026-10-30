/**
 * Which instrument the app is helping with.
 *
 * Mirrors the language switch in `i18n.js`: one global choice, stored in
 * localStorage, applied to every page, announced with an event. Pages that need
 * to change *layout* rather than *text* mark their elements `data-instr` and let
 * CSS do the hiding, so nothing has to imperatively track visibility.
 *
 * The per-instrument `audio` block matters more than it looks. Every constant in
 * the guitar chain was measured against a guitar — a 45 Hz highpass sits just
 * under the open low E, a 3 kHz lowpass sits just above the highest fretted
 * note, and the mains notch is wide because nothing musical lives at 50 Hz.
 * None of that survives contact with a piano, which reaches an octave lower and
 * two octaves higher, and which *does* have notes either side of 50 Hz.
 *
 * `family` is what the pages branch on, not `id`. A lyre and a kalimba are
 * different objects with the same shape of problem — a fixed row of pitches,
 * one note per string, nothing to fret and nothing to choose — so everything
 * except their layout is shared. See `tines.js`.
 */

const STORAGE_KEY = 'instrument-helper.instrument';

export const INSTRUMENTS = {
  guitar: {
    id: 'guitar',
    family: 'fretted',
    /** Open low E to the 24th fret of the high E. */
    lowMidi: 40,
    highMidi: 88,
    /** No standard digital-guitar input; the microphone is the only way in. */
    midi: false,
    audio: {
      // 4096 samples is 85 ms at 48 kHz — about 7 periods of the open low E.
      frameSize: 4096,
      hopSize: 512,
      minFreq: 65,     // below drop-D at 73.4 Hz
      maxFreq: 1400,   // a little above the 24th fret of the high E
      highpass: 45,    // below the open low E at 82.4 Hz
      lowpass: 3000,   // keep fundamentals + low harmonics, drop the rest
      notchQ: 8,       // wide: nothing musical sits near the mains frequency
    },
    chroma: { minHz: 75, maxHz: 2200 },
  },

  piano: {
    id: 'piano',
    family: 'keyed',
    /** A0 to C8 — the 88 keys of a full-size piano. */
    lowMidi: 21,
    highMidi: 108,
    midi: true,
    audio: {
      // Twice the guitar's window. The bottom of the piano is an octave lower,
      // and YIN needs several periods of the fundamental to lock on; at 40 Hz a
      // 4096-sample frame holds barely three.
      frameSize: 8192,
      // Four times the guitar's hop, because YIN's difference function costs
      // maxLag × frameSize and this instrument doubles both. Measured on the
      // audio thread's own budget: at hop 1024 an analysis takes 72% of the
      // time available before the next one is due, against the guitar's 51%.
      // At 2048 it is 36%, and nothing is lost that matters — a struck piano
      // note lasts seconds, so a reading every 43 ms is still far faster than
      // anything a player can perceive.
      hopSize: 2048,
      // 40 Hz, not 27.5: A0's fundamental is nearly absent from what a
      // microphone captures — the bottom octave of a piano is carried by its
      // partials — and searching down to it would triple the detector's cost
      // for a reading that would be wrong anyway. Use MIDI for the bottom.
      minFreq: 40,
      // C7. Above this a piano's fundamental is weak and its partials are
      // stretched far from whole-number ratios, which is exactly the condition
      // YIN handles worst. MIDI has no such limit.
      maxFreq: 2100,
      highpass: 25,
      lowpass: 4400,
      // Narrow, unlike the guitar's. G1 (49.0 Hz) and G#1 (51.9 Hz) sit either
      // side of European mains hum, so a Q of 8 — a 6 Hz notch — would gouge
      // two real notes out of the bass. Q 30 is ~1.7 Hz: still enough for a
      // steady hum, which is far narrower than a struck string.
      notchQ: 30,
    },
    chroma: { minHz: 55, maxHz: 3000 },
  },

  lyre: {
    id: 'lyre',
    family: 'tined',
    /** G3 to A5 — the 16 strings of the common C-major lyre. See tines.js. */
    lowMidi: 55,
    highMidi: 81,
    midi: false,
    audio: {
      // Half the guitar's window and still more of the fundamental: the lowest
      // string is G3 at 196 Hz, so 2048 samples (43 ms at 48 kHz) holds 8.4
      // periods against the guitar's 7 at its own bottom end.
      frameSize: 2048,
      // Shorter than the guitar's, and affordable. YIN costs maxLag ×
      // frameSize per analysis and the hop sets how often that is paid:
      // 369 × 4096 / 512 for a guitar against 160 × 2048 / 256 here — under
      // half the work for a reading every 5 ms. Worth spending, because tuning
      // sixteen strings one after another is the main thing this instrument
      // asks of a tuner, and a live needle is what makes that quick.
      hopSize: 256,
      // A lyre arrives from the factory as much as a whole tone flat, and goes
      // flat again every time the strings stretch, so the floor sits well under
      // G3 rather than just under it — a string too flat to be *named* is the
      // one moment the tuner is needed most.
      minFreq: 150,
      maxFreq: 1400,   // A5 is 880 Hz; the rest is headroom for a sharp string
      // The lowest note is 196 Hz, so this can sit far higher than a guitar's
      // and still not touch the instrument: −0.5 dB at G3, −18 dB at 50 Hz.
      highpass: 140,
      lowpass: 3000,
      notchQ: 8,       // nothing musical is near the mains frequency
    },
    chroma: { minHz: 180, maxHz: 2400 },
  },

  kalimba: {
    id: 'kalimba',
    family: 'tined',
    /** C4 to E6 — the 17 tines of the common C-major kalimba. See tines.js. */
    lowMidi: 60,
    highMidi: 88,
    midi: false,
    audio: {
      frameSize: 2048,   // 11 periods of the lowest tine, C4 at 261.6 Hz
      hopSize: 256,
      // Below C4 on purpose. Plenty of 17-key kalimbas ship in G or B flat
      // rather than C, and a tine that reads "too low to measure" is useless
      // to someone trying to find out what theirs is actually tuned to.
      minFreq: 190,
      maxFreq: 1500,     // E6 is 1318.5 Hz
      highpass: 130,
      // The one constant here that is not a scaled guitar number. A kalimba
      // tine is a clamped-free bar, not a string: its overtones sit at 6.27×
      // and 17.6× the fundamental instead of 2× and 3×. Those are not
      // harmonics, and a period-based detector has nothing useful to do with
      // them — unlike a guitar, where the low harmonics *are* the note. 2 kHz
      // passes every fundamental (the top tine is 1318 Hz) while removing the
      // second mode of every tine below G4, along with the broadband click of
      // a thumbnail landing on metal.
      lowpass: 2000,
      notchQ: 8,
    },
    chroma: { minHz: 240, maxHz: 2700 },
  },
};

export const DEFAULT_INSTRUMENT = 'guitar';

let current = load();

function load() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && INSTRUMENTS[stored] ? stored : DEFAULT_INSTRUMENT;
}

export function getInstrument() {
  return current;
}

/** 'fretted' | 'keyed' | 'tined' — what a page should branch on. */
export function instrumentFamily(id = current) {
  return (INSTRUMENTS[id] || INSTRUMENTS[DEFAULT_INSTRUMENT]).family;
}

export function isPiano() {
  return current === 'piano';
}

export function isGuitar() {
  return current === 'guitar';
}

/**
 * A lyre or a kalimba: one pitch per string, nothing to fret, nothing to
 * choose, and — because both are diatonic — notes that simply are not there.
 */
export function isTined() {
  return instrumentFamily() === 'tined';
}

/** Tuning constants for whichever instrument is selected. */
export function instrumentConfig(id = current) {
  return INSTRUMENTS[id] || INSTRUMENTS[DEFAULT_INSTRUMENT];
}

export function setInstrument(id) {
  if (!INSTRUMENTS[id] || id === current) return;
  current = id;
  localStorage.setItem(STORAGE_KEY, id);
  applyInstrumentAttribute();
  window.dispatchEvent(new CustomEvent('instrumentchange', { detail: { instrument: id } }));
}

/**
 * Drives the CSS that hides the panels belonging to the other instruments.
 * Set on <html> so a stylesheet rule can reach every element on the page
 * without any script having to enumerate them.
 */
function applyInstrumentAttribute() {
  document.documentElement.dataset.instrument = current;
  document.documentElement.dataset.family = instrumentFamily();
}

/** Wire up the instrument picker present on every page. */
export function initInstrumentSwitch() {
  applyInstrumentAttribute();
  const select = document.getElementById('instrument');
  if (!select) return;
  select.value = current;
  select.addEventListener('change', () => setInstrument(select.value));
  window.addEventListener('instrumentchange', () => {
    if (select.value !== current) select.value = current;
  });
}
