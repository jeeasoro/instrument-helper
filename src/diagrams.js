/** Labelled explanatory diagrams for the getting-started page. */

import { midiToName, STANDARD_TUNING } from './notes.js';
import { isBlackKey, whiteIndex, keyName, LOWEST_KEY, HIGHEST_KEY } from './piano.js';
import { LAYOUTS, renderTines } from './tines.js';

const STRING_MIDI = Object.fromEntries(STANDARD_TUNING.map((s) => [s.string, s.midi]));
const noteAt = (string, fret) => midiToName(STRING_MIDI[string] + fret);

const L = {
  en: {
    nut: 'nut', frets: 'frets', strings: 'strings', neck: 'neck',
    thinnest: 'thinnest, sounds highest', thickest: 'thickest, sounds lowest',
    nearestFloor: 'nearest the floor', nearestYou: 'nearest you',
    string: 'string', fret: 'fret', press: 'press in the space, not on the bar',
    open: 'Open', openDesc: 'nothing pressed', fretted: 'Fretted',
    frettedDesc: 'pressed at fret 3', muted: 'Muted', mutedDesc: 'not played',
    dontPlay: 'do not play', playOpen: 'play open', pressHere: 'press here',
    thickBarNut: 'thick bar = the nut', stringsAreVertical: 'strings run up and down',
    fretsAreHorizontal: 'frets run across', topIsThinnest: 'top line = thinnest string',
    readLeftRight: 'read left to right', numberIsFret: 'number = which fret',
    zeroIsOpen: '0 = play open', together: 'stacked = play together',
    melodyHeading: 'Melody — one note after another',
    chordHeading: 'Chord — all at once',
    theNote: 'the note you hear', mutedTab: '× = do not play',

    /* piano */
    twoBlack: 'two black keys', threeBlack: 'three black keys',
    cIsLeftOfTwo: 'C is always the white key just left of the two',
    fIsLeftOfThree: 'F is always just left of the three',
    namesRepeat: 'seven letters, then they start again',
    lowest: 'lowest', highest: 'highest',
    middleCLabel: 'middle C', middleCNote: 'roughly the middle of the instrument',
    allTheCs: 'every C, counted from the bottom',
    thumbIsOne: '1 = thumb, always — on both hands',
    thumb: 'thumb', index: 'index', middleFinger: 'middle', ring: 'ring', little: 'little',
    fiveFingers: 'one finger per key, no stretching',
    chordTogether: 'press all three at the same moment',
    skipOne: 'skip a white key between each',
    rootName: 'the note it is named after',
    leftHandBass: 'left hand, one low note',
    rightHandChord: 'right hand, the chord',

    /* lyre and kalimba */
    lyreLow: 'string 1 — longest, thickest, lowest',
    lyreHigh: 'string 16 — shortest, thinnest, highest',
    lyreRuns: 'the numbers run the same way the pitch does — the opposite of a guitar',
    zigzag: 'the scale zig-zags outward from the middle',
    tineOne: 'tine 1 — the long one in the middle, and the lowest note',
    oddLeft: 'odd numbers run out to the left',
    evenRight: 'even numbers run out to the right',
    dotsMean: 'A kalimba tab writes the tine number, not the note name.',
    noDot: 'no dot',
    oneDot: 'one dot above',
    twoDots: 'two dots above',
    lowOctave: 'the low octave, C4–B4',
    midOctave: 'an octave higher, C5–B5',
    highOctave: 'two octaves higher, C6–E6',

    /* technique */
    good: 'do this',
    bad: 'not this',
    archGood: 'knuckle arched, fingertip meeting the string end-on',
    archBad: 'first joint collapsed inward — no control, and it hurts',
    wristGood: 'wrist level with the forearm',
    wristBad: 'wrist bent up or dropped down',
    sitTall: 'sit forward on the seat, back long, shoulders down',
    sitSlump: 'slumped, shoulders up, neck craned to see',
    forearmLevel: 'forearms roughly level',
    thumbBehind: 'thumb flat on the back of the neck, opposite your 2nd finger',
    thumbOver: 'thumb hooked over the top — it locks your other fingers short',
    neckSection: 'the neck, seen end-on',
    fingersCurl: 'fingers arrive from above, curled',
    holdTilt: 'tilt it back against you — do not hold it flat',
    leftHandLow: 'left hand plays the low strings',
    rightHandHigh: 'right hand plays the high strings',
    palmsHold: 'held in both palms, fingers behind',
    thumbsPlay: 'only the thumbs play',
    holesBack: 'the two holes on the back are for the wah effect',
  },
  de: {
    nut: 'Sattel', frets: 'Bünde', strings: 'Saiten', neck: 'Hals',
    thinnest: 'dünnste, klingt am höchsten', thickest: 'dickste, klingt am tiefsten',
    nearestFloor: 'am nächsten zum Boden', nearestYou: 'am nächsten bei dir',
    string: 'Saite', fret: 'Bund', press: 'in den Zwischenraum drücken, nicht auf das Stäbchen',
    open: 'Leer', openDesc: 'nichts gedrückt', fretted: 'Gegriffen',
    frettedDesc: 'im 3. Bund gedrückt', muted: 'Abgedämpft', mutedDesc: 'nicht gespielt',
    dontPlay: 'nicht spielen', playOpen: 'leer spielen', pressHere: 'hier drücken',
    thickBarNut: 'dicker Strich = Sattel', stringsAreVertical: 'Saiten verlaufen senkrecht',
    fretsAreHorizontal: 'Bünde verlaufen quer', topIsThinnest: 'oberste Linie = dünnste Saite',
    readLeftRight: 'von links nach rechts lesen', numberIsFret: 'Zahl = welcher Bund',
    zeroIsOpen: '0 = leer spielen', together: 'übereinander = zusammen spielen',
    melodyHeading: 'Melodie — ein Ton nach dem anderen',
    chordHeading: 'Akkord — alle gleichzeitig',
    theNote: 'der Ton, den du hörst', mutedTab: '× = nicht spielen',

    /* Klavier */
    twoBlack: 'zwei schwarze Tasten', threeBlack: 'drei schwarze Tasten',
    cIsLeftOfTwo: 'C ist immer die weiße Taste links neben den zweien',
    fIsLeftOfThree: 'F ist immer links neben den dreien',
    namesRepeat: 'sieben Buchstaben, dann geht es von vorn los',
    lowest: 'tiefste', highest: 'höchste',
    middleCLabel: 'mittleres C', middleCNote: 'ungefähr in der Mitte des Instruments',
    allTheCs: 'jedes C, von unten gezählt',
    thumbIsOne: '1 = Daumen, immer — bei beiden Händen',
    thumb: 'Daumen', index: 'Zeige', middleFinger: 'Mittel', ring: 'Ring', little: 'kleiner',
    fiveFingers: 'ein Finger pro Taste, ohne Spreizen',
    chordTogether: 'alle drei gleichzeitig drücken',
    skipOne: 'dazwischen je eine weiße Taste überspringen',
    rootName: 'der Ton, nach dem er heißt',
    leftHandBass: 'linke Hand, ein tiefer Ton',
    rightHandChord: 'rechte Hand, der Akkord',

    /* Leier und Kalimba */
    lyreLow: 'Saite 1 — die längste, dickste, tiefste',
    lyreHigh: 'Saite 16 — die kürzeste, dünnste, höchste',
    lyreRuns: 'die Nummern laufen mit der Tonhöhe — anders als bei der Gitarre',
    zigzag: 'die Tonleiter läuft im Zickzack von der Mitte nach außen',
    tineOne: 'Zunge 1 — die lange in der Mitte, und der tiefste Ton',
    oddLeft: 'ungerade Nummern nach links außen',
    evenRight: 'gerade Nummern nach rechts außen',
    dotsMean: 'Eine Kalimba-Tabulatur schreibt die Zungennummer, nicht den Tonnamen.',
    noDot: 'ohne Punkt',
    oneDot: 'ein Punkt darüber',
    twoDots: 'zwei Punkte darüber',
    lowOctave: 'die tiefe Oktave, C4–H4',
    midOctave: 'eine Oktave höher, C5–H5',
    highOctave: 'zwei Oktaven höher, C6–E6',

    /* Technik */
    good: 'so',
    bad: 'nicht so',
    archGood: 'Grundgelenk gewölbt, Fingerkuppe trifft die Saite von vorn',
    archBad: 'vorderes Gelenk eingeknickt — keine Kontrolle, und es tut weh',
    wristGood: 'Handgelenk in einer Linie mit dem Unterarm',
    wristBad: 'Handgelenk abgeknickt, nach oben oder unten',
    sitTall: 'vorn auf der Sitzfläche, Rücken lang, Schultern locker',
    sitSlump: 'zusammengesackt, Schultern hoch, Hals vorgereckt',
    forearmLevel: 'Unterarme ungefähr waagerecht',
    thumbBehind: 'Daumen flach hinten am Hals, gegenüber dem 2. Finger',
    thumbOver: 'Daumen oben herumgehakt — das verkürzt alle anderen Finger',
    neckSection: 'der Hals, im Querschnitt',
    fingersCurl: 'die Finger kommen von oben, gekrümmt',
    holdTilt: 'nach hinten an dich lehnen — nicht flach halten',
    leftHandLow: 'linke Hand spielt die tiefen Saiten',
    rightHandHigh: 'rechte Hand spielt die hohen Saiten',
    palmsHold: 'in beiden Handflächen, Finger dahinter',
    thumbsPlay: 'gespielt wird nur mit den Daumen',
    holesBack: 'die zwei Löcher hinten sind für den Wah-Effekt',
  },
};

