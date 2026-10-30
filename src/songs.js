import { parseAbc } from './abc.js';
import {
  optimalFingering, fingeringSummary, suggestTranspose, candidatePositions,
} from './fingering.js';
import { midiToName, midiToOctave } from './notes.js';
import {
  SCALES, ARPEGGIOS, rootMidi, buildExercise, searchTunes, fetchTune,
} from './library.js';
import {
  parseChordPro, parseChordList, parseChordsOverLyrics, detectSheetFormat,
  transposeChord, lookupShape, suggestCapo, renderChordDiagram,
  fromGermanChord, usesGermanNotation, chordTransitions, buildDrill,
} from './chords.js';
import { t, getLang, initLanguageSwitch, applyTranslations } from './i18n.js';
import { SONGBOOK, PROGRESSIONS, levelLabel } from './songbook.js';
import { initInstrumentSwitch, isPiano, isTined, getInstrument } from './instrument.js';
import {
  layoutFor, renderTines, renderTineRoll, renderChordTines, chordTines,
  suggestTineShift, tineSummary, indexOfMidi, numberOf, describeTine,
  midiLabel,
} from './tines.js';
import { detectKeysheet, parseKeysheet, summarise, midiToLabel } from './keysheet.js';
import {
  listSongs, saveSong, deleteSong, isUsingServer, buildFolderTree, folderPaths,
  filterSongs, normaliseFolder, isValidFolder, MAX_DIFFICULTY,
} from './songstore.js';
import {
  renderChordKeyboard, renderKeyboard, chordVoicing, keyLabel, isBlackKey,
  inRange, blackKeyCount, suggestOctaveShift, describeKeyPosition,
  describeKeyColour, whiteKeyCount, keyboardWindow,
} from './piano.js';

/**
 * One song, whatever it came from. A source may supply notes, chords, or both —
 * an ABC tune with chord symbols supplies both — and the page shows whichever
 * sections that song can actually fill.
 */
const state = {
  song: null,        // { title, meta, notes, chords, lines, source }
  transpose: 0,
  chordTranspose: 0,
  capo: 0,
  tune: null,        // raw archive payload, when that's the source
  lastPaste: null,   // raw text of the last pasted sheet, so it can be saved
  germanMode: 'auto', // 'auto' | 'on' | 'off' — see translateChart
};

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const noteLabel = (m) => midiToName(m) + midiToOctave(m);
const hasNotes = () => !!(state.song && state.song.notes && state.song.notes.length);
const hasChords = () => !!(state.song && state.song.chords && state.song.chords.length);

/* ------------------------------------------------------------------ setup */

function init() {
  initInstrumentSwitch();
  initLanguageSwitch();

  document.querySelectorAll('.tabs button').forEach((btn) => {
    btn.addEventListener('click', () => selectTab(btn.dataset.tab));
  });

  $('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch($('searchInput').value.trim());
  });

  for (const name of Object.keys({ ...SCALES, ...ARPEGGIOS })) {
    $('pattern').append(new Option(name, name));
  }
  for (const r of ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']) {
    $('exRoot').append(new Option(r, r));
  }
  $('exRoot').value = 'A';
  $('pattern').value = 'Minor pentatonic';
  $('buildExercise').addEventListener('click', buildFromExercise);
  $('parsePaste').addEventListener('click', buildFromPaste);
  $('parseChords').addEventListener('click', () => readChords());
  $('germanMode').addEventListener('change', () => {
    state.germanMode = $('germanMode').value;
    if (state.lastPaste) readChords();
  });

  for (let c = 0; c <= 9; c++) {
    $('capo').append(new Option(c === 0 ? t('common.none') : `${t('common.fret')} ${c}`, String(c)));
  }
  $('suggestCapoBtn').addEventListener('click', applyCapoSuggestion);
  $('saveSong').addEventListener('click', saveCurrent);

  $('songFilter').addEventListener('input', () => {
    library.query = $('songFilter').value;
    renderLibrary();
  });
  $('instrumentFilter').addEventListener('change', () => {
    library.instrument = $('instrumentFilter').value;
    library.folder = '';   // the old folder may hold nothing for this instrument
    renderLibrary();
  });
  $('difficultyFilter').addEventListener('change', () => {
    library.minDifficulty = Number($('difficultyFilter').value);
    renderLibrary();
  });
  $('orgSave').addEventListener('click', commitOrganiser);
  $('orgCancel').addEventListener('click', closeOrganiser);

  $('keyboardSize').value = keyboardSize();
  $('keyboardSize').addEventListener('change', () => {
    localStorage.setItem(SIZE_KEY, $('keyboardSize').value);
    if (state.song) renderOverview();
  });

  $('drillRepeats').addEventListener('change', updateDrill);
  $('copyDrill').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('drillText').value);
      setStatus(t('songs.copied'), 'good');
    } catch {
      // Clipboard permission can be refused; selecting the text still works.
      $('drillText').select();
    }
  });
  $('capo').addEventListener('change', () => {
    state.capo = Number($('capo').value);
    renderOverview();
  });

  $('transpose').addEventListener('input', () => {
    const v = Number($('transpose').value);
    state.transpose = v;
    state.chordTranspose = v;
    renderOverview();
  });
  $('autoFit').addEventListener('click', autoFit);

  renderSongbook();

  window.addEventListener('languagechange', () => {
    rebuildCapoOptions();
    renderSongbook();
    if (state.song) renderOverview();
  });

  // A capo is a guitar object with no piano equivalent, so switching instrument
  // has to drop it — otherwise the chords on screen would silently be the ones
  // you play *with* a capo, on an instrument that cannot have one.
  window.addEventListener('instrumentchange', () => {
    state.capo = 0;
    $('capo').value = '0';
    // "Songs for what I am playing" has to re-evaluate when that changes.
    if (library.instrument === 'current') { library.folder = ''; renderLibrary(); }
    if (!state.song) return;
    if (state.song.notes.length || (isTined() && hasChords())) autoFit();
    else renderOverview();
  });

  // The songbook first: something playable without having to find a sheet
  // elsewhere. Melody search is deliberately not the landing pane.
  selectTab('songbook');
}

/* -------------------------------------------------------- saved sheets */

/**
 * Songs are written as files under ./songs by the dev server, so they survive
 * clearing browser data and can be backed up or edited by hand. localStorage
 * is kept as a fallback for when the page is served without that API. The
 * storage and shaping live in songstore.js, shared with the practice page.
 */
let savedCache = [];

/** Which slice of the library the list is showing. */
const library = {
  folder: '',          // '' is everything
  instrument: 'current',
  query: '',
  minDifficulty: 0,
  editing: null,       // id of the song open in the organiser
};

async function fetchSaved() {
  savedCache = await listSongs();
  return savedCache;
}

/** A newly saved sheet lands categorised for whatever you are playing now. */
/**
 * Anything pasted that practice mode can actually use: a chord sheet, or a
 * piano sheet written as notes. The test used to be "does it have chords",
 * which quietly stopped piano sheets from being saved at all.
 */
const canSave = () => !!state.lastPaste && (hasChords() || !!(state.song && state.song.sequence));

