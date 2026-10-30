/**
 * Lyre harp and kalimba: instruments that are nothing but a row of fixed
 * pitches.
 *
 * These two sit at the opposite end of the app from the guitar. A guitar's hard
 * question is *where* to play a note — the same pitch exists in up to five
 * places, so `fingering.js` runs a search to choose. A piano has no such
 * question but has every note. A lyre and a kalimba have neither: one pitch is
 * one string, and half the notes in the chromatic scale are simply **not on the
 * instrument at all**.
 *
 * That last fact drives everything here. Both ship tuned to a plain C major
 * scale, so there is no F♯ anywhere on a lyre and never will be. A song in D
 * cannot be played — not "is awkward", cannot. So where the guitar page ranks
 * chords by whether they need a barre and the piano page by whether they land
 * on black keys, this module's first job is to answer *is this even possible*,
 * and its second is to find the transposition that makes it so.
 *
 * The two instruments differ only in their layout, which is why they share a
 * family rather than a module each:
 *
 * - a **lyre** is a plain row, longest and lowest on the left, rising by one
 *   letter per string all the way to the right;
 * - a **kalimba** is a fan. The longest, *lowest* tine is in the *middle*, and
 *   the scale climbs by alternating right, left, right, left out to the short
 *   tines at both edges. Nothing about it is in pitch order to look at, which
 *   is the single hardest thing about starting on one.
 */

import { midiToName, midiToOctave, freqToMidi } from './notes.js';
import { chordVoicing } from './piano.js';
import { t } from './i18n.js';
import { getInstrument } from './instrument.js';

const pitchClass = (midi) => ((midi % 12) + 12) % 12;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** C major, one letter per step: the scale both instruments ship tuned to. */
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

/** `count` notes of C major, starting at `startMidi`. */
function diatonic(startMidi, count) {
  const startPc = pitchClass(startMidi);
  let degree = MAJOR_STEPS.indexOf(startPc);
  if (degree < 0) degree = 0;
  const out = [];
  let octave = Math.floor(startMidi / 12) * 12;
  for (let i = 0; i < count; i++) {
    const d = (degree + i) % 7;
    const wraps = Math.floor((degree + i) / 7);
    out.push(octave + wraps * 12 + MAJOR_STEPS[d]);
  }
  return out;
}

/* ------------------------------------------------------------------ layouts */

/**
 * A 16-string lyre, G3 to A5.
 *
 * Sixteen has become the size most of these are sold in, and they arrive tuned
 * to C major from G3 — three notes below middle C, up to A5. String 1 is the
 * thickest and lowest, on the left as you face the front, and the numbering
 * runs the same way the pitch does. That is the opposite of a guitar, where
 * string 1 is the *thinnest*, and it is worth saying out loud to anyone
 * arriving from one.
 */
const LYRE = {
  id: 'lyre',
  arrangement: 'row',
  count: 16,
  midis: diatonic(55, 16),          // G3 … A5
  /** Where a chord is comfortable to start from. */
  chordFloor: 60,
  /** Numbering runs with the pitch, so pitch order *is* string order. */
  order: null,                      // filled below
  numbers: null,
};

/**
 * A 17-key kalimba, C4 to E6.
 *
 * Tine 1 is the long one in the centre and is the *lowest* note. From there the
 * scale alternates: 2 to the right, 3 to the left, 4 further right, and so on,
 * so the odd numbers run out to the left and the even ones out to the right,
 * with the two highest notes at the outer edges. A handful of makers mirror
 * this — the numbers stamped on your own tines are the authority.
 */
const KALIMBA = {
  id: 'kalimba',
  arrangement: 'fan',
  count: 17,
  midis: diatonic(60, 17),          // C4 … E6
  chordFloor: 60,
  order: null,
  numbers: null,
};

/** Left-to-right positions, given as indices into `midis`. */
function buildOrder(layout) {
  layout.numbers = layout.midis.map((_, i) => i + 1);
  if (layout.arrangement === 'row') {
    layout.order = layout.midis.map((_, i) => i);
    return;
  }
  // A fan: odd numbers stack outward to the left, even ones outward to the
  // right, with number 1 — the longest, lowest tine — alone in the middle.
  const left = [];
  const right = [];
  for (let i = 0; i < layout.count; i++) {
    if (i === 0) continue;
    (i % 2 === 0 ? left : right).push(i);   // index 2 is number 3, and so on
  }
  layout.order = [...left.reverse(), 0, ...right];
}

buildOrder(LYRE);
buildOrder(KALIMBA);

