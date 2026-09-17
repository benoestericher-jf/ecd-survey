/* ------------------------------------------------------------------
   Offline-first storage. IndexedDB with a localStorage fallback.
   Nothing ever leaves the device until the enumerator taps Sync.
   ------------------------------------------------------------------ */

const DB_NAME = 'ecd-survey';
const DB_VERSION = 1;
const STORE = 'responses';
const META = 'meta';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('no-idb'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('status', 'status');
        os.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'k' });
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

/* ---- localStorage fallback ---- */
const LS_KEY = 'ecd-survey-responses';
const lsAll = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; } };
const lsSave = rows => { try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); } catch (e) { console.warn('LS full', e); } };

const Store = {
  available: true,
  usingFallback: false,

  async init() {
    try { await openDB(); } catch (e) { this.usingFallback = true; }
    return this;
  },

  async put(record) {
    record.updatedAt = new Date().toISOString();
    if (this.usingFallback) {
      const rows = lsAll().filter(r => r.id !== record.id);
      rows.push(record); lsSave(rows); return record;
    }
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => res(record);
      tx.onerror = () => rej(tx.error);
    });
  },

  async get(id) {
    if (this.usingFallback) return lsAll().find(r => r.id === id) || null;
    const db = await openDB();
    return new Promise((res, rej) => {
      const r = db.transaction(STORE).objectStore(STORE).get(id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  },

  async all() {
    if (this.usingFallback) return lsAll().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    const db = await openDB();
    return new Promise((res, rej) => {
      const r = db.transaction(STORE).objectStore(STORE).getAll();
      r.onsuccess = () => res((r.result || []).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
      r.onerror = () => rej(r.error);
    });
  },

  async remove(id) {
    if (this.usingFallback) { lsSave(lsAll().filter(r => r.id !== id)); return; }
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  },

  /* Small key/value settings, always in localStorage - tiny and sync */
  setting(k, v) {
    if (v === undefined) {
      try { return JSON.parse(localStorage.getItem('ecd-set-' + k)); } catch (e) { return null; }
    }
    try { localStorage.setItem('ecd-set-' + k, JSON.stringify(v)); } catch (e) {}
    return v;
  },

  async estimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try { return await navigator.storage.estimate(); } catch (e) {}
    }
    return null;
  }
};

function uid() {
  return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