const C = {
  line: '#39424f', dim: '#2a323e', text: '#e6edf3', muted: '#8b98a9',
  accent: '#58a6ff', good: '#3fb950', warn: '#d29922', bad: '#f85149',
  panel: '#161b23',
};
const FONT = '-apple-system, Segoe UI, system-ui, sans-serif';

const svg = (w, h, body) =>
  `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;height:auto;display:block" xmlns="http://www.w3.org/2000/svg" font-family="${FONT}">${body}</svg>`;

const label = (x, y, text, color = C.muted, size = 11, anchor = 'middle') =>
  `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${text}</text>`;

/** Curved leader line from a label to the thing it names. */
const leader = (x1, y1, x2, y2) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${C.muted}" stroke-width="1" stroke-dasharray="2,2" fill="none"/>`;

/* ------------------------------------------------------------------------ */

function anatomy(l) {
  const LEFT = 70, TOP = 58, GAP = 20, FRET_W = 58, N = 7;
  let s = '';
  // Strings.
  for (let i = 0; i < 6; i++) {
    const y = TOP + i * GAP;
    s += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + N * FRET_W}" y2="${y}" stroke="${C.line}" stroke-width="${1 + i * 0.3}"/>`;
  }
  // Frets, with a thick nut.
  for (let f = 0; f <= N; f++) {
    const x = LEFT + f * FRET_W;
    s += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + 5 * GAP}" stroke="${f === 0 ? C.muted : C.dim}" stroke-width="${f === 0 ? 5 : 1.5}"/>`;
  }
  s += leader(LEFT, 40, LEFT, TOP - 4) + label(LEFT, 32, l.nut, C.warn, 12);
  s += leader(LEFT + 3.5 * FRET_W, 40, LEFT + 3 * FRET_W, TOP - 4) + label(LEFT + 3.5 * FRET_W, 32, l.frets, C.accent, 12);
  s += leader(LEFT + N * FRET_W + 6, TOP + 2 * GAP, LEFT + N * FRET_W - 20, TOP + 2 * GAP);
  s += label(LEFT + N * FRET_W + 10, TOP + 2 * GAP + 4, l.strings, C.good, 12, 'start');
  s += label(LEFT + N * FRET_W / 2, TOP + 5 * GAP + 30, l.neck, C.muted, 12);
  return svg(560, 190, s);
}

