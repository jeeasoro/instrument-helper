/**
 * Note sources.
 *
 * Two kinds, deliberately:
 *   - Generated exercises: scales and arpeggios computed from interval formulas.
 *     Pure maths, no rights attached, and the bulk of what actually builds
 *     technique.
 *   - thesession.org: an open database of traditional tunes, which are public
 *     domain. Its API serves ABC over CORS. Settings are member transcriptions,
 *     so we keep the source link and credit alongside anything we pull.
 */

const NOTE_TO_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const SCALES = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Natural minor': [0, 2, 3, 5, 7, 8, 10],
  'Harmonic minor': [0, 2, 3, 5, 7, 8, 11],
  'Minor pentatonic': [0, 3, 5, 7, 10],
  'Major pentatonic': [0, 2, 4, 7, 9],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const ARPEGGIOS = {
  'Major triad': [0, 4, 7],
  'Minor triad': [0, 3, 7],
  'Dominant 7th': [0, 4, 7, 10],
  'Major 7th': [0, 4, 7, 11],
  'Minor 7th': [0, 3, 7, 10],
  'Diminished 7th': [0, 3, 6, 9],
};

/** Root note name (e.g. "A", "F#", "Bb") to a MIDI number in the given octave. */
export function rootMidi(name, octave = 2) {
  const m = /^([A-G])([#b]?)$/.exec(name);
  if (!m) return 40;
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (octave + 1) + NOTE_TO_PC[m[1]] + accidental;
}

/**
 * Ascend then descend a pattern over `octaves`, without repeating the peak.
 */
export function buildExercise(intervals, root, octaves = 2, descend = true) {
  const up = [];
  for (let o = 0; o < octaves; o++) {
    for (const iv of intervals) up.push(root + o * 12 + iv);
  }
  up.push(root + octaves * 12);

  if (!descend) return up;
  return up.concat(up.slice(0, -1).reverse());
}

/* --------------------------------------------------------------------------
   thesession.org client
   -------------------------------------------------------------------------- */

const SESSION_BASE = 'https://thesession.org';

/** Tune type to time signature. */
const TYPE_METER = {
  reel: '4/4', hornpipe: '4/4', barndance: '4/4', strathspey: '4/4', march: '4/4',
  jig: '6/8', 'slip jig': '9/8', slide: '12/8',
  polka: '2/4', waltz: '3/4', mazurka: '3/4', 'three-two': '3/2',
};

export async function searchTunes(query) {
  const url = `${SESSION_BASE}/tunes/search?q=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`thesession.org returned ${res.status}`);
  const data = await res.json();
  return (data.tunes || []).map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    url: t.url,
  }));
}

/**
 * Fetch a tune and return its settings as complete ABC documents, since the
 * API serves only the tune body.
 */
export async function fetchTune(id) {
  const res = await fetch(`${SESSION_BASE}/tunes/${id}?format=json`);
  if (!res.ok) throw new Error(`thesession.org returned ${res.status}`);
  const data = await res.json();

  const meter = TYPE_METER[(data.type || '').toLowerCase()] || '4/4';
  const settings = (data.settings || []).map((s, idx) => ({
    id: s.id,
    index: idx + 1,
    key: s.key,
    url: s.url,
    contributor: s.member ? s.member.name : null,
    // thesession.org writes everything in eighth-note units.
    abc: [
      `X:${idx + 1}`,
      `T:${data.name}`,
      `R:${data.type || ''}`,
      `M:${meter}`,
      'L:1/8',
      `K:${s.key}`,
      s.abc,
    ].join('\n'),
  }));

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    url: data.url,
    aliases: data.aliases || [],
    settings,
  };
}