async function saveCurrent() {
  if (!canSave()) return;

  // Both placeholder titles are the app's own words, not the song's, so
  // neither is worth offering back as a name.
  const placeholder = state.song.title === t('songs.chordChart')
    || state.song.title === t('songs.pastedSheet');
  const name = window.prompt(t('songs.saveTitle'),
    state.song.title && !placeholder ? state.song.title : '');
  if (!name) return;

  // Reuse the id of a song already saved under this name, so re-saving edits
  // it rather than piling up near-duplicates — and keep its categorisation.
  const existing = savedCache.find((s) => s.name === name);
  // A note sheet in fixed octaves is an arrangement for something with fixed
  // octaves, which rules the guitar out and nothing else. A *chord* sheet is
  // not: chords are chords, and this app draws them for every instrument — so
  // tagging one with whatever happened to be selected at the moment of saving
  // would hide a guitar song from the guitar list for no reason. Everything,
  // and let the organiser narrow it.
  const fallbackInstruments = state.song.sequence
    ? ['piano', 'lyre', 'kalimba']
    : ['guitar', 'piano', 'lyre', 'kalimba'];
  await saveSong({
    id: existing ? existing.id : `song-${Date.now()}`,
    name,
    text: state.lastPaste,
    instruments: existing ? existing.instruments : fallbackInstruments,
    folder: existing ? existing.folder : '',
    difficulty: existing ? existing.difficulty : 0,
  });

  await renderSongbook();
  setStatus(t('songs.saved'), 'good');
}

