/**
 * Piano: keyboard geometry, drawing, chord voicings, and matching held keys.
 *
 * The guitar's hard question is *where* to play a note — the same pitch exists
 * in up to five places, so `fingering.js` runs a search to choose. A piano has
 * no such question: one pitch, one key. What replaces it is *which fingers*,
 * and — for chords — which notes make up the shape, since a piano chord is a
 * set of notes rather than a memorised grip.
 *
 * So this module is mostly a renderer plus a small amount of theory, and there
 * is no equivalent of the fingering DP.
 */

import { templateFor } from './chroma.js';
import { t } from './i18n.js';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
/** German note names: H is what international notation calls B. */
const GERMAN_NAMES = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'];

/** A0 to C8 — the 88 keys of a full-size piano. */
export const LOWEST_KEY = 21;
export const HIGHEST_KEY = 108;
/** Middle C. The one fixed landmark on an otherwise repeating pattern. */
const MIDDLE_C = 60;

const BLACK_PC = new Set([1, 3, 6, 8, 10]);
/** White keys strictly below each pitch class, within its own octave. */
const WHITE_BELOW = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];

const pitchClass = (midi) => ((midi % 12) + 12) % 12;

/**
 * Chord names reach these diagrams straight from a pasted sheet, so they are
 * escaped here rather than at each call site — a renderer that can be handed
 * arbitrary text should not depend on every caller remembering.
 */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const isBlackKey = (midi) => BLACK_PC.has(pitchClass(midi));

export const inRange = (midi) => midi >= LOWEST_KEY && midi <= HIGHEST_KEY;

/** How many white keys sit below `midi`. Also the x-position of a black key. */
export function whiteIndex(midi) {
  const octave = Math.floor(midi / 12);
  return octave * 7 + WHITE_BELOW[midi - octave * 12];
}

const snapDown = (midi) => (isBlackKey(midi) ? midi - 1 : midi);
const snapUp = (midi) => (isBlackKey(midi) ? midi + 1 : midi);

export function keyName(midi, german = false) {
  return (german ? GERMAN_NAMES : SHARP_NAMES)[pitchClass(midi)];
}

export function keyLabel(midi, german = false) {
  return keyName(midi, german) + (Math.floor(midi / 12) - 1);
}

/**
 * Where a key sits relative to middle C, in octaves.
 *
 * The single most useful orientation fact for a beginner, and the one a
 * keyboard diagram cannot show on its own once it is scrolled away from C4.
 */
export function relativeToMiddleC(midi) {
  const octaves = Math.floor(midi / 12) - Math.floor(MIDDLE_C / 12);
  if (midi === MIDDLE_C) return { octaves: 0, exact: true };
  return { octaves, exact: false };
}

/** That relationship in words, ready to print. */
export function describeKeyPosition(midi) {
  const rel = relativeToMiddleC(midi);
  if (rel.exact) return t('piano.isMiddleC');
  if (rel.octaves === 0) return t('piano.sameOctaveAsMiddleC');
  const n = Math.abs(rel.octaves);
  const key = rel.octaves > 0
    ? (n === 1 ? 'piano.octaveAbove' : 'piano.octavesAbove')
    : (n === 1 ? 'piano.octaveBelow' : 'piano.octavesBelow');
  return t(key, { n });
}

/** Whether a key is black or white, in words. */
export function describeKeyColour(midi) {
  return t(isBlackKey(midi) ? 'piano.blackKey' : 'piano.whiteKey');
}

/* --------------------------------------------------------------- drawing */

const C = {
  white: '#e6edf3', whiteEdge: '#9aa6b6', black: '#12171f', blackEdge: '#000',
  line: '#39424f', muted: '#8b98a9', text: '#e6edf3', ink: '#04121f',
  accent: '#58a6ff', good: '#3fb950', warn: '#d29922', bad: '#f85149',
};

/** Fill colour per mark kind, and whether its label needs dark ink. */
const MARK_STYLE = {
  target: { fill: C.accent, dark: true },
  played: { fill: C.good, dark: true },
  wrong: { fill: C.bad, dark: false },
  missing: { fill: C.warn, dark: true },
  heat: { fill: C.accent, dark: true },
  bass: { fill: '#8957e5', dark: false },
};

/**
 * Choose a window that shows `midis` with a little room either side, rounded
 * out to whole octaves so the black-key pattern stays recognisable.
 */
