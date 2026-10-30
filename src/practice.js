import {
  createChordDetector, scoreAgainst, scoreAgainstNotes, matchChord, sameChord,
} from './chroma.js';
import { detectKeysheet, parseKeysheet, midiToLabel } from './keysheet.js';
import { lookupShape, renderChordDiagram, parseChordPro, parseChordsOverLyrics,
  parseChordList, detectSheetFormat, fromGermanChord, usesGermanNotation } from './chords.js';
import { SONGBOOK } from './songbook.js';
import { t, initLanguageSwitch, applyTranslations } from './i18n.js';
import { attachGainControl, dbToLinear } from './gain.js';
import {
  estimateBeats, fixedBeats, buildSchedule, createMetronome, createTapTempo, rateTiming,
} from './rhythm.js';
import {
  initInstrumentSwitch, instrumentConfig, isPiano, isTined, getInstrument,
} from './instrument.js';
import {
  layoutFor, renderTines, renderChordTines, chordTines, indexOfMidi, numberOf,
  midiLabel,
} from './tines.js';
import { listSongs, filterSongs, groupByFolder } from './songstore.js';
import {
  chordVoicing, renderChordKeyboard, renderKeyboard, keyboardWindow, keyName,
  matchHeld, chromaFromNotes,
} from './piano.js';
import { fretPositions } from './notes.js';
import { createMidiInput, midiSupported } from './midi.js';
import { getSynth, attachSoundControls } from './synth.js';

/**
 * Cosine score against the expected chord above which a strum counts.
 * Tuned on synthetic chords; the slider lets a real room override it.
 */
const DEFAULT_ACCEPT = 0.74;
/**
 * Note sheets need a stricter one. Measured against synthetic chromas of a
 * three-note step: playing it exactly scores 0.99, leaving one note out still
 * scores 0.81, and one wrong note scores 0.70. At the chord default of 0.74 a
 * two-thirds attempt would be called correct — fine when the question is "is
 * that a G", wrong when the sheet named three specific keys.
 */
const NOTE_ACCEPT = 0.85;
/**
 * Below this the input is silence, and chroma of silence is meaningless.
 * Deliberately low: this microphone runs quiet enough that 0.004 was already
 * shown to swallow the low E on the tuner page.
 */
const RMS_FLOOR = 0.0015;
/** Hold the right chord this long before it counts, so noise cannot fluke it. */
const HOLD_MS = 220;
/** After a hit, ignore the ringing string until it decays. */
const REARM_MS = 420;
/**
 * MIDI needs far less of both. The hold exists only to let all the fingers of a
 * chord land — there is no noise to fluke past — and nothing rings on into the
 * next chord, so the re-arm only has to outlast one hand movement.
 */
const MIDI_HOLD_MS = 130;
const MIDI_REARM_MS = 240;

/** Scratch vector for naming held notes; allocated once, like the chroma path. */
const heldChroma = new Float32Array(12);

