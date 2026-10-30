import {
  describeFrequency,
  fretPositions,
  nearestString,
  midiToFreq,
  STANDARD_TUNING,
} from './notes.js';
import { t, initLanguageSwitch } from './i18n.js';
import { attachGainControl, dbToLinear } from './gain.js';
import { initInstrumentSwitch, instrumentConfig, isPiano, isTined } from './instrument.js';
import {
  renderKeyboard, keyLabel, keyName, relativeToMiddleC,
  describeKeyPosition, describeKeyColour, LOWEST_KEY, HIGHEST_KEY,
} from './piano.js';
import {
  layoutFor, renderTines, nearestTine, indexOfMidi, numberOf, describeTine,
  tineNumberLabel, midiLabel,
} from './tines.js';
import { createMidiInput, midiSupported } from './midi.js';
import { getSynth, attachSoundControls } from './synth.js';

// Frame size, filter corners and search range all come from the instrument now:
// every one of them was measured against a guitar, and a piano reaches an
// octave below and two above it. See INSTRUMENTS in instrument.js.
const STABLE_HITS = 2;     // agreeing frames before the displayed note changes
const CLARITY_FLOOR = 0.7; // below this a reading is treated as noise
const HISTORY_LEN = 40;
/** Beyond this a piano note is out of tune rather than merely stretched. */
const PIANO_TOLERANCE_CENTS = 12;

const els = {};
const state = {
  ctx: null,
  stream: null,
  worklet: null,
  running: false,
  source: 'mic',   // 'mic' | 'midi'
  midi: null,      // the MIDI input, once connected
  a4: 440,
  mainsHz: 50,   // Europe. Switch to 60 for North America.
  notch: null,
  gainDb: 0,
  gainNode: null,
  latest: null,
  smoothedCents: 0,
  displayedMidi: null,
  candidateMidi: null,
  candidateHits: 0,
  velocity: 0,
  held: [],
  history: [],
};

function $(id) {
  return document.getElementById(id);
}

function init() {
  for (const id of [
    'toggle', 'deviceSelect', 'a4', 'a4Value', 'status',
    'noteName', 'noteOctave', 'centsValue', 'needle', 'needleWrap',
    'freqValue', 'targetValue', 'clarityBar', 'levelBar', 'levelValue',
    'positions', 'tunerString', 'tunerHint', 'history', 'diagnostics',
    'clipWarning', 'rawValue', 'mains', 'gain', 'gainValue', 'tuningTable',
    'source', 'micControls', 'midiControls', 'midiDevice', 'micGainHint',
    'a4Hint', 'pitchDetail', 'midiDetail', 'velocityValue', 'heldValue',
    'keyboard', 'keyWhere', 'pitchVerdict', 'pitchDetailLine',
    'tineDiagram', 'tineWhere',
    'signalPanel', 'diagnosticsPanel', 'midiPanel', 'midiDiagnostics',
    'voice', 'synthVolume', 'synthVolumeValue', 'soundHint', 'sustain',
  ]) {
    els[id] = $(id);
  }
  buildTuningTable();

  attachGainControl({
    slider: els.gain,
    readout: els.gainValue,
    onChange: (db) => {
      state.gainDb = db;
      if (state.gainNode) state.gainNode.gain.value = dbToLinear(db);
    },
  });

  initInstrumentSwitch();
  initLanguageSwitch();
  attachSoundControls({
    select: els.voice, slider: els.synthVolume, readout: els.synthVolumeValue,
    sustain: els.sustain,
  });

  els.mains.addEventListener('change', () => {
    state.mainsHz = Number(els.mains.value);
    if (state.notch) state.notch.frequency.value = state.mainsHz;
  });

  window.addEventListener('languagechange', () => {
    els.toggle.textContent = t(state.running ? 'tuner.stop' : 'tuner.start');
    if (!state.running) setStatus(t('tuner.idle'));
    else if (state.stream) showDiagnostics(state.stream);
    if (state.displayedMidi !== null) renderPositions(state.displayedMidi);
    buildTuningTable();
    if (state.source === 'midi') renderMidiDiagnostics();
  });

  // Changing instrument changes the filters, the window size and half the
  // panels, so the simplest correct thing is to stop and let the user restart.
  window.addEventListener('instrumentchange', async () => {
    await stop();
    if (!isPiano()) setSource('mic');
    applySourceVisibility();
    // The tuning table is shared by the guitar, the lyre and the kalimba now,
    // so it holds the *previous* instrument's strings until it is rebuilt —
    // six rows of guitar tuning left behind on a kalimba, or the reverse.
    buildTuningTable();
    resetReadouts();
    setStatus(t('tuner.idle'));
  });

  setStatus(t('tuner.idle'));

  els.toggle.addEventListener('click', () => (state.running ? stop() : start()));
  els.deviceSelect.addEventListener('change', () => {
    if (state.running) start(els.deviceSelect.value);
  });
  els.source.addEventListener('change', async () => {
    await stop();
    setSource(els.source.value);
    resetReadouts();
    setStatus(t(state.source === 'midi' ? 'common.midiIdle' : 'tuner.idle'));
  });
  els.midiDevice.addEventListener('change', () => {
    if (state.midi) state.midi.select(els.midiDevice.value);
  });
  els.a4.addEventListener('input', () => {
    state.a4 = Number(els.a4.value);
    els.a4Value.textContent = `${state.a4} Hz`;
    updateTuningFrequencies();
  });

  applySourceVisibility();
  // Draw the instrument before anything has been played. An empty panel where a
  // lyre should be reads as broken, and the drawing is worth looking at on its
  // own — on a kalimba it is the fastest way to learn where the tines are.
  if (isTined()) renderTinePosition(null);
  requestAnimationFrame(render);
}

