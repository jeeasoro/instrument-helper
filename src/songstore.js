/**
 * Saved songs: storage, categorisation, and the folder tree.
 *
 * Both the songs page and the practice page need the saved list, and both used
 * to fetch and shape it themselves. This is that logic in one place, plus the
 * two things a growing collection needs: which instrument a song is for, and
 * somewhere to put it.
 *
 * Folders are real directories under ./songs — see server.js. That keeps the
 * promise the plain-file storage was chosen for: the collection stays
 * organisable in a file manager, and moving a file there moves it here.
 */

const LOCAL_KEY = 'instrument-helper.songs';

export const INSTRUMENTS = ['guitar', 'piano', 'lyre', 'kalimba'];
export const MAX_DIFFICULTY = 5;
/** Matches the server's cap. Genre / difficulty / one more is plenty. */
export const MAX_DEPTH = 3;

const SEGMENT = /^[A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ _'&+.-]{0,39}$/;

/** True when a folder path is one the server will accept. */
export function isValidFolder(folder) {
  if (!folder) return true;
  const parts = String(folder).split('/').map((s) => s.trim()).filter(Boolean);
  return parts.length <= MAX_DEPTH && parts.every((p) => SEGMENT.test(p));
}

/**
 * Tidy a typed folder path: trim each segment and drop empty ones, so
 * ` Folk / Easy ` and `Folk//Easy` both become `Folk/Easy`.
 *
 * Deliberately does *not* cap the depth. Truncating here would make
 * `isValidFolder` pass on a path the user did not type, and they would be told
 * their song was saved into a folder they never asked for. Depth is a
 * validation failure, not something to quietly fix.
 */
export function normaliseFolder(folder) {
  return String(folder || '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('/');
}

/** Fill in the fields older saved songs predate, so the UI never sees holes. */
function complete(song) {
  const folder = normaliseFolder(song.folder);
  return {
    id: song.id,
    name: song.name || '',
    text: song.text || '',
    // Last line of defence, for a record that reached here another way — the
    // UI rejects an over-deep path long before this, with an explanation.
    folder: folder.split('/').slice(0, MAX_DEPTH).filter(Boolean).join('/'),
    // A song from before categorisation belongs to both instruments until its
    // owner says otherwise. Defaulting to neither would hide it everywhere,
    // which is indistinguishable from having lost it.
    instruments: Array.isArray(song.instruments) && song.instruments.length
      ? song.instruments.filter((i) => INSTRUMENTS.includes(i))
      : [...INSTRUMENTS],
    difficulty: Number.isFinite(Number(song.difficulty))
      ? Math.min(MAX_DIFFICULTY, Math.max(0, Math.round(Number(song.difficulty)))) : 0,
    savedAt: song.savedAt || null,
  };
}

/* ------------------------------------------------------------ persistence */

const localList = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(complete) : [];
  } catch { return []; }
};
const localWrite = (list) => localStorage.setItem(LOCAL_KEY, JSON.stringify(list));

/** Whether the last operation reached the server, for the "stored where" note. */
let usingServer = true;
export const isUsingServer = () => usingServer;

export async function listSongs() {
  try {
    const res = await fetch('/api/songs');
    if (res.ok) {
      usingServer = true;
      return (await res.json()).map(complete);
    }
  } catch { /* API unavailable — fall through to the browser copy */ }
  usingServer = false;
  return localList();
}

export async function saveSong(song) {
  const entry = complete(song);
  try {
    const res = await fetch(`/api/songs/${encodeURIComponent(entry.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      usingServer = true;
      return complete(await res.json());
    }
  } catch { /* fall through */ }

  usingServer = false;
  const list = localList().filter((s) => s.id !== entry.id);
  list.push(entry);
  localWrite(list);
  return entry;
}

export async function deleteSong(id) {
  try {
    const res = await fetch(`/api/songs/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) { usingServer = true; return true; }
  } catch { /* fall through */ }
  usingServer = false;
  localWrite(localList().filter((s) => s.id !== id));
  return true;
}

/* --------------------------------------------------------------- shaping */

/** Every folder that has something in it, plus their parents, sorted. */
export function folderPaths(songs) {
  const set = new Set();
  for (const song of songs) {
    if (!song.folder) continue;
    const parts = song.folder.split('/');
    for (let i = 1; i <= parts.length; i++) set.add(parts.slice(0, i).join('/'));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * The folder tree, with a count on every node.
 *
 * `count` is the whole subtree, not just the songs sitting directly in that
 * folder — a genre folder reading "0" while its difficulty sub-folders hold
 * twenty songs would be actively misleading.
 */
export function buildFolderTree(songs) {
  const root = { name: '', path: '', children: new Map(), direct: 0, count: 0 };

  for (const song of songs) {
    root.count++;
    if (!song.folder) { root.direct++; continue; }
    let node = root;
    const parts = song.folder.split('/');
    parts.forEach((part, i) => {
      if (!node.children.has(part)) {
        node.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: new Map(),
          direct: 0,
          count: 0,
        });
      }
      node = node.children.get(part);
      node.count++;
    });
    node.direct++;
  }

  const toArray = (node) => ({
    ...node,
    children: [...node.children.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(toArray),
  });
  return toArray(root);
}

/**
 * Narrow the list. A folder filter includes everything beneath it, which is
 * what a folder means to anyone who has used one before.
 */
export function filterSongs(songs, { instrument, folder, query, minDifficulty } = {}) {
  const needle = String(query || '').trim().toLowerCase();
  return songs.filter((song) => {
    if (instrument && !song.instruments.includes(instrument)) return false;
    if (folder && song.folder !== folder && !song.folder.startsWith(`${folder}/`)) return false;
    if (minDifficulty && song.difficulty < minDifficulty) return false;
    if (needle && !song.name.toLowerCase().includes(needle)
      && !song.folder.toLowerCase().includes(needle)) return false;
    return true;
  });
}

/** Songs grouped by folder, for a picker that wants optgroups. */
export function groupByFolder(songs) {
  const groups = new Map();
  for (const song of songs) {
    const key = song.folder || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(song);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([folder, list]) => ({
      folder,
      songs: list.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
