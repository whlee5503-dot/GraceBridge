// src/lib/offlineQueue.ts
// IndexedDB 기반 오프라인 스크리닝 큐

const DB_NAME = 'gracebridge-offline'
const DB_VERSION = 1
const STORE = 'pending-screenings'

export interface PendingScreening {
  id?: number
  sessionId: string
  churchCode: string
  regionCode: string
  phq9Score: number
  mnaSfScore: number
  chronicConditions: Record<string, boolean>
  riskLevel: 'green' | 'yellow' | 'orange' | 'red'
  timestamp: number
  synced: boolean
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror  = (e) => reject((e.target as IDBOpenDBRequest).error)
  })
}

export async function enqueue(payload: Omit<PendingScreening, 'id' | 'timestamp' | 'synced'>): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).add({ ...payload, timestamp: Date.now(), synced: false })
    req.onsuccess = (e) => resolve((e.target as IDBRequest).result as number)
    req.onerror  = (e) => reject((e.target as IDBRequest).error)
  })
}

export async function markSynced(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getReq = store.get(id)
    getReq.onsuccess = (e) => {
      const record = (e.target as IDBRequest).result
      if (record) {
        record.synced = true
        store.put(record)
      }
      resolve()
    }
    getReq.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

export async function getUnsynced(): Promise<PendingScreening[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = (e) => {
      const all = (e.target as IDBRequest).result as PendingScreening[]
      resolve(all.filter(r => !r.synced))
    }
    req.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

export async function getAll(): Promise<PendingScreening[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = (e) => resolve((e.target as IDBRequest).result)
    req.onerror  = (e) => reject((e.target as IDBRequest).error)
  })
}

export async function registerSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready
    await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
      .sync.register('gracebridge-sync-screenings')
  }
}
