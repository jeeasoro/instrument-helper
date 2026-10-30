/**
 * Chord shapes, ChordPro parsing, and capo planning.
 *
 * Campfire and scout songs are chord songs: you strum and sing rather than
 * playing the melody, so the useful questions are "which grip" and "where's the
 * capo", not "which fret for this note".
 *
 * Shapes are written low E first: -1 muted, 0 open, n fretted.
 */

const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6,
  Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** `easy` marks shapes playable in open position without a barre. */
export const CHORD_SHAPES = {
  // Open majors
  'C':      { frets: [-1, 3, 2, 0, 1, 0], easy: true },
  'A':      { frets: [-1, 0, 2, 2, 2, 0], easy: true },
  'G':      { frets: [3, 2, 0, 0, 0, 3], easy: true },
  'E':      { frets: [0, 2, 2, 1, 0, 0], easy: true },
  'D':      { frets: [-1, -1, 0, 2, 3, 2], easy: true },
  // Open minors
  'Am':     { frets: [-1, 0, 2, 2, 1, 0], easy: true },
  'Em':     { frets: [0, 2, 2, 0, 0, 0], easy: true },
  'Dm':     { frets: [-1, -1, 0, 2, 3, 1], easy: true },
  // Open sevenths
  'C7':     { frets: [-1, 3, 2, 3, 1, 0], easy: true },
  'A7':     { frets: [-1, 0, 2, 0, 2, 0], easy: true },
  'G7':     { frets: [3, 2, 0, 0, 0, 1], easy: true },
  'E7':     { frets: [0, 2, 0, 1, 0, 0], easy: true },
  'D7':     { frets: [-1, -1, 0, 2, 1, 2], easy: true },
  'B7':     { frets: [-1, 2, 1, 2, 0, 2], easy: true },
  'Am7':    { frets: [-1, 0, 2, 0, 1, 0], easy: true },
  'Em7':    { frets: [0, 2, 0, 0, 0, 0], easy: true },
  'Dm7':    { frets: [-1, -1, 0, 2, 1, 1], easy: true },
  // Open colour chords
  'Cadd9':  { frets: [-1, 3, 2, 0, 3, 3], easy: true },
  'Fmaj7':  { frets: [-1, -1, 3, 2, 1, 0], easy: true },
  'Amaj7':  { frets: [-1, 0, 2, 1, 2, 0], easy: true },
  'Dmaj7':  { frets: [-1, -1, 0, 2, 2, 2], easy: true },
  'Dsus4':  { frets: [-1, -1, 0, 2, 3, 3], easy: true },
  'Dsus2':  { frets: [-1, -1, 0, 2, 3, 0], easy: true },
  'Asus4':  { frets: [-1, 0, 2, 2, 3, 0], easy: true },
  'Asus2':  { frets: [-1, 0, 2, 2, 0, 0], easy: true },
  'Esus4':  { frets: [0, 2, 2, 2, 0, 0], easy: true },
  'G6':     { frets: [3, 2, 0, 0, 0, 0], easy: true },
  // Barres — the ones scout songbooks reach for
  'F':      { frets: [1, 3, 3, 2, 1, 1], barre: { fret: 1, from: 6, to: 1 } },
  'Bb':     { frets: [-1, 1, 3, 3, 3, 1], barre: { fret: 1, from: 5, to: 1 } },
  'Bm':     { frets: [-1, 2, 4, 4, 3, 2], barre: { fret: 2, from: 5, to: 1 } },
  'B':      { frets: [-1, 2, 4, 4, 4, 2], barre: { fret: 2, from: 5, to: 1 } },
  'F#m':    { frets: [2, 4, 4, 2, 2, 2], barre: { fret: 2, from: 6, to: 1 } },
  'Cm':     { frets: [-1, 3, 5, 5, 4, 3], barre: { fret: 3, from: 5, to: 1 } },
  'Gm':     { frets: [3, 5, 5, 3, 3, 3], barre: { fret: 3, from: 6, to: 1 } },
  'Fm':     { frets: [1, 3, 3, 1, 1, 1], barre: { fret: 1, from: 6, to: 1 } },
  'F7':     { frets: [1, 3, 1, 2, 1, 1], barre: { fret: 1, from: 6, to: 1 } },
  'Bm7':    { frets: [-1, 2, 4, 2, 3, 2], barre: { fret: 2, from: 5, to: 1 } },
};