export const LAYOUTS = { lyre: LYRE, kalimba: KALIMBA };

export function layoutFor(id = getInstrument()) {
  return LAYOUTS[id] || LYRE;
}

/** Which of the twelve pitch classes exist anywhere on the instrument. */
export function availablePitchClasses(layout) {
  return new Set(layout.midis.map(pitchClass));
}

/** The pitch-order index of a note, or −1 when the instrument has not got it. */
export function indexOfMidi(layout, midi) {
  return layout.midis.indexOf(midi);
}

/** True when this exact pitch is on the instrument. */
export const hasMidi = (layout, midi) => layout.midis.includes(midi);

/**
 * True when the *note* exists somewhere, in some octave. Weaker than `hasMidi`
 * and the more useful of the two for a chord, where the octave is free.
 */
export const hasPitchClass = (layout, midi) =>
  availablePitchClasses(layout).has(pitchClass(midi));

export const midiLabel = (midi) => midiToName(midi) + midiToOctave(midi);

/** The printed number of a string or tine, from its pitch-order index. */
export const numberOf = (layout, index) => layout.numbers[index];

/** Where an index sits left to right, 0-based. */
export const columnOf = (layout, index) => layout.order.indexOf(index);

/**
 * Which side of a kalimba a tine is on, and how far out.
 * Meaningless for a lyre, which is why it is only asked for a fan.
 */
export function fanPosition(layout, index) {
  const n = numberOf(layout, index);
  if (n === 1) return { side: 'centre', out: 0 };
  return n % 2 === 0
    ? { side: 'right', out: n / 2 }
    : { side: 'left', out: (n - 1) / 2 };
}

/**
 * Where a string or tine is, in words.
 *
 * Deliberately *not* a restatement of the number, which the caller already has.
 * On a lyre the number tells you nothing you cannot see, so the useful fact is
 * which hand's half it falls in — the hands divide the instrument and do not
 * cross. On a kalimba the number tells you nothing about where it *is*, which
 * is the whole difficulty, so there the answer is the side and the distance
 * from the middle.
 */
export function describeTine(layout, index) {
  if (layout.arrangement === 'row') {
    return t(numberOf(layout, index) <= layout.count / 2
      ? 'tines.handLeft' : 'tines.handRight');
  }
  const pos = fanPosition(layout, index);
  if (pos.side === 'centre') return t('tines.centre');
  return t(pos.side === 'left' ? 'tines.leftOf' : 'tines.rightOf', { n: pos.out });
}

/** "string 4 of 16" — the counting fact, kept separate from the placing one. */
export function tineNumberLabel(layout, index) {
  return t('tines.stringNo', { n: numberOf(layout, index), total: layout.count });
}

/**
 * Closest string or tine to a played frequency, for the tuner.
 *
 * Same job as `nearestString` on a guitar, and a much more frequent one: a
 * guitarist tunes six strings, a lyre player sixteen, and a lyre goes out of
 * tune far faster than a guitar does.
 */
export function nearestTine(layout, freq, a4 = 440) {
  const exact = freqToMidi(freq, a4);
  let best = null;
  layout.midis.forEach((midi, index) => {
    const cents = (exact - midi) * 100;
    if (!best || Math.abs(cents) < Math.abs(best.cents)) {
      best = { index, midi, number: numberOf(layout, index), label: midiLabel(midi), cents };
    }
  });
  return best;
}

/* ------------------------------------------------------------------ chords */

/**
 * A chord as strings to pluck.
 *
 * Unlike a guitar grip or a piano voicing, this can come back **impossible**:
 * a D major needs an F♯ and there is no F♯ on the instrument, in any octave,
 * ever. `missing` names the notes that are not there, and the caller is
 * expected to say so rather than quietly drawing a two-note chord.
 *
 * When it is possible, the notes are claimed in rising order from the middle of
 * the instrument, which is both how a chord is actually played here and what
 * keeps the hand in one place across a song.
 */