function strings(l) {
  const LEFT = 116, TOP = 40, GAP = 26, W = 300;
  const names = ['E', 'B', 'G', 'D', 'A', 'E'];
  const namesDe = ['E', 'H', 'G', 'D', 'A', 'E'];
  const useNames = l === L.de ? namesDe : names;
  let s = '';
  for (let i = 0; i < 6; i++) {
    const y = TOP + i * GAP;
    const num = i + 1;                       // top row is string 1
    s += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + W}" y2="${y}" stroke="${C.line}" stroke-width="${1 + i * 0.6}"/>`;
    s += label(LEFT - 12, y + 4, `${l.string} ${num}`, C.text, 12, 'end');
    s += label(LEFT + W + 12, y + 4, useNames[i], C.accent, 13, 'start');
  }
  s += label(LEFT + W / 2, TOP - 16, l.thinnest, C.muted, 11);
  s += label(LEFT + W / 2, TOP + 5 * GAP + 24, l.thickest, C.muted, 11);
  s += label(LEFT + W + 44, TOP + 4, l.nearestFloor, C.muted, 10, 'start');
  s += label(LEFT + W + 44, TOP + 5 * GAP + 4, l.nearestYou, C.muted, 10, 'start');
  return svg(560, 210, s);
}

function frets(l) {
  const LEFT = 60, TOP = 46, GAP = 17, FRET_W = 76, N = 5;
  let s = '';
  for (let i = 0; i < 6; i++) {
    const y = TOP + i * GAP;
    s += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + N * FRET_W}" y2="${y}" stroke="${C.line}" stroke-width="1"/>`;
  }
  for (let f = 0; f <= N; f++) {
    const x = LEFT + f * FRET_W;
    s += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + 5 * GAP}" stroke="${f === 0 ? C.muted : C.dim}" stroke-width="${f === 0 ? 5 : 1.5}"/>`;
    if (f < N) {
      s += label(LEFT + f * FRET_W + FRET_W / 2, TOP + 5 * GAP + 20, `${l.fret} ${f + 1}`, C.muted, 11);
    }
  }
  // A finger pressing in the third space.
  const cx = LEFT + 2 * FRET_W + FRET_W * 0.72;
  s += `<circle cx="${cx}" cy="${TOP + 3 * GAP}" r="8" fill="${C.accent}"/>`;
  s += leader(cx, 32, cx, TOP + 3 * GAP - 10);
  s += label(cx, 24, l.press, C.accent, 11);
  return svg(560, 190, s);
}

function stringStates(l) {
  const BOXW = 168, TOP = 54, GAP = 15, FRET_W = 34, N = 4;
  const states = [
    { title: l.open, desc: l.openDesc, fret: 0, colour: C.good },
    { title: l.fretted, desc: l.frettedDesc, fret: 3, colour: C.accent },
    { title: l.muted, desc: l.mutedDesc, fret: -1, colour: C.muted },
  ];
  let s = '';
  states.forEach((st, i) => {
    const ox = i * BOXW + 14;
    s += label(ox + BOXW / 2 - 14, 22, st.title, st.colour, 13);
    s += label(ox + BOXW / 2 - 14, 38, st.desc, C.muted, 10);
    for (let r = 0; r < 6; r++) {
      const y = TOP + r * GAP;
      const active = r === 3;
      s += `<line x1="${ox}" y1="${y}" x2="${ox + N * FRET_W}" y2="${y}"
        stroke="${active ? st.colour : C.dim}" stroke-width="${active ? 2 : 1}"
        ${st.fret === -1 && active ? 'stroke-dasharray="3,3"' : ''}/>`;
    }
    for (let f = 0; f <= N; f++) {
      const x = ox + f * FRET_W;
      s += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + 5 * GAP}" stroke="${f === 0 ? C.muted : C.dim}" stroke-width="${f === 0 ? 4 : 1}"/>`;
    }
    const y = TOP + 3 * GAP;
    if (st.fret === 0) {
      s += `<circle cx="${ox - 12}" cy="${y}" r="5" fill="none" stroke="${C.good}" stroke-width="2"/>`;
    } else if (st.fret === -1) {
      s += label(ox - 12, y + 4, '×', C.muted, 15);
    } else {
      s += `<circle cx="${ox + (st.fret - 0.5) * FRET_W}" cy="${y}" r="7" fill="${C.accent}"/>`;
    }
  });
  return svg(560, 160, s);
}