function loadSavedSong(id) {
  const entry = savedCache.find((s) => s.id === id);
  if (!entry) return;
  $('chordInput').value = entry.text;
  readChords(entry.name);
  $('overview').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteSavedSong(id, name) {
  if (!window.confirm(t('songs.confirmDelete', { name }))) return;
  await deleteSong(id);
  if (library.editing === id) closeOrganiser();
  await renderSongbook();
}

/* ------------------------------------------------------- categorisation */

function openOrganiser(id) {
  const song = savedCache.find((s) => s.id === id);
  if (!song) return;
  library.editing = id;

  $('organiserTitle').textContent = t('songs.organise', { name: song.name });
  $('orgName').value = song.name;
  $('orgGuitar').checked = song.instruments.includes('guitar');
  $('orgPiano').checked = song.instruments.includes('piano');
  $('orgLyre').checked = song.instruments.includes('lyre');
  $('orgKalimba').checked = song.instruments.includes('kalimba');
  $('orgDifficulty').value = String(song.difficulty || 0);
  $('orgFolder').value = song.folder || '';
  $('orgError').hidden = true;

  $('folderOptions').innerHTML = folderPaths(savedCache)
    .map((p) => `<option value="${esc(p)}"></option>`).join('');

  $('organiser').hidden = false;
  $('organiser').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeOrganiser() {
  library.editing = null;
  $('organiser').hidden = true;
}

async function commitOrganiser() {
  const song = savedCache.find((s) => s.id === library.editing);
  if (!song) return closeOrganiser();

  const folder = normaliseFolder($('orgFolder').value);
  if (!isValidFolder(folder)) {
    $('orgError').textContent = t('songs.folderInvalid');
    $('orgError').hidden = false;
    return;
  }
  const name = $('orgName').value.trim();
  if (!name) {
    $('orgError').textContent = t('songs.nameRequired');
    $('orgError').hidden = false;
    return;
  }

  const instruments = [];
  if ($('orgGuitar').checked) instruments.push('guitar');
  if ($('orgPiano').checked) instruments.push('piano');
  if ($('orgLyre').checked) instruments.push('lyre');
  if ($('orgKalimba').checked) instruments.push('kalimba');

  await saveSong({
    ...song, name, folder, instruments,
    difficulty: Number($('orgDifficulty').value),
  });
  closeOrganiser();
  await renderSongbook();
  setStatus(t('songs.saved'), 'good');
}

/* --------------------------------------------------------------- songbook */

async function renderSongbook() {
  const lang = getLang();

  await fetchSaved();
  $('mySongsBlock').hidden = false;
  renderLibrary();

  $('songlist').innerHTML = SONGBOOK
    .slice()
    .sort((a, b) => a.level - b.level || a.chords.length - b.chords.length)
    .map((song) => `
      <button class="song" data-song="${song.id}">
        <span class="song-main">
          <span class="song-title">${esc(song.title)}</span>
          <span class="song-origin">${esc(song.origin[lang] || song.origin.en)}</span>
          <span class="song-note">${esc(song.note[lang] || song.note.en)}</span>
        </span>
        <span class="song-side">
          <span class="song-chords">${song.chords.map(esc).join(' ')}</span>
          <span class="song-level"><span class="level-dots">${'●'.repeat(song.level)}${'○'.repeat(3 - song.level)}</span>
            ${esc(levelLabel(song.level, lang))}</span>
        </span>
      </button>`)
    .join('');

  $('songlist').querySelectorAll('.song').forEach((el) => {
    el.addEventListener('click', () => loadFromSongbook(el.dataset.song));
  });

  $('progressionList').innerHTML = PROGRESSIONS
    .map((p) => `
      <button class="song" data-prog="${p.id}">
        <span class="song-main">
          <span class="song-title">${esc(p.name[lang] || p.name.en)}</span>
          <span class="song-note">${esc(p.note[lang] || p.note.en)}</span>
        </span>
        <span class="song-side"><span class="song-chords">${p.chords.map(esc).join(' ')}</span></span>
      </button>`)
    .join('');

  $('progressionList').querySelectorAll('.song').forEach((el) => {
    el.addEventListener('click', () => loadProgression(el.dataset.prog));
  });
}

/** The instrument the filters are currently narrowing to, or null for all. */
function filterInstrument() {
  if (library.instrument === 'all') return null;
  if (library.instrument === 'current') return getInstrument();
  return library.instrument;
}

const stars = (n) => (n ? '★'.repeat(n) + '☆'.repeat(MAX_DIFFICULTY - n) : '');

/**
 * The saved collection: a folder tree on the left, matching songs on the right.
 *
 * The instrument filter defaults to whatever you are playing, because that is
 * almost always the question being asked — a guitarist scrolling past twenty
 * piano arrangements is the problem this whole section exists to fix.
 */
function renderLibrary() {
  const instrument = filterInstrument();
  // The tree counts what the other filters allow but ignores the folder filter,
  // so the counts stay put as you click around rather than collapsing to one.
  const inScope = filterSongs(savedCache, {
    instrument, query: library.query, minDifficulty: library.minDifficulty,
  });
  const visible = filterSongs(inScope, { folder: library.folder });

  renderFolderTree(buildFolderTree(inScope));

  $('mySongsList').innerHTML = visible.length
    ? visible.map((s) => `
      <div class="song" data-saved="${esc(s.id)}">
        <span class="song-main">
          <span class="song-title">${esc(s.name)}</span>
          ${s.folder ? `<span class="song-folder">${esc(s.folder.replace(/\//g, ' › '))}</span>` : ''}
        </span>
        <span class="song-side">
          ${s.difficulty ? `<span class="stars">${stars(s.difficulty)}</span>` : ''}
          <span class="song-tags">
            ${s.instruments.map((i) =>
              `<span class="badge ${i}">${esc(t(`common.${i}`))}</span>`).join('')}
          </span>
          <span class="row-actions">
            <button class="link-danger" data-edit="${esc(s.id)}">${t('songs.organiseShort')}</button>
            <button class="link-danger" data-del="${esc(s.id)}">${t('songs.delete')}</button>
          </span>
        </span>
      </div>`).join('')
    : `<p class="hint" style="margin:0">${
        savedCache.length ? t('songs.noneMatch') : t('songs.mySongsEmpty')}</p>`;

  $('mySongsList').querySelectorAll('[data-saved]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.dataset.del || e.target.dataset.edit) return;
      loadSavedSong(el.dataset.saved);
    });
  });
  $('mySongsList').querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openOrganiser(btn.dataset.edit); });
  });
  $('mySongsList').querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = btn.closest('[data-saved]');
      deleteSavedSong(btn.dataset.del, row.querySelector('.song-title').textContent);
    });
  });

  $('storageNote').textContent = isUsingServer()
    ? t('songs.storedInFiles') : t('songs.storedInBrowser');
}

function renderFolderTree(root) {
  const rows = [];
  const push = (label, path, count, depth, caret) => {
    rows.push(`<button class="folder${library.folder === path ? ' active' : ''}"
      data-folder="${esc(path)}" style="padding-left:${8 + depth * 12}px">
      <span class="caret">${caret}</span><span>${esc(label)}</span>
      <span class="n">${count}</span></button>`);
  };

  push(t('songs.allSongs'), '', root.count, 0, '⌂');
  const walk = (node, depth) => {
    for (const child of node.children) {
      push(child.name, child.path, child.count, depth, child.children.length ? '▾' : '•');
      walk(child, depth + 1);
    }
  };
  walk(root, 1);

  $('folderTree').innerHTML = rows.join('');
  $('folderTree').querySelectorAll('[data-folder]').forEach((btn) => {
    btn.addEventListener('click', () => {
      library.folder = btn.dataset.folder;
      renderLibrary();
    });
  });
}

function loadFromSongbook(id) {
  const song = SONGBOOK.find((s) => s.id === id);
  if (!song) return;
  const chart = parseChordPro(song.chordpro);
  load({
    title: song.title,
    parsed: {
      key: { label: chart.meta.key || '' },
      meter: '',
      rhythm: song.origin[getLang()] || song.origin.en,
    },
    notes: [],
    events: [],
    chords: chart.chords,
    lines: chart.lines,
    source: { label: null, url: null, credit: null },
  });
  $('settingRow').hidden = true;
  setStatus(t('songs.chordsFound', { n: new Set(chart.chords).size }), 'good');
  $('overview').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadProgression(id) {
  const prog = PROGRESSIONS.find((p) => p.id === id);
  if (!prog) return;
  const lang = getLang();
  load({
    title: prog.name[lang] || prog.name.en,
    parsed: { key: { label: '' }, meter: '', rhythm: '' },
    notes: [],
    events: [],
    chords: prog.chords,
    lines: [],
    source: { label: null, url: null, credit: null },
  });
  $('settingRow').hidden = true;
  setStatus(t('songs.chordsFound', { n: prog.chords.length }), 'good');
  $('overview').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function rebuildCapoOptions() {
  const keep = $('capo').value;
  $('capo').innerHTML = '';
  for (let c = 0; c <= 9; c++) {
    $('capo').append(new Option(c === 0 ? t('common.none') : `${t('common.fret')} ${c}`, String(c)));
  }
  $('capo').value = keep;
}

function selectTab(name) {
  document.querySelectorAll('.tabs button').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('[data-pane]').forEach((p) => {
    p.hidden = p.dataset.pane !== name;
  });
}

function setStatus(text, kind = '') {
  $('status').textContent = text;
  $('status').className = `status ${kind}`;
}

function formatTranspose(n) {
  if (n === 0) return t('songs.asWritten');
  const oct = n % 12 === 0 ? ` (${n > 0 ? '+' : ''}${n / 12} okt)` : '';
  return `${n > 0 ? '+' : ''}${n}${oct}`;
}

/* ---------------------------------------------------------------- sources */

async function runSearch(query) {
  if (!query) return;
  setStatus(t('songs.searching'), 'busy');
  try {
    const tunes = await searchTunes(query);
    if (!tunes.length) {
      setStatus(t('songs.noResults'));
      $('results').innerHTML = '';
      return;
    }
    setStatus(t('songs.resultCount', { n: tunes.length }), 'good');
    $('results').innerHTML = tunes
      .map((x) => `<div class="result" data-id="${x.id}">
          <span>${esc(x.name)}</span><span class="type">${esc(x.type || '')}</span>
        </div>`)
      .join('');
    $('results').querySelectorAll('.result').forEach((el) => {
      el.addEventListener('click', () => loadTune(Number(el.dataset.id)));
    });
  } catch (err) {
    setStatus(err.message, 'bad');
  }
}

async function loadTune(id) {
  setStatus(t('songs.loadingTune'), 'busy');
  try {
    const tune = await fetchTune(id);
    if (!tune.settings.length) {
      setStatus(t('songs.noResults'), 'bad');
      return;
    }
    state.tune = tune;

    const picker = $('setting');
    picker.innerHTML = '';
    tune.settings.forEach((s) => {
      picker.append(new Option(`${t('songs.setting')} ${s.index} — ${s.key}`, String(s.index)));
    });
    picker.onchange = () => applySetting(Number(picker.value));
    $('settingRow').hidden = tune.settings.length < 2;

    applySetting(1);
    setStatus(t('songs.loaded', { name: tune.name }), 'good');
  } catch (err) {
    setStatus(err.message, 'bad');
  }
}

function applySetting(index) {
  const tune = state.tune;
  const setting = tune.settings.find((s) => s.index === index) || tune.settings[0];
  const parsed = parseAbc(setting.abc);
  load({
    title: parsed.title,
    parsed,
    notes: parsed.notes.map((n) => n.midi),
    events: parsed.events,
    chords: parsed.chords,
    source: {
      label: 'thesession.org',
      url: setting.url || tune.url,
      credit: setting.contributor || null,
    },
  });
}

function buildFromExercise() {
  const patterns = { ...SCALES, ...ARPEGGIOS };
  const name = $('pattern').value;
  const root = $('exRoot').value;
  const midis = buildExercise(
    patterns[name],
    rootMidi(root, Number($('exStartOctave').value)),
    Number($('exOctaves').value));

  const events = midis.map((m) => ({ type: 'note', midi: m, duration: 1 }));
  load({
    title: `${root} ${name}`,
    parsed: { key: { label: root }, meter: '', rhythm: '' },
    notes: midis,
    events,
    chords: [],
    source: { label: null, url: null, credit: null },
  });
  $('settingRow').hidden = true;
  setStatus(t('songs.built', { name: `${root} ${name}`, n: midis.length }), 'good');
}

function buildFromPaste() {
  const text = $('pasteAbc').value.trim();
  if (!text) return;
  if (detectKeysheet(text) && loadKeysheet(text)) return;
  try {
    const parsed = parseAbc(text);
    if (!parsed.notes.length && !parsed.chords.length) {
      setStatus(t('songs.parseNoNotes'), 'bad');
      return;
    }
    load({
      title: parsed.title,
      parsed,
      notes: parsed.notes.map((n) => n.midi),
      events: parsed.events,
      chords: parsed.chords,
      source: { label: null, url: null, credit: null },
    });
    $('settingRow').hidden = true;
    setStatus(t('songs.parsed', { n: parsed.notes.length }), 'good');
  } catch (err) {
    setStatus(t('songs.parseFailed'), 'bad');
  }
}

/**
 * Rewrite German chord names to international ones, in the chord list and in
 * every sheet segment. Auto mode only fires when an `H` proves the notation,
 * because a lone `B` is ambiguous and guessing wrong is worse than not acting.
 */
function translateChart(chart) {
  const shouldTranslate = state.germanMode === 'on'
    || (state.germanMode === 'auto' && usesGermanNotation(chart.chords));
  if (!shouldTranslate) return { chart, translated: false };

  return {
    translated: true,
    chart: {
      ...chart,
      chords: chart.chords.map(fromGermanChord),
      lines: (chart.lines || []).map((line) => line.segments
        ? { ...line, segments: line.segments.map((s) =>
            s.chord ? { ...s, chord: fromGermanChord(s.chord) } : s) }
        : line),
    },
  };
}

/**
 * Load a piano sheet written as notes rather than chord symbols.
 *
 * Accepted from either paste box, because the distinction between "chords" and
 * "notation" is the app's, not the user's — someone with a sheet in their
 * clipboard should be able to drop it in either and have it work.
 */
function loadKeysheet(text, titleOverride) {
  const parsed = parseKeysheet(text);
  if (!parsed) return false;

  const s = summarise(parsed);
  load({
    title: titleOverride || t('songs.pastedSheet'),
    parsed: { key: { label: '' }, meter: '', rhythm: '' },
    notes: parsed.notes,
    events: parsed.events,
    sequence: parsed.steps,
    polyphonic: s.maxVoices > 1,
    chords: [],
    lines: [],
    paste: text,
    source: { label: null, url: null, credit: null },
  });
  $('settingRow').hidden = true;

  const parts = [t('songs.keysheetRead', {
    n: s.events, notes: s.notes, chords: s.chords,
    low: midiToLabel(s.low), high: midiToLabel(s.high),
    octaves: s.octaves.toFixed(1),
  })];
  parts.push(t(parsed.format === 'letters' ? 'songs.keysheetLetters' : 'songs.keysheetNames'));
  parts.push(t('songs.keysheetNoRhythm'));
  setStatus(parts.join(' '), 'good');
  return true;
}

function readChords(titleOverride) {
  const text = $('chordInput').value.trim();
  if (!text) return;

  // A piano sheet gets first refusal: `detectKeysheet` demands evidence no
  // chord sheet can produce, so this cannot swallow an ordinary songbook page.
  if (detectKeysheet(text) && loadKeysheet(text, titleOverride)) return;

  // Three layouts in the wild: ChordPro's inline markers, chords on their own
  // line above the words (by far the most common), and a bare list of names.
  const format = detectSheetFormat(text);
  const raw = format === 'chordpro' ? parseChordPro(text)
    : format === 'over-lyrics' ? parseChordsOverLyrics(text)
    : { meta: {}, lines: [], chords: parseChordList(text) };

  if (!raw.chords.length) {
    setStatus(t('songs.noChords'), 'bad');
    return;
  }
  const { chart, translated } = translateChart(raw);

  load({
    title: titleOverride || chart.meta.title || t('songs.chordChart'),
    parsed: { key: { label: chart.meta.key || '' }, meter: '', rhythm: chart.meta.artist || '' },
    notes: [],
    events: [],
    chords: chart.chords,
    lines: chart.lines,
    paste: text,
    source: { label: null, url: null, credit: null },
  });
  $('settingRow').hidden = true;

  const fmtName = t(format === 'chordpro' ? 'songs.fmtChordpro'
    : format === 'over-lyrics' ? 'songs.fmtOverLyrics' : 'songs.fmtList');
  const parts = [
    t('songs.chordsFound', { n: new Set(chart.chords).size }),
    t('songs.formatDetected', { format: fmtName }),
  ];
  if (translated) parts.push(t('songs.germanApplied'));
  setStatus(parts.join(' '), 'good');
}

/** Load a song and render whatever sections it can fill. */
function load(song) {
  state.song = song;
  // Only pasted sheets carry their source text, so only those can be saved.
  state.lastPaste = song.paste || null;
  state.capo = 0;
  $('capo').value = '0';

  // Melodies get an octave chosen for them; chord charts start where written.
  // A piano sheet also starts where written — its octaves are the arrangement,
  // not an accident of the collection it came from, so moving it would be
  // rewriting the piece rather than fitting it to the instrument.
  if (song.notes.length && !song.sequence) {
    const suggestion = suggestShift(song.notes);
    state.transpose = suggestion ? suggestion.semitones : 0;
  } else {
    state.transpose = 0;
  }
  state.chordTranspose = state.transpose;
  $('transpose').value = state.transpose;

  $('overview').hidden = false;
  renderOverview();
}

/**
 * Whichever instrument's idea of "put this where it is easiest" applies.
 *
 * Three genuinely different questions. A guitar weighs hand span against fret
 * height. A piano only has to pick an octave, because every key is there. A
 * lyre or a kalimba asks something the other two never do — *which of these
 * notes exist at all* — and answers it in semitones rather than octaves,
 * because the fix for a tune in D is to move it to C, not to move it down
 * twelve.
 */
function suggestShift(midis) {
  if (isTined()) return suggestTineShift(layoutFor(), midis);
  return isPiano() ? suggestOctaveShift(midis) : suggestTranspose(midis);
}

function autoFit() {
  const best = hasNotes() ? suggestShift(state.song.notes) : suggestChordShift();
  if (!best) return;
  state.transpose = best.semitones;
  state.chordTranspose = best.semitones;
  $('transpose').value = best.semitones;
  renderOverview();
}

/**
 * The same search, for a song that is only chord symbols.
 *
 * Needed because on a diatonic instrument a *chord sheet* can be unplayable
 * just as a melody can, and for the same reason: a plain D major needs an F♯
 * and there is not one. The songbook is full of G–C–D songs, every one of which
 * is impossible on a lyre as written and perfectly easy two semitones down, so
 * without this the button that fixes it would simply not be offered.
 */
function suggestChordShift() {
  if (!hasChords() || !isTined()) return null;
  const layout = layoutFor();
  const unique = [...new Set(state.song.chords)];

  let best = null;
  for (let semitones = -6; semitones <= 6; semitones++) {
    const impossible = unique.filter((name) => {
      const chord = chordTines(layout, transposeChord(name, semitones));
      return !chord || !chord.playable;
    }).length;
    // Playability dominates; the distance from the written key only breaks ties,
    // since a singer has to live with wherever this lands.
    const score = impossible * 100 + Math.abs(semitones);
    if (!best || score < best.score) best = { semitones, score, impossible };
  }
  return best;
}

function applyCapoSuggestion() {
  if (!hasChords()) return;
  const sounding = [...new Set(state.song.chords)]
    .map((c) => transposeChord(c, state.chordTranspose));
  const { best } = suggestCapo(sounding);
  state.capo = best.capo;
  $('capo').value = String(best.capo);
  renderOverview();
}

/* --------------------------------------------------------------- overview */

function renderOverview() {
  const song = state.song;
  if (!song) return;

  applyTranslations();
  $('transposeValue').textContent = formatTranspose(state.transpose);

  const notes = hasNotes();
  const chords = hasChords();

  // Show only the controls that apply to what was loaded.
  $('transposeRow').hidden = false;
  // A chord sheet can be unplayable on a diatonic instrument too, so the fit
  // button is offered there even with no melody to centre.
  $('autoFit').hidden = !(notes || (isTined() && chords));
  $('capoRow').hidden = !chords;
  $('suggestCapoBtn').hidden = !chords;
  // Only pasted sheets are worth saving; songbook entries are already here.
  $('saveSong').hidden = !canSave();
  $('controlsHint').textContent = notes
    ? t('songs.fitHelp')
    : t(isTined() ? 'songs.capoNotHere' : 'songs.capoHelp');
  // Whether a song fits a diatonic instrument at all comes before anything
  // about how to play it, so this sits above every other section.
  $('tinedNoticePanel').hidden = !isTined();
  $('tinedAdvice').textContent = '';

  $('tuneTitle').textContent = song.title;
  const bits = [];
  if (song.parsed.rhythm) bits.push(song.parsed.rhythm);
  if (song.parsed.key && song.parsed.key.label) {
    bits.push(`${t('common.keyOf')} ${song.parsed.key.label}`);
  }
  if (song.parsed.meter) bits.push(song.parsed.meter);
  if (notes) bits.push(`${song.notes.length} ${t('common.notes')}`);
  if (chords) bits.push(`${new Set(song.chords).size} ${t('common.chords')}`);
  $('tuneMeta').textContent = bits.join(' · ');

  $('credit').innerHTML = song.source.url
    ? `${t('songs.source')}: <a href="${esc(song.source.url)}" target="_blank" rel="noopener">${esc(song.source.label)}</a>${
        song.source.credit ? ` — ${esc(song.source.credit)}` : ''}`
    : '';

  renderChordSections(chords);
  renderMelodySections(notes);
}

function renderChordSections(show) {
  for (const id of ['capoPanel', 'changesPanel', 'sheetPanel', 'transitionsPanel']) {
    $(id).hidden = !show;
  }
  if (!show) return;

  const song = state.song;
  const piano = isPiano();
  const tined = isTined();
  const sounding = (name) => transposeChord(name, state.chordTranspose);
  // A capo shifts what you grip away from what you hear. Only a guitar has one,
  // so everywhere else the two are always the same thing.
  const gripped = (name) => (piano || tined
    ? sounding(name) : transposeChord(sounding(name), -state.capo));
  const unique = [...new Set(song.chords)];

  const soundingSet = unique.map(sounding);
  const grips = unique.map(gripped);

  if (!piano && !tined) {
    const { best } = suggestCapo(soundingSet);
    const hard = grips.filter((g) => { const s = lookupShape(g); return !s || !s.easy; });

    let advice;
    if (state.capo > 0) {
      advice = t('songs.capoAdviceOn', {
        capo: state.capo, grips: grips.join(' '), sounds: soundingSet.join(' '),
      });
    } else if (!hard.length) {
      advice = t('songs.capoAdviceEasy');
    } else if (best.capo > 0 && best.easyCount > unique.length - hard.length) {
      advice = t('songs.capoAdviceGood', {
        capo: best.capo, shapes: best.shapes.map((s) => s.shape).join(' '),
      });
    } else {
      advice = t('songs.capoAdviceHard', { n: hard.length });
    }
    $('capoAdvice').textContent = advice;
  }

  if (tined) renderTinedChordAdvice(unique.map(gripped));

  $('chordDiagrams').innerHTML = unique
    .map((name) => {
      const grip = gripped(name);
      if (tined) {
        return `<figure class="tines">${renderChordTines(layoutFor(), grip, {
          width: 250, height: 118, unknownLabel: t('songs.noShape'),
        })}</figure>`;
      }
      if (piano) {
        return `<figure>${renderChordKeyboard(grip, {
          width: 188, whiteHeight: 52, unknownLabel: t('songs.noShape'),
        })}<figcaption>&nbsp;</figcaption></figure>`;
      }
      const shape = lookupShape(grip);
      const caption = state.capo > 0
        ? esc(t('songs.soundsLike', { chord: sounding(name) }))
        : '&nbsp;';
      return `<figure>${renderChordDiagram(esc(grip), shape)}<figcaption>${caption}</figcaption></figure>`;
    })
    .join('');

  const seq = song.chords.map(gripped);
  $('changesPanel').hidden = seq.length < 2;
  $('chordSequence').innerHTML = seq
    .map((c, i) => `<span class="chip"${i && seq[i - 1] === c ? ' style="opacity:.45"' : ''}><b>${esc(c)}</b></span>`)
    .join('');

  renderTransitions(song.chords.map(gripped));

  const lines = song.lines || [];
  $('sheetPanel').hidden = !lines.length;
  $('chordSheet').innerHTML = lines
    .map((line) => {
      if (line.type === 'blank') return '<div class="row blank"></div>';
      if (line.type === 'section') {
        return `<div class="row section">${esc(line.label)}</div>`;
      }
      const segs = line.segments
        .map((s) => `<span class="seg"><span class="c">${s.chord ? esc(gripped(s.chord)) : ''}</span><span class="t">${esc(s.text)}</span></span>`)
        .join('');
      return `<div class="row">${segs}</div>`;
    })
    .join('');
}

/**
 * How awkward a chord is to reach, in the terms of the instrument in hand.
 *
 * On a guitar that is whether it needs a barre. A piano has no barre and no
 * open shapes; what makes a chord unfamiliar there is landing on black keys,
 * which is what a beginner's fingers have not learned to find yet.
 */
function chordIsHard(name) {
  if (isTined()) {
    // Not "hard" so much as absent: a chord needing a note the instrument has
    // not got is not a change to drill, it is one to transpose away.
    const chord = chordTines(layoutFor(), name);
    return !chord || !chord.playable;
  }
  if (!isPiano()) {
    const shape = lookupShape(name);
    return !shape || !shape.easy;
  }
  const voicing = chordVoicing(name);
  return !voicing || blackKeyCount(voicing.midis) > 0;
}

/**
 * Whether this song's chords exist on the instrument at all, said plainly.
 *
 * The most useful sentence on the page for a diatonic instrument, and one
 * neither of the other two ever needs: a sheet in D or E♭ is not difficult
 * here, it is impossible, and the fix is one drag of the transpose slider
 * rather than weeks of practice.
 */
function renderTinedChordAdvice(grips) {
  const layout = layoutFor();
  const impossible = [...new Set(grips)].filter((c) => chordIsHard(c));
  const box = $('tinedAdvice');
  if (!box) return;
  box.textContent = impossible.length
    ? t('songs.chordsImpossible', { n: impossible.length, names: impossible.join(' ') })
    : t('songs.chordsAllPlayable');
  box.style.color = impossible.length ? 'var(--warn)' : 'var(--good)';
}

/** Rank the song's chord changes, and build a drill sequence from them. */
function renderTransitions(chords) {
  const { pairs, total } = chordTransitions(chords);
  if (!pairs.length) {
    $('transitionsPanel').hidden = true;
    return;
  }
  const most = pairs[0].count;
  // `chordTransitions` grades difficulty for a guitar; re-grade for a piano.
  const graded = pairs.map((p) => ({
    ...p, hard: (isPiano() || isTined()) ? [p.a, p.b].some(chordIsHard) : p.hard,
  }));

  $('transitionList').innerHTML = graded.map((p) => `
    <div class="change${p.hard ? ' hard' : ''}">
      <span class="names">${esc(p.a)} ↔ ${esc(p.b)}</span>
      <span class="bar"><i style="width:${Math.round((p.count / most) * 100)}%"></i></span>
      <span class="n">×${p.count} · ${t('songs.changeShare', { pct: Math.round(p.share * 100) })}${
        p.hard ? ` · ${t('songs.needsBarre')}` : ''}</span>
    </div>`).join('');

  state.drillPairs = pairs;
  updateDrill();
}

function updateDrill() {
  if (!state.drillPairs) return;
  $('drillText').value = buildDrill(state.drillPairs, Number($('drillRepeats').value));
}

function renderMelodySections(show) {
  // A pasted piano sheet is several notes at a time, in fixed octaves. The
  // guitar view flattens it into a single line of tab, which is not a
  // transcription of anything — better to say so than to draw a fiction.
  // A lyre and a kalimba are excluded from that: their roll stacks the notes of
  // a chord on separate rows exactly as the sheet writes them, so it *is* a
  // transcription — the objection was only ever to squashing several voices
  // into one line of tab.
  const pianoOnly = show && state.song.sequence && !isPiano() && !isTined();
  for (const id of ['statsPanel', 'tabPanel', 'fretboardPanel', 'inventoryPanel']) {
    $(id).hidden = !show || pianoOnly;
  }
  $('pianoOnlyPanel').hidden = !pianoOnly;
  // Explain the single-note-at-a-time nature, but only when there are no
  // chords alongside — with both present it is self-evident.
  $('melodyNoticePanel').hidden = !show || hasChords() || !!state.song.sequence;
  if (!show || pianoOnly) return;

  const midis = state.song.notes.map((m) => m + state.transpose);

  if (isTined()) {
    const layout = layoutFor();
    renderTinedStats(layout, midis);
    $('tabStaff').innerHTML = renderTineRoll(layout, state.song.events, midis);
    $('fretboard').innerHTML = renderTineHeatMap(layout, midis);
    renderTinedInventory(layout, midis);
    return;
  }

  if (isPiano()) {
    renderPianoStats(midis);
    $('tabStaff').innerHTML = renderPianoRoll(state.song.events, midis);
    $('fretboard').innerHTML = renderKeyHeatMap(midis);
    updateRangeNote(midis);
    renderPianoInventory(midis);
    return;
  }

  const path = optimalFingering(midis);
  const summary = fingeringSummary(path);

  renderStats(midis, path, summary);
  $('tabStaff').innerHTML = renderTabStaff(state.song.events, path);
  $('fretboard').innerHTML = renderFretboard(summary);
  renderInventory(midis, path);
}

/* ------------------------------------------------- lyre and kalimba */

/**
 * The overview for a diatonic instrument.
 *
 * The guitar's version reports hand span and fret height; the piano's reports
 * octaves and black keys. Neither question exists here. What matters instead is
 * a count the other two never have to make — how much of this song the
 * instrument physically contains — so that leads, and the note names it has not
 * got are named rather than left as a number.
 */
function renderTinedStats(layout, midis) {
  const s = tineSummary(layout, midis);
  if (!s.playable) {
    $('stats').innerHTML = `<span class="muted">${t('songs.noPlayable')}</span>`;
    if (!hasChords()) writeTinedAdvice(s);
    return;
  }

  const cells = [
    [t('songs.range'), `${midiLabel(s.low)}–${midiLabel(s.high)}`],
    [t('songs.playableShare'), `${s.playable} <small>/ ${s.total}</small>`],
    [t('songs.stringsUsed'), `${s.usedCount} <small>/ ${layout.count}</small>`],
    [t('songs.distinct'), String(s.distinct)],
  ];
  if (s.wrongLetter) {
    cells.push([t('songs.notOnInstrument'),
      `<span style="color:var(--bad)">${s.wrongLetter}</span>`]);
    cells.push([t('songs.missingLetters'),
      `<span style="color:var(--warn)">${esc(s.missingNames.join(' '))}</span>`]);
  }
  if (s.outOfRange) {
    cells.push([t('songs.unplayable'),
      `<span style="color:var(--warn)">${s.outOfRange}</span>`]);
  }

  $('stats').innerHTML = cells
    .map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`)
    .join('');

  // With chords present the advice line belongs to them; a melody-only song
  // still needs the same verdict, phrased about its notes.
  if (!hasChords()) writeTinedAdvice(s);
}

function writeTinedAdvice(s) {
  const box = $('tinedAdvice');
  if (!box) return;
  // Two different problems with two different fixes, so they get two different
  // sentences: a note whose letter is absent is gone until the key changes, and
  // one merely out of range only needs the tune moving an octave.
  if (s.wrongLetter) {
    box.textContent = t('songs.notesMissing', {
      n: s.wrongLetter, names: s.missingNames.join(' '),
    });
  } else if (s.outOfRange) {
    box.textContent = t('songs.notesOutOfRange', { n: s.outOfRange });
  } else {
    box.textContent = t('songs.notesAllPlayable');
  }
  box.style.color = (s.wrongLetter || s.outOfRange) ? 'var(--warn)' : 'var(--good)';
}

/** Every string the song touches, shaded by how much work it does. */
function renderTineHeatMap(layout, midis) {
  const counts = new Map();
  for (const m of midis) {
    const index = indexOfMidi(layout, m);
    if (index >= 0) counts.set(index, (counts.get(index) || 0) + 1);
  }
  if (!counts.size) return '';
  const max = Math.max(...counts.values());

  return renderTines(layout, {
    width: 760,
    marks: [...counts.entries()].map(([index, n]) => ({
      index, kind: 'heat', label: String(n), weight: n / max,
    })),
  });
}

function renderTinedInventory(layout, midis) {
  const byMidi = new Map();
  for (const m of midis) {
    if (!byMidi.has(m)) byMidi.set(m, { midi: m, count: 0 });
    byMidi.get(m).count++;
  }

  const rows = [...byMidi.values()].sort((a, b) => a.midi - b.midi).map((e) => {
    const index = indexOfMidi(layout, e.midi);
    const there = index >= 0;
    return `<tr>
      <td><b>${esc(midiLabel(e.midi))}</b></td>
      <td class="num">${e.count}</td>
      <td>${there
        ? `${t('common.string')} <b>${numberOf(layout, index)}</b>`
        : `<span style="color:var(--bad)">${esc(t('tines.notHere'))}</span>`}</td>
      <td class="muted">${there ? esc(describeTine(layout, index)) : ''}</td>
    </tr>`;
  }).join('');

  $('inventory').innerHTML = `<table class="inv">
    <thead><tr>
      <th>${t('songs.invNote')}</th><th class="num">${t('songs.invTimes')}</th>
      <th>${t('songs.invPlayed')}</th><th>${t('songs.invAlts')}</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

/* ----------------------------------------------------------------- piano */

function renderPianoStats(midis) {
  const playable = midis.filter(inRange);
  if (!playable.length) {
    $('stats').innerHTML = `<span class="muted">${t('songs.noPlayable')}</span>`;
    return;
  }

  const low = Math.min(...playable);
  const high = Math.max(...playable);
  const distinct = new Set(playable);
  let leap = 0;
  for (let i = 1; i < midis.length; i++) {
    leap = Math.max(leap, Math.abs(midis[i] - midis[i - 1]));
  }

  // No hand-span figure here: on a guitar that is a real constraint the
  // fingering has to respect, but a piano melody's total range says nothing
  // about how far any one hand stretches — and it would just restate the
  // octave count in a different unit.
  const cells = [
    [t('songs.range'), `${keyLabel(low)}–${keyLabel(high)}`],
    [t('songs.octavesSpanned'), ((high - low) / 12).toFixed(1)],
    [t('songs.widestLeap'), `${leap} <small>${t('songs.leapUnit')}</small>`],
    [t('songs.blackKeysUsed'), `${blackKeyCount([...distinct])} <small>/ ${
      new Set([...distinct].map((m) => ((m % 12) + 12) % 12)).size}</small>`],
    [t('songs.distinct'), String(distinct.size)],
  ];
  const outside = midis.length - playable.length;
  if (outside) {
    cells.push([t('songs.unplayable'), `<span style="color:var(--bad)">${outside}</span>`]);
  }

  $('stats').innerHTML = cells
    .map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`)
    .join('');
}

/**
 * A piano roll: the honest equivalent of tab.
 *
 * Tab exists because a guitar note needs a string *and* a fret — the pitch
 * alone does not say where to put a finger. On a piano the pitch is the whole
 * answer, so there is nothing to encode; what a learner needs instead is to see
 * the shape of the line and where it sits, which is what a roll shows.
 */
function renderPianoRoll(events, midis) {
  const playable = midis.filter(inRange);
  if (!playable.length) return '';

  // The roll suffers from a wide range too — five octaves is sixty rows — so
  // it follows the same size setting rather than needing its own.
  const ROW_SCALE = { fit: 1, medium: 1.3, large: 1.8, xlarge: 2.4 }[keyboardSize()] || 1;
  const ROW_H = Math.round(9 * ROW_SCALE);
  const NOTE_W = Math.round(22 * Math.min(1.6, ROW_SCALE));
  const BAR_W = 8, LEFT = 40;
  const WIDTH = Math.round(900 * Math.min(1.5, ROW_SCALE));
  // Round the pitch range out to whole octaves so the black-key stripes and the
  // C labels line up into something readable rather than an arbitrary slice.
  const low = Math.floor(Math.min(...playable) / 12) * 12;
  const high = Math.ceil((Math.max(...playable) + 1) / 12) * 12 - 1;
  const rows = high - low + 1;
  const staffH = rows * ROW_H;
  const SYSTEM_H = staffH + 26;

  // An event may hold several notes at once — a pasted piano sheet is full of
  // three-note stacks — so each token carries a list, not a single pitch.
  const tokens = [];
  let noteIndex = 0;
  for (const ev of events) {
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

  // Pitch increases upward, so the row for a note is measured from the top.
  const rowY = (top, midi) => top + (high - midi) * ROW_H;

  let svg = `<svg width="${WIDTH}" height="${systems.length * SYSTEM_H + 10}"
    xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, Segoe UI, system-ui, sans-serif">`;

  systems.forEach((system, si) => {
    const top = si * SYSTEM_H + 14;

    for (let m = low; m <= high; m++) {
      const y = rowY(top, m);
      if (isBlackKey(m)) {
        svg += `<rect x="${LEFT}" y="${y}" width="${WIDTH - 10 - LEFT}" height="${ROW_H}"
          fill="#1d232d"/>`;
      }
      if (m % 12 === 0) {
        svg += `<line x1="${LEFT}" y1="${y + ROW_H}" x2="${WIDTH - 10}" y2="${y + ROW_H}"
          stroke="#2a323e" stroke-width="1"/>`;
        svg += `<text x="${LEFT - 8}" y="${y + ROW_H - 1}" fill="#8b98a9" font-size="9"
          text-anchor="end">${keyLabel(m)}</text>`;
      }
    }

    for (const tok of system) {
      if (tok.kind === 'bar') {
        svg += `<line x1="${tok.x + 3}" y1="${top}" x2="${tok.x + 3}" y2="${top + staffH}"
          stroke="#3d4757" stroke-width="1.5"/>`;
        continue;
      }
      if (tok.kind !== 'note') continue;   // a rest is just space
      for (const midi of tok.notes) {
        if (!Number.isFinite(midi) || !inRange(midi)) continue;
        const y = rowY(top, midi);
        svg += `<rect x="${tok.x + 2}" y="${y + 1}" width="${NOTE_W - 4}" height="${ROW_H - 2}"
          rx="2" fill="${isBlackKey(midi) ? '#8957e5' : '#58a6ff'}"/>`;
      }
    }
  });

  return svg + '</svg>';
}

/**
 * How wide a white key is drawn, in pixels.
 *
 * A song spanning five octaves is thirty-five white keys, and squeezed into the
 * panel width that is twelve pixels each — too narrow to read the note counts
 * printed on them, let alone to see which key is which. Every size above "fit"
 * scrolls sideways instead of shrinking, which is the trade the reader should
 * get to make rather than have made for them.
 */
const KEY_WIDTHS = { fit: null, medium: 34, large: 48, xlarge: 66 };
/** What "fit" will grow to when there is room; beyond this it just looks odd. */
const COMFORTABLE_KEY = 34;
const SIZE_KEY = 'instrument-helper.keyboardSize';

function keyboardSize() {
  const stored = localStorage.getItem(SIZE_KEY);
  return stored && stored in KEY_WIDTHS ? stored : 'fit';
}

/** Every key the song touches, shaded by how much work it does. */
function renderKeyHeatMap(midis) {
  const counts = new Map();
  for (const m of midis) {
    if (inRange(m)) counts.set(m, (counts.get(m) || 0) + 1);
  }
  if (!counts.size) return '';

  const used = [...counts.keys()];
  const max = Math.max(...counts.values());
  const window = keyboardWindow(used, { minOctaves: 2 });
  const keys = whiteKeyCount(window.from, window.to);

  const perKey = KEY_WIDTHS[keyboardSize()];
  // "Fit" means what it says: never wider than the panel, so it never scrolls.
  // Every other size is a fixed width per key and scrolls when it has to —
  // which is the whole point of offering them.
  const available = Math.max(320, $('fretboard').clientWidth || 880);
  const width = perKey
    ? keys * perKey
    : Math.min(available, keys * COMFORTABLE_KEY);
  // Keys stay roughly piano-shaped rather than growing into tall slabs.
  const height = Math.round(Math.min(150, Math.max(80, (width / keys) * 3.4)));

  return renderKeyboard({
    ...window,
    width,
    whiteHeight: height,
    marks: used.map((midi) => ({
      midi, kind: 'heat',
      label: String(counts.get(midi)),
      weight: counts.get(midi) / max,
    })),
  });
}

/** Tell the reader when a song is wide enough that "fit" will hurt. */
function updateRangeNote(midis) {
  const playable = midis.filter(inRange);
  const note = $('rangeNote');
  if (!playable.length) { note.textContent = ''; return; }

  const octaves = (Math.max(...playable) - Math.min(...playable)) / 12;
  note.textContent = octaves >= 2.5 && keyboardSize() === 'fit'
    ? t('songs.wideRange', { n: octaves.toFixed(1) })
    : '';
  note.style.color = 'var(--warn)';
}

function renderPianoInventory(midis) {
  const byMidi = new Map();
  for (const m of midis) {
    if (!byMidi.has(m)) byMidi.set(m, { midi: m, count: 0 });
    byMidi.get(m).count++;
  }

  const rows = [...byMidi.values()].sort((a, b) => a.midi - b.midi).map((e) => {
    const playable = inRange(e.midi);
    return `<tr>
      <td><b>${esc(keyLabel(e.midi))}</b></td>
      <td class="num">${e.count}</td>
      <td>${playable ? esc(describeKeyColour(e.midi)) : `<span style="color:var(--bad)">—</span>`}</td>
      <td class="muted">${playable ? esc(describeKeyPosition(e.midi)) : ''}</td>
    </tr>`;
  }).join('');

  $('inventory').innerHTML = `<table class="inv">
    <thead><tr>
      <th>${t('songs.invNote')}</th><th class="num">${t('songs.invTimes')}</th>
      <th>${t('songs.invPlayed')}</th><th>${t('songs.invAlts')}</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

function renderStats(midis, path, summary) {
  if (!summary) {
    $('stats').innerHTML = `<span class="muted">${t('songs.noPlayable')}</span>`;
    return;
  }
  const unplayable = path.filter((p) => !p).length;
  const cells = [
    [t('songs.range'), `${noteLabel(Math.min(...midis))}–${noteLabel(Math.max(...midis))}`],
    [t('songs.fretsUsed'), `${summary.minFret}–${summary.maxFret}`],
    [t('songs.handSpan'), `${summary.span} <small>${t('songs.handSpanUnit')}</small>`],
    [t('songs.openStrings'), `${summary.openCount} <small>/ ${summary.noteCount}</small>`],
    [t('songs.stringsUsed'), summary.strings.join(' ')],
    [t('songs.distinct'), String(new Set(midis).size)],
  ];
  if (unplayable) {
    cells.push([t('songs.unplayable'), `<span style="color:var(--bad)">${unplayable}</span>`]);
  }
  $('stats').innerHTML = cells
    .map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`)
    .join('');
}

/** Six-line tab staff, wrapped into systems. */
function renderTabStaff(events, path) {
  const STRING_GAP = 15, NOTE_W = 25, BAR_W = 9, LEFT = 26;
  const SYSTEM_H = 5 * STRING_GAP + 34, WIDTH = 900;

  const tokens = [];
  let noteIdx = 0;
  for (const ev of events) {
    if (ev.type === 'note') tokens.push({ kind: 'note', pos: path[noteIdx++] || null });
    else if (ev.type === 'bar') tokens.push({ kind: 'bar' });
  }
  if (!tokens.length) return '';

  const systems = [[]];
  let x = LEFT;
  for (const tok of tokens) {
    const w = tok.kind === 'bar' ? BAR_W : NOTE_W;
    if (x + w > WIDTH - 10) { systems.push([]); x = LEFT; }
    systems[systems.length - 1].push({ ...tok, x });
    x += w;
  }

  const labels = ['e', 'B', 'G', 'D', 'A', 'E'];
  let svg = `<svg width="${WIDTH}" height="${systems.length * SYSTEM_H + 10}"
    xmlns="http://www.w3.org/2000/svg" font-family="ui-monospace, Consolas, monospace">`;

  systems.forEach((system, si) => {
    const top = si * SYSTEM_H + 16;
    for (let s = 0; s < 6; s++) {
      const y = top + s * STRING_GAP;
      svg += `<line x1="${LEFT}" y1="${y}" x2="${WIDTH - 10}" y2="${y}" stroke="#2a323e" stroke-width="1"/>`;
      svg += `<text x="${LEFT - 10}" y="${y + 3.5}" fill="#8b98a9" font-size="10" text-anchor="end">${labels[s]}</text>`;
    }
    for (const tok of system) {
      if (tok.kind === 'bar') {
        svg += `<line x1="${tok.x + 4}" y1="${top}" x2="${tok.x + 4}" y2="${top + 5 * STRING_GAP}" stroke="#3d4757" stroke-width="1.5"/>`;
        continue;
      }
      if (!tok.pos) continue;
      const y = top + (tok.pos.string - 1) * STRING_GAP;
      const text = String(tok.pos.fret);
      const w = text.length * 7 + 5;
      svg += `<rect x="${tok.x + NOTE_W / 2 - w / 2}" y="${y - 7}" width="${w}" height="14" fill="#161b23"/>`;
      svg += `<text x="${tok.x + NOTE_W / 2}" y="${y + 4}" fill="${tok.pos.fret === 0 ? '#3fb950' : '#e6edf3'}" font-size="12" text-anchor="middle">${text}</text>`;
    }
  });
  return svg + '</svg>';
}

/** Neck diagram, each used position sized by how often it occurs. */
function renderFretboard(summary) {
  if (!summary) return '';
  const FRET_W = 46, STRING_GAP = 26, LEFT = 40, TOP = 26;
  const lastFret = Math.max(12, summary.maxFret);
  const width = LEFT + (lastFret + 1) * FRET_W + 20;
  const height = TOP + 5 * STRING_GAP + 34;
  const counts = summary.positionCounts;
  const maxCount = Math.max(...counts.values());
  const labels = ['e', 'B', 'G', 'D', 'A', 'E'];

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"
    font-family="-apple-system, Segoe UI, system-ui, sans-serif">`;

  for (const f of [3, 5, 7, 9, 15, 17, 19, 21]) {
    if (f > lastFret) continue;
    svg += `<circle cx="${LEFT + f * FRET_W + FRET_W / 2}" cy="${TOP + 2.5 * STRING_GAP}" r="5" fill="#1d232d"/>`;
  }
  if (lastFret >= 12) {
    const cx = LEFT + 12 * FRET_W + FRET_W / 2;
    svg += `<circle cx="${cx}" cy="${TOP + 1.5 * STRING_GAP}" r="5" fill="#1d232d"/>`;
    svg += `<circle cx="${cx}" cy="${TOP + 3.5 * STRING_GAP}" r="5" fill="#1d232d"/>`;
  }
  for (let f = 0; f <= lastFret + 1; f++) {
    const x = LEFT + f * FRET_W;
    const isNut = f === 1;
    svg += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + 5 * STRING_GAP}"
      stroke="${isNut ? '#8b98a9' : '#2a323e'}" stroke-width="${isNut ? 3 : 1}"/>`;
    if (f > 0 && f <= lastFret) {
      svg += `<text x="${LEFT + f * FRET_W + FRET_W / 2}" y="${TOP + 5 * STRING_GAP + 18}"
        fill="#8b98a9" font-size="10" text-anchor="middle">${f}</text>`;
    }
  }
  for (let s = 0; s < 6; s++) {
    const y = TOP + s * STRING_GAP;
    svg += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + (lastFret + 1) * FRET_W}" y2="${y}"
      stroke="#39424f" stroke-width="${1 + s * 0.25}"/>`;
    svg += `<text x="${LEFT - 12}" y="${y + 4}" fill="#8b98a9" font-size="11" text-anchor="end">${labels[s]}</text>`;
  }
  for (const [key, count] of counts) {
    const [string, fret] = key.split(':').map(Number);
    const cx = fret === 0 ? LEFT : LEFT + fret * FRET_W + FRET_W / 2;
    const cy = TOP + (string - 1) * STRING_GAP;
    const weight = count / maxCount;
    const fill = fret === 0 ? '#3fb950' : '#58a6ff';
    svg += `<circle cx="${cx}" cy="${cy}" r="${8 + weight * 5}" fill="${fill}"
      fill-opacity="${0.25 + weight * 0.6}" stroke="${fill}" stroke-width="1.5"/>`;
    svg += `<text x="${cx}" y="${cy + 3.5}" fill="#04121f" font-size="10" font-weight="700" text-anchor="middle">${count}</text>`;
  }
  return svg + '</svg>';
}

function renderInventory(midis, path) {
  const byMidi = new Map();
  midis.forEach((m, i) => {
    if (!byMidi.has(m)) byMidi.set(m, { midi: m, count: 0, chosen: path[i] });
    byMidi.get(m).count++;
  });

  const rows = [...byMidi.values()].sort((a, b) => a.midi - b.midi).map((e) => {
    const alts = candidatePositions(e.midi)
      .filter((p) => !e.chosen || p.string !== e.chosen.string || p.fret !== e.chosen.fret)
      .map((p) => `${p.string}/${p.fret}`)
      .join(', ');
    const chosen = e.chosen
      ? `${t('common.string')} ${e.chosen.string}, ${e.chosen.fret === 0
          ? t('common.open') : `${t('common.fret')} ${e.chosen.fret}`}`
      : `<span style="color:var(--bad)">—</span>`;
    return `<tr><td><b>${noteLabel(e.midi)}</b></td><td class="num">${e.count}</td>
      <td>${chosen}</td><td class="muted">${alts || '—'}</td></tr>`;
  }).join('');

  $('inventory').innerHTML = `<table class="inv">
    <thead><tr>
      <th>${t('songs.invNote')}</th><th class="num">${t('songs.invTimes')}</th>
      <th>${t('songs.invPlayed')}</th><th>${t('songs.invAlts')}</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

init();