export function chordTines(layout, name) {
  const voicing = chordVoicing(name);
  if (!voicing) return null;

  const available = availablePitchClasses(layout);
  const wanted = voicing.midis.map(pitchClass);
  const missing = [...new Set(wanted.filter((pc) => !available.has(pc)))]
    .map((pc) => midiToName(pc));

  // Rising from the middle: each note is the lowest one above the last that
  // has the right letter, which is exactly how a hand walks up the strings.
  const chosen = [];
  let floor = layout.chordFloor;
  for (const pc of wanted) {
    if (!available.has(pc)) continue;
    let index = layout.midis.findIndex((m) => m >= floor && pitchClass(m) === pc);
    if (index < 0) index = layout.midis.findIndex((m) => pitchClass(m) === pc);
    if (index < 0) continue;
    chosen.push(index);
    floor = layout.midis[index] + 1;
  }

  const chosenSet = new Set(chosen);
  // Every other place the same notes live. Faded rather than hidden, because
  // "this chord is also over there" is the fact that makes a lyre playable at
  // more than one height.
  const others = layout.midis
    .map((m, i) => i)
    .filter((i) => !chosenSet.has(i) && available.has(pitchClass(layout.midis[i]))
      && wanted.includes(pitchClass(layout.midis[i])));

  return {
    name: String(name).trim(),
    playable: missing.length === 0 && chosen.length >= 2,
    missing,
    indices: chosen,
    others,
    notes: chosen.map((i) => layout.midis[i]),
  };
}

/** How awkward a chord is here: not awkward at all, or flatly impossible. */
export function chordIsImpossible(layout, name) {
  const c = chordTines(layout, name);
  return !c || !c.playable;
}

/* --------------------------------------------------------------- transpose */

/**
 * Choose a transposition, which on these instruments is the whole ball game.
 *
 * The guitar's version of this weighs hand span against fret height and the
 * piano's just centres the tune. Here the question is blunter: how many of the
 * notes exist at all? A tune in D loses every F♯ and C♯ — perhaps a third of
 * itself — and moving it down two semitones to C recovers every one of them.
 *
 * So playability dominates by two orders of magnitude, and register only breaks
 * ties. Every semitone within two octaves is a candidate, not just the octaves:
 * the whole point is to find the *key* that fits, and that is rarely a multiple
 * of twelve.
 */
export function suggestTineShift(layout, midis, candidates = null) {
  if (!midis || !midis.length) return { semitones: 0 };
  const list = candidates || Array.from({ length: 25 }, (_, i) => i - 12);

  const available = availablePitchClasses(layout);
  const low = layout.midis[0];
  const high = layout.midis[layout.midis.length - 1];
  const centre = (low + high) / 2;

  let best = null;
  for (const semitones of list) {
    const shifted = midis.map((m) => m + semitones);
    // Two different failures, weighted differently. A note whose *letter* is
    // not on the instrument is gone for good; a note that is merely out of
    // range can often be pulled into the octave that is, so it costs less.
    const wrongLetter = shifted.filter((m) => !available.has(pitchClass(m))).length;
    const outOfRange = shifted.filter((m) =>
      available.has(pitchClass(m)) && (m < low || m > high)).length;

    const sorted = [...shifted].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const score = wrongLetter * 1000
      + outOfRange * 40
      + Math.abs(median - centre)
      + (Math.abs(semitones) / 12) * 2;      // mild preference for as written

    if (!best || score < best.score) {
      best = { semitones, score, wrongLetter, outOfRange, playable: midis.length - wrongLetter };
    }
  }
  return best;
}

/** Counts for the overview panel. */
export function tineSummary(layout, midis) {
  const available = availablePitchClasses(layout);
  const onInstrument = midis.filter((m) => hasMidi(layout, m));
  const wrongLetter = midis.filter((m) => !available.has(pitchClass(m)));
  const outOfRange = midis.filter((m) =>
    available.has(pitchClass(m)) && !hasMidi(layout, m));

  const used = new Set(onInstrument.map((m) => indexOfMidi(layout, m)));
  return {
    total: midis.length,
    playable: onInstrument.length,
    wrongLetter: wrongLetter.length,
    outOfRange: outOfRange.length,
    distinct: new Set(onInstrument).size,
    usedCount: used.size,
    low: onInstrument.length ? Math.min(...onInstrument) : null,
    high: onInstrument.length ? Math.max(...onInstrument) : null,
    missingNames: [...new Set(wrongLetter.map((m) => midiToName(m)))],
  };
}

/* ----------------------------------------------------------------- drawing */

const C = {
  body: '#1d232d', bodyEdge: '#39424f', bar: '#8b98a9', line: '#39424f',
  text: '#e6edf3', muted: '#8b98a9', ink: '#04121f', dim: '#2a323e',
  accent: '#58a6ff', good: '#3fb950', warn: '#d29922', bad: '#f85149',
  faint: '#3d4757',
};
const FONT = '-apple-system, Segoe UI, system-ui, sans-serif';