const state = {
  ctx: null, stream: null, detector: null, raf: null,
  running: false,
  source: 'mic',       // 'mic' | 'midi'
  midi: null,          // MIDI input, when that is the source
  held: [],            // keys currently down, MIDI only
  midiMatch: null,     // { ok, missing, extra, score } against the target
  heldName: null,      // what the held keys add up to, for the live readout
  lastHeldSig: '',     // redraw the diagram only when the held set changes
  playback: null,      // { index, from, gap, timer } while playing the song back
  chords: [],          // the sequence to play
  index: 0,
  armedAt: 0,
  matchingSince: 0,    // when the expected chord started matching
  accept: DEFAULT_ACCEPT,
  live: null,          // latest reading, for the diagnostic readout
  bestSeen: 0,         // best score for the current target, to show progress
  results: [],         // { expected, played, ok }
  feedback: null,      // { ok, expected, played, score }

  // Timed mode
  timed: false,
  bpm: 80,
  beatsSource: 'fixed',  // 'fixed' | 'sheet'
  beatsPerChord: 4,
  schedule: [],          // { startBeat, beats, endBeat } per step
  metronome: null,
  zeroTime: 0,           // audio-clock time of beat 0, after the count-in
  hitAtBeat: null,       // when in the current window the chord was first right
  timingResults: [],     // 'onTime' | 'early' | 'late' | 'missed'
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ------------------------------------------------------------------ setup */

function init() {
  initInstrumentSwitch();
  initLanguageSwitch();
  populateSongs();

  $('source').addEventListener('change', async () => {
    await stop();
    setSource($('source').value);
  });
  $('midiDevice').addEventListener('change', () => {
    if (state.midi) state.midi.select($('midiDevice').value);
  });
  attachSoundControls({
    select: $('voice'), slider: $('synthVolume'), readout: $('synthVolumeValue'),
    sustain: $('sustain'),
  });
  $('playSong').addEventListener('click', () =>
    (state.playback ? stopPlayback() : startPlayback()));
  $('playSpeed').addEventListener('input', showPlaySpeed);
  showPlaySpeed();
  window.addEventListener('languagechange', showPlaySpeed);
  $('hearChord').addEventListener('click', () => {
    const synth = getSynth();
    synth.prime();
    // A note sheet already says exactly which keys; only a chord symbol has to
    // be voiced first.
    if (noteMode()) {
      const step = currentStep();
      if (step) synth.playChord(step.notes, { hold: 1.1 });
      return;
    }
    const chord = state.chords[state.index];
    const voicing = chord && chordVoicing(chord);
    if (!voicing) return;
    synth.playChord(voicing.bass === null
      ? voicing.midis : [voicing.bass, ...voicing.midis]);
  });
  window.addEventListener('instrumentchange', async () => {
    stopPlayback();
    await stop();
    // Guitar has no MIDI path, so the source picker has to fall back with it.
    if (!isPiano()) setSource('mic');
    else applySourceVisibility();
    state.lastHeldSig = '';
    // The saved list is filtered by instrument, so it has to be rebuilt — and
    // the loaded song may no longer be on it.
    populateSongs();
    if ($('songSelect').value !== state.loadedValue) loadSelected();
    render();
  });

  $('songSelect').addEventListener('change', () => { stopPlayback(); loadSelected(); });
  $('toggle').addEventListener('click', () => (state.running ? stop() : start()));
  $('restart').addEventListener('click', restart);
  $('skip').addEventListener('click', () => { judgeWrong(); skipCurrent(); render(); });

  $('sensitivity').addEventListener('input', () => {
    state.accept = Number($('sensitivity').value) / 100;
    $('sensitivityValue').textContent = `${Math.round(state.accept * 100)}%`;
  });
  $('sensitivity').value = String(Math.round(DEFAULT_ACCEPT * 100));
  $('sensitivityValue').textContent = `${Math.round(DEFAULT_ACCEPT * 100)}%`;

  const tapper = createTapTempo();
  $('modeSelect').addEventListener('change', () => {
    state.timed = $('modeSelect').value === 'timed';
    $('timedControls').hidden = !state.timed;
    if (state.running) { stop().then(start); }
    render();
  });
  $('bpm').addEventListener('input', () => {
    state.bpm = Number($('bpm').value);
    $('bpmValue').textContent = `${state.bpm} BPM`;
    if (state.metronome) state.metronome.setBpm(state.bpm);
  });
  $('tapTempo').addEventListener('click', () => {
    const bpm = tapper.tap();
    if (!bpm) return;
    state.bpm = bpm;
    $('bpm').value = String(bpm);
    $('bpmValue').textContent = `${bpm} BPM`;
    if (state.metronome) state.metronome.setBpm(bpm);
  });
  $('beatsSource').addEventListener('change', () => {
    state.beatsSource = $('beatsSource').value;
    $('estimateWarning').hidden = state.beatsSource !== 'sheet';
    if (state.running) { stop().then(start); }
  });
  $('beatsPerChord').addEventListener('change', () => {
    state.beatsPerChord = Number($('beatsPerChord').value);
    if (state.running) { stop().then(start); }
  });
  $('metronome').addEventListener('change', () => {
    if (state.metronome) state.metronome.setMuted(!$('metronome').checked);
  });

  attachGainControl({
    slider: $('gain'),
    readout: $('gainValue'),
    onChange: (db) => {
      state.gainDb = db;
      if (state.detector) state.detector.setGainLinear(dbToLinear(db));
    },
  });

  window.addEventListener('languagechange', () => {
    populateSongs();
    applyTranslations();
    render();
  });

  applySourceVisibility();
  loadSelected();
  render();
}

function setSource(value) {
  state.source = value === 'midi' ? 'midi' : 'mic';
  $('source').value = state.source;
  state.midiMatch = null;
  state.heldName = null;
  state.held = [];
  state.lastHeldSig = '';
  applySourceVisibility();
  render();
}

/**
 * The microphone's controls — gain, level, sensitivity — describe a problem
 * MIDI does not have. Left on screen they invite fiddling with settings that
 * cannot affect anything.
 */
function applySourceVisibility() {
  const midi = state.source === 'midi';
  $('micOnly').hidden = midi;
  $('sensitivityMidiNote').hidden = !midi;
  $('midiDeviceRow').hidden = !midi;
  $('midiStatusRow').hidden = !midi;
  $('midiHowItWorks').hidden = !midi;
  // Sound output only belongs to the MIDI path: on the microphone path you are
  // already making the sound yourself, and playing it back would be an echo.
  // Sound is the instrument's, not the input path's: "Hear it" and "Play the
  // song" use it on the microphone path too.
  // Sound belongs to both instruments: hearing the chord you are about to
  // strum helps a guitarist exactly as much as it helps a pianist.
  $('soundControls').hidden = false;
  $('soundHint').hidden = false;
  $('playSongHint').hidden = false;
  $('sustainHint').hidden = false;
}


/**
 * The song picker, with saved songs grouped by their folder.
 *
 * Saved songs are filtered to the instrument in hand: a list mixing guitar and
 * piano arrangements makes you read every entry to find the ones you can
 * actually play, which is exactly what tagging them was for.
 */
function populateSongs() {
  const select = $('songSelect');
  const keep = select.value;
  select.innerHTML = '';

  const builtIn = document.createElement('optgroup');
  builtIn.label = t('songs.tabSongbook');
  for (const song of SONGBOOK) {
    builtIn.append(new Option(`${song.title} — ${song.chords.join(' ')}`, `book:${song.id}`));
  }
  select.append(builtIn);

  const mine = filterSongs(state.savedSongs || [], { instrument: getInstrument() });
  for (const { folder, songs } of groupByFolder(mine)) {
    const group = document.createElement('optgroup');
    group.label = folder ? folder.replace(/\//g, ' › ') : t('songs.mySongs');
    for (const saved of songs) {
      const stars = saved.difficulty ? ` ${'★'.repeat(saved.difficulty)}` : '';
      group.append(new Option(`${saved.name}${stars}`, `saved:${saved.id}`));
    }
    select.append(group);
  }

  // Only keep the previous selection if it is still on offer — switching
  // instrument can take the current song off the list entirely.
  if (keep && [...select.options].some((o) => o.value === keep)) select.value = keep;
}

async function loadSavedList() {
  state.savedSongs = await listSongs();
  populateSongs();
}

/** Pull the practice sequence out of whichever source was chosen. */
function loadSelected() {
  const value = $('songSelect').value || '';
  state.loadedValue = value;
  let chart = null;
  let title = '';

  if (value.startsWith('book:')) {
    const song = SONGBOOK.find((s) => s.id === value.slice(5));
    if (song) {
      title = song.title;
      chart = parseChordPro(song.chordpro);
    }
  } else if (value.startsWith('saved:')) {
    const saved = (state.savedSongs || []).find((s) => s.id === value.slice(6));
    if (saved) {
      title = saved.name;
      // A saved piano sheet is note-level, not chord-level, and practice mode
      // switches to matching notes rather than chord names.
      if (detectKeysheet(saved.text)) {
        const parsed = parseKeysheet(saved.text);
        if (parsed) return loadNoteSequence(parsed.steps, title);
      }
      const fmt = detectSheetFormat(saved.text);
      chart = fmt === 'chordpro' ? parseChordPro(saved.text)
        : fmt === 'over-lyrics' ? parseChordsOverLyrics(saved.text)
        : { chords: parseChordList(saved.text), lines: [] };
    }
  }

  // Leaving note mode restores the chord threshold, or a sheet practised after
  // a note sheet would silently inherit the stricter one.
  if (state.sequence) setAccept(DEFAULT_ACCEPT);
  state.sequence = null;
  const lines = (chart && chart.lines) || [];
  const german = chart ? usesGermanNotation(chart.chords) : false;
  const name = (c) => (german ? fromGermanChord(c) : c);

  // Keep each chord's position in the sheet alongside it, so practice mode can
  // show *where in the song* you are rather than only which chord comes next.
  const occurrences = [];
  lines.forEach((line, lineIndex) => {
    if (!line.segments) return;
    line.segments.forEach((seg, segIndex) => {
      if (seg.chord) occurrences.push({ chord: name(seg.chord), lineIndex, segIndex });
    });
  });
  // A bare chord list has no lyric lines to point at.
  if (!occurrences.length && chart) {
    chart.chords.forEach((c) => occurrences.push({ chord: name(c), lineIndex: -1, segIndex: -1 }));
  }

  // Collapse immediate repeats: strumming the same chord twice is one change.
  state.steps = occurrences.filter((o, i) => i === 0 || o.chord !== occurrences[i - 1].chord);
  state.chords = state.steps.map((s) => s.chord);
  state.lines = lines;
  state.title = title;
  restart();
}

/**
 * Practise a sheet written as notes rather than chord symbols.
 *
 * Chord practice asks "is this a G?" — a question about pitch classes, which is
 * all a strummed guitar can answer. A pasted piano sheet says exactly which
 * keys, in which octave, so the question becomes "are those the keys?" and the
 * answer can be exact. Repeats are *not* collapsed here: on a piano the same
 * note twice is two notes to play, not one shape held.
 */
function loadNoteSequence(steps, title) {
  state.sequence = steps.map((s) => ({ notes: [...s.notes].sort((a, b) => a - b) }));
  state.chords = [];
  state.steps = [];
  state.lines = [];
  state.title = title;
  setAccept(NOTE_ACCEPT);
  restart();
}

/* ---------------------------------------------------------------- playback */

/**
 * Milliseconds per event, from the speed slider.
 *
 * Read fresh on every event rather than captured once, so dragging the slider
 * mid-song takes effect on the next note instead of after a restart. Neither
 * notation carries durations, so this is a reading pace rather than a tempo —
 * the point is to hear how the piece goes and watch the keys, not to reproduce
 * a performance the sheet never described.
 */
function playbackGap() {
  const perMinute = Number($('playSpeed').value) || 145;
  return 60000 / perMinute;
}

function showPlaySpeed() {
  $('playSpeedValue').textContent = t('practice.perMinute', { n: $('playSpeed').value });
}

function startPlayback() {
  const synth = getSynth();
  synth.prime();
  if (!synth.enabled) {
    setStatus(t('practice.needsVoice'), 'bad');
    return;
  }
  if (!stepCount()) return;

  // Listening and playing at once makes no sense: on the microphone path the
  // app would hear itself, and on either path the practice loop would be
  // grading a performance nobody gave.
  if (state.running) stop();

  state.playback = { index: state.index, from: state.index, timer: null };
  setStatus(t('practice.playing'), 'busy');
  playNextEvent();
}

function playNextEvent() {
  const play = state.playback;
  if (!play) return;

  if (play.index >= stepCount()) { stopPlayback(); return; }

  state.index = play.index;
  render();

  const notes = noteMode()
    ? state.sequence[play.index].notes
    : (() => {
      const voicing = chordVoicing(state.chords[play.index]);
      if (!voicing) return [];
      return voicing.bass === null ? voicing.midis : [voicing.bass, ...voicing.midis];
    })();

  const gap = playbackGap();
  // Held just short of the gap, so repeated notes are audibly re-struck rather
  // than blurring into one long tone.
  if (notes.length) getSynth().playChord(notes, { hold: (gap / 1000) * 0.85 });

  play.index++;
  play.timer = setTimeout(playNextEvent, gap);
}

function stopPlayback() {
  const play = state.playback;
  if (!play) return;
  clearTimeout(play.timer);
  state.playback = null;
  getSynth().allOff();
  // Playback is a listen, not an attempt: put the practice position back where
  // it was so nobody loses their place by pressing play.
  state.index = play.from;
  setStatus('');
  render();
}

/** Move the sensitivity slider and the threshold together. */
function setAccept(value) {
  state.accept = value;
  $('sensitivity').value = String(Math.round(value * 100));
  $('sensitivityValue').textContent = `${Math.round(value * 100)}%`;
}

const noteMode = () => !!state.sequence;
/** How many things there are to play, whichever mode is running. */
const stepCount = () => (noteMode() ? state.sequence.length : state.chords.length);
const currentStep = () => (noteMode() ? state.sequence[state.index] : null);
const stepAt = (i) => (noteMode() ? state.sequence[i] : null);
const stepLabel = (step) => (step ? step.notes.map(midiToLabel).join(' ') : '');
/**
 * What the player is being asked for, as text. A chord name in chord mode, the
 * note names in note mode — everything downstream (results, feedback, the
 * trouble-spot tally) only ever needs the label, so this is the single seam
 * between the two modes.
 */
const labelAt = (i) => (noteMode() ? stepLabel(stepAt(i)) : state.chords[i]);
const expectedLabel = () => labelAt(state.index);

function restart() {
  stopPlayback();
  state.index = 0;
  state.results = [];
  state.timingResults = [];
  state.hitAtBeat = null;
  state.feedback = null;
  state.lastEnergy = 0;
  state.armedAt = performance.now();
  state.pendingAt = 0;
  render();
}

/* ---------------------------------------------------------------- listening */

async function start() {
  stopPlayback();
  await stop();
  const started = state.source === 'midi' ? await openMidi() : await openMic();
  if (!started) return;

  state.running = true;
  state.armedAt = performance.now();

  if (state.timed) {
    buildTiming();
    state.hitAtBeat = null;
    state.timingResults = [];
    state.metronome = createMetronome(state.ctx, { beatsPerBar: 4 });
    state.metronome.setMuted($('metronome') && !$('metronome').checked);
    state.metronome.start(state.bpm);
    // One free bar before the first chord is due.
    state.zeroTime = state.ctx.currentTime + 0.1 + (60 / state.bpm) * 4;
    setStatus(t('practice.countIn'), 'busy');
  } else {
    setStatus(t(noteMode() ? 'practice.listeningNotes' : 'practice.listening'), 'good');
  }

  $('toggle').textContent = t('practice.stop');
  $('toggle').classList.add('running');
  loop();
}

async function openMic() {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false, noiseSuppression: false,
        autoGainControl: false, channelCount: 1,
      },
    });
  } catch (err) {
    setStatus(`${t('tuner.blocked')} (${err.name})`, 'bad');
    return false;
  }

  const config = instrumentConfig();
  state.stream = stream;
  state.ctx = new AudioContext({ latencyHint: 'interactive' });
  const source = state.ctx.createMediaStreamSource(stream);
  state.detector = createChordDetector(state.ctx, source, {
    gainLinear: dbToLinear(state.gainDb || 0),
    audio: config.audio,
    chroma: config.chroma,
  });
  return true;
}

