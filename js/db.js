// Tiny IndexedDB wrapper.
// Stores: "kv" (settings, prefs) and "days" (one record per child per day).

const DB_NAME = 'morning-tracker';
let db;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      if (!d.objectStoreNames.contains('days')) {
        const s = d.createObjectStore('days', { keyPath: 'id' });
        s.createIndex('kidId', 'kidId');
        s.createIndex('dayKey', 'dayKey');
      }
    };
    req.onsuccess = () => {
      db = req.result;
      // A newer version of the app wants to upgrade the database: step aside and reload.
      db.onversionchange = () => { db.close(); location.reload(); };
      resolve(db);
    };
    req.onblocked = () => location.reload();
    req.onerror = () => reject(req.error);
  });
}

function run(store, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const kvGet = (key) => run('kv', 'readonly', (s) => s.get(key));
export const kvSet = (key, value) => run('kv', 'readwrite', (s) => s.put(value, key));
export const dayGet = (id) => run('days', 'readonly', (s) => s.get(id));
export const dayPut = (rec) => run('days', 'readwrite', (s) => s.put(rec));
export const dayDelete = (id) => run('days', 'readwrite', (s) => s.delete(id));
export const dayAll = () => run('days', 'readonly', (s) => s.getAll());
