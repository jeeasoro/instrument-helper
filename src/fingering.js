/**
 * Choosing where to play a melody on the neck.
 *
 * The same pitch exists in up to five places on a guitar, so a note sequence
 * doesn't determine a fingering — you have to pick one. This scores every path
 * through the candidate positions with a Viterbi-style DP, minimising hand
 * movement rather than just picking the lowest fret each time.
 */

import { STANDARD_TUNING, MAX_FRET } from './notes.js';

const WEIGHTS = {
  fretMove: 1.0,      // per fret of hand travel between consecutive notes
  handShift: 2.5,     // extra, per fret beyond a comfortable 4-fret span
  stringMove: 0.35,   // per string crossed
  sameStringLeap: 0.5, // a leap on one string means a slide
  fretHeight: 0.10,   // mild preference for the lower neck
  upperNeck: 1.5,     // melodies above the 12th fret are awkward
  openBonus: 0.5,     // open strings need no finger at all
  COMFORT_SPAN: 4,
};

export function candidatePositions(midi, tuning = STANDARD_TUNING, maxFret = MAX_FRET) {
  const out = [];
  for (const s of tuning) {
    const fret = midi - s.midi;
    if (fret >= 0 && fret <= maxFret) out.push({ string: s.string, fret, midi });
  }
  return out;
}

function positionCost(p) {
  let cost = p.fret * WEIGHTS.fretHeight;
  if (p.fret === 0) cost -= WEIGHTS.openBonus;
  if (p.fret > 12) cost += WEIGHTS.upperNeck;
  return cost;
}

function transitionCost(a, b) {
  let cost = 0;

  // Open strings don't anchor the fretting hand, so they cost no travel.
  if (a.fret > 0 && b.fret > 0) {
    const move = Math.abs(a.fret - b.fret);
    cost += move * WEIGHTS.fretMove;
    if (move > WEIGHTS.COMFORT_SPAN) {
      cost += (move - WEIGHTS.COMFORT_SPAN) * WEIGHTS.handShift;
    }
    if (a.string === b.string && move > 0) cost += WEIGHTS.sameStringLeap;
  }

  cost += Math.abs(a.string - b.string) * WEIGHTS.stringMove;
  return cost;
}

/**
 * Least-effort fingering for a MIDI sequence.
 * Returns one { string, fret, midi } per note (null where a note is unplayable).
 */
export function optimalFingering(midiSequence, tuning = STANDARD_TUNING, maxFret = MAX_FRET) {
  const layers = midiSequence.map((m) => candidatePositions(m, tuning, maxFret));
  const n = layers.length;
  if (n === 0) return [];

  const scores = layers.map((layer) => layer.map(() => Infinity));
  const back = layers.map((layer) => layer.map(() => -1));

  layers[0].forEach((p, j) => { scores[0][j] = positionCost(p); });

  for (let i = 1; i < n; i++) {
    // A note with no playable position breaks the chain; restart scoring after it.
    if (layers[i - 1].length === 0) {
      layers[i].forEach((p, j) => { scores[i][j] = positionCost(p); });
      continue;
    }
    layers[i].forEach((p, j) => {
      let best = Infinity;
      let bestK = -1;
      layers[i - 1].forEach((prev, k) => {
        const total = scores[i - 1][k] + transitionCost(prev, p);
        if (total < best) { best = total; bestK = k; }
      });
      scores[i][j] = best + positionCost(p);
      back[i][j] = bestK;
    });
  }

  // Backtrack from the cheapest endpoint.
  const path = new Array(n).fill(null);
  let last = n - 1;
  while (last >= 0 && layers[last].length === 0) last--;
  if (last < 0) return path;

  let idx = scores[last].indexOf(Math.min(...scores[last]));
  for (let i = last; i >= 0; i--) {
    if (idx < 0 || layers[i].length === 0) break;
    path[i] = layers[i][idx];
    idx = back[i][idx];
  }
  return path;
}

/**
 * Pick an octave that suits the guitar.
 *
 * Melodies from fiddle and whistle collections are written an octave above
 * where a guitarist would play them, which turns a comfortable tune into a
 * 16-fret scramble. Score a few octave shifts and return the easiest.
 */
/** Where a guitar melody sits most naturally — around D4, the 2nd/3rd strings. */
const MELODIC_CENTRE = 62;

export function suggestTranspose(midiSequence, candidates = [0, -12, 12, -24]) {
  let best = null;
  for (const semitones of candidates) {
    const shifted = midiSequence.map((m) => m + semitones);
    const path = optimalFingering(shifted);
    const summary = fingeringSummary(path);
    if (!summary) continue;

    const sorted = [...shifted].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const unplayable = path.filter((p) => !p).length;

    // Playability alone always favours dropping as low as possible — open
    // strings are free and the span collapses — so it has to be balanced
    // against register, or every tune ends up buried below the melody range.
    const score =
      summary.span +
      unplayable * 50 +
      summary.maxFret * 0.4 -
      summary.openCount * 0.05 +
      Math.abs(median - MELODIC_CENTRE) * 0.6 +
      (Math.abs(semitones) / 12) * 0.5;   // mild preference for as written

    if (!best || score < best.score) best = { semitones, score, summary, unplayable };
  }
  return best;
}

/** Summary stats for an overview page. */
export function fingeringSummary(path) {
  const played = path.filter(Boolean);
  if (!played.length) return null;

  const frets = played.map((p) => p.fret);
  const fretted = frets.filter((f) => f > 0);
  const counts = new Map();
  for (const p of played) {
    const key = `${p.string}:${p.fret}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return {
    noteCount: played.length,
    unplayable: path.length - played.length,
    minFret: Math.min(...frets),
    maxFret: Math.max(...frets),
    lowestFretted: fretted.length ? Math.min(...fretted) : null,
    openCount: frets.filter((f) => f === 0).length,
    strings: [...new Set(played.map((p) => p.string))].sort((a, b) => a - b),
    positionCounts: counts,
    span: fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0,
  };
}