function setSource(value) {
  state.source = value === 'midi' ? 'midi' : 'mic';
  els.source.value = state.source;
  applySourceVisibility();
}

/**
 * MIDI has no level, no clarity and no microphone to report on, so those
 * panels are not merely irrelevant — left visible and empty they read as
 * broken. Swap them for the ones that do apply.
 */
function applySourceVisibility() {
  const midi = state.source === 'midi';
  els.micControls.hidden = midi;
  els.midiControls.hidden = !midi;
  els.micGainHint.hidden = midi;
  els.a4Hint.hidden = midi;
  els.pitchDetail.hidden = midi;
  els.midiDetail.hidden = !midi;
  els.signalPanel.hidden = midi;
  els.diagnosticsPanel.hidden = midi;
  els.midiPanel.hidden = !midi;
  els.soundHint.hidden = !midi;
  $('sustainHint').hidden = !midi;
  const check = $('pitchCheckPanel');
  if (check) check.hidden = midi;
}

function resetReadouts() {
  state.latest = null;
  state.displayedMidi = null;
  state.candidateMidi = null;
  state.candidateHits = 0;
  state.velocity = 0;
  state.held = [];
  els.noteName.textContent = '—';
  els.noteOctave.textContent = '';
  els.centsValue.textContent = '—';
  els.levelBar.style.width = '0%';
  els.clarityBar.style.width = '0%';
  els.keyboard.innerHTML = '';
  els.keyWhere.textContent = '';
  els.tineWhere.innerHTML = '';
  els.positions.innerHTML = '<span class="muted">—</span>';
  // The instrument itself stays drawn with nothing marked: an empty panel
  // where a lyre was reads as broken, and the drawing is worth looking at
  // even before you have played anything.
  if (isTined()) renderTinePosition(null);
  else els.tineDiagram.innerHTML = '';
}

async function start(deviceId) {
  if (state.source === 'midi') return startMidi();
  return startMic(deviceId);
}

