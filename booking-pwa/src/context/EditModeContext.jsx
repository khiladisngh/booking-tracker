import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  subscribeToAuthConfig,
  seedAuthIfMissing,
  registerSession,
  touchSession,
  endSession,
} from '../services/firestoreSync'
import { getDeviceId, describeDevice, fetchPublicIp } from '../utils/device'

// authLevel: 'locked' | 'view' | 'edit'
//   locked — no access, show ViewPasscodeGate
//   view   — can see data, cannot modify
//   edit   — admin: can see + modify + access Settings → Admin
const EditModeContext = createContext(null)

const HEARTBEAT_MS = 30_000
const AUTH_CACHE_KEY = 'booking_auth_cache'

function loadCachedAuthConfig() {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCachedAuthConfig(config) {
  try { localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(config)) } catch {}
}

export function EditModeProvider({ children }) {
  // Seed from localStorage immediately so offline auth works on first render.
  // null means "never seen config" (shows "Connecting…"); a cached value means
  // the gate is usable right away even without network.
  const [authConfig, setAuthConfig] = useState(loadCachedAuthConfig)
  const [authLevel,  setAuthLevel]  = useState('locked')

  // Keep the passcode the user entered in memory (not persisted) so we can
  // re-validate it whenever the auth config changes — e.g. admin rotates a
  // code or flips the kill switch.
  const lastPasscodeRef = useRef(null)
  const deviceIdRef     = useRef(getDeviceId())
  const ipAddressRef    = useRef(null)

  // Seed /config/auth on first load if it doesn't exist. Retry on failure —
  // the first user post-deploy may race the Firestore rules propagation, and
  // a failed seed leaves everyone stuck on the loading screen forever.
  useEffect(() => {
    let cancelled = false
    let attempt   = 0
    async function trySeed() {
      while (!cancelled && attempt < 5) {
        try {
          await seedAuthIfMissing({
            viewPasscode: '9458',
            editPasscode: String(import.meta.env.VITE_ADMIN_PASSCODE ?? '3586'),
          })
          return
        } catch (err) {
          attempt += 1
          console.warn(`[auth] seed attempt ${attempt} failed, retrying…`, err?.code ?? err)
          await new Promise((r) => setTimeout(r, 2000 * attempt))
        }
      }
    }
    trySeed()
    return () => { cancelled = true }
  }, [])

  // Fetch public IP once per session; best-effort.
  useEffect(() => {
    fetchPublicIp().then((ip) => { ipAddressRef.current = ip })
  }, [])

  // Subscribe to auth config. On every change, re-validate the unlock.
  useEffect(() => {
    const unsub = subscribeToAuthConfig((cfg) => {
      setAuthConfig(cfg)
      // Keep localStorage in sync so next load works offline.
      if (cfg) saveCachedAuthConfig(cfg)
      if (!cfg) return

      const entered = lastPasscodeRef.current
      if (!entered) return

      const matchesEdit = entered === cfg.editPasscode
      const matchesView = entered === cfg.viewPasscode

      if (matchesEdit)                      setAuthLevel('edit')
      else if (matchesView && cfg.accessEnabled !== false) setAuthLevel('view')
      else {
        // Passcode no longer valid (rotated, or kill switch flipped).
        lastPasscodeRef.current = null
        setAuthLevel('locked')
        endSession(deviceIdRef.current).catch(() => {})
      }
    })
    return unsub
  }, [])

  // Heartbeat while unlocked — updates lastSeenAt so the admin sees fresh
  // activity in the sessions panel.
  useEffect(() => {
    if (authLevel === 'locked') return
    const id = setInterval(() => {
      touchSession(deviceIdRef.current)
    }, HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [authLevel])

  // Best-effort cleanup when the tab closes.
  useEffect(() => {
    function handleUnload() { endSession(deviceIdRef.current).catch(() => {}) }
    window.addEventListener('pagehide', handleUnload)
    return () => window.removeEventListener('pagehide', handleUnload)
  }, [])

  function unlock(passcode) {
    if (!authConfig) return false

    const matchesEdit = passcode === authConfig.editPasscode
    const matchesView = passcode === authConfig.viewPasscode

    // Edit code bypasses the kill switch — admin can always get in.
    if (matchesEdit) {
      lastPasscodeRef.current = passcode
      setAuthLevel('edit')
      registerSessionForRole('edit', deviceIdRef, ipAddressRef)
      return 'edit'
    }

    if (matchesView && authConfig.accessEnabled !== false) {
      lastPasscodeRef.current = passcode
      setAuthLevel('view')
      registerSessionForRole('view', deviceIdRef, ipAddressRef)
      return 'view'
    }

    return false
  }

  function lock() {
    lastPasscodeRef.current = null
    setAuthLevel('locked')
    endSession(deviceIdRef.current).catch(() => {})
  }

  const value = {
    authConfig,
    authLevel,
    isEditMode: authLevel === 'edit',
    isUnlocked: authLevel !== 'locked',
    unlock,
    lock,
    deviceId: deviceIdRef.current,
  }

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>
}

function registerSessionForRole(role, deviceIdRef, ipRef) {
  registerSession(deviceIdRef.current, {
    deviceName: describeDevice(),
    userAgent:  navigator.userAgent,
    ipAddress:  ipRef.current ?? null,
    unlockedAs: role,
  }).catch((err) => console.warn('[auth] session register failed', err))
}

export function useEditModeContext() {
  return useContext(EditModeContext)
}