async function openMidi() {
  if (!midiSupported()) {
    setStatus(t('common.midiUnsupported'), 'bad');
    return false;
  }
  const input = createMidiInput();
  try {
    await input.enable();
  } catch (err) {
    setStatus(`${t('common.midiBlocked')} (${err.name})`, 'bad');
    return false;
  }

  state.midi = input;
  input.onDevices(() => populateMidiDevices());
  populateMidiDevices();

  // Make the keyboard audible. A MIDI controller has no sound of its own, so
  // without this the whole page is silent. Because `midi.js` already withholds
  // a note-off until the sustain pedal rises, the pedal works here for free.
  const synth = getSynth();
  synth.prime();
  input.onNote((event) => {
    if (event.type === 'on') synth.noteOn(event.midi, event.velocity);
    else if (event.type === 'off') synth.noteOff(event.midi);
    else if (event.type === 'reset') synth.allOff();
  });

  // The metronome still needs an audio clock even when no audio comes in, and
  // timed mode scores against `ctx.currentTime`.
  state.ctx = new AudioContext({ latencyHint: 'interactive' });
  return true;
}

function populateMidiDevices() {
  const devices = state.midi ? state.midi.devices() : [];
  const select = $('midiDevice');
  const keep = select.value;
  select.innerHTML = '';
  select.append(new Option(t('common.inputMidi'), 'all'));
  for (const d of devices) select.append(new Option(d.name, d.id));
  select.value = [...select.options].some((o) => o.value === keep) ? keep : 'all';
  select.disabled = devices.length === 0;
}

