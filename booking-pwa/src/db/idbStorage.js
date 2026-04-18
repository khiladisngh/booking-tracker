import Dexie from 'dexie'

const db = new Dexie('BookingTrackerDB')
db.version(1).stores({ kv: 'key' })

export const idbStorage = {
  getItem: async (name) => {
    const row = await db.kv.get(name)
    return row ? row.value : null
  },
  setItem: async (name, value) => {
    await db.kv.put({ key: name, value })
  },
  removeItem: async (name) => {
    await db.kv.delete(name)
  },
}

// One-time migration: move existing localStorage data into IndexedDB
export async function migrateFromLocalStorage(storageKey) {
  const existing = localStorage.getItem(storageKey)
  if (!existing) return
  const alreadyMigrated = await db.kv.get(storageKey)
  if (alreadyMigrated) return
  await db.kv.put({ key: storageKey, value: existing })
  localStorage.removeItem(storageKey)
}