export function keyboardWindow(midis, { padOctaves = 0, minOctaves = 2 } = {}) {
  const list = (midis || []).filter(Number.isFinite);
  if (!list.length) return { from: 60, to: 84 };

  let low = Math.floor(Math.min(...list) / 12) * 12 - padOctaves * 12;
  let high = Math.ceil((Math.max(...list) + 1) / 12) * 12 + padOctaves * 12;

  while (high - low < minOctaves * 12) {
    // Grow downward first: melodies read better with headroom above them.
    if (low - 12 >= LOWEST_KEY) low -= 12;
    else if (high + 12 <= HIGHEST_KEY) high += 12;
    else break;
  }
  return {
    from: Math.max(LOWEST_KEY, snapDown(low)),
    to: Math.min(HIGHEST_KEY, snapUp(high)),
  };
}

/**
 * A keyboard as SVG.
 *
 * `marks` are `{ midi, kind, label, weight, finger }`. `weight` (0–1) fades a
 * mark, which is how the heat map shows "used more often" without needing a
 * second visual language. Black keys are drawn after white ones because they
 * overlap them, exactly as they do on the instrument.
 */
export function renderKeyboard(options = {}) {
  const {
    marks = [],
    width = 460,
    labelC = true,
    labelMarks = true,
    german = false,
    whiteHeight = 74,
    caption = null,
  } = options;

  const marked = new Map();
  for (const m of marks) {
    if (Number.isFinite(m.midi)) marked.set(m.midi, m);
  }

  const auto = keyboardWindow([...marked.keys()], { minOctaves: 1 });
  const from = Math.max(LOWEST_KEY, snapDown(options.from ?? auto.from));
  const to = Math.min(HIGHEST_KEY, snapUp(options.to ?? auto.to));

  const whites = whiteIndex(to) - whiteIndex(from) + 1;
  const ww = width / whites;
  const bw = ww * 0.6;
  const bh = whiteHeight * 0.62;
  const base = whiteIndex(from);
  const top = 2;
  const captionH = caption ? 15 : 0;
  const height = top + whiteHeight + 16 + captionH;

  const x = (midi) => (whiteIndex(midi) - base) * ww;
  const radius = Math.min(3, ww * 0.18);

  let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
    xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, Segoe UI, system-ui, sans-serif">`;

  if (caption) {
    svg += `<text x="${width / 2}" y="11" fill="${C.text}" font-size="12"
      font-weight="600" text-anchor="middle">${esc(caption)}</text>`;
  }
  const keyTop = top + captionH;

  const labels = [];

  /* White keys. */
  for (let m = from; m <= to; m++) {
    if (isBlackKey(m)) continue;
    const mark = marked.get(m);
    const style = mark ? MARK_STYLE[mark.kind] || MARK_STYLE.target : null;
    const opacity = mark ? 0.35 + (mark.weight ?? 1) * 0.65 : 1;

    svg += `<rect x="${x(m).toFixed(2)}" y="${keyTop}" width="${(ww - 1).toFixed(2)}"
      height="${whiteHeight}" rx="${radius}" fill="${style ? style.fill : C.white}"
      fill-opacity="${opacity}" stroke="${C.whiteEdge}" stroke-width="0.7"/>`;

    const cx = x(m) + (ww - 1) / 2;
    if (mark && labelMarks) {
      labels.push({ x: cx, y: keyTop + whiteHeight - 8, text: mark.label ?? keyName(m, german),
        fill: style.dark ? C.ink : '#fff', size: Math.min(11, ww * 0.62), weight: 700 });
      if (mark.finger) {
        labels.push({ x: cx, y: keyTop + whiteHeight - 21, text: String(mark.finger),
          fill: style.dark ? C.ink : '#fff', size: Math.min(9, ww * 0.5), weight: 500, opacity: 0.75 });
      }
    } else if (labelC && pitchClass(m) === 0) {
      // Every C is labelled with its octave: on a repeating pattern that is the
      // only thing telling you which part of the keyboard you are looking at.
      const middle = m === MIDDLE_C;
      labels.push({ x: cx, y: keyTop + whiteHeight - 7, text: keyLabel(m),
        fill: middle ? C.ink : '#5c6775', size: Math.min(10, ww * 0.58),
        weight: middle ? 700 : 500 });
      if (middle) {
        svg += `<circle cx="${cx}" cy="${keyTop + whiteHeight - 22}" r="2.6" fill="${C.accent}"/>`;
      }
    }
  }

  /* Black keys, drawn over the white ones they sit between. */
  for (let m = from; m <= to; m++) {
    if (!isBlackKey(m)) continue;
    const cx = x(m);
    if (cx <= 0 || cx >= width) continue;
    const mark = marked.get(m);
    const style = mark ? MARK_STYLE[mark.kind] || MARK_STYLE.target : null;
    const opacity = mark ? 0.4 + (mark.weight ?? 1) * 0.6 : 1;

    svg += `<rect x="${(cx - bw / 2).toFixed(2)}" y="${keyTop}" width="${bw.toFixed(2)}"
      height="${bh}" rx="${radius}" fill="${style ? style.fill : C.black}"
      fill-opacity="${opacity}" stroke="${C.blackEdge}" stroke-width="0.7"/>`;

    if (mark && labelMarks) {
      labels.push({ x: cx, y: keyTop + bh - 6, text: mark.label ?? keyName(m, german),
        fill: style.dark ? C.ink : '#fff', size: Math.min(9, bw * 0.62), weight: 700 });
      if (mark.finger) {
        labels.push({ x: cx, y: keyTop + bh - 17, text: String(mark.finger),
          fill: style.dark ? C.ink : '#fff', size: Math.min(8, bw * 0.55), weight: 500, opacity: 0.8 });
      }
    }
  }

  // Labels last so a black key drawn over a white one cannot cover its text.
  for (const l of labels) {
    svg += `<text x="${l.x.toFixed(2)}" y="${l.y}" fill="${l.fill}" font-size="${l.size.toFixed(1)}"
      font-weight="${l.weight}"${l.opacity ? ` opacity="${l.opacity}"` : ''}
      text-anchor="middle">${esc(l.text)}</text>`;
  }

  return svg + '</svg>';
}