async function stop() {
  state.running = false;
  if (state.raf) cancelAnimationFrame(state.raf);
  state.raf = null;
  if (state.metronome) { state.metronome.stop(); state.metronome = null; }
  if (state.detector) { state.detector.disconnect(); state.detector = null; }
  if (state.stream) { state.stream.getTracks().forEach((tr) => tr.stop()); state.stream = null; }
  if (state.midi) { state.midi.close(); state.midi = null; getSynth().allOff(); }
  if (state.ctx) { await state.ctx.close(); state.ctx = null; }
  state.held = [];
  state.midiMatch = null;
  state.heldName = null;
  $('toggle').textContent = t('practice.start');
  $('toggle').classList.remove('running');
}

const holdMs = () => (state.source === 'midi' ? MIDI_HOLD_MS : HOLD_MS);
const rearmMs = () => (state.source === 'midi' ? MIDI_REARM_MS : REARM_MS);

/**
 * One frame of the microphone path: score the spectrum against the target.
 * Returns whether the chord counts as played right now.
 */
function pollMic(expected) {
  const reading = state.detector.read();
  state.live = reading;
  const loud = reading.rms >= RMS_FLOOR;

  if (noteMode()) {
    const step = currentStep();
    // No chord template to compare against — the notes may not spell a named
    // chord at all — so the template is built from the step's own pitches.
    const score = step && loud ? scoreAgainstNotes(reading.chroma, step.notes) : 0;
    state.liveScore = score;
    if (score > state.bestSeen) state.bestSeen = score;
    return score >= state.accept;
  }

  const self = expected && loud ? scoreAgainst(reading.chroma, expected) : null;
  state.liveScore = self ? self.score : 0;
  if (self && self.score > state.bestSeen) state.bestSeen = self.score;
  return !!(self && self.score >= state.accept);
}

/**
 * Compare held keys against an exact set of notes.
 *
 * Octave matters here, unlike chord practice: the sheet names the key, the app
 * draws that key, so playing the right notes an octave out is a different thing
 * from playing them where they are written.
 */
function matchNotes(held, target) {
  const down = new Set(held);
  const want = new Set(target);
  const missing = target.filter((m) => !down.has(m));
  const extra = held.filter((m) => !want.has(m));
  return {
    ok: !missing.length && !extra.length,
    missing,
    extra,
    score: Math.max(0, Math.min(1,
      (want.size - missing.length) / want.size - extra.length * 0.3)),
  };
}

/**
 * One frame of the MIDI path. There is no threshold here and no `accept`
 * slider: the notes are known exactly, so the chord is either the one asked
 * for or it is not — and when it is not, we can say precisely why.
 */
function pollMidi(expected) {
  const held = state.midi ? state.midi.held() : [];
  state.held = held;

  if (noteMode()) {
    const step = currentStep();
    const match = step ? matchNotes(held, step.notes) : null;
    state.midiMatch = match && {
      ...match,
      missing: match.missing.map(midiToLabel),
      extra: match.extra.map(midiToLabel),
    };
    state.liveScore = match ? match.score : 0;
    state.heldName = held.length ? held.map(midiToLabel).join(' ') : null;
    return !!(match && match.ok);
  }

  const match = expected ? matchHeld(held, expected) : null;
  state.midiMatch = match;
  state.liveScore = match ? match.score : 0;

  // Name what is being held with the same template matcher the microphone uses.
  // Two notes are not a chord, so below three the note names are the honest
  // answer rather than a guess at what they might be part of.
  state.heldName = held.length >= 3
    ? matchChord(chromaFromNotes(held, heldChroma)).best.name
    : null;

  return !!(match && match.ok);
}

function loop() {
  if (!state.running) return;
  state.raf = requestAnimationFrame(loop);

  const now = performance.now();
  const expected = expectedLabel();
  const correct = state.source === 'midi' ? pollMidi(expected) : pollMic(expected);

  if (state.timed) {
    runTimed(expected, correct);
    renderLive();
    return;
  }

  // Accept a target that has matched continuously for long enough. This
  // replaces onset detection, which could not survive the analyser's own time
  // smoothing: strum, arpeggiate or just hold it — all work.
  if (expected && correct && now - state.armedAt > rearmMs()) {
    if (!state.matchingSince) state.matchingSince = now;
    if (now - state.matchingSince >= holdMs()) {
      state.matchingSince = 0;
      state.armedAt = now;
      state.feedback = { ok: true, expected, played: expected, score: state.liveScore };
      state.bestSeen = 0;
      advance(true, expected);
      // Full redraw: the target changed, so the chord, diagram, fret list,
      // next-up panel, position and progress all need updating. renderLive()
      // below only refreshes the meters.
      render();
    }
  } else {
    state.matchingSince = 0;
  }

  renderLive();
}

/**
 * Timed mode: the song advances on the clock whether or not you keep up, and
 * each chord is judged on whether it was right *and* when it arrived.
 */
function runTimed(expected, correct) {
  const beat = (state.ctx.currentTime - state.zeroTime) / (60 / state.bpm);

  if (beat < 0) {
    setStatus(t('practice.countIn'), 'busy');
    return;
  }

  // Note the first moment the correct chord sounds inside this window.
  if (expected && correct && state.hitAtBeat === null) {
    state.hitAtBeat = beat;
  }

  const window = state.schedule[state.index];
  if (!window) return;

  if (beat >= window.endBeat) {
    // Score the window that just closed, then move on regardless.
    const offset = state.hitAtBeat === null ? null : state.hitAtBeat - window.startBeat;
    const verdict = offset === null ? 'missed' : rateTiming(offset);
    state.timingResults.push(verdict);
    state.results.push({ expected, played: verdict === 'missed' ? null : expected,
                         ok: verdict !== 'missed' });
    state.feedback = { timing: verdict, expected, ok: verdict !== 'missed' };

    state.hitAtBeat = null;
    state.index++;
    if (state.index >= stepCount()) {
      setStatus(t('practice.finished'), 'good');
      stop();
    }
    render();
  }
}