const MARK_STYLE = {
  target: { fill: C.accent, dark: true },
  played: { fill: C.good, dark: true },
  wrong: { fill: C.bad, dark: false },
  missing: { fill: C.warn, dark: true },
  heat: { fill: C.accent, dark: true },
  ghost: { fill: '#8957e5', dark: false },
};

/**
 * How long to draw a string or a tine.
 *
 * Not decoration. On both instruments the length is what you actually look at
 * to find your place — it is the only thing distinguishing one bare metal bar
 * from the next — so a drawing that made them all the same height would throw
 * away the instrument's own signposting.
 *
 * A string's pitch goes as 1/L and a bar's as 1/L², so the exponents differ;
 * both are then flattened a little so the shortest is not a stub.
 */
function normalisedLengths(layout) {
  const lo = layout.midis[0];
  // A bar's pitch goes as 1/L², a string's as 1/L, so the exponent is not the
  // same for the two. Both land the shortest at about 45% of the longest,
  // which is close to what either instrument actually looks like.
  const power = layout.arrangement === 'fan' ? 0.5 : 0.55;
  return layout.midis.map((midi) => Math.pow(2, (-(midi - lo) / 12) * power));
}

function markMap(marks) {
  const out = new Map();
  for (const m of marks || []) {
    if (Number.isInteger(m.index)) out.set(m.index, m);
  }
  return out;
}

/**
 * The instrument, drawn to scale, with any set of strings marked.
 *
 * One renderer for both layouts: a lyre hangs its strings down from the
 * crossbar and a kalimba stands its tines up from the bridge, but past that the
 * drawing is the same — bars at even spacing, length carrying the pitch, marks
 * filled in. `marks` are `{ index, kind, label, weight }` with `index` counting
 * in *pitch* order, never in screen order, so callers never have to know that a
 * kalimba is shuffled.
 */
