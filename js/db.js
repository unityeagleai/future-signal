// Future Signal — IndexedDB Storage Layer
// All data stays local. Never leaves the device.

const DB_NAME = 'future-signal';
const DB_VERSION = 1;

let _db = null;

export async function openDB() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Signals store
      if (!db.objectStoreNames.contains('signals')) {
        const ss = db.createObjectStore('signals', { keyPath: 'id' });
        ss.createIndex('date', 'date', { unique: true });
        ss.createIndex('saved', 'saved', { unique: false });
      }
      // Reflections store
      if (!db.objectStoreNames.contains('reflections')) {
        const rs = db.createObjectStore('reflections', { keyPath: 'id' });
        rs.createIndex('signalId', 'signalId', { unique: true });
      }
      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

// Generic helpers
function tx(storeName, mode = 'readonly') {
  return _db.transaction(storeName, mode).objectStore(storeName);
}
function req2promise(r) {
  return new Promise((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export async function getSetting(key) {
  await openDB();
  try {
    const r = await req2promise(tx('settings').get(key));
    return r ? r.value : null;
  } catch { return null; }
}

export async function setSetting(key, value) {
  await openDB();
  return req2promise(tx('settings', 'readwrite').put({ key, value }));
}

export async function getAllSettings() {
  await openDB();
  const all = await req2promise(tx('settings').getAll());
  return Object.fromEntries(all.map(s => [s.key, s.value]));
}

// ─── SIGNALS ─────────────────────────────────────────────────────────────────
export async function saveSignal(signal) {
  await openDB();
  if (!signal.id) signal.id = `signal_${Date.now()}`;
  if (!signal.createdAt) signal.createdAt = new Date().toISOString();
  return req2promise(tx('signals', 'readwrite').put(signal));
}

export async function getSignalByDate(dateStr) {
  await openDB();
  return req2promise(tx('signals').index('date').get(dateStr));
}

export async function getSignal(id) {
  await openDB();
  return req2promise(tx('signals').get(id));
}

export async function getAllSignals() {
  await openDB();
  const all = await req2promise(tx('signals').getAll());
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updateSignal(id, patch) {
  await openDB();
  const existing = await getSignal(id);
  if (!existing) throw new Error('Signal not found');
  return req2promise(tx('signals', 'readwrite').put({ ...existing, ...patch }));
}

// ─── REFLECTIONS ─────────────────────────────────────────────────────────────
export async function saveReflection(signalId, text) {
  await openDB();
  const r = {
    id: `refl_${signalId}`,
    signalId,
    text,
    updatedAt: new Date().toISOString()
  };
  return req2promise(tx('reflections', 'readwrite').put(r));
}

export async function getReflection(signalId) {
  await openDB();
  return req2promise(tx('reflections').index('signalId').get(signalId));
}

export async function getAllReflections() {
  await openDB();
  return req2promise(tx('reflections').getAll());
}

// ─── TODAY's DATE KEY ─────────────────────────────────────────────────────────
export function todayKey() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}
