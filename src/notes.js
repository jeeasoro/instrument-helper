/** Note maths and guitar fretboard mapping. */

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Standard tuning, low to high. MIDI 40 = E2. */
export const STANDARD_TUNING = [
  { string: 6, midi: 40, label: 'E2' },
  { string: 5, midi: 45, label: 'A2' },
  { string: 4, midi: 50, label: 'D3' },
  { string: 3, midi: 55, label: 'G3' },
  { string: 2, midi: 59, label: 'B3' },
  { string: 1, midi: 64, label: 'E4' },
];

export const MAX_FRET = 22;

export function freqToMidi(freq, a4 = 440) {
  return 69 + 12 * Math.log2(freq / a4);
}

export function midiToFreq(midi, a4 = 440) {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function midiToName(midi) {
  const pitchClass = ((midi % 12) + 12) % 12;
  return NAMES[pitchClass];
}

export function midiToOctave(midi) {
  return Math.floor(midi / 12) - 1;
}

/** Nearest tempered note to `freq`, with the deviation in cents. */
export function describeFrequency(freq, a4 = 440) {
  const exact = freqToMidi(freq, a4);
  const midi = Math.round(exact);
  return {
    midi,
    cents: (exact - midi) * 100,
    name: midiToName(midi),
    octave: midiToOctave(midi),
    label: midiToName(midi) + midiToOctave(midi),
  };
}

/** Every place on the neck this MIDI note can be played, in standard tuning. */
export function fretPositions(midi, maxFret = MAX_FRET) {
  const out = [];
  for (const s of STANDARD_TUNING) {
    const fret = midi - s.midi;
    if (fret >= 0 && fret <= maxFret) out.push({ string: s.string, fret });
  }
  return out.sort((a, b) => a.fret - b.fret);
}

/**
 * Closest open string to `freq`, for tuner mode. Returns the string plus how
 * far the played pitch sits from it in cents.
 */
export function nearestString(freq, a4 = 440) {
  const exact = freqToMidi(freq, a4);
  let best = null;
  for (const s of STANDARD_TUNING) {
    const cents = (exact - s.midi) * 100;
    if (!best || Math.abs(cents) < Math.abs(best.cents)) {
      best = { ...s, cents };
    }
  }
  return best;
}