export function renderTines(layout, options = {}) {
  const {
    width = 540,
    marks = [],
    showNumbers = true,
    showNames = true,
    caption = null,
    height: wantHeight = null,
  } = options;

  const marked = markMap(marks);
  const lengths = normalisedLengths(layout);
  const fan = layout.arrangement === 'fan';

  const slot = width / layout.count;
  const barW = Math.max(3, slot * (fan ? 0.5 : 0.34));
  const captionH = caption ? 15 : 0;
  const nameH = showNames ? 13 : 0;
  const numberH = showNumbers ? 12 : 0;
  const maxLen = wantHeight
    ? wantHeight - captionH - nameH - numberH - 16
    : Math.round(Math.min(150, Math.max(70, slot * 3.4)));
  const bodyH = fan ? Math.round(maxLen * 0.32) : 14;
  const height = captionH + numberH + maxLen + bodyH + nameH + 10;

  const x = (index) => columnOf(layout, index) * slot + slot / 2;

  let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%"
    style="max-width:${width}px;height:auto;display:block"
    xmlns="http://www.w3.org/2000/svg" font-family="${FONT}">`;

  if (caption) {
    svg += `<text x="${width / 2}" y="11" fill="${C.text}" font-size="12"
      font-weight="600" text-anchor="middle">${esc(caption)}</text>`;
  }

  // Where the bars start, and which way they run.
  const barBase = fan
    ? captionH + numberH + maxLen          // tines stand up from the bridge
    : captionH + numberH + 4;              // strings hang down from the crossbar

  if (fan) {
    // Body, sound hole and bridge. The bridge is the line the length is
    // measured from, so it is the one part that has to be drawn accurately.
    svg += `<rect x="2" y="${barBase - 2}" width="${width - 4}" height="${bodyH + 4}"
      rx="7" fill="${C.body}" stroke="${C.bodyEdge}" stroke-width="1"/>`;
    svg += `<circle cx="${width / 2}" cy="${barBase + bodyH * 0.62}"
      r="${Math.min(9, bodyH * 0.3)}" fill="#0d1117" stroke="${C.bodyEdge}" stroke-width="0.8"/>`;
    svg += `<line x1="6" y1="${barBase}" x2="${width - 6}" y2="${barBase}"
      stroke="${C.bar}" stroke-width="3"/>`;
  } else {
    // Crossbar at the top, where the tuning pins are, and the slanted bridge
    // the string ends sit on.
    svg += `<line x1="4" y1="${barBase - 3}" x2="${width - 4}" y2="${barBase - 3}"
      stroke="${C.bar}" stroke-width="4"/>`;
    const first = barBase + lengths[layout.order[0]] * maxLen;
    const last = barBase + lengths[layout.order[layout.count - 1]] * maxLen;
    svg += `<path d="M4 ${first + 4} L${width - 4} ${last + 4}"
      stroke="${C.bodyEdge}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }

  const labels = [];

  for (let i = 0; i < layout.count; i++) {
    const cx = x(i);
    const len = lengths[i] * maxLen;
    const mark = marked.get(i);
    const style = mark ? MARK_STYLE[mark.kind] || MARK_STYLE.target : null;
    const opacity = mark ? 0.35 + (mark.weight ?? 1) * 0.65 : 1;

    const top = fan ? barBase - len : barBase;
    const fill = style ? style.fill : (fan ? C.bar : C.faint);

    if (fan) {
      svg += `<rect x="${(cx - barW / 2).toFixed(1)}" y="${top.toFixed(1)}"
        width="${barW.toFixed(1)}" height="${len.toFixed(1)}" rx="${(barW / 2).toFixed(1)}"
        fill="${fill}" fill-opacity="${opacity}"
        stroke="${style ? style.fill : C.bodyEdge}" stroke-width="0.7"/>`;
    } else {
      // A string, not a bar: on a lyre the low strings are visibly thicker as
      // well as longer, and that is half of how you find one without looking.
      const w = Math.max(1.2, barW * (0.30 + lengths[i] * 0.55));
      svg += `<line x1="${cx.toFixed(1)}" y1="${top.toFixed(1)}"
        x2="${cx.toFixed(1)}" y2="${(top + len).toFixed(1)}"
        stroke="${fill}" stroke-opacity="${opacity}" stroke-width="${w.toFixed(1)}"
        stroke-linecap="round"/>`;
      // A line cannot be read at a glance once sixteen of them are side by
      // side, so a marked string also gets a disc at its free end — but only
      // when it is being asserted. A chord's faint "the same notes also live
      // here" strings would otherwise put eight more discs on the drawing and
      // bury the three that are the answer.
      if (mark && (mark.label || (mark.weight ?? 1) >= 0.4)) {
        svg += `<circle cx="${cx.toFixed(1)}" cy="${(top + len - 9).toFixed(1)}"
          r="${Math.min(8, slot * 0.36).toFixed(1)}" fill="${style.fill}"
          fill-opacity="${opacity}"/>`;
      }
    }

    if (showNumbers) {
      const ny = fan ? barBase + bodyH + 11 : captionH + 9;
      labels.push({
        x: cx, y: ny, text: String(numberOf(layout, i)),
        fill: mark ? style.fill : C.muted, size: Math.min(9, slot * 0.42), weight: 600,
      });
    }
    if (showNames) {
      const ly = fan ? top - 4 : top + len + (mark ? 12 : 13);
      labels.push({
        x: cx, y: ly, text: midiToName(layout.midis[i]),
        fill: mark ? C.text : C.muted, size: Math.min(11, slot * 0.5),
        weight: mark ? 700 : 500,
      });
    }
    if (mark && mark.label) {
      const cy = fan ? top + len / 2 + 3 : top + len - 6;
      labels.push({
        x: cx, y: cy, text: String(mark.label),
        fill: style.dark ? C.ink : '#fff', size: Math.min(9, slot * 0.42), weight: 700,
      });
    }
  }

  for (const l of labels) {
    svg += `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" fill="${l.fill}"
      font-size="${l.size.toFixed(1)}" font-weight="${l.weight}"
      text-anchor="middle">${esc(l.text)}</text>`;
  }

  return `${svg}</svg>`;
}

/** One chord as strings to pluck, ready to drop into a panel. */
export function renderChordTines(layout, name, opts = {}) {
  const chord = chordTines(layout, name);
  const width = opts.width || 260;
  if (!chord) {
    return `<svg viewBox="0 0 ${width} 46" width="${width}" height="46"
      xmlns="http://www.w3.org/2000/svg" font-family="${FONT}">
      <text x="${width / 2}" y="18" fill="${C.text}" font-size="12" font-weight="600"
        text-anchor="middle">${esc(name)}</text>
      <text x="${width / 2}" y="34" fill="${C.muted}" font-size="10"
        text-anchor="middle">${esc(opts.unknownLabel || 'not known')}</text></svg>`;
  }

  const marks = chord.indices.map((index, i) => ({
    index, kind: 'target', label: opts.showOrder === false ? null : String(i + 1),
  }));
  for (const index of chord.others) marks.push({ index, kind: 'heat', weight: 0.15 });

  const svg = renderTines(layout, {
    width, marks, caption: opts.caption ?? name,
    height: opts.height || null,
  });

  if (!chord.missing.length) return svg;
  // An impossible chord has to say so on the diagram itself. Drawing the two
  // notes that do exist and leaving it there would be showing someone a chord
  // that is not the chord.
  return `${svg}<div class="tine-missing">${esc(
    t('tines.chordMissing', { notes: chord.missing.join(' ') }))}</div>`;
}