/** Split "F#m7" into { root: "F#", quality: "m7" }. */
export function parseChordName(name) {
  const m = /^([A-G][#b]?)(.*)$/.exec(String(name).trim());
  if (!m) return null;
  return { root: m[1], quality: m[2] || '', name: name.trim() };
}

export function transposeChord(name, semitones, preferFlats = null) {
  const parsed = parseChordName(name);
  if (!parsed) return name;
  // Leave the spelling alone when nothing moves, so "Bb" doesn't come back
  // as "A#" just for passing through.
  if (semitones === 0) return parsed.name;
  // Otherwise keep the accidental style the writer used.
  if (preferFlats === null) preferFlats = name.includes('b');

  // A slash chord's bass note has to move with the root.
  const [quality, bass] = parsed.quality.split('/');
  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES;
  const shift = (pc) => names[(((pc + semitones) % 12) + 12) % 12];

  let out = shift(PC[parsed.root]) + (quality || '');
  if (bass !== undefined) {
    const bassPc = PC[bass];
    out += '/' + (bassPc === undefined ? bass : shift(bassPc));
  }
  return out;
}

export function lookupShape(name) {
  const parsed = parseChordName(name);
  if (!parsed) return null;

  // Ignore a slash bass when looking for a grip.
  const base = parsed.root + parsed.quality.split('/')[0];
  if (CHORD_SHAPES[base]) return { ...CHORD_SHAPES[base], name: base };

  // Try the enharmonic spelling before giving up.
  const pc = PC[parsed.root];
  if (pc === undefined) return null;
  for (const alt of [SHARP_NAMES[pc], FLAT_NAMES[pc]]) {
    const key = alt + parsed.quality.split('/')[0];
    if (CHORD_SHAPES[key]) return { ...CHORD_SHAPES[key], name: key };
  }
  return null;
}

/**
 * Find a capo position that turns the song's chords into open shapes.
 *
 * With a capo at fret n, playing the shape for chord X sounds as X transposed
 * up n. So to keep the song sounding the same, look up each chord transposed
 * *down* by n and see whether that lands on an easy grip.
 */
export function suggestCapo(chordNames, maxCapo = 7) {
  const unique = [...new Set(chordNames)];
  const options = [];

  for (let capo = 0; capo <= maxCapo; capo++) {
    const shapes = unique.map((name) => {
      const shaped = transposeChord(name, -capo);
      const shape = lookupShape(shaped);
      return { sounds: name, shape: shaped, easy: !!(shape && shape.easy), known: !!shape };
    });

    const easy = shapes.filter((s) => s.easy).length;
    const unknown = shapes.filter((s) => !s.known).length;
    options.push({
      capo,
      shapes,
      easyCount: easy,
      unknownCount: unknown,
      // Prefer all-open shapes, then fewer unknowns, then a lower capo.
      score: (unique.length - easy) * 10 + unknown * 6 + capo * 0.5,
    });
  }

  options.sort((a, b) => a.score - b.score);
  return { best: options[0], all: options };
}

/* ------------------------------------------------------------- ChordPro */

/**
 * Parse ChordPro: `{directives}` plus inline `[Chord]` markers in the lyric.
 * Returns the directives and, per line, the chord/lyric segments — enough to
 * lay chords above the words they land on.
 */
export function parseChordPro(text) {
  const meta = {};
  const lines = [];

  for (const raw of text.split(/\r?\n/)) {
    const directive = /^\s*\{\s*([^:}]+)\s*:?\s*([^}]*)\}\s*$/.exec(raw);
    if (directive) {
      meta[directive[1].trim().toLowerCase()] = directive[2].trim();
      continue;
    }
    if (!raw.trim()) { lines.push({ type: 'blank' }); continue; }
    if (PAGE_FURNITURE.test(raw)) continue;

    const section = sectionLabel(raw);
    if (section) { lines.push({ type: 'section', label: section }); continue; }

    const segments = [];
    const re = /\[([^\]]+)\]/g;
    let cursor = 0;
    let m;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > cursor) segments.push({ chord: null, text: raw.slice(cursor, m.index) });
      segments.push({ chord: m[1].trim(), text: '' });
      cursor = m.index + m[0].length;
    }
    if (cursor < raw.length) {
      const tail = raw.slice(cursor);
      if (segments.length && segments[segments.length - 1].chord) {
        segments[segments.length - 1].text = tail;
      } else {
        segments.push({ chord: null, text: tail });
      }
    }
    lines.push({ type: segments.some((s) => s.chord) ? 'mixed' : 'lyric', segments });
  }

  const chords = [];
  for (const line of lines) {
    if (!line.segments) continue;
    for (const s of line.segments) if (s.chord) chords.push(s.chord);
  }

  return { meta, lines, chords, uniqueChords: [...new Set(chords)] };
}

