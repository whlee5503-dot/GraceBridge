// src/hooks/useScreeningDraft.ts
// ScreeningForm 진행 상태를 IndexedDB에 자동 저장/복원

import { useEffect, useCallback } from 'react'

const DB_NAME    = 'gracebridge'
const STORE_NAME = 'screening_draft'
const DRAFT_KEY  = 'current'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror   = () => reject(req.error)
  })
}

export async function saveDraft(data: object): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.put({ ...data, savedAt: Date.now() }, DRAFT_KEY)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

export async function loadDraft(): Promise<Record<string, unknown> | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.get(DRAFT_KEY)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror   = () => reject(req.error)
  })
}

export async function clearDraft(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.delete(DRAFT_KEY)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

export function useAutosaveDraft(data: object, enabled: boolean) {
  const save = useCallback(() => {
    if (enabled) saveDraft(data).catch(console.error)
  }, [data, enabled])

  useEffect(() => {
    save()
  }, [save])
}