/**
 * The song as strings to pluck, in order — the counterpart of guitar tab and of
 * the piano roll.
 *
 * Rows are strings rather than semitones, so a gap between two rows is a gap
 * between two *strings*, which is the distance a hand actually has to travel.
 * A note the instrument has not got gets a marked-out column instead of being
 * dropped: a silent hole in a melody is something the player has to know about.
 */
export function renderTineRoll(layout, events, midis, opts = {}) {
  const ROW_H = opts.rowH || 12;
  const NOTE_W = opts.noteW || 22;
  const BAR_W = 8, LEFT = 42;
  const WIDTH = opts.width || 900;
  const rows = layout.count;
  const staffH = rows * ROW_H;
  const SYSTEM_H = staffH + 24;

  const tokens = [];
  let noteIndex = 0;
  for (const ev of events || []) {
    if (ev.type === 'note') {
      const count = ev.notes ? ev.notes.length : 1;
      const notes = [];
      for (let k = 0; k < count; k++) notes.push(midis[noteIndex++]);
      tokens.push({ kind: 'note', notes });
    } else if (ev.type === 'bar') tokens.push({ kind: 'bar' });
    else if (ev.type === 'rest') tokens.push({ kind: 'rest' });
  }
  if (!tokens.length) return '';

  const systems = [[]];
  let x = LEFT;
  for (const tok of tokens) {
    const w = tok.kind === 'note' ? NOTE_W : BAR_W;
    if (x + w > WIDTH - 10) { systems.push([]); x = LEFT; }
    systems[systems.length - 1].push({ ...tok, x });
    x += w;
  }

  // Highest string at the top, as on every other stave in the app.
  const rowY = (top, index) => top + (rows - 1 - index) * ROW_H;

  let svg = `<svg width="${WIDTH}" height="${systems.length * SYSTEM_H + 10}"
    xmlns="http://www.w3.org/2000/svg" font-family="${FONT}">`;

  systems.forEach((system, si) => {
    const top = si * SYSTEM_H + 14;

    for (let i = 0; i < rows; i++) {
      const y = rowY(top, i);
      const isC = pitchClass(layout.midis[i]) === 0;
      if (isC) {
        svg += `<rect x="${LEFT}" y="${y}" width="${WIDTH - 10 - LEFT}" height="${ROW_H}"
          fill="#1d232d"/>`;
      }
      svg += `<line x1="${LEFT}" y1="${y + ROW_H}" x2="${WIDTH - 10}" y2="${y + ROW_H}"
        stroke="#232a34" stroke-width="1"/>`;
      svg += `<text x="${LEFT - 6}" y="${y + ROW_H - 2}" fill="${isC ? C.accent : C.muted}"
        font-size="9" text-anchor="end">${numberOf(layout, i)} · ${
          esc(midiLabel(layout.midis[i]))}</text>`;
    }

    for (const tok of system) {
      if (tok.kind === 'bar') {
        svg += `<line x1="${tok.x + 3}" y1="${top}" x2="${tok.x + 3}" y2="${top + staffH}"
          stroke="#3d4757" stroke-width="1.5"/>`;
        continue;
      }
      if (tok.kind !== 'note') continue;
      for (const midi of tok.notes) {
        if (!Number.isFinite(midi)) continue;
        const index = indexOfMidi(layout, midi);
        if (index < 0) {
          svg += `<text x="${tok.x + NOTE_W / 2}" y="${top + staffH + 12}"
            fill="${C.bad}" font-size="10" text-anchor="middle">×</text>`;
          continue;
        }
        const y = rowY(top, index);
        svg += `<rect x="${tok.x + 2}" y="${y + 1}" width="${NOTE_W - 4}" height="${ROW_H - 2}"
          rx="2" fill="${C.accent}"/>`;
        svg += `<text x="${tok.x + NOTE_W / 2}" y="${y + ROW_H - 3}" fill="${C.ink}"
          font-size="${Math.min(9, ROW_H - 3)}" font-weight="700"
          text-anchor="middle">${numberOf(layout, index)}</text>`;
      }
    }
  });

  return `${svg}</svg>`;
}
