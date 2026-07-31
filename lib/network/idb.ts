/** Minimal IndexedDB helpers for offline content + write queues. */

const DB_NAME = "skulkid-offline";
const DB_VERSION = 1;

export const CONTENT_STORE = "content";
export const QUEUE_STORE = "write-queue";

type StoreName = typeof CONTENT_STORE | typeof QUEUE_STORE;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE);
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
    };
  });
}

function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | void> {
  return openDb().then(
    (db) =>
      new Promise<T | void>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let request: IDBRequest<T> | undefined;
        try {
          const result = run(store);
          if (result) request = result;
        } catch (error) {
          reject(error);
          return;
        }
        tx.oncomplete = () => resolve(request ? request.result : undefined);
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed."));
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
        if (request) {
          request.onerror = () => reject(request!.error ?? new Error("IndexedDB request failed."));
        }
      })
  );
}

export async function idbGet<T>(storeName: StoreName, key: string): Promise<T | null> {
  try {
    const value = await withStore<T | undefined>(storeName, "readonly", (store) => store.get(key));
    return (value as T | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function idbSet(storeName: StoreName, key: string, value: unknown): Promise<void> {
  try {
    await withStore(storeName, "readwrite", (store) => store.put(value, key));
  } catch {
    // Offline cache is best-effort on restricted browsers.
  }
}

export async function idbPutRecord(storeName: StoreName, value: { id: string }): Promise<void> {
  try {
    await withStore(storeName, "readwrite", (store) => store.put(value));
  } catch {
    // ignore
  }
}

export async function idbDelete(storeName: StoreName, key: string): Promise<void> {
  try {
    await withStore(storeName, "readwrite", (store) => store.delete(key));
  } catch {
    // ignore
  }
}

export async function idbGetAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    const value = await withStore<T[]>(storeName, "readonly", (store) => store.getAll());
    return (value as T[] | undefined) ?? [];
  } catch {
    return [];
  }
}
