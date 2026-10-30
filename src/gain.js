/**
 * Manual input gain.
 *
 * USB microphones vary enormously in output level, and a quiet one starves
 * both the pitch detector and the chord matcher — the signal is clean, just
 * small. This is a plain amplifier applied before any analysis, set by ear
 * against the level meter and remembered across pages and sessions.
 */

const STORAGE_KEY = 'instrument-helper.micGainDb';

export const MIN_DB = -12;
export const MAX_DB = 36;
export const DEFAULT_DB = 0;

export const dbToLinear = (db) => Math.pow(10, db / 20);

export function loadGainDb() {
  // `Number(null)` is 0, and 0 is finite, so a missing setting would read as a
  // stored 0 dB. Harmless while the default *is* 0, wrong the moment it isn't.
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return DEFAULT_DB;
  const raw = Number(stored);
  if (!Number.isFinite(raw)) return DEFAULT_DB;
  return Math.min(MAX_DB, Math.max(MIN_DB, raw));
}

export function saveGainDb(db) {
  localStorage.setItem(STORAGE_KEY, String(db));
}

/**
 * Wire a gain slider to a GainNode. Returns a setter so the caller can rebuild
 * its audio graph without losing the current setting.
 */
export function attachGainControl({ slider, readout, onChange }) {
  const apply = (db, persist) => {
    if (readout) readout.textContent = `${db > 0 ? '+' : ''}${db} dB`;
    if (persist) saveGainDb(db);
    if (onChange) onChange(db);
  };

  const initial = loadGainDb();
  if (slider) {
    slider.min = String(MIN_DB);
    slider.max = String(MAX_DB);
    slider.step = '1';
    slider.value = String(initial);
    slider.addEventListener('input', () => apply(Number(slider.value), true));
  }
  apply(initial, false);

  return {
    get db() { return slider ? Number(slider.value) : initial; },
    get linear() { return dbToLinear(this.db); },
  };
}