async function startMic(deviceId) {
  await stop();
  const cfg = instrumentConfig().audio;

  const audio = {
    // These three are the whole ballgame. Chrome turns them on by default and
    // they are tuned for speech: AGC pumps the level, noise suppression eats
    // sustained tones, and echo cancellation spectrally subtracts your signal.
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  };
  if (deviceId) audio.deviceId = { exact: deviceId };

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
  } catch (err) {
    setStatus(`${t('tuner.blocked')} (${err.name})`, 'bad');
    return;
  }

  state.stream = stream;
  state.ctx = new AudioContext({ latencyHint: 'interactive' });
  await state.ctx.audioWorklet.addModule('./src/pitch-processor.js');

  const source = state.ctx.createMediaStreamSource(stream);

  // Manual input gain, before everything else, so the meters show what the
  // detector actually receives.
  const inputGain = state.ctx.createGain();
  inputGain.gain.value = dbToLinear(state.gainDb);
  state.gainNode = inputGain;

  const highpass = state.ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = cfg.highpass;

  // Notch on the mains frequency. Lowering the highpass lets hum through, and
  // hum wrecks the low strings specifically — measured, it was the difference
  // between 36 and 68 good frames on an open low E. Its width is
  // instrument-specific: a piano has notes either side of 50 Hz and a guitar
  // does not, so the same wide notch that is free on one gouges the other.
  const notch = state.ctx.createBiquadFilter();
  notch.type = 'notch';
  notch.frequency.value = state.mainsHz;
  notch.Q.value = cfg.notchQ;
  state.notch = notch;

  const lowpass = state.ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = cfg.lowpass;

  state.worklet = new AudioWorkletNode(state.ctx, 'pitch-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
    processorOptions: {
      frameSize: cfg.frameSize,
      hopSize: cfg.hopSize,
      minFreq: cfg.minFreq,
      maxFreq: cfg.maxFreq,
    },
  });
  state.worklet.port.onmessage = (e) => {
    state.latest = e.data;
  };

  // A silent sink keeps the graph pulling without any monitoring feedback.
  const sink = state.ctx.createGain();
  sink.gain.value = 0;

  source.connect(inputGain).connect(highpass).connect(notch).connect(lowpass)
    .connect(state.worklet);
  state.worklet.connect(sink).connect(state.ctx.destination);

  state.running = true;
  els.toggle.textContent = t('tuner.stop');
  els.toggle.classList.add('running');
  setStatus(t('tuner.listening'), 'good');

  await populateDevices(stream);
  showDiagnostics(stream);
}

/**
 * MIDI needs none of the audio machinery. There is no stream to open, no
 * filters to place, no frame to fill — a note-on simply *is* the reading.
 */
async function startMidi() {
  await stop();

  if (!midiSupported()) {
    setStatus(t('common.midiUnsupported'), 'bad');
    return;
  }

  setStatus(t('common.midiConnecting'), 'busy');
  const input = createMidiInput();
  try {
    await input.enable();
  } catch (err) {
    setStatus(`${t('common.midiBlocked')} (${err.name})`, 'bad');
    return;
  }

  state.midi = input;
  // A MIDI controller makes no sound of its own, so the app supplies it.
  const synth = getSynth();
  synth.prime();

  input.onDevices(() => {
    populateMidiDevices();
    renderMidiDiagnostics();
  });
  input.onNote((event) => {
    if (event.type === 'on') {
      synth.noteOn(event.midi, event.velocity);
      state.velocity = event.velocity;
      if (event.midi !== state.displayedMidi) {
        state.displayedMidi = event.midi;
        pushHistory({ label: keyLabel(event.midi) });
        renderPositions(event.midi);
      }
    } else if (event.type === 'off') {
      synth.noteOff(event.midi);
    } else if (event.type === 'reset') {
      synth.allOff();
    }
    state.held = input.held();
  });

  populateMidiDevices();
  renderMidiDiagnostics();

  if (!input.devices().length) {
    // Access granted but nothing plugged in. `onstatechange` will pick a
    // keyboard up the moment one appears, so stay running rather than failing.
    setStatus(t('common.midiNoDevice'), 'bad');
  } else {
    setStatus(t('common.midiReady'), 'good');
  }

  state.running = true;
  els.toggle.textContent = t('tuner.stop');
  els.toggle.classList.add('running');
}

function populateMidiDevices() {
  const devices = state.midi ? state.midi.devices() : [];
  const keep = els.midiDevice.value;
  els.midiDevice.innerHTML = '';
  els.midiDevice.append(new Option(t('common.inputMidi'), 'all'));
  for (const d of devices) {
    els.midiDevice.append(new Option(d.manufacturer ? `${d.name} — ${d.manufacturer}` : d.name, d.id));
  }
  els.midiDevice.value = [...els.midiDevice.options].some((o) => o.value === keep) ? keep : 'all';
  els.midiDevice.disabled = devices.length === 0;
}

async function stop() {
  state.running = false;
  state.latest = null;
  state.displayedMidi = null;
  state.candidateMidi = null;
  state.candidateHits = 0;
  state.velocity = 0;
  state.held = [];

  if (state.worklet) {
    state.worklet.port.onmessage = null;
    state.worklet.disconnect();
    state.worklet = null;
  }
  if (state.stream) {
    for (const track of state.stream.getTracks()) track.stop();
    state.stream = null;
  }
  if (state.ctx) {
    await state.ctx.close();
    state.ctx = null;
  }
  if (state.midi) {
    state.midi.close();
    state.midi = null;
    getSynth().allOff();
  }

  els.toggle.textContent = t('tuner.start');
  els.toggle.classList.remove('running');
}