function chordBox(l) {
  const LEFT = 190, TOP = 62, STR = 26, FRET = 30, FRETS = 4;
  // An open C shape: x 3 2 0 1 0, low E first.
  const shape = [-1, 3, 2, 0, 1, 0];
  let s = '';
  for (let i = 0; i < 6; i++) {
    const x = LEFT + i * STR;
    s += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + FRETS * FRET}" stroke="${C.line}" stroke-width="1"/>`;
  }
  for (let f = 0; f <= FRETS; f++) {
    const y = TOP + f * FRET;
    s += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + 5 * STR}" y2="${y}"
      stroke="${f === 0 ? C.muted : C.dim}" stroke-width="${f === 0 ? 5 : 1.5}"/>`;
  }
  shape.forEach((fret, i) => {
    const x = LEFT + i * STR;
    if (fret === -1) s += label(x, TOP - 10, '×', C.muted, 15);
    else if (fret === 0) s += `<circle cx="${x}" cy="${TOP - 15}" r="5" fill="none" stroke="${C.good}" stroke-width="2"/>`;
    else s += `<circle cx="${x}" cy="${TOP + (fret - 0.5) * FRET}" r="8" fill="${C.accent}"/>`;
  });
  // Callouts.
  s += leader(150, TOP - 15, LEFT - 8, TOP - 15) + label(146, TOP - 11, l.playOpen, C.good, 11, 'end');
  s += leader(150, TOP - 40, LEFT + 5 * STR + 8, TOP - 34) + label(146, TOP - 36, l.dontPlay, C.muted, 11, 'end');
  s += leader(150, TOP + 8, LEFT - 8, TOP + 2) + label(146, TOP + 12, l.thickBarNut, C.warn, 11, 'end');
  s += leader(LEFT + 5 * STR + 12, TOP + 55, LEFT + 5 * STR - 6, TOP + 2.5 * FRET);
  s += label(LEFT + 5 * STR + 16, TOP + 59, l.pressHere, C.accent, 11, 'start');
  s += label(LEFT + 2.5 * STR, TOP + FRETS * FRET + 22, l.stringsAreVertical, C.muted, 10);
  s += label(LEFT + 2.5 * STR, TOP + FRETS * FRET + 38, l.fretsAreHorizontal, C.muted, 10);
  return svg(560, 230, s);
}

/**
 * Two staves side by side, because the whole point of tab is the distinction
 * between them: notes spread left to right happen one after another, notes
 * stacked in a column happen together. Showing only one of the two invites
 * reading a spread-out chord as a melody.
 */
function tabReading(l) {
  const TOP = 66, GAP = 16;
  const LEFT = 54, W = 250;          // melody stave
  const CLEFT = 392, CW = 108;       // chord stave
  const labels = ['e', 'B', 'G', 'D', 'A', 'E'];

  // A plain ascending scale fragment: the fret numbers visibly climb, drop to
  // the next line and climb again, so left-to-right reads as movement.
  const melody = [[2, 0], [2, 1], [2, 3], [1, 0], [1, 1], [1, 3]];
  // One column. Frets by string, 6 to 1; null means do not play that string.
  const chord = { 6: null, 5: 3, 4: 2, 3: 0, 2: 1, 1: 0 };

  const stave = (x0, width) => {
    let out = '';
    for (let i = 0; i < 6; i++) {
      const y = TOP + i * GAP;
      out += `<line x1="${x0}" y1="${y}" x2="${x0 + width}" y2="${y}" stroke="${C.line}" stroke-width="1"/>`;
      out += label(x0 - 9, y + 4, labels[i], C.muted, 10, 'end');
    }
    return out;
  };

  const digit = (x, y, text, colour) =>
    `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" fill="${C.panel}"/>` +
    label(x, y + 4, text, colour, 13);

  let s = '';

  /* --- melody --- */
  s += label(LEFT + W / 2 - 20, TOP - 36, l.melodyHeading, C.accent, 12);
  s += stave(LEFT, W);
  melody.forEach(([str, fret], i) => {
    const x = LEFT + 30 + i * 38;
    s += digit(x, TOP + (str - 1) * GAP, String(fret), fret === 0 ? C.good : C.text);
    // The sounding note under each position — the tab number alone says where
    // to put a finger, not what comes out.
    s += label(x, TOP + 5 * GAP + 20, noteAt(str, fret), C.muted, 11);
  });
  s += label(LEFT - 9, TOP + 5 * GAP + 20, l.theNote, C.muted, 9, 'end');
  s += label(LEFT - 9, TOP - 14, l.topIsThinnest, C.muted, 9, 'end');
  s += `<path d="M${LEFT + 30} ${TOP - 22} L${LEFT + 220} ${TOP - 22}" stroke="${C.muted}" stroke-width="1" fill="none" marker-end="url(#arrow)"/>`;
  s += label(LEFT + 125, TOP - 26, l.readLeftRight, C.muted, 9);

  /* --- chord --- */
  s += label(CLEFT + CW / 2, TOP - 36, l.chordHeading, C.warn, 12);
  s += stave(CLEFT, CW);
  const cx = CLEFT + CW / 2;
  for (let str = 1; str <= 6; str++) {
    const y = TOP + (str - 1) * GAP;
    const fret = chord[str];
    if (fret === null) s += digit(cx, y, '×', C.muted);
    else s += digit(cx, y, String(fret), fret === 0 ? C.good : C.text);
  }
  s += `<rect x="${cx - 13}" y="${TOP - 10}" width="26" height="${5 * GAP + 20}"
    fill="none" stroke="${C.warn}" stroke-width="1" stroke-dasharray="3,3" rx="5"/>`;
  s += label(cx, TOP + 5 * GAP + 20, l.together, C.warn, 9);
  s += label(cx, TOP + 5 * GAP + 34, l.mutedTab, C.muted, 9);

  const defs = `<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3"
    orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="${C.muted}"/></marker></defs>`;
  return svg(560, 200, defs + s);
}

/* ---------------------------------------------------------------- piano */

const KEY = { white: '#e6edf3', edge: '#9aa6b6', black: '#12171f', ink: '#04121f' };

/**
 * Keys, drawn to order. `marks` maps a MIDI note to a fill, `labels` to text.
 * The guitar diagrams draw their own grids too; a keyboard is simple enough
 * that sharing this much is all the reuse worth having.
 */
