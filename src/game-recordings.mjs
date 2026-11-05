export const RECORDING_LIFETIME = 24 * 60 * 60 * 1000

let databasePromise

function database() {
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('mostor-game-recordings', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('recordings', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }).catch((error) => { databasePromise = null; throw error })
  return databasePromise
}

function transaction(db, mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', mode)
    const store = tx.objectStore('recordings')
    const request = operation(store)
    tx.oncomplete = () => resolve(request?.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export function isRecordingExpired(recording, now = Date.now()) {
  return !Number.isFinite(recording?.endedAt) || recording.endedAt + RECORDING_LIFETIME <= now
}

export async function listGameRecordings(now = Date.now()) {
  const db = await database()
  const recordings = await transaction(db, 'readonly', (store) => store.getAll())
  const expired = recordings.filter((item) => isRecordingExpired(item, now))
  await Promise.all(expired.map((item) => transaction(db, 'readwrite', (store) => store.delete(item.id))))
  return recordings.filter((item) => !isRecordingExpired(item, now)).sort((a, b) => b.endedAt - a.endedAt)
}

export async function saveGameRecording({ blob, title, endedAt = Date.now() }) {
  if (!blob?.size) return
  const db = await database()
  await transaction(db, 'readwrite', (store) => store.put({ id: crypto.randomUUID(), title, blob, endedAt }))
}