/* --------------------------------------------------------------- voicing */

/**
 * Intervals used to *show* a chord, which is a different job from the templates
 * `chroma.js` matches against. Matching deliberately collapses colour tones onto
 * the triad underneath — a C6 should still answer yes to "is that a C". Telling
 * someone which keys to press must not collapse anything, or they play the
 * wrong chord and are told they are right.
 */
const VOICING_INTERVALS = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  7: [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  6: [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  9: [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  11: [0, 4, 7, 10, 17],
  13: [0, 4, 7, 10, 21],
};

const PC_INDEX = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6,
  Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

/** Right-hand fingering for a close-position chord, root at the bottom. */
const FINGERING = {
  2: [1, 5],
  3: [1, 3, 5],
  4: [1, 2, 3, 5],
  5: [1, 2, 3, 4, 5],
};

function normaliseQuality(raw) {
  const q = String(raw || '').trim();
  if (VOICING_INTERVALS[q] !== undefined) return q;
  const lower = q.toLowerCase();
  if (lower === 'maj' || lower === 'M' || lower === '') return '';
  if (lower === 'min') return 'm';
  if (lower === 'm7b5' || lower === 'ø') return 'm7b5';
  if (lower === 'dim7' || lower === 'o7') return 'dim7';
  if (lower === 'sus') return 'sus4';
  if (VOICING_INTERVALS[lower] !== undefined) return lower;
  if (/^min(\d.*)?$/.test(lower)) return normaliseQuality(lower.replace('min', 'm'));
  if (/^maj(\d+)$/.test(lower)) return lower === 'maj7' ? 'maj7' : 'maj9';
  return null;
}

/**
 * Notes and fingers for one chord, voiced close around middle C.
 *
 * Roots are placed in A3–G#4 so every chord lands under the same hand position
 * — a learner moving between C, F and G should not have to relocate. A slash
 * bass becomes a separate left-hand note an octave or so below, which is how a
 * piano actually plays one.
 */
export function chordVoicing(name) {
  const m = /^([A-G][#b]?)(.*)$/.exec(String(name || '').trim());
  if (!m) return null;
  const rootPc = PC_INDEX[m[1]];
  if (rootPc === undefined) return null;

  const [rawQuality, bassName] = m[2].split('/');
  const quality = normaliseQuality(rawQuality);
  if (quality === null) return null;

  let root = 60 + rootPc;
  if (root > 68) root -= 12;   // keep A–B below middle C rather than a ninth up

  const midis = VOICING_INTERVALS[quality].map((iv) => root + iv);
  const fingers = FINGERING[midis.length] || midis.map(() => null);

  let bass = null;
  if (bassName !== undefined) {
    const bassPc = PC_INDEX[bassName];
    if (bassPc !== undefined) {
      bass = 48 + bassPc;                       // C3–B3
      while (bass >= root - 4) bass -= 12;      // always clearly under the chord
    }
  }

  return {
    name: String(name).trim(),
    root,
    quality,
    midis,
    fingers,
    bass,
    /** Pitch classes actually sounding, bass included. */
    pitchClasses: [...new Set([...midis, ...(bass === null ? [] : [bass])].map(pitchClass))],
  };
}

/** A chord as a small keyboard diagram, ready to drop into a panel. */
export function renderChordKeyboard(name, opts = {}) {
  const voicing = chordVoicing(name);
  const width = opts.width || 176;
  if (!voicing) {
    return `<svg viewBox="0 0 ${width} 60" width="${width}" height="60"
      xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, Segoe UI, system-ui, sans-serif">
      <text x="${width / 2}" y="20" fill="${C.text}" font-size="12" font-weight="600"
        text-anchor="middle">${esc(name)}</text>
      <text x="${width / 2}" y="40" fill="${C.muted}" font-size="10"
        text-anchor="middle">${esc(opts.unknownLabel || 'not known')}</text></svg>`;
  }

  const marks = voicing.midis.map((midi, i) => ({
    midi, kind: 'target',
    finger: opts.showFingers === false ? null : voicing.fingers[i],
  }));
  if (voicing.bass !== null) marks.push({ midi: voicing.bass, kind: 'bass', finger: 5 });

  const notes = [...marks.map((k) => k.midi)];
  // Always show a whole octave below and above the chord, so the shape reads as
  // a position on the keyboard rather than as a floating cluster.
  const win = keyboardWindow(notes, { minOctaves: 2 });

  return renderKeyboard({
    ...win, marks, width,
    caption: opts.caption ?? name,
    whiteHeight: opts.whiteHeight || 56,
    german: opts.german,
  });
}

/* -------------------------------------------------------------- matching */

/**
 * Compare the keys currently held against the chord that was asked for.
 *
 * This is the whole reason to support MIDI. The microphone path has to infer a
 * chord from a smeared spectrum and answer with a confidence score; MIDI hands
 * over the exact set of notes, so the answer is not "0.83 sure" but "you have
 * everything except the E". Octave and doubling are ignored — playing the root
 * twice is still the same chord — so this compares pitch classes.
 */
export function matchHeld(held, expectedName) {
  const template = templateFor(expectedName);
  const voicing = chordVoicing(expectedName);
  // Prefer the fuller voicing spelling, falling back to the matcher's template
  // for chords voicing does not know how to spell.
  const wanted = voicing
    ? new Set(voicing.midis.map(pitchClass))
    : template
      ? new Set(template.intervals.map((iv) => (template.root + iv) % 12))
      : null;
  if (!wanted) return null;

  const heldPcs = new Set((held || []).map(pitchClass));
  const missing = [...wanted].filter((pc) => !heldPcs.has(pc));
  const extra = [...heldPcs].filter((pc) => !wanted.has(pc));

  // A wrong note is worse than a thin chord: leaving out the fifth still sounds
  // like the chord, adding a semitone next door does not.
  const score = Math.max(0, Math.min(1,
    (wanted.size - missing.length) / wanted.size - extra.length * 0.3));

  return {
    ok: missing.length === 0 && extra.length === 0,
    complete: missing.length === 0,
    score,
    missing: missing.map((pc) => SHARP_NAMES[pc]),
    extra: extra.map((pc) => SHARP_NAMES[pc]),
    wanted: [...wanted].map((pc) => SHARP_NAMES[pc]),
  };
}

/**
 * A chroma vector from exactly-known notes, so held keys can be named by the
 * same template matcher the microphone path uses. One code path for "what chord
 * is this", fed either by an FFT or by a keyboard.
 */
export function chromaFromNotes(held, out) {
  const chroma = out || new Float32Array(12);
  chroma.fill(0);
  if (!held || !held.length) return chroma;

  const lowest = Math.min(...held);
  for (const midi of held) {
    // The bass note is what a listener hears as the root, so weight it. Without
    // this an inversion is indistinguishable from the chord it inverts.
    chroma[pitchClass(midi)] += midi === lowest ? 1.4 : 1;
  }
  return chroma;
}

/* ------------------------------------------------------------ melody stats */

/** How many white keys a window spans, for sizing a drawing to fit it. */
export function whiteKeyCount(from, to) {
  return whiteIndex(snapUp(to)) - whiteIndex(snapDown(from)) + 1;
}

export function blackKeyCount(midis) {
  return new Set(midis.filter(isBlackKey).map(pitchClass)).size;
}

/**
 * Choose an octave shift that centres a melody on the keyboard.
 *
 * The guitar's version of this is a genuine search — `fingering.js` weighs hand
 * span against fret height, because on a guitar most octaves are barely
 * playable and the wrong choice turns a tune into a 16-fret scramble. A piano
 * has 88 keys and every octave under the same fingers, so the only thing left
 * to decide is which octave reads and reaches most easily: the one nearest
 * middle C.
 */
export function suggestOctaveShift(midis, candidates = [0, -24, -12, 12, 24]) {
  if (!midis || !midis.length) return { semitones: 0 };

  let best = null;
  for (const semitones of candidates) {
    const shifted = midis.map((m) => m + semitones);
    const outside = shifted.filter((m) => !inRange(m)).length;
    const sorted = [...shifted].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const score = outside * 100
      + Math.abs(median - MIDDLE_C)
      + (Math.abs(semitones) / 12) * 1.5;   // mild preference for as written

    if (!best || score < best.score) best = { semitones, score, outside, median };
  }
  return best;
}