async function populateDevices(stream) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const inputs = devices.filter((d) => d.kind === 'audioinput');
  const activeId = stream.getAudioTracks()[0]?.getSettings().deviceId;

  els.deviceSelect.innerHTML = '';
  for (const d of inputs) {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `Input ${els.deviceSelect.length + 1}`;
    if (d.deviceId === activeId) opt.selected = true;
    els.deviceSelect.appendChild(opt);
  }
  els.deviceSelect.disabled = inputs.length === 0;
}

function showDiagnostics(stream) {
  const track = stream.getAudioTracks()[0];
  const s = track ? track.getSettings() : {};
  const cfg = instrumentConfig().audio;

  renderRows(els.diagnostics, [
    [t('tuner.diagDevice'), track ? track.label : '—'],
    [t('tuner.diagRate'), `${state.ctx.sampleRate} Hz`],
    [t('tuner.diagLatency'), `${(state.ctx.baseLatency * 1000).toFixed(1)} ms`],
    [t('tuner.diagWindow'), `${((cfg.frameSize / state.ctx.sampleRate) * 1000).toFixed(1)} ms`],
    [t('tuner.diagUpdate'), `${((cfg.hopSize / state.ctx.sampleRate) * 1000).toFixed(1)} ms`],
    [t('tuner.diagEcho'), flag(s.echoCancellation)],
    [t('tuner.diagNoise'), flag(s.noiseSuppression)],
    [t('tuner.diagAgc'), flag(s.autoGainControl)],
  ]);
}

function renderMidiDiagnostics() {
  const midi = state.midi;
  if (!midi) {
    els.midiDiagnostics.innerHTML = `<span class="muted">${t('common.midiIdle')}</span>`;
    return;
  }
  const devices = midi.devices();
  renderRows(els.midiDiagnostics, [
    [t('common.midiDevice'), devices.length
      ? devices.map((d) => d.name).join(', ')
      : t('common.midiNoDevice')],
    [t('common.midiChannel'), midi.channel === null ? '—' : String(midi.channel)],
    [t('common.sustain'), t(midi.pedalDown ? 'common.sustainDown' : 'common.sustainUp')],
    [t('common.keysHeld'), state.held.length
      ? state.held.map((m) => keyLabel(m)).join(' ')
      : t('common.nothingHeld')],
  ]);
}

function renderRows(host, rows) {
  host.innerHTML = '';
  for (const [label, value] of rows) {
    const row = document.createElement('div');
    row.className = 'diag-row';
    const k = document.createElement('span');
    k.className = 'diag-key';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'diag-value';
    if (value === true || value === false) {
      v.textContent = t(value ? 'tuner.diagOn' : 'tuner.diagOff');
      v.classList.add(value ? 'bad' : 'good');
    } else {
      v.textContent = value;
    }
    row.append(k, v);
    host.appendChild(row);
  }
}

function flag(value) {
  return value === undefined ? t('tuner.diagUnknown') : Boolean(value);
}

function setStatus(text, kind) {
  els.status.textContent = text;
  els.status.className = `status ${kind || ''}`;
}