function keys(x0, y0, from, to, ww, wh, { marks = {}, labels = {} } = {}) {
  const bw = ww * 0.6;
  const bh = wh * 0.62;
  const base = whiteIndex(from);
  const x = (m) => x0 + (whiteIndex(m) - base) * ww;
  let s = '';

  for (let m = from; m <= to; m++) {
    if (isBlackKey(m)) continue;
    s += `<rect x="${x(m).toFixed(1)}" y="${y0}" width="${(ww - 1).toFixed(1)}" height="${wh}"
      rx="3" fill="${marks[m] || KEY.white}" stroke="${KEY.edge}" stroke-width="0.8"/>`;
    if (labels[m]) {
      s += label(x(m) + (ww - 1) / 2, y0 + wh - 8, labels[m], KEY.ink,
        Math.min(13, ww * 0.5));
    }
  }
  for (let m = from; m <= to; m++) {
    if (!isBlackKey(m)) continue;
    const cx = x(m);
    if (cx <= x0 || cx >= x0 + (whiteIndex(to) - base + 1) * ww) continue;
    s += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y0}" width="${bw.toFixed(1)}" height="${bh}"
      rx="3" fill="${marks[m] || KEY.black}" stroke="#000" stroke-width="0.8"/>`;
    if (labels[m]) {
      s += label(cx, y0 + bh - 6, labels[m], marks[m] ? KEY.ink : C.text, Math.min(10, bw * 0.6));
    }
  }
  return s;
}

/**
 * The pattern that makes a keyboard navigable at all.
 *
 * Every key looks like its neighbours, so the only way to know where you are is
 * the black keys: they come in a group of two and a group of three, forever.
 * C is the white key immediately left of the two. That single fact is the piano
 * equivalent of "string 6 is the thick one", and nothing else on the instrument
 * works until you have it.
 */
function keyboardPattern(l) {
  const X = 40, Y = 56, WW = 40, WH = 120;
  const from = 60, to = 76;              // C4 to E5: two full groups of each
  const names = {};
  for (let m = from; m <= to; m++) if (!isBlackKey(m)) names[m] = keyName(m);

  let s = keys(X, Y, from, to, WW, WH, { labels: names });
  const x = (m) => X + (whiteIndex(m) - whiteIndex(from)) * WW;

  // Brackets over each black-key group.
  const bracket = (m1, m2, text, colour) => {
    const a = x(m1) - WW * 0.3;
    const b = x(m2) + WW * 0.3;
    return `<path d="M${a} ${Y - 10} L${a} ${Y - 16} L${b} ${Y - 16} L${b} ${Y - 10}"
      stroke="${colour}" stroke-width="1.2" fill="none"/>`
      + label((a + b) / 2, Y - 22, text, colour, 11);
  };
  s += bracket(61, 63, l.twoBlack, C.accent);
  s += bracket(66, 70, l.threeBlack, C.warn);

  // Dots on every C and every F, keyed by colour to the two legend lines below.
  // Leader lines were tried here and could not avoid crossing each other, which
  // on a diagram about finding your place is worse than no line at all.
  for (let m = from; m <= to; m++) {
    const pc = m % 12;
    if (pc !== 0 && pc !== 5) continue;
    s += `<circle cx="${x(m) + (WW - 1) / 2}" cy="${Y + WH - 26}" r="4"
      fill="${pc === 0 ? C.accent : C.warn}"/>`;
  }
  s += `<circle cx="${X + 4}" cy="${Y + WH + 16}" r="4" fill="${C.accent}"/>`;
  s += label(X + 14, Y + WH + 20, l.cIsLeftOfTwo, C.accent, 11, 'start');
  s += `<circle cx="${X + 4}" cy="${Y + WH + 36}" r="4" fill="${C.warn}"/>`;
  s += label(X + 14, Y + WH + 40, l.fIsLeftOfThree, C.warn, 11, 'start');
  // Below, not above: the top of this diagram belongs to the two brackets.
  s += label(X, Y + WH + 60, l.namesRepeat, C.muted, 11, 'start');

  return svg(560, 254, s);
}

/**
 * The whole instrument at once, so "middle C" stops being an abstraction.
 * Eighty-eight keys is a lot of repetition to look at, which is exactly why the
 * one labelled landmark matters.
 */
function middleC(l) {
  const X = 12, Y = 44, WH = 62;
  const whites = whiteIndex(HIGHEST_KEY) - whiteIndex(LOWEST_KEY) + 1;   // 52
  const WW = (560 - X * 2) / whites;

  const marks = { 60: C.accent };
  let s = keys(X, Y, LOWEST_KEY, HIGHEST_KEY, WW, WH, { marks });

  const x = (m) => X + (whiteIndex(m) - whiteIndex(LOWEST_KEY)) * WW;
  for (let m = 24; m <= 96; m += 12) {
    s += label(x(m) + WW / 2, Y + WH + 12, `C${m / 12 - 1}`, m === 60 ? C.accent : C.muted, 9);
  }
  s += label(X + (560 - X * 2) / 2, Y + WH + 28, l.allTheCs, C.muted, 10);

  s += leader(x(60) + WW / 2, 37, x(60) + WW / 2, Y - 3);
  s += label(x(60) + WW / 2, 31, l.middleCLabel, C.accent, 12);
  s += label(x(60) + WW / 2, 12, l.middleCNote, C.muted, 10);
  s += label(X, Y - 6, l.lowest, C.muted, 10, 'start');
  s += label(560 - X, Y - 6, l.highest, C.muted, 10, 'end');
  return svg(560, 150, s);
}

/**
 * Finger numbering, which is the piano's version of the guitar's string
 * numbering — an arbitrary convention that every book assumes and none states.
 * The catch is the mirroring: both hands number outward from the thumb, so the
 * two hands' number 1s point at each other.
 */
function fingerNumbers(l) {
  const X = 130, Y = 66, WW = 44, WH = 96;
  const from = 60, to = 71;
  const marks = {};
  const labels = {};
  [60, 62, 64, 65, 67].forEach((m, i) => { marks[m] = C.accent; labels[m] = String(i + 1); });

  let s = keys(X, Y, from, to, WW, WH, { marks, labels });
  const names = [l.thumb, l.index, l.middleFinger, l.ring, l.little];
  [60, 62, 64, 65, 67].forEach((m, i) => {
    const cx = X + (whiteIndex(m) - whiteIndex(from)) * WW + (WW - 1) / 2;
    s += label(cx, Y - 10, names[i], C.muted, 10);
  });
  s += label(X, 30, l.thumbIsOne, C.accent, 12, 'start');
  s += label(X, Y + WH + 20, l.fiveFingers, C.muted, 11, 'start');
  return svg(560, 190, s);
}

/**
 * A chord on a keyboard. The guitar equivalent is a chord box — a memorised
 * shape. Here there is no shape to memorise: a chord is a set of notes, and the
 * useful pattern is that a plain triad skips a white key between each finger.
 */
function pianoChord(l) {
  // Twelve white keys at 42 px each fills the 560-wide canvas exactly; the
  // window has to start at G3 so the left-hand bass note has somewhere to sit.
  const X = 40, Y = 62, WW = 42, WH = 104;
  const from = 55, to = 72;
  const marks = { 60: C.accent, 64: C.accent, 67: C.accent, 55: '#8957e5' };
  const labels = { 60: '1', 64: '3', 67: '5', 55: '5' };

  let s = keys(X, Y, from, to, WW, WH, { marks, labels });
  const x = (m) => X + (whiteIndex(m) - whiteIndex(from)) * WW + (WW - 1) / 2;

  for (const [m, name] of [[60, 'C'], [64, 'E'], [67, 'G']]) {
    s += label(x(m), Y - 10, name, C.accent, 12);
  }
  s += label(x(55), Y - 10, 'G', '#b083f0', 12);

  s += `<rect x="${x(60) - WW / 2 - 2}" y="${Y - 4}" width="${x(67) - x(60) + WW + 4}"
    height="${WH + 8}" fill="none" stroke="${C.accent}" stroke-width="1"
    stroke-dasharray="3,3" rx="6"/>`;
  s += label((x(60) + x(67)) / 2, Y + WH + 24, l.chordTogether, C.accent, 11);
  s += label((x(60) + x(67)) / 2, Y + WH + 38, l.skipOne, C.muted, 10);
  s += label(X, Y + WH + 24, l.leftHandBass, '#b083f0', 10, 'start');
  s += label(X, 30, l.rightHandChord, C.muted, 11, 'start');
  return svg(560, 220, s);
}

/* ------------------------------------------------------ lyre and kalimba */

/**
 * The instrument itself, drawn by the same code the rest of the app uses.
 *
 * Deliberately not a second, prettier drawing made for the guide. The whole
 * point of the getting-started page is to teach you to read what you will see
 * on the other three, and a picture that differed from them — even in its
 * numbering — would be teaching the wrong diagram.
 */
function lyreStrings(l) {
  return `<div class="tines">${renderTines(LAYOUTS.lyre, { width: 560 })}</div>`
    + captionRow([
      [C.accent, l.lyreLow],
      [C.warn, l.lyreHigh],
      [C.muted, l.lyreRuns],
    ]);
}

function kalimbaLayout(l) {
  return `<div class="tines">${renderTines(LAYOUTS.kalimba, { width: 560 })}</div>`
    + zigzag(l)
    + captionRow([
      [C.accent, l.tineOne],
      [C.good, l.evenRight],
      [C.warn, l.oddLeft],
    ]);
}

/**
 * The one fact that makes a kalimba readable: the scale does not run along the
 * instrument, it alternates outward from the middle. Drawn as a line joining
 * 1–2–3–…–17 in the order they actually sit, because the zig-zag is the shape
 * your thumbs have to learn and no list of numbers conveys it.
 */
function zigzag(l) {
  const layout = LAYOUTS.kalimba;
  const W = 560, TOP = 26, H = 74;
  const slot = W / layout.count;
  const x = (index) => layout.order.indexOf(index) * slot + slot / 2;
  // Alternate the height so consecutive numbers are visibly a step apart even
  // when they sit on opposite sides of the instrument.
  const y = (i) => TOP + (i % 2 === 0 ? 0 : 26);

  const points = layout.midis.map((_, i) => `${x(i).toFixed(1)},${y(i)}`).join(' ');
  let s = `<polyline points="${points}" fill="none" stroke="${C.accent}"
    stroke-width="1.2" stroke-opacity="0.65"/>`;
  for (let i = 0; i < layout.count; i++) {
    const fill = i === 0 ? C.accent : (i % 2 === 1 ? C.good : C.warn);
    s += `<circle cx="${x(i).toFixed(1)}" cy="${y(i)}" r="8.5" fill="${fill}"/>`;
    s += `<text x="${x(i).toFixed(1)}" y="${y(i) + 3.5}" fill="${C.panel}"
      font-size="9" font-weight="700" text-anchor="middle">${i + 1}</text>`;
  }
  s += label(W / 2, TOP + H - 8, l.zigzag, C.muted, 11);
  return svg(W, TOP + H, s);
}

/** How kalimba tabs write a tine: a number, with dots for the octave. */
function kalimbaNumbers(l) {
  const W = 560;
  const rows = [
    { dots: 0, text: l.noDot, notes: '1 2 3 4 5 6 7', desc: l.lowOctave, colour: C.accent },
    { dots: 1, text: l.oneDot, notes: '1 2 3 4 5 6 7', desc: l.midOctave, colour: C.good },
    { dots: 2, text: l.twoDots, notes: '1 2 3', desc: l.highOctave, colour: C.warn },
  ];
  let s = label(16, 18, l.dotsMean, C.text, 12, 'start');
  rows.forEach((row, i) => {
    const y = 46 + i * 40;
    // The digits, with the octave dots printed above them exactly as a tab does.
    row.notes.split(' ').forEach((n, j) => {
      const cx = 30 + j * 26;
      s += label(cx, y, n, row.colour, 16);
      for (let d = 0; d < row.dots; d++) {
        s += `<circle cx="${cx}" cy="${y - 17 - d * 5}" r="1.7" fill="${row.colour}"/>`;
      }
    });
    s += label(230, y, row.text, C.text, 11, 'start');
    s += label(360, y, row.desc, C.muted, 11, 'start');
  });
  return svg(W, 46 + rows.length * 40, s);
}

/** A row of colour-keyed captions under a diagram. */
function captionRow(entries) {
  const items = entries.map(([colour, text]) =>
    `<span style="display:flex;align-items:center;gap:6px">
      <i style="width:9px;height:9px;border-radius:50%;background:${colour};flex:0 0 auto"></i>
      <span>${text}</span></span>`).join('');
  return `<div style="display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;
    font-size:11px;color:${C.muted}">${items}</div>`;
}

