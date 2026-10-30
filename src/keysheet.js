/**
 * Piano sheets written as note events rather than chord symbols.
 *
 * Two formats, one meaning. **Virtual Piano** letter notation is what almost
 * every piano sheet site publishes — the computer keyboard *is* the piano, so
 * `[8u] u y` means "C3 and E4 together, then E4, then D4". **Note-name**
 * notation spells the same thing out as `[C3E4] E4 D4`.
 *
 * Both were verified against each other on a 372-event sheet: decoded with the
 * layout below, the letter form reproduces the note-name form exactly.
 *
 * What neither carries is *duration*. Timing is conveyed only by whitespace
 * convention, and that convention is not consistent between transcribers, so
 * everything here is evenly spaced and nothing pretends to know a rhythm.
 */

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];

/**
 * The virtualpiano.net layout: 36 white keys from C2 to C7 across four rows,
 * with shift giving the sharp above — except after E and B, which have none.
 */
const WHITE_ROWS = [
  ['1234567890', 36],   // C2 … E3
  ['qwertyuiop', 53],   // F3 … A4
  ['asdfghjkl', 71],    // B4 … C6
  ['zxcvbnm', 86],      // D6 … C7
];

/** Shifted number row. Digits have no upper case, so these are spelled out. */
const NUMBER_SHARPS = {
  '!': 37, '@': 39, $: 42, '%': 44, '^': 46, '*': 49, '(': 51,
};

function buildKeyMap() {
  const map = {};
  for (const [row, startMidi] of WHITE_ROWS) {
    let whiteIndex = WHITE_PC.indexOf(startMidi % 12);
    let octave = Math.floor(startMidi / 12);
    for (const ch of row) {
      const midi = octave * 12 + WHITE_PC[whiteIndex];
      map[ch] = midi;
      // Letters only. `'8'.toUpperCase()` is `'8'`, so doing this for digits
      // would overwrite each natural with its own sharp and put the whole bass
      // line a semitone high — which is exactly the bug this comment prevents.
      const pc = midi % 12;
      if (/[a-z]/.test(ch) && pc !== 4 && pc !== 11) map[ch.toUpperCase()] = midi + 1;
      whiteIndex++;
      if (whiteIndex === 7) { whiteIndex = 0; octave++; }
    }
  }
  return { ...map, ...NUMBER_SHARPS };
}

export const KEY_MAP = buildKeyMap();

const NOTE_TOKEN = /^([A-G]#?)([0-8])/;
const noteToMidi = (name) => {
  const m = NOTE_TOKEN.exec(name);
  return m ? (Number(m[2]) + 1) * 12 + NAMES.indexOf(m[1]) : null;
};

export const midiToLabel = (midi) => NAMES[midi % 12] + (Math.floor(midi / 12) - 1);

/* --------------------------------------------------------------- detection */

/**
 * Bracket groups, e.g. the `8u` of `[8u]` — but never a bracket sitting alone
 * on its own line.
 *
 * That exclusion is the whole ballgame. `[Verse]` and `[Chorus]` are section
 * headings, and every letter in both happens to be a valid Virtual Piano key,
 * so a songbook page with ten of them sails past a naive "three key groups and
 * it must be a key sheet" test — and a German chord sheet gets read as a piano
 * arrangement. Music never sits alone in brackets on a line; headings always do.
 */
function groupsIn(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*\[[^\]]*\]\s*$/.test(line)) continue;
    for (const m of line.matchAll(/\[([^\]\n]*)\]/g)) out.push(m[1]);
  }
  return out;
}

/**
 * How much of the text is made of playable key characters, judged line by line.
 *
 * A key sheet is *nothing but* keys, so almost every line scores 1. A chord
 * sheet is mostly lyrics, and prose is full of characters no key maps to, so it
 * scores near zero — which catches the cases brackets alone would not.
 * Measured per line so a title or a credit at the top cannot sink a real sheet.
 */
function isKeyLine(line, threshold = 0.95) {
  const compact = line.replace(/[\s[\]|]/g, '');
  if (!compact.length) return false;
  const keys = [...compact].filter((c) => KEY_MAP[c] !== undefined).length;
  return keys / compact.length >= threshold;
}

function keyLineRatio(text) {
  const lines = text.split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2 && !/^\[[^\]]*\]$/.test(l));
  if (!lines.length) return 0;
  return lines.filter((l) => isKeyLine(l)).length / lines.length;
}