function render() {
  requestAnimationFrame(render);

  if (state.source === 'midi') {
    if (state.running) renderMidiFrame();
    return;
  }

  const r = state.latest;
  if (!state.running || !r) {
    if (!state.running) {
      els.levelBar.style.width = '0%';
      els.clarityBar.style.width = '0%';
    }
    return;
  }

  // Level meter in dBFS, mapped from -60 dB up to 0.
  const db = r.rms > 0 ? 20 * Math.log10(r.rms) : -100;
  const levelPct = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
  els.levelBar.style.width = `${levelPct}%`;
  els.levelValue.textContent = db > -99 ? `${db.toFixed(1)} dBFS` : '—';
  els.clipWarning.hidden = r.peak < 0.98;

  els.clarityBar.style.width = `${Math.round(r.clarity * 100)}%`;

  // Pre-gate reading. When a string won't register, this distinguishes "too
  // quiet to analyse" from "analysed but rejected as unreliable" — otherwise
  // both look identical from the outside.
  const raw = describeFrequency(r.frequency > 0 ? r.frequency : 1, state.a4);
  els.rawValue.textContent = r.frequency > 0
    ? `${r.frequency.toFixed(1)} Hz · ${raw.label} · ${(r.clarity * 100).toFixed(0)}%`
    : t('tuner.belowGate');
  els.rawValue.className = r.frequency > 0
    ? (r.clarity >= CLARITY_FLOOR ? 'diag-value good' : 'diag-value')
    : 'diag-value bad';

  const usable = r.frequency > 0 && r.clarity >= CLARITY_FLOOR;
  if (!usable) {
    state.candidateHits = 0;
    return;
  }

  const note = describeFrequency(r.frequency, state.a4);

  if (note.midi === state.candidateMidi) {
    state.candidateHits++;
  } else {
    state.candidateMidi = note.midi;
    state.candidateHits = 1;
  }

  if (state.candidateHits >= STABLE_HITS && note.midi !== state.displayedMidi) {
    state.displayedMidi = note.midi;
    pushHistory(note);
    renderPositions(note.midi);
  }

  if (state.displayedMidi === null) return;

  // Cents are shown against the note we're actually displaying, so a wobbling
  // reading near a semitone boundary doesn't flip the needle end to end.
  const target = midiToFreq(state.displayedMidi, state.a4);
  const cents = 1200 * Math.log2(r.frequency / target);
  state.smoothedCents = state.smoothedCents * 0.75 + cents * 0.25;

  const shown = describeFrequency(midiToFreq(state.displayedMidi, state.a4), state.a4);
  els.noteName.textContent = shown.name;
  els.noteOctave.textContent = shown.octave;

  const clamped = Math.max(-50, Math.min(50, state.smoothedCents));
  els.needle.style.left = `${50 + clamped}%`;
  els.centsValue.textContent = `${state.smoothedCents >= 0 ? '+' : ''}${state.smoothedCents.toFixed(1)}¢`;
  els.needleWrap.classList.toggle('in-tune', Math.abs(state.smoothedCents) < 5);

  els.freqValue.textContent = `${r.frequency.toFixed(2)} Hz`;
  els.targetValue.textContent = `${target.toFixed(2)} Hz`;

  if (isPiano()) {
    renderPitchCheck(state.smoothedCents, state.displayedMidi);
    return;
  }

  if (isTined()) {
    renderTinedTuner(r.frequency);
    return;
  }

  const near = nearestString(r.frequency, state.a4);
  // A pitch far from any open string is a fretted note, not a string to tune.
  highlightTuningRow(Math.abs(near.cents) < 150 ? near.string : 0, near.cents);
  els.tunerString.textContent = `${near.label} (${t('common.string')} ${near.string})`;
  if (Math.abs(near.cents) < 5) {
    els.tunerHint.textContent = t('tuner.inTune');
    els.tunerHint.className = 'tuner-hint good';
  } else if (Math.abs(near.cents) > 150) {
    els.tunerHint.textContent = t('tuner.notNearString');
    els.tunerHint.className = 'tuner-hint';
  } else {
    els.tunerHint.textContent = t(near.cents > 0 ? 'tuner.tuneDown' : 'tuner.tuneUp');
    els.tunerHint.className = 'tuner-hint warn';
  }
}

/**
 * The lyre and kalimba tuner.
 *
 * The same job as the guitar's, and the one these instruments need most: a
 * guitarist tunes six strings occasionally, a lyre player sixteen almost every
 * time they pick it up. There is no fretted-note case to exclude either —
 * everything you can play *is* an open string — so a reading far from any of
 * them means a string is badly out rather than that you played something else.
 */
function renderTinedTuner(frequency) {
  const layout = layoutFor();
  const near = nearestTine(layout, frequency, state.a4);
  highlightTuningRow(Math.abs(near.cents) < 150 ? near.number : 0, near.cents);

  els.tunerString.textContent = `${near.label} (${t('common.string')} ${near.number})`;
  if (Math.abs(near.cents) < 5) {
    els.tunerHint.textContent = t('tuner.inTune');
    els.tunerHint.className = 'tuner-hint good';
  } else if (Math.abs(near.cents) > 150) {
    els.tunerHint.textContent = t('tuner.notNearString');
    els.tunerHint.className = 'tuner-hint';
  } else {
    els.tunerHint.textContent = t(near.cents > 0 ? 'tuner.tuneDown' : 'tuner.tuneUp');
    els.tunerHint.className = 'tuner-hint warn';
  }
}

