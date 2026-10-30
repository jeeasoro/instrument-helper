/**
 * Web MIDI input.
 *
 * Everything else in this app is signal processing: infer a pitch from a smear
 * of air pressure, and live with the uncertainty. A MIDI keyboard skips all of
 * it. Notes arrive as exact numbers with exact timestamps, polyphony is free,
 * and there is nothing to be out of tune — so the microphone's whole apparatus
 * of gates, clarity scores and confidence thresholds simply does not apply.
 *
 * What it does need is state. MIDI describes *changes* (this key went down,
 * that one came up), not what is currently sounding, so the set of held notes
 * has to be tracked here — including the sustain pedal, without which a
 * pedalled chord looks released the instant the fingers lift.
 */

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;
const CONTROL_CHANGE = 0xb0;

const CC_SUSTAIN = 64;
const CC_ALL_SOUND_OFF = 120;
const CC_RESET_CONTROLLERS = 121;
const CC_ALL_NOTES_OFF = 123;

export function midiSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
}

/**
 * A MIDI input, with held-note tracking.
 *
 * `enable()` triggers the browser permission prompt and resolves once access is
 * granted. Everything after that is synchronous.
 */
export function createMidiInput() {
  let access = null;
  let selectedId = 'all';
  let lastChannel = null;

  /** midi note -> velocity, for keys physically down. */
  const down = new Map();
  /** Notes released while the pedal was down. Still sounding, no longer held. */
  const sustained = new Set();
  let pedal = false;

  const noteHandlers = new Set();
  const deviceHandlers = new Set();

  const emitNote = (event) => { for (const fn of noteHandlers) fn(event); };
  const emitDevices = () => { for (const fn of deviceHandlers) fn(devices()); };

  function devices() {
    if (!access) return [];
    return [...access.inputs.values()].map((input) => ({
      id: input.id,
      name: input.name || 'MIDI input',
      manufacturer: input.manufacturer || '',
      state: input.state,
    }));
  }

  function handleMessage(event) {
    const data = event.data;
    if (!data || data.length < 2) return;

    const status = data[0] & 0xf0;
    const channel = (data[0] & 0x0f) + 1;
    const a = data[1];
    const b = data.length > 2 ? data[2] : 0;
    // `event.timeStamp` shares its clock with performance.now(), so a note-on
    // can be scored against the beat without the audio round trip that timed
    // practice mode otherwise has to guess at.
    const time = Number.isFinite(event.timeStamp) ? event.timeStamp : performance.now();

    if (status === NOTE_ON && b > 0) {
      lastChannel = channel;
      sustained.delete(a);
      down.set(a, b);
      emitNote({ type: 'on', midi: a, velocity: b, channel, time });
      return;
    }

    // A note-on with velocity 0 is a note-off. Most keyboards send it that way,
    // because running status then lets a whole phrase share one status byte.
    if (status === NOTE_OFF || (status === NOTE_ON && b === 0)) {
      lastChannel = channel;
      down.delete(a);
      if (pedal) {
        // Lifting a finger under the pedal is not the end of the note. Holding
        // the `off` back until the pedal rises keeps the event stream saying
        // the same thing `held()` does — otherwise a listener that tracks
        // note-ons and note-offs silently disagrees with what is sounding.
        sustained.add(a);
        return;
      }
      emitNote({ type: 'off', midi: a, velocity: 0, channel, time });
      return;
    }

    if (status === CONTROL_CHANGE) {
      lastChannel = channel;
      if (a === CC_SUSTAIN) {
        const nowDown = b >= 64;
        if (pedal && !nowDown) {
          // Pedal up: everything it was holding stops, unless a finger is on it.
          for (const midi of sustained) {
            if (!down.has(midi)) emitNote({ type: 'off', midi, velocity: 0, channel, time });
          }
          sustained.clear();
        }
        pedal = nowDown;
        emitNote({ type: 'pedal', pedal: nowDown, channel, time });
        return;
      }
      if (a === CC_ALL_NOTES_OFF || a === CC_ALL_SOUND_OFF || a === CC_RESET_CONTROLLERS) {
        reset();
        emitNote({ type: 'reset', channel, time });
      }
    }
  }

  function attach() {
    if (!access) return;
    for (const input of access.inputs.values()) {
      const wanted = selectedId === 'all' || input.id === selectedId;
      input.onmidimessage = wanted ? handleMessage : null;
    }
  }

  function reset() {
    down.clear();
    sustained.clear();
    pedal = false;
  }

  return {
    async enable() {
      if (!midiSupported()) {
        const err = new Error('unsupported');
        err.name = 'NotSupportedError';
        throw err;
      }
      if (!access) {
        access = await navigator.requestMIDIAccess({ sysex: false });
        // Keyboards get plugged in after the page loads at least as often as
        // before it, and a silent app is indistinguishable from a broken one.
        access.onstatechange = () => {
          attach();
          emitDevices();
        };
      }
      attach();
      return devices();
    },

    devices,

    select(id) {
      selectedId = id || 'all';
      reset();
      attach();
    },

    get selected() { return selectedId; },
    get enabled() { return !!access; },
    get pedalDown() { return pedal; },
    get channel() { return lastChannel; },

    /** Every note currently sounding, low to high — fingers and pedal both. */
    held() {
      return [...new Set([...down.keys(), ...sustained])].sort((x, y) => x - y);
    },

    /** How hard the most recent press of this note was, 0–127. */
    velocity(midi) {
      return down.get(midi) ?? 0;
    },

    /** Loudest note currently down, which is what a level meter should show. */
    peakVelocity() {
      let peak = 0;
      for (const v of down.values()) if (v > peak) peak = v;
      return peak;
    },

    onNote(fn) {
      noteHandlers.add(fn);
      return () => noteHandlers.delete(fn);
    },

    onDevices(fn) {
      deviceHandlers.add(fn);
      return () => deviceHandlers.delete(fn);
    },

    reset,

    close() {
      if (access) {
        for (const input of access.inputs.values()) input.onmidimessage = null;
        access.onstatechange = null;
      }
      noteHandlers.clear();
      deviceHandlers.clear();
      reset();
      access = null;
    },
  };
}