/** Beats remaining in the current window, for the countdown readout. */
function beatsLeftInWindow() {
  if (!state.timed || !state.ctx) return null;
  const window = state.schedule[state.index];
  if (!window) return null;
  const beat = (state.ctx.currentTime - state.zeroTime) / (60 / state.bpm);
  return Math.max(0, window.endBeat - beat);
}

/** Work out how long each chord lasts, from the sheet or from a fixed value. */
function buildTiming() {
  const beats = state.beatsSource === 'sheet' && state.lines && state.lines.length
    ? estimateBeats(state.steps || [], state.lines, state.beatsPerChord)
    : fixedBeats(state.steps || state.chords, state.beatsPerChord);
  state.schedule = buildSchedule(beats);
}

/** Mark the current target wrong and say what was played instead. */
function judgeWrong() {
  const expected = expectedLabel();
  if (!expected) return;

  if (state.source === 'midi') {
    const match = state.midiMatch;
    state.feedback = {
      ok: false, expected, played: state.heldName,
      score: match ? match.score : 0, detail: match,
    };
    state.results.push({ expected, played: state.heldName, ok: false });
    render();
    return;
  }

  if (!state.live) return;
  const self = scoreAgainst(state.live.chroma, expected);
  const played = state.live.best ? state.live.best.name : null;
  state.feedback = { ok: false, expected, played, score: self ? self.score : 0 };
  state.results.push({ expected, played, ok: false });
  render();
}

/** Record an attempt. A wrong chord stays on the same target to try again. */
function advance(ok, played) {
  state.results.push({ expected: expectedLabel(), played, ok });
  if (ok) step();
}

/** Move past the current chord whether or not it was played correctly. */
function skipCurrent() {
  if (state.index >= stepCount()) return;
  state.results.push({ expected: expectedLabel(), played: null, ok: false });
  state.feedback = null;
  step();
}

function step() {
  state.index = Math.min(state.index + 1, stepCount());
  state.armedAt = performance.now();
  if (state.index >= stepCount()) setStatus(t('practice.finished'), 'good');
}

/* ---------------------------------------------------------------- rendering */

/** Per-frame readout: how loud, what it hears, how close to the target. */
function renderLive() {
  if (state.source === 'midi') {
    renderLiveMidi();
    return;
  }

  const r = state.live;
  if (!r) return;

  const loud = r.rms >= RMS_FLOOR;
  // Decibels, not raw amplitude: a quiet input barely moves a linear meter,
  // which makes "is it hearing me at all?" impossible to answer by looking.
  const db = r.rms > 0 ? 20 * Math.log10(r.rms) : -100;
  $('levelBar').style.width = `${Math.max(0, Math.min(100, ((db + 60) / 60) * 100))}%`;
  $('levelValue').textContent = db > -99 ? `${db.toFixed(0)} dBFS` : '—';
  // Gain is applied before this measurement, so clipping here means the gain
  // is too high, not the microphone.
  $('clipWarning').hidden = (r.peak || 0) < 0.98;

  const pct = Math.round(state.liveScore * 100);
  $('matchBar').style.width = `${Math.min(100, pct)}%`;
  $('matchBar').style.background =
    state.liveScore >= state.accept ? 'var(--good)' : 'var(--warn)';
  $('matchValue').textContent = loud ? `${pct}%` : '—';

  $('heardNow').textContent = !loud
    ? t('practice.tooQuiet')
    : (r.best ? r.best.name : '—');
  $('heardNow').className = loud && state.liveScore >= state.accept
    ? 'heard good' : 'heard';

  $('acceptMark').style.left = `${Math.round(state.accept * 100)}%`;
}

/**
 * The MIDI readout. Where the microphone can only report a percentage, this can
 * name the notes under your fingers — and, more usefully, redraw the target
 * chord with the notes you already have marked off, so a half-formed chord
 * shows you what is left rather than a number that has stopped rising.
 */
function renderLiveMidi() {
  const held = state.held;
  const match = state.midiMatch;

  $('heardNow').textContent = held.length
    ? (state.heldName || held.map((m) => keyName(m)).join(' '))
    : t('common.nothingHeld');
  $('heardNow').className = match && match.ok ? 'heard good' : 'heard';

  const pct = Math.round(state.liveScore * 100);
  $('matchBar').style.width = `${Math.min(100, pct)}%`;
  $('matchBar').style.background = match && match.ok ? 'var(--good)' : 'var(--warn)';
  $('matchValue').textContent = held.length ? `${pct}%` : '—';
  // The acceptance mark belongs to the microphone's sliding threshold. With
  // exact notes there is no threshold, so it sits at the top: all or nothing.
  $('acceptMark').style.left = '100%';

  const devices = state.midi ? state.midi.devices() : [];
  $('midiDot').className = `dot ${devices.length ? 'live' : 'off'}`;
  $('midiStatusText').textContent = devices.length
    ? devices.map((d) => d.name).join(', ')
    : t('common.midiNoDevice');
  const pedal = state.midi && state.midi.pedalDown;
  $('pedalFlag').textContent = pedal ? `${t('common.sustain')}: ${t('common.sustainDown')}` : '';
  $('pedalFlag').className = `pedal-flag${pedal ? ' down' : ''}`;

  const signature = held.join(',');
  if (signature !== state.lastHeldSig) {
    state.lastHeldSig = signature;
    renderCurrentDiagram();
  }
}

/**
 * The line of the song you are currently on, with the active chord marked.
 *
 * Chord sheets read left to right across a whole line before dropping to the
 * next, which is easy to mistake for a column when several chords sit above
 * one line of words. Showing the line makes the position unambiguous.
 */
function renderContext() {
  const step = !noteMode() && state.steps && state.steps[state.index];
  const box = $('context');
  if (!step || step.lineIndex < 0 || !state.lines[step.lineIndex]) {
    box.innerHTML = '';
    box.hidden = true;
    return;
  }
  box.hidden = false;

  const line = state.lines[step.lineIndex];
  const segs = (line.segments || []).map((seg, i) => {
    const active = i === step.segIndex;
    const chord = seg.chord
      ? `<span class="cc${active ? ' now' : ''}">${esc(seg.chord)}</span>`
      : '<span class="cc"></span>';
    return `<span class="cseg${active ? ' now' : ''}">${chord}<span class="ct">${esc(seg.text)}</span></span>`;
  }).join('');

  // How far along this line's chords the current one is, spelled out, because
  // "3rd of 3 on this line" is the fact that resolves the confusion.
  const onLine = (line.segments || []).filter((s) => s.chord);
  const position = onLine.findIndex((s, i) =>
    (line.segments || []).indexOf(s) === step.segIndex);
  const counter = onLine.length > 1
    ? `<div class="cmeta">${t('practice.chordOnLine', {
        n: position + 1, total: onLine.length,
        names: onLine.map((s) => esc(s.chord)).join(' → '),
      })}</div>`
    : '';

  box.innerHTML = `<div class="cline">${segs}</div>${counter}`;
}