/** Per-frame readout for the MIDI path: no meters, because there is nothing to meter. */
function renderMidiFrame() {
  const midi = state.displayedMidi;
  if (midi === null) return;

  const shown = keyName(midi);
  els.noteName.textContent = shown;
  els.noteOctave.textContent = String(Math.floor(midi / 12) - 1);
  els.velocityValue.textContent = state.velocity
    ? `${Math.round((state.velocity / 127) * 100)}%`
    : '—';
  els.heldValue.textContent = state.held.length
    ? state.held.map((m) => keyName(m)).join(' ')
    : t('common.nothingHeld');
  renderMidiDiagnostics();
}

/**
 * How far this note sits from equal temperament — the only "tuning" question a
 * pianist can act on, since the instrument is not tuned by its player.
 *
 * The threshold is deliberately loose. Pianos are tuned with a deliberate
 * *stretch*, flat in the bass and sharp in the treble, so a correctly tuned
 * instrument reads as out of tune at its extremes. Calling that a fault would
 * be worse than saying nothing.
 */
function renderPitchCheck(cents, midi) {
  const off = Math.abs(cents);
  const octaves = midi === null ? 0 : Math.abs(relativeToMiddleC(midi).octaves);
  // Allow more slack the further from the middle, where stretch is largest.
  const tolerance = PIANO_TOLERANCE_CENTS + octaves * 5;

  let key;
  let kind;
  if (off < 5) { key = 'piano.inTune'; kind = 'good'; }
  else if (off < tolerance) { key = 'piano.slightlyOff'; kind = 'good'; }
  else { key = cents > 0 ? 'piano.sharp' : 'piano.flat'; kind = 'warn'; }

  els.pitchVerdict.textContent = t(key);
  els.pitchVerdict.className = `verdict ${kind}`;
  els.pitchDetailLine.textContent =
    `${cents >= 0 ? '+' : ''}${cents.toFixed(1)}¢ · ${keyLabel(midi)}`;
}

/**
 * The rows of the tuning reference, in the order the instrument wants them.
 *
 * A guitar is listed thickest first — the order you see the strings holding it,
 * which is the reverse of their numbering. A lyre and a kalimba are listed low
 * to high, which for a lyre is also left to right and for a kalimba is
 * deliberately *not*: its tines are numbered outward from the middle, and a
 * table pretending they run in a line would teach the wrong thing.
 */
function tuningRows() {
  if (!isTined()) {
    return STANDARD_TUNING.map((s, i) => ({
      key: s.string, label: s.label, midi: s.midi,
      edge: i === 0 ? t('tuner.thickest')
        : i === STANDARD_TUNING.length - 1 ? t('tuner.thinnest') : '',
    }));
  }
  const layout = layoutFor();
  return layout.midis.map((midi, index) => ({
    key: numberOf(layout, index), label: midiLabel(midi), midi, edge: '',
  }));
}

/** Built once; only the highlight changes per frame. */
function buildTuningTable() {
  const rows = tuningRows();
  // Sixteen rows do not want to be one tall column the way six do.
  els.tuningTable.className = `tuning-table${rows.length > 8 ? ' wide' : ''}`;
  els.tuningTable.innerHTML = rows.map((r) => `<div class="tuning-row" data-string="${r.key}">
      <span class="tn">${t('common.string')} ${r.key}</span>
      <span class="tnote">${r.label}</span>
      <span class="thz" data-midi="${r.midi}"></span>
      <span class="tstate">${r.edge}</span>
    </div>`).join('');
  updateTuningFrequencies();
}

/** Targets follow the A4 reference, so the slider moves them all. */
function updateTuningFrequencies() {
  els.tuningTable.querySelectorAll('.thz').forEach((el) => {
    el.textContent = `${midiToFreq(Number(el.dataset.midi), state.a4).toFixed(2)} Hz`;
  });
}