/** Chord names from a plain list like "G C D Em" or "G, C, D, Em". */
export function parseChordList(text) {
  return text.split(/[\s,|]+/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Strict enough to tell a chord line from a lyric line. `H` is allowed as a
 * root because German songbooks use it — see fromGermanChord below.
 */
const CHORD_TOKEN =
  /^[A-H][#b]?(maj|min|m|dim|aug|sus|add|M)?\d*(sus[24]|add\d+|maj\d+)?\d*(\/[A-H][#b]?)?$/;

/**
 * German chord naming differs from international naming in exactly one place,
 * and it is a trap: German **H** is B natural, and German **B** is B flat.
 * Read a German songbook without translating and every B comes out a semitone
 * sharp — silently, since B is a perfectly valid chord name either way.
 */
export function fromGermanChord(name) {
  const m = /^([A-H][#b]?)(.*)$/.exec(String(name).trim());
  if (!m) return name;
  const [, root, quality] = m;
  const translated = root === 'H' ? 'B' : root === 'B' ? 'Bb' : root;
  const bass = quality.includes('/')
    ? quality.replace(/\/([A-H][#b]?)/, (_, b) =>
        '/' + (b === 'H' ? 'B' : b === 'B' ? 'Bb' : b))
    : quality;
  return translated + bass;
}

/**
 * German notation is only detectable from the presence of `H`. Without one,
 * a lone `B` is ambiguous and is safest left alone.
 */
export function usesGermanNotation(chordNames) {
  return chordNames.some((n) => /^H([#b]?)($|[^a-z])/.test(String(n).trim()));
}

function isChordToken(tok) {
  return CHORD_TOKEN.test(tok);
}

/**
 * A line that is nothing but a bracketed label — [Verse], [Chorus], [Refrain].
 * These matter because several start with a note letter, so a naive check for
 * `[X]` reads [Chorus] as a C chord and [Bridge] as a B.
 */
const SECTION_LINE = /^\s*[\[(]\s*([^\])]{1,40}?)\s*[\])]\s*$/;

/** Page furniture from a printout or PDF export. */
const PAGE_FURNITURE = /^\s*(page|seite|s\.)\s*\d+\s*(\s*[/of von]+\s*\d+)?\s*$/i;

function sectionLabel(line) {
  const m = SECTION_LINE.exec(line);
  if (!m) return null;
  // A lone bracketed chord, e.g. "[Am]", is a chord, not a heading.
  return isChordToken(m[1]) ? null : m[1];
}

/**
 * A line counts as chords when every token on it is a chord name. Lyric lines
 * almost never satisfy that — a stray "A" or "Am" does, but those sit inside a
 * sentence, and the whole-line requirement rules the sentence out.
 */
function isChordLine(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  if (!tokens.every(isChordToken)) return false;
  // Chord lines are sparse; a dense run of short words is prose.
  return tokens.length === 1 || /\s{2,}/.test(line.trim()) || tokens.length <= 8;
}

function chordPositions(line) {
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(line)) !== null) out.push({ name: m[0], col: m.index });
  return out;
}

function segmentsFor(positions, lyric) {
  const segs = [];
  if (positions.length && positions[0].col > 0) {
    segs.push({ chord: null, text: lyric.slice(0, positions[0].col) });
  }
  positions.forEach((p, i) => {
    const end = i + 1 < positions.length ? positions[i + 1].col : lyric.length;
    segs.push({ chord: p.name, text: lyric.slice(p.col, Math.max(p.col, end)) });
  });
  return segs;
}

/**
 * Parse the "chords on their own line above the words" layout, which is what
 * Ultimate Guitar, most German songbooks and almost every chord sheet on the
 * web actually use. ChordPro's inline `[G]` markers are the minority format.
 */
export function parseChordsOverLyrics(text) {
  const raw = text.split(/\r?\n/);
  const lines = [];
  const chords = [];
  const meta = {};

  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];

    const directive = /^\s*\{\s*([^:}]+)\s*:?\s*([^}]*)\}\s*$/.exec(line);
    if (directive) {
      meta[directive[1].trim().toLowerCase()] = directive[2].trim();
      continue;
    }
    if (!line.trim()) { lines.push({ type: 'blank' }); continue; }

    // Page numbers from a printout carry no musical information.
    if (PAGE_FURNITURE.test(line)) continue;

    const section = sectionLabel(line);
    if (section) { lines.push({ type: 'section', label: section }); continue; }

    if (isChordLine(line)) {
      const positions = chordPositions(line);
      positions.forEach((p) => chords.push(p.name));
      // Consume the next line as the lyric, unless it is itself chords or blank.
      const next = raw[i + 1];
      const lyric = next !== undefined && next.trim() && !isChordLine(next) ? raw[++i] : '';
      lines.push({ type: 'mixed', segments: segmentsFor(positions, lyric) });
      continue;
    }

    lines.push({ type: 'lyric', segments: [{ chord: null, text: line }] });
  }

  return { meta, lines, chords, uniqueChords: [...new Set(chords)] };
}

/** Which of the three supported layouts a pasted sheet is written in. */
export function detectSheetFormat(text) {
  // Only count a bracketed token as ChordPro if it is genuinely a chord.
  // Section headings share their first letter with real chords — [Chorus],
  // [Bridge], [Ending], [Fine] — and reading one as a chord marker makes the
  // whole sheet parse as ChordPro, discarding the real chord lines.
  const bracketed = text.match(/\[([^\]\n]{1,14})\]/g) || [];
  if (bracketed.some((b) => isChordToken(b.slice(1, -1).trim()))) return 'chordpro';

  const lines = text.split(/\r?\n/)
    .filter((l) => l.trim() && !sectionLabel(l) && !PAGE_FURNITURE.test(l));
  if (lines.length > 1 && lines.some(isChordLine) && lines.some((l) => !isChordLine(l))) {
    return 'over-lyrics';
  }
  return 'list';
}

/**
 * The changes a song actually contains, ranked by how often they occur.
 *
 * Individual chords are the easy part; moving between them is the skill, and
 * a song's difficulty lives in its handful of most frequent transitions.
 * A↔B and B↔A count together, since you practise a change in both directions.
 */
export function chordTransitions(chords) {
  const seq = chords.filter((c, i) => i === 0 || c !== chords[i - 1]);
  const counts = new Map();

  for (let i = 1; i < seq.length; i++) {
    const key = [seq[i - 1], seq[i]].sort().join(' ');
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const total = seq.length - 1;
  return {
    total,
    sequence: seq,
    pairs: [...counts.entries()]
      .map(([key, count]) => {
        const [a, b] = key.split(' ');
        return {
          a, b, count,
          share: total > 0 ? count / total : 0,
          hard: [a, b].some((c) => { const s = lookupShape(c); return !s || !s.easy; }),
        };
      })
      .sort((x, y) => y.count - x.count),
  };
}

/**
 * A pasteable drill: each change repeated, hardest-worked first. Written as a
 * plain chord list so it can go straight back into the app.
 */
export function buildDrill(pairs, repeats = 4) {
  return pairs
    .map(({ a, b }) => Array.from({ length: repeats }, () => `${a} ${b}`).join(' '))
    .join('\n');
}

/* ------------------------------------------------------------- rendering */

/** Vertical chord-box diagram as SVG. */
export function renderChordDiagram(name, shape, opts = {}) {
  const W = opts.width || 92;
  const STR_GAP = 13;
  const FRET_GAP = 17;
  const LEFT = (W - 5 * STR_GAP) / 2;
  const TOP = 30;
  const FRETS = 4;
  const H = TOP + FRETS * FRET_GAP + 16;

  if (!shape) {
    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="${W / 2}" y="20" fill="#e6edf3" font-size="13" font-weight="600"
        text-anchor="middle" font-family="-apple-system, Segoe UI, system-ui, sans-serif">${name}</text>
      <text x="${W / 2}" y="${TOP + 30}" fill="#8b98a9" font-size="10"
        text-anchor="middle" font-family="-apple-system, Segoe UI, system-ui, sans-serif">no shape</text>
    </svg>`;
  }

  const fretted = shape.frets.filter((f) => f > 0);
  const minFret = fretted.length ? Math.min(...fretted) : 1;
  const maxFret = fretted.length ? Math.max(...fretted) : 1;
  // Slide the window up the neck when the shape doesn't reach the nut.
  const baseFret = maxFret <= FRETS ? 1 : minFret;
  const showNut = baseFret === 1;

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    font-family="-apple-system, Segoe UI, system-ui, sans-serif">`;
  svg += `<text x="${W / 2}" y="14" fill="#e6edf3" font-size="13" font-weight="600" text-anchor="middle">${name}</text>`;

  // Grid.
  for (let s = 0; s < 6; s++) {
    const x = LEFT + s * STR_GAP;
    svg += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + FRETS * FRET_GAP}" stroke="#3d4757" stroke-width="1"/>`;
  }
  for (let f = 0; f <= FRETS; f++) {
    const y = TOP + f * FRET_GAP;
    const nut = f === 0 && showNut;
    svg += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + 5 * STR_GAP}" y2="${y}"
      stroke="${nut ? '#8b98a9' : '#2a323e'}" stroke-width="${nut ? 3 : 1}"/>`;
  }
  if (!showNut) {
    svg += `<text x="${LEFT + 5 * STR_GAP + 7}" y="${TOP + 12}" fill="#8b98a9" font-size="10">${baseFret}</text>`;
  }

  // Barre.
  if (shape.barre && shape.barre.fret >= baseFret && shape.barre.fret < baseFret + FRETS) {
    const y = TOP + (shape.barre.fret - baseFret + 0.5) * FRET_GAP;
    const x1 = LEFT + (6 - shape.barre.from) * STR_GAP;
    const x2 = LEFT + (6 - shape.barre.to) * STR_GAP;
    svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#58a6ff"
      stroke-width="9" stroke-linecap="round" opacity="0.85"/>`;
  }

  // Dots, and the open/muted markers above the nut.
  shape.frets.forEach((fret, idx) => {
    const x = LEFT + idx * STR_GAP;   // index 0 is the low E, drawn leftmost
    if (fret === -1) {
      svg += `<text x="${x}" y="${TOP - 5}" fill="#8b98a9" font-size="10" text-anchor="middle">×</text>`;
      return;
    }
    if (fret === 0) {
      svg += `<circle cx="${x}" cy="${TOP - 9}" r="3.5" fill="none" stroke="#3fb950" stroke-width="1.5"/>`;
      return;
    }
    const rel = fret - baseFret;
    if (rel < 0 || rel >= FRETS) return;
    const y = TOP + (rel + 0.5) * FRET_GAP;
    svg += `<circle cx="${x}" cy="${y}" r="5" fill="#58a6ff"/>`;
  });

  return svg + '</svg>';
}