/* ------------------------------------------------------------- technique */

/** A "do this / not this" pair of panels, which is how technique reads best. */
function pair(l, width, height, drawGood, drawBad) {
  const half = width / 2;
  let s = `<line x1="${half}" y1="18" x2="${half}" y2="${height - 10}"
    stroke="${C.dim}" stroke-width="1"/>`;
  s += label(half / 2, 14, l.good, C.good, 12);
  s += label(half + half / 2, 14, l.bad, C.bad, 12);
  s += `<g>${drawGood(0)}</g><g>${drawBad(half)}</g>`;
  return svg(width, height, s);
}

/**
 * The arch, which is the same instruction on every instrument here and the one
 * that is genuinely hard to unlearn later.
 *
 * A finger with its last joint collapsed inward cannot control how hard it
 * presses, cannot land on one string without touching the next, and drives the
 * force into the joint instead of down the bone. It is comfortable at first
 * and it is the reason people get sore hands in month three.
 */
function handArch(l) {
  const surface = (ox) => `<line x1="${ox + 20}" y1="128" x2="${ox + 250}" y2="128"
    stroke="${C.muted}" stroke-width="2"/>`;
  const joint = (x, y, colour) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${colour}"/>`;

  const good = (ox) => surface(ox)
    // Knuckle high, three joints stepping down, fingertip vertical at the end.
    + `<path d="M${ox + 55} 52 C${ox + 110} 42 ${ox + 158} 62 ${ox + 172} 100
        L${ox + 172} 126" stroke="${C.good}" stroke-width="6" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>`
    + joint(ox + 55, 52, C.panel) + joint(ox + 130, 60, C.panel) + joint(ox + 172, 104, C.panel)
    + `<path d="M${ox + 40} 60 L${ox + 40} 110" stroke="${C.dim}" stroke-width="8"
        stroke-linecap="round"/>`
    + label(ox + 135, 148, l.archGood, C.muted, 10);

  const bad = (ox) => surface(ox)
    // The last joint bends the wrong way, so the pad lands flat on the string.
    + `<path d="M${ox + 55} 52 C${ox + 100} 78 ${ox + 120} 118 ${ox + 150} 124
        L${ox + 205} 128" stroke="${C.warn}" stroke-width="6" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>`
    + joint(ox + 55, 52, C.panel) + joint(ox + 118, 110, C.panel) + joint(ox + 152, 124, C.panel)
    + `<path d="M${ox + 40} 60 L${ox + 40} 110" stroke="${C.dim}" stroke-width="8"
        stroke-linecap="round"/>`
    + label(ox + 135, 148, l.archBad, C.muted, 10);

  return pair(l, 560, 168, good, bad);
}