/**
 * Where a step's notes fall on a guitar neck.
 *
 * The same pitch exists in up to five places, so strings are claimed lowest
 * fret first and no two notes of a step share one — a string can only sound one
 * note at a time, and quietly showing two on it would be a lie.
 */
function guitarPositionsFor(step) {
  const used = new Set();
  return step.notes.map((midi) => {
    const pick = fretPositions(midi).find((p) => !used.has(p.string)) || null;
    if (pick) used.add(pick.string);
    return { midi, pos: pick };
  });
}

/**
 * One step of a note sheet as a tab column — the guitar's own way of saying
 * "press here", and the counterpart of the keyboard drawn for a piano.
 */
function renderStepTab(step, { width = 150, live = false } = {}) {
  if (!step) return '';
  const GAP = 15;
  const TOP = 10;
  const placed = guitarPositionsFor(step);
  const byString = new Map(placed.filter((p) => p.pos).map((p) => [p.pos.string, p]));
  const labels = ['e', 'B', 'G', 'D', 'A', 'E'];

  // Only relevant on the microphone path — a guitar has no MIDI here — but the
  // pitch classes being heard still tell you which notes are landing.
  const heardPcs = live && state.live && state.live.chroma
    ? new Set(step.notes
      .filter((m) => state.live.chroma[((m % 12) + 12) % 12] > 0.12)
      .map((m) => ((m % 12) + 12) % 12))
    : new Set();

  const height = TOP + 5 * GAP + 22;
  let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
    xmlns="http://www.w3.org/2000/svg" font-family="ui-monospace, Consolas, monospace">`;

  for (let i = 0; i < 6; i++) {
    const y = TOP + i * GAP;
    const string = 6 - i;               // top line is string 1, the thinnest
    svg += `<line x1="26" y1="${y}" x2="${width - 10}" y2="${y}"
      stroke="#2a323e" stroke-width="1"/>`;
    svg += `<text x="18" y="${y + 3.5}" fill="#8b98a9" font-size="10"
      text-anchor="end">${labels[i]}</text>`;

    const entry = byString.get(string);
    const cx = (26 + width - 10) / 2;
    if (!entry) {
      svg += `<text x="${cx}" y="${y + 4}" fill="#3d4757" font-size="11"
        text-anchor="middle">×</text>`;
      continue;
    }
    const hit = heardPcs.has(((entry.midi % 12) + 12) % 12);
    svg += `<rect x="${cx - 11}" y="${y - 8}" width="22" height="16" rx="3"
      fill="${hit ? '#3fb950' : '#58a6ff'}"/>`;
    svg += `<text x="${cx}" y="${y + 4}" fill="#04121f" font-size="11"
      font-weight="700" text-anchor="middle">${entry.pos.fret}</text>`;
  }

  const unplayable = placed.filter((p) => !p.pos).length;
  if (unplayable) {
    svg += `<text x="${width / 2}" y="${height - 5}" fill="#d29922" font-size="9"
      text-anchor="middle">${esc(t('practice.notOnGuitar', { n: unplayable }))}</text>`;
  }
  return `${svg}</svg>`;
}

/**
 * One step of a note sheet, drawn on a keyboard.
 *
 * On the MIDI path the held keys are folded in, exactly as for chords: notes
 * already down go green, the rest stay blue, and anything held that is not part
 * of this step shows red where it was actually played.
 */
function renderStepKeyboard(step, { width = 240, height = 56, live = false } = {}) {
  if (!step) return '';
  const marks = step.notes.map((midi) => ({ midi, kind: 'target' }));

  if (live && state.source === 'midi' && state.running) {
    const wanted = new Set(step.notes);
    const down = new Set(state.held);
    for (const mark of marks) if (down.has(mark.midi)) mark.kind = 'played';
    for (const midi of state.held) {
      if (!wanted.has(midi)) marks.push({ midi, kind: 'wrong' });
    }
  }

  const window = keyboardWindow(marks.map((m) => m.midi), { minOctaves: 2 });
  return renderKeyboard({ ...window, marks, width, whiteHeight: height });
}

/**
 * What to press, written out — the thing the diagram shows pictorially.
 * `index` selects the step in note mode, where the label alone is not enough
 * to recover which notes were meant.
 */
function renderFrets(chord, index) {
  if (noteMode()) return renderStepNotes(stepAt(index));
  if (isTined()) return renderTinedChordNotes(chord);
  if (isPiano()) return renderChordNotes(chord);

  const shape = lookupShape(chord);
  if (!shape) return `<span class="muted">${t('practice.noShape')}</span>`;

  // shape.frets is low-E-first; show it thickest string to thinnest.
  return shape.frets.map((fret, i) => {
    const string = 6 - i;
    const label = fret === -1 ? `<span class="x">×</span>`
      : fret === 0 ? `<b class="open">${t('common.open')}</b>`
      : `<b>${t('common.fret')} ${fret}</b>`;
    return `<div class="fret-row"><span class="s">${t('common.string')} ${string}</span>${label}</div>`;
  }).join('');
}

/**
 * The step's notes written out. No fingering: a sheet does not carry one.
 * On a guitar each note gains the string and fret it lands on, since the note
 * name alone does not tell a guitarist where to put a finger.
 */
function renderStepNotes(step) {
  if (!step) return '';
  if (isTined()) {
    const layout = layoutFor();
    return `<div class="note-list">${step.notes.map((midi) => {
      const index = indexOfMidi(layout, midi);
      const where = index >= 0
        ? `${t('common.string')} ${numberOf(layout, index)}`
        : t('tines.notHere');
      return `<span class="note-pill${index >= 0 ? '' : ' off'}"><b>${esc(midiToLabel(midi))}</b>
        <span class="fg">${esc(where)}</span></span>`;
    }).join('')}</div>`;
  }
  if (isPiano()) {
    return `<div class="note-list">${step.notes
      .map((midi) => `<span class="note-pill"><b>${esc(midiToLabel(midi))}</b></span>`)
      .join('')}</div>`;
  }
  return `<div class="note-list">${guitarPositionsFor(step).map(({ midi, pos }) => {
    const where = pos
      ? `${t('common.string')} ${pos.string} · ${pos.fret === 0
        ? t('common.open') : `${t('common.fret')} ${pos.fret}`}`
      : t('practice.outOfRange');
    return `<span class="note-pill${pos ? '' : ' off'}"><b>${esc(midiToLabel(midi))}</b>
      <span class="fg">${esc(where)}</span></span>`;
  }).join('')}</div>`;
}

/**
 * The chord written out as strings to pluck.
 *
 * Ends with the notes the instrument has not got, when there are any. A lyre
 * shown a D major has an A and a D on it and no F♯ at all, and drawing the two
 * it has without saying so would be showing someone a chord that is not the
 * chord — the one failure mode this whole family has and the other two do not.
 */
function renderTinedChordNotes(chord) {
  const layout = layoutFor();
  const voiced = chordTines(layout, chord);
  if (!voiced) return `<span class="muted">${t('practice.noShape')}</span>`;

  const pills = voiced.indices.map((index) =>
    `<span class="note-pill"><b>${esc(midiLabel(layout.midis[index]))}</b>
      <span class="fg">${t('common.string')} ${numberOf(layout, index)}</span></span>`);
  if (voiced.missing.length) {
    pills.push(`<span class="note-pill off"><b>${esc(voiced.missing.join(' '))}</b>
      <span class="fg">${esc(t('tines.notHere'))}</span></span>`);
  }
  return `<div class="note-list">${pills.join('')}</div>`;
}

/** One step of a note sheet, drawn on the instrument. */
function renderStepTines(step, { width = 250 } = {}) {
  if (!step) return '';
  const layout = layoutFor();
  const marks = [];
  let absent = 0;
  step.notes.forEach((midi, i) => {
    const index = indexOfMidi(layout, midi);
    if (index < 0) { absent++; return; }
    marks.push({ index, kind: 'target', label: String(i + 1) });
  });

  const svg = renderTines(layout, { width, marks, height: 108 });
  if (!absent) return svg;
  return `${svg}<div class="tine-missing">${esc(t('practice.notHere', { n: absent }))}</div>`;
}

/** The chord written out as notes and fingers — the piano equivalent of a grip. */
function renderChordNotes(chord) {
  const voicing = chordVoicing(chord);
  if (!voicing) return `<span class="muted">${t('practice.noShape')}</span>`;

  const pills = voicing.midis.map((midi, i) =>
    `<span class="note-pill"><b>${esc(keyName(midi))}</b><span class="fg">${
      voicing.fingers[i] ?? ''}</span></span>`);
  if (voicing.bass !== null) {
    pills.unshift(`<span class="note-pill bass"><b>${esc(keyName(voicing.bass))}</b>
      <span class="fg">${t('piano.leftHand')}</span></span>`);
  }
  return `<div class="note-list">${pills.join('')}</div>`;
}

/**
 * The target chord as a keyboard.
 *
 * On the MIDI path the held keys are folded in: notes you already have go
 * green, notes still missing stay blue, and anything held that does not belong
 * shows red. That turns the diagram from a picture of the answer into a live
 * checklist, which is the thing exact note data buys that audio cannot.
 */
function renderCurrentDiagram() {
  const host = $('currentDiagram');

  // A note sheet is the same music whichever instrument is selected, but it is
  // shown in that instrument's own notation: keys for a piano, a tab column for
  // a guitar. Neither reader should have to translate the other's picture.
  if (noteMode()) {
    host.innerHTML = isPiano()
      ? renderStepKeyboard(currentStep(), { width: 260, height: 60, live: true })
      : isTined()
        ? renderStepTines(currentStep(), { width: 250 })
        : renderStepTab(currentStep(), { width: 150, live: true });
    return;
  }

  const chord = state.chords[state.index];
  if (!chord) { host.innerHTML = ''; return; }

  if (isTined()) {
    host.innerHTML = renderChordTines(layoutFor(), chord, {
      width: 250, height: 118, caption: chord, unknownLabel: t('practice.noShape'),
    });
    return;
  }

  if (!isPiano()) {
    host.innerHTML = renderChordDiagram(esc(chord), lookupShape(chord), { width: 128 });
    return;
  }

  const voicing = chordVoicing(chord);
  if (!voicing) {
    host.innerHTML = renderChordKeyboard(chord, {
      width: 240, unknownLabel: t('practice.noShape'),
    });
    return;
  }

  if (state.source !== 'midi' || !state.running) {
    host.innerHTML = renderChordKeyboard(chord, { width: 240, caption: chord });
    return;
  }

  const heldPcs = new Set(state.held.map((m) => ((m % 12) + 12) % 12));
  const chordPcs = new Set(voicing.pitchClasses);

  const marks = voicing.midis.map((midi, i) => ({
    midi,
    kind: heldPcs.has(((midi % 12) + 12) % 12) ? 'played' : 'target',
    finger: voicing.fingers[i],
  }));
  if (voicing.bass !== null) {
    marks.push({
      midi: voicing.bass,
      kind: heldPcs.has(((voicing.bass % 12) + 12) % 12) ? 'played' : 'bass',
      finger: 5,
    });
  }
  // Wrong notes are shown where they were actually played, not folded into the
  // voicing's octave: "that key, the one under your finger" is the useful fact.
  for (const midi of state.held) {
    if (!chordPcs.has(((midi % 12) + 12) % 12)) marks.push({ midi, kind: 'wrong' });
  }

  const window = keyboardWindow(marks.map((m) => m.midi), { minOctaves: 2 });
  host.innerHTML = renderKeyboard({
    ...window, marks, width: 240, whiteHeight: 56, caption: chord,
  });
}

function setStatus(text, kind = '') {
  $('status').textContent = text;
  $('status').className = `status ${kind}`;
}

function render() {
  applyTranslations();

  const total = stepCount();
  const done = Math.min(state.index, total);
  $('progressBar').style.width = total ? `${(done / total) * 100}%` : '0%';
  $('progressText').textContent = `${done} / ${total}`;

  const expected = expectedLabel();
  const next = labelAt(state.index + 1);
  const later = Array.from({ length: 4 }, (_, i) => labelAt(state.index + 2 + i))
    .filter(Boolean);

  // Note names run long — "C3 E4 G4" against a chord's "Am" — so the huge chord
  // display is stepped down rather than allowed to wrap across the stage.
  $('currentChord').classList.toggle('notes', noteMode());
  $('noteModeNote').hidden = !noteMode();
  // A note sheet carries no fingering and no separated bass, so the key to
  // reading finger numbers and purple keys would be explaining a picture that
  // is not on screen.
  $('fingerHelp').hidden = noteMode();
  // Set after applyTranslations(), which would otherwise reset the label from
  // its data-i18n attribute the moment playback redraws a step.
  $('playSong').textContent = t(state.playback ? 'practice.stopPlaying' : 'practice.playSong');
  $('playSong').classList.toggle('on', !!state.playback);
  if (noteMode()) $('practiceSub').textContent = t('practice.subNotes');

  if (!expected) {
    $('currentChord').textContent = '✓';
    $('currentDiagram').innerHTML = '';
    $('fretList').innerHTML = '';
    $('nextPanel').hidden = true;
    $('laterChords').innerHTML = '';
  } else {
    $('currentChord').textContent = expected;
    renderCurrentDiagram();
    $('fretList').innerHTML = renderFrets(expected, state.index);

    // Show the next grip in full, not just its name: the change is the hard
    // part, and you cannot prepare a shape you have not seen yet.
    $('nextPanel').hidden = !next;
    if (next) {
      $('nextChord').textContent = next;
      $('nextChord').classList.toggle('notes', noteMode());
      $('nextDiagram').innerHTML = noteMode()
        ? (isPiano()
          ? renderStepKeyboard(stepAt(state.index + 1), { width: 172, height: 42 })
          : isTined()
            ? renderStepTines(stepAt(state.index + 1), { width: 176 })
            : renderStepTab(stepAt(state.index + 1), { width: 118 }))
        : isPiano()
          ? renderChordKeyboard(next, { width: 172, whiteHeight: 42, caption: next })
          : isTined()
            ? renderChordTines(layoutFor(), next, {
              width: 176, height: 88, caption: next, showOrder: false,
            })
            : renderChordDiagram(esc(next), lookupShape(next), { width: 96 });
      $('nextFretList').innerHTML = renderFrets(next, state.index + 1);
    }

    $('laterChords').innerHTML = later.length
      ? later.map((c) => `<span class="chip"><b>${esc(c)}</b></span>`).join('')
      : '';
  }
  renderContext();

  const fb = state.feedback;
  const box = $('feedback');
  if (!fb) {
    box.className = 'feedback';
    box.innerHTML = `<span class="muted">${t('practice.waiting')}</span>`;
  } else if (fb.timing) {
    // Timed mode judges when as well as what.
    const good = fb.timing === 'onTime';
    box.className = `feedback ${good ? 'ok' : fb.timing === 'missed' ? 'bad' : 'warn'}`;
    box.innerHTML = `<b>${t(`practice.${fb.timing}`)}</b> <span class="muted">${esc(fb.expected)}</span>`
      + (fb.timing === 'missed' ? `<div class="fix">${t('practice.hintGeneric')}</div>` : '');
  } else if (fb.ok) {
    box.className = 'feedback ok';
    box.innerHTML = `<b>${t('practice.correct')}</b> <span class="muted">${esc(fb.expected)} · ${Math.round(fb.score * 100)}%</span>`;
  } else {
    box.className = 'feedback bad';
    // With exact notes we can say what is missing rather than what it sounded
    // like — a much more actionable sentence, and never a guess.
    const detail = fb.detail && (fb.detail.missing.length || fb.detail.extra.length)
      ? [
          fb.detail.missing.length
            ? t('piano.missing', { notes: esc(fb.detail.missing.join(' ')) }) : null,
          fb.detail.extra.length
            ? t('piano.extra', { notes: esc(fb.detail.extra.join(' ')) }) : null,
        ].filter(Boolean).join(' · ')
      : fb.played
        ? t('practice.heard', { played: esc(fb.played) })
        : '';
    box.innerHTML =
      `<b>${t('practice.wrong', { expected: esc(fb.expected) })}</b>
       <span class="muted">${detail}</span>
       <div class="fix">${fixHint(fb.expected, fb.played, fb.detail)}</div>`;
  }

  const attempts = state.results.length;
  const good = state.results.filter((r) => r.ok).length;
  $('accuracy').textContent = attempts ? `${Math.round((good / attempts) * 100)}%` : '—';
  $('attempts').textContent = String(attempts);

  // In timed mode, being on the beat is a separate score from being right.
  const timed = state.timingResults.length;
  $('timingStat').hidden = !state.timed;
  if (timed) {
    const onTime = state.timingResults.filter((v) => v === 'onTime').length;
    $('timingValue').textContent = `${Math.round((onTime / timed) * 100)}%`;
  } else {
    $('timingValue').textContent = '—';
  }

  // Which changes keep going wrong — the genuinely useful statistic.
  const misses = new Map();
  state.results.forEach((r) => {
    if (r.ok) return;
    misses.set(r.expected, (misses.get(r.expected) || 0) + 1);
  });
  const worst = [...misses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  $('troubleSpots').innerHTML = worst.length
    ? worst.map(([c, n]) => `<span class="chip"><b>${esc(c)}</b> ×${n}</span>`).join('')
    : `<span class="muted">${t('practice.noTrouble')}</span>`;
}

/** A concrete thing to try, rather than just "wrong". */
function fixHint(expected, played, detail) {
  // Exact notes give an exact instruction, so nothing else is worth saying.
  if (detail) {
    const missing = esc(detail.missing.join(' '));
    const extra = esc(detail.extra.join(' '));
    if (detail.missing.length && detail.extra.length) {
      return t('piano.hintBoth', { missing, extra });
    }
    if (detail.missing.length) return t('piano.hintMissing', { notes: missing });
    if (detail.extra.length) return t('piano.hintExtra', { notes: extra });
  }

  // A note sheet names the octave, so "right notes, wrong octave" is a real and
  // common mistake — and a much more useful thing to be told than "wrong".
  if (noteMode()) {
    const step = currentStep();
    if (step && state.held.length) {
      const wantPcs = new Set(step.notes.map((m) => ((m % 12) + 12) % 12));
      const heldPcs = new Set(state.held.map((m) => ((m % 12) + 12) % 12));
      const samePitchClasses = wantPcs.size === heldPcs.size
        && [...wantPcs].every((pc) => heldPcs.has(pc));
      if (samePitchClasses) return t('practice.hintOctave');
    }
    return t('practice.hintNotes');
  }

  // On a diatonic instrument the first question is not how you played it but
  // whether it is there at all, and no amount of technique advice helps with a
  // chord the instrument does not contain.
  if (isTined()) {
    const voiced = chordTines(layoutFor(), expected);
    if (voiced && voiced.missing.length) {
      return t('practice.hintImpossible', { notes: esc(voiced.missing.join(' ')) });
    }
    if (played && sameChord(expected.replace(/m$/, ''), played.replace(/m$/, ''))) {
      return t('practice.hintMajorMinor');
    }
    return t(played ? 'practice.hintPress' : 'practice.hintGeneric');
  }

  if (isPiano()) {
    if (played && sameChord(expected.replace(/m$/, ''), played.replace(/m$/, ''))) {
      return t('practice.hintMajorMinor');
    }
    return t(played ? 'practice.hintPress' : 'practice.hintGeneric');
  }

  const shape = lookupShape(expected);
  if (!shape) return t('practice.hintGeneric');
  if (!played) return t('practice.hintGeneric');

  const muted = shape.frets.filter((f) => f === -1).length;
  if (sameChord(expected.replace(/m$/, ''), played.replace(/m$/, ''))) {
    return t('practice.hintMajorMinor');
  }
  if (shape.barre) return t('practice.hintBarre');
  if (muted) return t('practice.hintMuted', { n: muted });
  return t('practice.hintPress');
}

init();
loadSavedList();