/** Two or more note names run together — `C3E4`. No chord sheet contains this. */
const NOTE_GROUP = /^(?:[A-G]#?[0-8]){2,}$/;
/** A chord name, so ChordPro's `[G]` and `[F#m7]` are never mistaken for keys. */
const CHORD_LIKE = /^[A-H][#b]?(maj|min|m|dim|aug|sus|add|M)?\d*(sus[24]|add\d+|maj\d+)?\d*(\/[A-H][#b]?)?$/;

/**
 * Which of the two formats a pasted sheet is, or null if it is neither.
 *
 * Deliberately hard to trigger. This runs before the chord-sheet parsers, and a
 * false positive would turn somebody's songbook into gibberish — so each format
 * has to prove itself with evidence no chord sheet could produce.
 */
export function detectKeysheet(text) {
  if (!text || !text.trim()) return null;
  const groups = groupsIn(text);

  // Note names: `[C3E4]` is unambiguous — no chord sheet contains one.
  if (groups.filter((g) => NOTE_GROUP.test(g.replace(/\s+/g, ''))).length >= 2) return 'notes';

  // Every remaining test needs the text to actually read as music rather than
  // as words, so this gate comes before all of them.
  const ratio = keyLineRatio(text);
  if (ratio < 0.7) return null;

  // A bare run of note names, with the same proof required: `G7 C7 D7` is a
  // perfectly ordinary chord list, and `E7` appears all over real songbooks.
  const bare = text.match(/\b[A-G]#?[0-8]\b/g) || [];
  if (bare.length >= 12 && text.includes('|')
    && bare.length > (text.match(/[A-Za-z]+/g) || []).length * 0.5) return 'notes';

  // Letters: bracket groups that are not chord names and contain only keys.
  const keyGroups = groups.filter((g) => {
    const body = g.replace(/\s+/g, '');
    if (!body || CHORD_LIKE.test(body)) return false;
    return [...body].every((c) => KEY_MAP[c] !== undefined);
  });
  if (keyGroups.length >= 3) return 'letters';

  // A bracketless letter sheet: dense key characters, bar markers, and the
  // mix of digits and letters inside single words that only this notation has.
  if (!groups.length) {
    const compact = text.replace(/\s+/g, '');
    if (compact.length < 40) return null;
    const keys = [...compact].filter((c) => KEY_MAP[c] !== undefined || c === '|').length;
    const mixed = (text.match(/\b(?=\w*\d)(?=\w*[a-z])\w{2,}\b/g) || []).length;
    if (keys / compact.length > 0.92 && (text.match(/\|/g) || []).length >= 5 && mixed >= 3) {
      return 'letters';
    }
  }
  return null;
}

/* ----------------------------------------------------------------- parsing */

/**
 * Turn a sheet into a flat sequence of events.
 *
 * `[abc]` is one event with several notes; a loose character is one event with
 * one note; `|` is a rest. Anything unrecognised is skipped rather than
 * refused — sheets in the wild carry section headings, counts and stray
 * punctuation, and losing a whole paste over one bad character helps nobody.
 */
export function parseKeysheet(text, format = null) {
  const kind = format || detectKeysheet(text);
  if (!kind) return null;

  const sequence = [];
  const skipped = new Set();

  const readNotes = (body) => {
    const notes = [];
    if (kind === 'notes') {
      for (const token of body.match(/[A-G]#?[0-8]/g) || []) {
        const midi = noteToMidi(token);
        if (midi !== null) notes.push(midi);
      }
      return notes;
    }
    for (const ch of body) {
      if (/\s/.test(ch)) continue;
      if (KEY_MAP[ch] === undefined) { skipped.add(ch); continue; }
      notes.push(KEY_MAP[ch]);
    }
    return notes;
  };

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // A bracket alone on a line is a section heading, not a chord of keys.
    if (/^\[[^\]]*\]$/.test(trimmed)) continue;

    // A line of prose — a title, a credit, "Verse 1" — is not music. In letter
    // notation this matters more than it looks: nearly every letter maps to
    // some key, so "Renai Circulation" sitting above a sheet would otherwise
    // become fifteen invented notes before the piece even starts.
    // The same 0.95 the detector uses. "Renai Circulation" scores 0.94 — every
    // letter but the R maps to a key — so a looser bar keeps exactly the lines
    // it was meant to drop.
    if (kind === 'letters' && !isKeyLine(trimmed)) continue;

    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (/\s/.test(ch)) { i++; continue; }

      if (ch === '|') { sequence.push({ notes: [], rest: true }); i++; continue; }

      if (ch === '[') {
        const end = line.indexOf(']', i);
        const body = line.slice(i + 1, end === -1 ? line.length : end);
        const notes = readNotes(body);
        if (notes.length) sequence.push({ notes, rest: false });
        i = end === -1 ? line.length : end + 1;
        continue;
      }

      if (kind === 'notes') {
        const m = NOTE_TOKEN.exec(line.slice(i));
        if (m) {
          sequence.push({ notes: [noteToMidi(m[0])], rest: false });
          i += m[0].length;
          continue;
        }
        skipped.add(ch);
        i++;
        continue;
      }

      if (KEY_MAP[ch] !== undefined) {
        sequence.push({ notes: [KEY_MAP[ch]], rest: false });
      } else {
        skipped.add(ch);
      }
      i++;
    }
  }

  const sounding = sequence.filter((e) => !e.rest);
  if (!sounding.length) return null;

  return {
    format: kind,
    sequence,
    // The shapes the rest of the app already speaks: `events` drives the piano
    // roll, `notes` drives the stats, heat map and inventory.
    events: sequence.map((e) => (e.rest
      ? { type: 'rest', duration: 1 }
      : { type: 'note', notes: e.notes, midi: e.notes[0], duration: 1 })),
    notes: sounding.flatMap((e) => e.notes),
    steps: sounding,
    skipped: [...skipped],
  };
}

/** Stats worth showing about a parsed sheet, for the load confirmation. */
export function summarise(parsed) {
  const chords = parsed.steps.filter((s) => s.notes.length > 1);
  const all = parsed.notes;
  return {
    events: parsed.steps.length,
    notes: all.length,
    chords: chords.length,
    maxVoices: chords.length ? Math.max(...chords.map((c) => c.notes.length)) : 1,
    low: Math.min(...all),
    high: Math.max(...all),
    octaves: (Math.max(...all) - Math.min(...all)) / 12,
    rests: parsed.sequence.length - parsed.steps.length,
  };
}