/**
 * Sitting. Boring, and the single thing most likely to end a hobby: a hunched
 * shoulder and a craned neck do not hurt on day one, they hurt in year one.
 */
function posture(l) {
  const seat = (ox) => `<rect x="${ox + 26}" y="${132}" width="86" height="7" rx="2"
    fill="${C.dim}"/>`;
  const limb = (d, colour, w = 5) =>
    `<path d="${d}" stroke="${colour}" stroke-width="${w}" fill="none"
      stroke-linecap="round" stroke-linejoin="round"/>`;

  const good = (ox) => seat(ox)
    + `<circle cx="${ox + 76}" cy="46" r="13" fill="none" stroke="${C.good}" stroke-width="4"/>`
    + limb(`M${ox + 76} 59 L${ox + 74} 132`, C.good, 6)                 // spine, upright
    + limb(`M${ox + 74} 78 L${ox + 92} 108 L${ox + 148} 108`, C.good)   // arm, forearm level
    + limb(`M${ox + 74} 132 L${ox + 140} 134 L${ox + 144} 176`, C.dim)  // thigh, shin
    + `<line x1="${ox + 92}" y1="108" x2="${ox + 160}" y2="108"
        stroke="${C.dim}" stroke-width="1" stroke-dasharray="3,3"/>`
    + label(ox + 138, 100, l.forearmLevel, C.good, 10)
    + label(ox + 96, 196, l.sitTall, C.muted, 10);

  const bad = (ox) => seat(ox)
    + `<circle cx="${ox + 96}" cy="52" r="13" fill="none" stroke="${C.warn}" stroke-width="4"/>`
    // Rounded back, head thrown forward over the instrument.
    + limb(`M${ox + 92} 64 C${ox + 74} 84 ${ox + 66} 108 ${ox + 74} 132`, C.warn, 6)
    + limb(`M${ox + 80} 82 L${ox + 96} 112 L${ox + 146} 126`, C.warn)   // forearm dropping
    + limb(`M${ox + 74} 132 L${ox + 140} 134 L${ox + 144} 176`, C.dim)
    + label(ox + 96, 196, l.sitSlump, C.muted, 10);

  return pair(l, 560, 214, good, bad);
}

/**
 * The guitar thumb, seen end-on down the neck.
 *
 * Hooking the thumb over the top feels secure and is the single habit that
 * caps how far a beginner ever gets: it drags the palm against the neck, which
 * shortens every other finger's reach and makes a barre physically impossible.
 */
function guitarThumb(l) {
  const neck = (ox) => `<path d="M${ox + 84} 52 L${ox + 84} 112
      C${ox + 84} 128 ${ox + 196} 128 ${ox + 196} 112 L${ox + 196} 52 Z"
      fill="${C.dim}" stroke="${C.line}" stroke-width="1.5"/>`
    // The six strings, seen end-on across the front of the neck.
    + Array.from({ length: 6 }, (_, i) =>
      `<circle cx="${ox + 92 + i * 20}" cy="52" r="${2.6 - i * 0.25}" fill="${C.muted}"/>`).join('');

  const good = (ox) => neck(ox)
    + `<ellipse cx="${ox + 140}" cy="124" rx="17" ry="9" fill="${C.good}"/>`
    + `<path d="M${ox + 130} 20 C${ox + 152} 26 ${ox + 160} 40 ${ox + 152} 50"
        stroke="${C.good}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    + label(ox + 140, 152, l.thumbBehind, C.muted, 10)
    + label(ox + 140, 166, l.fingersCurl, C.muted, 10);

  const bad = (ox) => neck(ox)
    // Thumb curled over the top edge, palm clamped against the neck.
    + `<path d="M${ox + 96} 128 C${ox + 74} 118 ${ox + 70} 60 ${ox + 96} 44
        C${ox + 108} 38 ${ox + 118} 42 ${ox + 118} 48"
        stroke="${C.warn}" stroke-width="7" fill="none" stroke-linecap="round"/>`
    + `<path d="M${ox + 150} 22 C${ox + 176} 34 ${ox + 178} 44 ${ox + 168} 52"
        stroke="${C.warn}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    + label(ox + 140, 152, l.thumbOver, C.muted, 10)
    + label(ox + 140, 166, l.neckSection, C.muted, 9);

  return pair(l, 560, 184, good, bad);
}

