/**
 * Minimal ABC notation parser.
 *
 * ABC is the lingua franca of the open traditional-tune databases (thesession.org,
 * abcnotation.com), it's plain text, and it's compact enough to paste by hand.
 * This handles the subset those sources actually emit: headers, key signatures
 * with modes, accidentals, octave marks, note lengths, broken rhythm, bars and
 * rests. Decorations, slurs, tuplet markers and grace notes are skipped rather
 * than interpreted.
 */

const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

const KEY_SHARPS = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
};

/** Sharps to add/remove relative to the tonic's major key signature. */
const MODE_OFFSET = {
  maj: 0, ion: 0, lyd: 1, mix: -1, dor: -2, min: -3, aeo: -3, phr: -4, loc: -5,
};

function normaliseMode(raw) {
  const s = (raw || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return 'maj';
  if (s === 'm') return 'min';
  for (const key of Object.keys(MODE_OFFSET)) {
    if (s.startsWith(key)) return key;
  }
  return 'maj';
}

/** Build a letter -> semitone-offset map for a key like "Ddor" or "Bb". */
export function keySignature(spec) {
  const m = /^([A-G])([#b]?)\s*(.*)$/.exec((spec || 'C').trim());
  if (!m) return { map: {}, sharps: 0, label: 'C' };

  const tonic = m[1] + (m[2] || '');
  const mode = normaliseMode(m[3]);
  const base = KEY_SHARPS[tonic];
  if (base === undefined) return { map: {}, sharps: 0, label: tonic };

  let sharps = base + MODE_OFFSET[mode];
  // Wrap enharmonically so we never index past the 7 accidentals available.
  while (sharps > 7) sharps -= 12;
  while (sharps < -7) sharps += 12;

  const map = {};
  if (sharps > 0) for (const l of SHARP_ORDER.slice(0, sharps)) map[l] = 1;
  if (sharps < 0) for (const l of FLAT_ORDER.slice(0, -sharps)) map[l] = -1;

  return { map, sharps, mode, tonic, label: tonic + (mode === 'maj' ? '' : ' ' + mode) };
}

/** Strip the constructs this parser deliberately ignores. */
function clean(body) {
  return body
    .replace(/%.*$/gm, '')            // comments
    .replace(/\{[^}]*\}/g, '')        // grace notes
    // Decorations only — the pattern is deliberately tight (short, no spaces or
    // bar lines) because thesession.org also uses a bare `!` as a line break,
    // and a greedy match would swallow the music between two of them.
    .replace(/![a-zA-Z0-9()<>.+-]{1,10}!/g, '')
    .replace(/!/g, ' ')               // remaining bare `!` are line breaks
    .replace(/\+[a-zA-Z]{1,10}\+/g, '')
    .replace(/\\\s*$/gm, '');         // line continuations
}

/**
 * Parse a full ABC document.
 * Returns { title, key, meter, unitLength, events } where each event is
 * { type: 'note'|'rest'|'bar', midi?, midis?, duration? }.
 */
export function parseAbc(text) {
  const lines = text.split(/\r?\n/);
  // All empty: the header loop only fills a field that is still blank, so a
  // non-empty default here would shadow the tune's real value.
  const header = { T: '', M: '', L: '', K: '', R: '', C: '' };
  const bodyLines = [];
  let inBody = false;

  for (const line of lines) {
    const h = /^([A-Za-z]):\s*(.*)$/.exec(line);
    if (h && !inBody) {
      const field = h[1].toUpperCase();
      if (header[field] !== undefined && !header[field]) header[field] = h[2].trim();
      if (field === 'K') inBody = true;   // K: is always the last header field
      continue;
    }
    if (h && 'KLMQVRP'.includes(h[1].toUpperCase())) continue;  // mid-tune directives
    if (inBody) bodyLines.push(line);
  }

  const key = keySignature(header.K || 'C');

  // Default note length: explicit L:, else the standard meter-derived rule.
  let unitLength = 1 / 8;
  if (header.L) {
    const [n, d] = header.L.split('/').map(Number);
    if (n && d) unitLength = n / d;
  } else if (header.M && header.M.includes('/')) {
    const [n, d] = header.M.split('/').map(Number);
    if (n && d) unitLength = n / d < 0.75 ? 1 / 16 : 1 / 8;
  }

  const events = parseBody(clean(bodyLines.join('\n')), key.map);

  return {
    title: header.T || 'Untitled',
    rhythm: header.R || '',
    meter: header.M || '4/4',
    unitLength,
    key,
    events,
    notes: events.filter((e) => e.type === 'note'),
    chords: events.filter((e) => e.type === 'chord').map((e) => e.name),
  };
}

function parseBody(body, keyMap) {
  const events = [];
  let barAccidentals = {};
  let i = 0;

  const pushBar = () => {
    barAccidentals = {};
    if (events.length && events[events.length - 1].type !== 'bar') {
      events.push({ type: 'bar' });
    }
  };

  /** Read one note head at `i`, advancing it. Returns midi or null. */
  const readNote = () => {
    let accidental = null;
    while (i < body.length && '^_='.includes(body[i])) {
      const c = body[i];
      if (c === '=') accidental = 0;
      else if (c === '^') accidental = (accidental || 0) + 1;
      else accidental = (accidental || 0) - 1;
      i++;
    }

    const letter = body[i];
    if (!letter || !/[A-Ga-g]/.test(letter)) return null;
    i++;

    const upper = letter.toUpperCase();
    let octave = letter === upper ? 4 : 5;
    while (i < body.length && (body[i] === ',' || body[i] === "'")) {
      octave += body[i] === "'" ? 1 : -1;
      i++;
    }

    const slot = upper + octave;
    if (accidental !== null) barAccidentals[slot] = accidental;
    const applied = slot in barAccidentals ? barAccidentals[slot] : (keyMap[upper] || 0);

    return 12 * (octave + 1) + SEMITONE[upper] + applied;
  };

  /** Read a length suffix like `2`, `/2`, `//`, `3/2`. */
  const readDuration = () => {
    let num = '';
    while (i < body.length && /[0-9]/.test(body[i])) num += body[i++];
    let den = '';
    let slashes = 0;
    while (i < body.length && body[i] === '/') { slashes++; i++; }
    while (i < body.length && /[0-9]/.test(body[i])) den += body[i++];

    let d = num ? Number(num) : 1;
    if (den) d /= Number(den);
    else if (slashes) d /= Math.pow(2, slashes);
    return d;
  };

  while (i < body.length) {
    const c = body[i];

    if (/\s/.test(c)) { i++; continue; }

    // Quoted text is either a chord symbol ("Am") or a placed annotation
    // ("^text"), which starts with a position character. Keep the chords.
    if (c === '"') {
      const end = body.indexOf('"', i + 1);
      const text = end > i ? body.slice(i + 1, end) : '';
      i = end > i ? end + 1 : i + 1;
      if (text && !/^[_^<>@]/.test(text)) {
        events.push({ type: 'chord', name: text.trim() });
      }
      continue;
    }

    // Bar lines and repeats. `[|` is a bar; `[C` is a chord, handled below.
    if (c === '|' || c === ':' || (c === '[' && body[i + 1] === '|')) {
      if (c === '[') i++;
      while (i < body.length && '|:'.includes(body[i])) i++;
      // Numbered repeat endings, written either `[1` or `|1`.
      if (body[i] === '[' && /[0-9]/.test(body[i + 1] || '')) i++;
      while (i < body.length && /[0-9,\-]/.test(body[i])) i++;
      pushBar();
      continue;
    }

    // Tuplet markers — timing only, not pitch.
    if (c === '(' && /[0-9]/.test(body[i + 1] || '')) {
      i += 2;
      while (i < body.length && /[:0-9]/.test(body[i])) i++;
      continue;
    }
    if (c === '(' || c === ')' || c === '-') { i++; continue; }

    // Rests.
    if (c === 'z' || c === 'x' || c === 'Z') {
      i++;
      events.push({ type: 'rest', duration: readDuration() });
      continue;
    }

    // Chords: [CEG]
    if (c === '[') {
      i++;
      const midis = [];
      while (i < body.length && body[i] !== ']') {
        const m = readNote();
        if (m === null) { i++; continue; }
        readDuration();
        midis.push(m);
      }
      i++;  // closing ]
      const duration = readDuration();
      if (midis.length) {
        midis.sort((a, b) => a - b);
        events.push({ type: 'note', midi: midis[midis.length - 1], midis, duration });
      }
      continue;
    }

    // Broken rhythm: applies to the previous note and the next one.
    if (c === '>' || c === '<') {
      let count = 0;
      while (i < body.length && (body[i] === '>' || body[i] === '<')) { count++; i++; }
      const factor = Math.pow(2, count);
      const lengthen = c === '>';
      const prev = [...events].reverse().find((e) => e.type === 'note' || e.type === 'rest');
      if (prev) {
        prev.duration *= lengthen ? (2 * factor - 1) / factor : 1 / factor;
        events.brokenNext = lengthen ? 1 / factor : (2 * factor - 1) / factor;
      }
      continue;
    }

    // A note.
    const before = i;
    const midi = readNote();
    if (midi !== null) {
      let duration = readDuration();
      if (events.brokenNext) { duration *= events.brokenNext; delete events.brokenNext; }
      events.push({ type: 'note', midi, duration });
      continue;
    }

    if (i === before) i++;  // unrecognised character — skip it
  }

  return events.filter((e, idx) => !(e.type === 'bar' && idx === 0));
}
