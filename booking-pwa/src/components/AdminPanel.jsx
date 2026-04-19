import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, ShieldAlert, Users, Eye, EyeOff, KeyRound, Check, X, Pencil, Circle,
} from 'lucide-react'
import { useEditModeContext } from '../context/EditModeContext'
import {
  subscribeToSessions,
  updateAuthConfig,
  endSession,
} from '../services/firestoreSync'

const SPRING = { type: 'spring', stiffness: 380, damping: 36 }
const STALE_MS = 2 * 60_000   // sessions silent longer than this are hidden

export default function AdminPanel() {
  const { authConfig, deviceId } = useEditModeContext()

  if (!authConfig) return null

  return (
    <section aria-label="Admin controls">
      <h2 className="section-label mb-2">Admin</h2>
      <div className="glass rounded-[16px] overflow-hidden divide-y divide-white/[0.06]">
        <PasscodeRow
          label="Viewing passcode"
          current={authConfig.viewPasscode}
          onSave={(val) => updateAuthConfig({ viewPasscode: val })}
        />
        <PasscodeRow
          label="Edit passcode"
          current={authConfig.editPasscode}
          onSave={(val) => updateAuthConfig({ editPasscode: val })}
        />
        <KillSwitchRow authConfig={authConfig} />
      </div>

      <SessionsList currentDeviceId={deviceId} />
    </section>
  )
}

// ─── Passcode editor row ──────────────────────────────────────────────────────

function PasscodeRow({ label, current, onSave }) {
  const [editing, setEditing] = useState(false)
  const [show,    setShow]    = useState(false)
  const [value,   setValue]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (editing) { setValue(''); setError('') }
  }, [editing])

  async function handleSave() {
    if (!/^\d{4}$/.test(value)) { setError('Must be exactly 4 digits'); return }
    if (value === current)      { setError('Same as current'); return }
    setSaving(true)
    try {
      await onSave(value)
      setEditing(false)
    } catch (err) {
      console.error(err)
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <KeyRound size={18} className="text-accent shrink-0" strokeWidth={1.8} />
          <div className="min-w-0">
            <p className="text-[13px] text-hi">{label}</p>
            <p className="text-[12px] text-lo tabular-nums">
              {show ? current : '••••'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShow((s) => !s)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-lo active:text-hi"
            aria-label={show ? 'Hide' : 'Show'}
          >
            {show ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
          </button>
          <button
            onClick={() => setEditing((e) => !e)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-lo active:text-hi"
            aria-label="Edit"
          >
            {editing ? <X size={15} strokeWidth={2} /> : <Pencil size={14} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={value}
                onChange={(e) => { setValue(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                placeholder="New 4-digit code"
                className="flex-1 bg-white/5 rounded-[10px] px-3 py-2 text-[14px] text-hi tabular-nums outline-none focus:bg-white/10"
              />
              <motion.button
                whileTap={{ scale: 0.94 }}
                transition={SPRING}
                onClick={handleSave}
                disabled={saving || value.length !== 4}
                className="px-4 rounded-[10px] bg-accent text-white text-[13px] font-semibold disabled:opacity-40 flex items-center gap-1.5"
              >
                <Check size={14} strokeWidth={2.2} />
                {saving ? 'Saving…' : 'Save'}
              </motion.button>
            </div>
            {error && (
              <p className="text-[12px] mt-2" style={{ color: 'var(--ds-urgent)' }}>{error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Kill switch row ──────────────────────────────────────────────────────────

function KillSwitchRow({ authConfig }) {
  const enabled = authConfig.accessEnabled !== false
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    try {
      await updateAuthConfig({ accessEnabled: !enabled })
    } catch (err) {
      console.error('[admin] kill-switch update failed', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {enabled
          ? <ShieldCheck size={18} className="text-accent shrink-0" strokeWidth={1.8} />
          : <ShieldAlert size={18} className="shrink-0" strokeWidth={1.8} style={{ color: 'var(--ds-urgent)' }} />
        }
        <div className="min-w-0">
          <p className="text-[13px] text-hi">Allow viewers</p>
          <p className="text-[12px] text-lo">
            {enabled ? 'Viewers can unlock with the viewing passcode' : 'All viewer access is blocked'}
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        aria-label={enabled ? 'Disable viewer access' : 'Enable viewer access'}
        className="relative w-[46px] h-[26px] rounded-full transition-colors duration-200 shrink-0"
        style={{ background: enabled ? 'var(--ds-accent)' : 'rgba(255,255,255,0.15)' }}
      >
        <motion.span
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  )
}

// ─── Active sessions list ─────────────────────────────────────────────────────

function SessionsList({ currentDeviceId }) {
  const [sessions, setSessions] = useState([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const unsub = subscribeToSessions(setSessions)
    return unsub
  }, [])

  // Refresh the "last seen" time display every 15s so the list stays fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(id)
  }, [])

  const activeSessions = sessions
    .filter((s) => {
      const seen = sessionMillis(s.lastSeenAt)
      return seen && now - seen < STALE_MS
    })
    .sort((a, b) => sessionMillis(b.lastSeenAt) - sessionMillis(a.lastSeenAt))

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-label">Active sessions</h3>
        <span className="flex items-center gap-1.5 text-[11px] text-lo">
          <Users size={12} strokeWidth={1.8} />
          {activeSessions.length}
        </span>
      </div>
      <div className="glass rounded-[16px] overflow-hidden">
        {activeSessions.length === 0 ? (
          <p className="text-[13px] text-dim text-center py-5">No active sessions</p>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {activeSessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                now={now}
                isSelf={s.id === currentDeviceId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SessionRow({ session, now, isSelf }) {
  const seen = sessionMillis(session.lastSeenAt)
  const role = session.unlockedAs ?? 'view'
  const roleColor = role === 'edit' ? 'var(--ds-green)' : 'var(--ds-accent)'

  function handleKick() {
    if (isSelf) return
    endSession(session.id).catch((err) => console.warn('[admin] kick failed', err))
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <Circle size={8} fill={roleColor} stroke="none" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] text-hi truncate">{session.deviceName ?? 'Unknown device'}</p>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: roleColor }}
          >
            {role}
          </span>
          {isSelf && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-lo shrink-0">
              you
            </span>
          )}
        </div>
        <p className="text-[11px] text-lo truncate">
          {session.ipAddress ?? '—'} · {formatRelative(seen, now)}
        </p>
      </div>
      {!isSelf && (
        <button
          onClick={handleKick}
          aria-label="End session"
          className="w-8 h-8 flex items-center justify-center rounded-full text-lo active:text-hi shrink-0"
        >
          <X size={15} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

// serverTimestamp() values come back as Firestore Timestamp objects;
// convert to millis, tolerating the brief pending-write state (null).
function sessionMillis(ts) {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts.seconds != null) return ts.seconds * 1000
  return new Date(ts).getTime()
}

function formatRelative(then, now) {
  if (!then) return 'just connected'
  const diff = Math.max(0, now - then)
  if (diff < 60_000)        return 'just now'
  const mins = Math.floor(diff / 60_000)
  if (mins < 60)            return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}