/**
 * Holding a lyre. Two things: it leans back against you rather than lying flat,
 * and the hands divide the strings between them instead of crossing.
 */
function lyreHold(l) {
  const W = 560, s0 = [];
  // The player, side on, with the instrument tilted against the chest.
  s0.push(`<circle cx="70" cy="44" r="13" fill="none" stroke="${C.dim}" stroke-width="4"/>`);
  s0.push(`<path d="M70 57 L68 148" stroke="${C.dim}" stroke-width="6" stroke-linecap="round"/>`);
  // Instrument body, tilted about 25 degrees off vertical.
  s0.push(`<g transform="rotate(-22 150 100)">
    <path d="M112 34 L188 34 L200 156 L100 156 Z" fill="${C.panel}"
      stroke="${C.muted}" stroke-width="2"/>
    ${Array.from({ length: 9 }, (_, i) =>
      `<line x1="${118 + i * 8.5}" y1="42" x2="${116 + i * 9.6}" y2="148"
        stroke="${C.line}" stroke-width="${2 - i * 0.14}"/>`).join('')}
  </g>`);
  s0.push(leader(96, 120, 118, 108));
  s0.push(label(214, 60, l.holdTilt, C.accent, 11, 'start'));
  s0.push(`<path d="M206 74 L188 88" stroke="${C.accent}" stroke-width="1" stroke-dasharray="2,2"/>`);

  // Which hand takes which half, drawn as a plain split of the string field.
  s0.push(`<rect x="300" y="46" width="112" height="96" rx="8" fill="${C.panel}"
    stroke="${C.line}" stroke-width="1"/>`);
  s0.push(`<rect x="412" y="46" width="112" height="96" rx="8" fill="${C.panel}"
    stroke="${C.line}" stroke-width="1"/>`);
  for (let i = 0; i < 8; i++) {
    s0.push(`<line x1="${312 + i * 13}" y1="54" x2="${312 + i * 13}" y2="134"
      stroke="${C.accent}" stroke-width="${2.4 - i * 0.15}" stroke-opacity="0.7"/>`);
    s0.push(`<line x1="${424 + i * 13}" y1="60" x2="${424 + i * 13}" y2="128"
      stroke="${C.warn}" stroke-width="${1.3 - i * 0.08}" stroke-opacity="0.7"/>`);
  }
  s0.push(label(356, 160, l.leftHandLow, C.accent, 10));
  s0.push(label(468, 160, l.rightHandHigh, C.warn, 10));

  return svg(W, 180, s0.join(''));
}

/**
 * Holding a kalimba. The instrument sits in the palms, the fingers support it
 * from behind, and only the two thumbs play — which is the whole reason its
 * notes alternate outward from the middle.
 */
function kalimbaHold(l) {
  const W = 560;
  const bodyX = 190, bodyY = 62, bodyW = 180, bodyH = 96;
  let s = `<rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="12"
    fill="${C.panel}" stroke="${C.muted}" stroke-width="2"/>`;
  s += `<circle cx="${bodyX + bodyW / 2}" cy="${bodyY + 62}" r="11" fill="#0d1117"
    stroke="${C.line}" stroke-width="1"/>`;
  // Tines, longest in the middle, standing up out of the body.
  for (let i = 0; i < 13; i++) {
    const from = Math.abs(i - 6);
    const h = 40 - from * 4.4;
    const x = bodyX + 24 + i * 11.2;
    s += `<rect x="${x}" y="${bodyY + 34 - h}" width="5" height="${h + 6}" rx="2.5"
      fill="${C.muted}"/>`;
  }
  s += `<line x1="${bodyX + 14}" y1="${bodyY + 36}" x2="${bodyX + bodyW - 14}" y2="${bodyY + 36}"
    stroke="${C.muted}" stroke-width="3"/>`;

  // Hands: a palm behind each side, thumb reaching over the front.
  const hand = (x, dir) => `
    <path d="M${x} ${bodyY + 24} C${x - dir * 34} ${bodyY + 20} ${x - dir * 40} ${bodyY + 96}
      ${x} ${bodyY + 100} Z" fill="${C.dim}" stroke="${C.line}" stroke-width="1.5"/>
    <path d="M${x - dir * 6} ${bodyY + 40} L${x + dir * 34} ${bodyY + 22}"
      stroke="${C.accent}" stroke-width="9" stroke-linecap="round"/>`;
  s += hand(bodyX + 6, 1) + hand(bodyX + bodyW - 6, -1);

  s += label(96, bodyY + 40, l.palmsHold, C.muted, 11);
  s += leader(150, bodyY + 44, bodyX - 26, bodyY + 60);
  s += label(96, bodyY + 58, l.thumbsPlay, C.accent, 11);

  // The two holes are on the back, so they are drawn dashed: you cannot see
  // them from here, and that is exactly why nobody finds them.
  s += `<circle cx="452" cy="${bodyY + 40}" r="9" fill="none" stroke="${C.warn}"
    stroke-width="1.5" stroke-dasharray="3,3"/>`;
  s += `<circle cx="452" cy="${bodyY + 72}" r="9" fill="none" stroke="${C.warn}"
    stroke-width="1.5" stroke-dasharray="3,3"/>`;
  s += leader(444, bodyY + 56, bodyX + bodyW + 8, bodyY + 56);
  s += label(468, bodyY + 100, l.holesBack, C.warn, 10, 'start');

  return svg(W, bodyY + bodyH + 56, s);
}

const BUILDERS = {
  anatomy, strings, frets, stringstates: stringStates,
  chordbox: chordBox, tabreading: tabReading,
  keyboardpattern: keyboardPattern, middlec: middleC,
  fingernumbers: fingerNumbers, pianochord: pianoChord,
  lyrestrings: lyreStrings, lyrehold: lyreHold,
  kalimbalayout: kalimbaLayout, kalimbanumbers: kalimbaNumbers,
  kalimbahold: kalimbaHold,
  handarch: handArch, posture, guitarthumb: guitarThumb,
};

export function renderDiagram(name, lang = 'en') {
  const build = BUILDERS[name];
  if (!build) return '';
  return build(L[lang] || L.en);
}
