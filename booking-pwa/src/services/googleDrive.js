const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const BACKUP_FOLDER = 'appDataFolder'
const MAX_BACKUPS = 5
const BACKUP_PREFIX = 'booking-backup-'

// ─── Token management ─────────────────────────────────────────────────────────

let _accessToken = null
let _tokenClient = null
let _resolveToken = null

export function getAccessToken() {
  return _accessToken
}

export function setAccessToken(token) {
  _accessToken = token
}

export function initGoogleAuth({ onSignIn, onSignOut }) {
  if (!window.google || !CLIENT_ID) return

  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (response) => {
      if (response.error) {
        _accessToken = null
        onSignOut?.()
        _resolveToken?.(null)
        _resolveToken = null
        return
      }
      _accessToken = response.access_token
      onSignIn?.(response.access_token)
      _resolveToken?.(response.access_token)
      _resolveToken = null
    },
  })
}

export function requestToken() {
  return new Promise((resolve) => {
    if (_accessToken) { resolve(_accessToken); return }
    _resolveToken = resolve
    _tokenClient?.requestAccessToken({ prompt: '' })
  })
}

export function signOut() {
  if (_accessToken) {
    window.google?.accounts.oauth2.revoke(_accessToken)
  }
  _accessToken = null
}

// ─── Drive helpers ────────────────────────────────────────────────────────────

async function driveRequest(path, options = {}) {
  const token = _accessToken || (await requestToken())
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Drive API error ${res.status}`)
  }

  return res.headers.get('Content-Type')?.includes('application/json') ? res.json() : res
}

async function listBackups() {
  const data = await driveRequest(
    `/files?spaces=${BACKUP_FOLDER}&orderBy=name desc&fields=files(id,name,createdTime,size)&q=name+contains+'${BACKUP_PREFIX}'`
  )
  return data.files ?? []
}

async function createBackup(bookings) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${BACKUP_PREFIX}${timestamp}.json`
  const body = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), bookings })

  // 1. Create file metadata
  const meta = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: filename, parents: [BACKUP_FOLDER] }),
  }).then((r) => r.json())

  // 2. Upload content via PATCH
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${meta.id}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  return meta.id
}

async function downloadBackup(fileId) {
  return driveRequest(`/files/${fileId}?alt=media`)
}

async function deleteFile(fileId) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${_accessToken}` },
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchBackupList() {
  return listBackups()
}

export async function backupNow(bookings) {
  const token = _accessToken || (await requestToken())
  if (!token) throw new Error('Not authenticated')

  await createBackup(bookings)

  // Prune to keep only last MAX_BACKUPS
  const all = await listBackups()
  if (all.length > MAX_BACKUPS) {
    const toDelete = all.slice(MAX_BACKUPS)
    await Promise.all(toDelete.map((f) => deleteFile(f.id)))
  }
}

// Merge remote bookings with local: prefer newer updatedAt, keep local-only entries
export function mergeBookings(local, remote) {
  const merged = new Map()

  for (const b of local) merged.set(b.id, b)

  for (const b of remote) {
    const existing = merged.get(b.id)
    if (!existing) {
      merged.set(b.id, b)
    } else {
      const localTime = new Date(existing.updatedAt ?? existing.createdAt ?? 0).getTime()
      const remoteTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()
      if (remoteTime > localTime) merged.set(b.id, b)
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function restoreBackup(fileId, localBookings) {
  const data = await downloadBackup(fileId)
  const remote = data.bookings ?? []
  return mergeBookings(localBookings, remote)
}

// ─── Auto-backup (debounced) ──────────────────────────────────────────────────

let _autoBackupTimer = null

export function scheduleAutoBackup(bookings) {
  if (!_accessToken) return
  clearTimeout(_autoBackupTimer)
  _autoBackupTimer = setTimeout(() => {
    backupNow(bookings).catch(() => {})
  }, 3000)
}