function highlightTuningRow(stringNumber, cents) {
  const rows = tuningRows();
  els.tuningTable.querySelectorAll('.tuning-row').forEach((row) => {
    const active = Number(row.dataset.string) === stringNumber;
    row.classList.toggle('active', active);
    const stateCell = row.querySelector('.tstate');
    if (!active) {
      const idx = [...row.parentNode.children].indexOf(row);
      stateCell.textContent = rows[idx] ? rows[idx].edge : '';
      stateCell.className = 'tstate';
      return;
    }
    const off = Math.abs(cents) < 5 ? 'ok' : cents > 0 ? 'high' : 'low';
    stateCell.textContent = off === 'ok' ? t('tuner.okShort')
      : off === 'high' ? t('tuner.tuneDownShort') : t('tuner.tuneUpShort');
    stateCell.className = `tstate ${off === 'ok' ? 'good' : 'warn'}`;
  });
}

function renderPositions(midi) {
  if (isPiano()) {
    renderKeyPosition(midi);
    return;
  }
  if (isTined()) {
    renderTinePosition(midi);
    return;
  }
  const positions = fretPositions(midi);
  els.positions.innerHTML = '';
  if (positions.length === 0) {
    els.positions.innerHTML = '<span class="muted">—</span>';
    return;
  }
  for (const p of positions) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `<b>${t('common.string')} ${p.string}</b> ${
      p.fret === 0 ? t('common.open') : `${t('common.fret')} ${p.fret}`}`;
    els.positions.appendChild(chip);
  }
}

/**
 * The one key this note lives on, shown against enough surrounding keyboard to
 * locate it — plus its distance from middle C in words, because a picture of a
 * repeating pattern cannot say which repetition you are looking at.
 */
function renderKeyPosition(midi) {
  const clamped = Math.max(LOWEST_KEY, Math.min(HIGHEST_KEY, midi));
  // Two octaves around the note, or the octave containing middle C as well when
  // the note is close enough for both to fit.
  const from = Math.max(LOWEST_KEY, Math.floor(clamped / 12) * 12 - 12);
  const to = Math.min(HIGHEST_KEY, from + 35);

  els.keyboard.innerHTML = renderKeyboard({
    from, to, width: 560, whiteHeight: 82,
    marks: [{ midi: clamped, kind: 'target', label: keyLabel(clamped) }],
  });

  const cfg = instrumentConfig().audio;
  const freq = midiToFreq(clamped, state.a4);
  let warning = '';
  if (state.source === 'mic' && freq > cfg.maxFreq) warning = t('piano.aboveMicRange');
  else if (state.source === 'mic' && freq < cfg.minFreq) warning = t('piano.belowMicRange');

  els.keyWhere.innerHTML =
    `<b>${keyLabel(clamped)}</b> — ${describeKeyColour(clamped)}, ${describeKeyPosition(clamped)}.`
    + (warning ? `<div style="margin-top:6px;color:var(--warn)">${warning}</div>` : '');
}

/**
 * The played note on a drawing of the instrument.
 *
 * A note the instrument has not got is a real outcome here, not an error: play
 * an F♯ near a lyre and there is nothing on it that is an F♯. Marking the
 * nearest string in amber and saying so is more use than an empty diagram,
 * because "the string next door is an F" is what you actually needed to know.
 */
function renderTinePosition(midi) {
  const layout = layoutFor();
  const index = midi === null ? -1 : indexOfMidi(layout, midi);
  const near = midi === null || index >= 0
    ? null
    : nearestTine(layout, midiToFreq(midi, state.a4), state.a4);

  const marks = index >= 0 ? [{ index, kind: 'target' }]
    : near ? [{ index: near.index, kind: 'missing' }] : [];

  els.tineDiagram.innerHTML = renderTines(layout, { width: 560, marks });

  if (midi === null) { els.tineWhere.innerHTML = ''; return; }
  els.tineWhere.innerHTML = index >= 0
    ? `<b>${midiLabel(midi)}</b> — ${tineNumberLabel(layout, index)}, ${
        describeTine(layout, index)}.`
    : `<b>${midiLabel(midi)}</b><div style="margin-top:6px;color:var(--warn)">${
        t('tuner.notOnInstrument')}</div>`;
}

function pushHistory(note) {
  state.history.push(note.label);
  if (state.history.length > HISTORY_LEN) state.history.shift();
  els.history.innerHTML = state.history
    .map((n) => `<span class="hist">${n}</span>`)
    .join('');
  els.history.scrollLeft = els.history.scrollWidth;
}

init();
