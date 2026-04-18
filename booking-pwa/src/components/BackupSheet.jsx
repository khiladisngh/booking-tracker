import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { CloudUpload, CloudDownload, Trash2, Clock, CheckCircle2, AlertCircle, Wifi } from 'lucide-react'
import {
  initGoogleAuth,
  requestToken,
  signOut,
  getAccessToken,
  fetchBackupList,
  backupNow,
  restoreBackup,
  deleteBackup,
  shouldRunScheduledBackup,
} from '../services/googleDrive'
import { useStore } from '../store/useStore'

const SPRING = { type: 'spring', stiffness: 380, damping: 36 }

function formatBackupName(name) {
  const m = name.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})/)
  if (!m) return name
  const [, yr, mo, dy, hr, mn] = m
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${dy} ${months[parseInt(mo, 10) - 1]} ${yr}, ${hr}:${mn}`
}

export default function BackupSheet({ isOpen, onClose }) {
  const bookings    = useStore((s) => s.bookings)
  const setBookings = useStore((s) => s.setBookings)
  const backupTime  = useStore((s) => s.backupTime)
  const setBackupTime = useStore((s) => s.setBackupTime)

  const [isConnected, setIsConnected] = useState(false)
  const [backups, setBackups]         = useState([])
  const [status, setStatus]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [restoring, setRestoring]     = useState(null)
  const [deleting, setDeleting]       = useState(null)

  const bookingsRef = useRef(bookings)
  useEffect(() => { bookingsRef.current = bookings }, [bookings])

  const refreshBackups = useCallback(async () => {
    try {
      const list = await fetchBackupList()
      setBackups(list)
      return list
    } catch {
      setBackups([])
      return []
    }
  }, [])

  const runScheduledCheck = useCallback(async () => {
    const list = await fetchBackupList()
    setBackups(list)
    const lastISO = list[0]?.createdTime ?? null
    if (shouldRunScheduledBackup(backupTime, lastISO)) {
      try {
        await backupNow(bookingsRef.current)
        await refreshBackups()
      } catch {} // eslint-disable-line no-empty
    }
  }, [backupTime, refreshBackups])

  useEffect(() => {
    if (!window.google) return
    initGoogleAuth({
      onSignIn:  () => { setIsConnected(true); runScheduledCheck() },
      onSignOut: () => { setIsConnected(false); setBackups([]) },
    })
    if (getAccessToken()) { setIsConnected(true); runScheduledCheck() }
  }, [runScheduledCheck])

  useEffect(() => {
    if (!isConnected) return
    const interval = setInterval(runScheduledCheck, 60_000)
    return () => clearInterval(interval)
  }, [isConnected, runScheduledCheck])

  useEffect(() => {
    if (isOpen && isConnected) refreshBackups()
  }, [isOpen, isConnected, refreshBackups])

  async function handleConnect() {
    setStatus(null)
    try { await requestToken() }
    catch { setStatus({ type: 'err', msg: 'Could not connect to Google.' }) }
  }

  function handleDisconnect() {
    signOut()
    setIsConnected(false)
    setBackups([])
    setStatus(null)
  }

  async function handleBackupNow() {
    setLoading(true)
    setStatus(null)
    try {
      await backupNow(bookings)
      await refreshBackups()
      setStatus({ type: 'ok', msg: 'Backup saved.' })
    } catch (e) {
      setStatus({ type: 'err', msg: e.message ?? 'Backup failed.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(fileId) {
    setRestoring(fileId)
    setStatus(null)
    try {
      const merged = await restoreBackup(fileId, bookings)
      setBookings(merged)
      setStatus({ type: 'ok', msg: `Restored — ${merged.length} bookings.` })
    } catch (e) {
      setStatus({ type: 'err', msg: e.message ?? 'Restore failed.' })
    } finally {
      setRestoring(null)
    }
  }

  async function handleDelete(fileId) {
    setDeleting(fileId)
    setStatus(null)
    try {
      await deleteBackup(fileId)
      await refreshBackups()
    } catch (e) {
      setStatus({ type: 'err', msg: e.message ?? 'Delete failed.' })
    } finally {
      setDeleting(null)
    }
  }

  const gisAvailable = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <>
      {/* Overlay */}
      <motion.div
        aria-hidden="true"
        onClick={isOpen ? onClose : undefined}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Cloud Backup"
        animate={{ y: isOpen ? 0 : '100%' }}
        transition={SPRING}
        className="fixed bottom-0 left-0 right-0 z-50 glass-heavy rounded-t-[28px] max-h-[85vh] flex flex-col"
      >
        {/* Handle */}
        <button type="button" aria-label="Close sheet" onClick={onClose}
          className="flex justify-center pt-3 pb-1 w-full shrink-0 touch-target">
          <span className="w-9 h-1 rounded-full bg-white/20" />
        </button>

        <div className="flex flex-col flex-1 overflow-y-auto px-5 pb-8 pt-2 min-h-0 gap-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <CloudUpload size={20} className="text-accent" strokeWidth={1.8} />
            <h2 className="text-[18px] font-bold text-hi">Cloud Backup</h2>
          </div>

          {!gisAvailable && (
            <div className="glass rounded-[14px] p-4">
              <p className="text-warn text-[13px] font-semibold mb-1">Google Client ID not configured</p>
              <p className="text-lo text-[12px]">
                Set <span className="text-hi font-mono">VITE_GOOGLE_CLIENT_ID</span> in your{' '}
                <span className="text-hi font-mono">.env</span> file and rebuild.
              </p>
            </div>
          )}

          {gisAvailable && !isConnected && (
            <button type="button" onClick={handleConnect}
              className="btn-primary touch-target flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect Google Drive
            </button>
          )}

          {gisAvailable && isConnected && (
            <>
              {/* Connected status */}
              <div className="glass rounded-[14px] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-ok" strokeWidth={2} />
                  <span className="text-[13px] text-hi">Google Drive connected</span>
                </div>
                <button type="button" onClick={handleDisconnect}
                  className="text-[12px] text-lo hover:text-urgent transition-colors">
                  Disconnect
                </button>
              </div>

              {/* Daily backup time */}
              <div className="glass rounded-[14px] px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-lo shrink-0" strokeWidth={1.8} />
                  <div>
                    <p className="text-[13px] text-hi font-medium">Daily backup</p>
                    <p className="text-[11px] text-lo">Runs once per day automatically</p>
                  </div>
                </div>
                <input
                  type="time"
                  value={backupTime}
                  onChange={(e) => setBackupTime(e.target.value)}
                  className="field !w-auto text-[13px] px-2 py-1.5"
                />
              </div>

              {/* Manual backup */}
              <button type="button" onClick={handleBackupNow} disabled={loading}
                className="btn-primary touch-target disabled:opacity-50 flex items-center justify-center gap-2">
                <CloudUpload size={16} strokeWidth={2} />
                {loading ? 'Backing up…' : 'Backup Now'}
              </button>

              {/* Status message */}
              {status && (
                <div className={`flex items-center gap-2 text-[13px] ${status.type === 'ok' ? 'text-ok' : 'text-urgent'}`}>
                  {status.type === 'ok'
                    ? <CheckCircle2 size={15} strokeWidth={2} />
                    : <AlertCircle  size={15} strokeWidth={2} />}
                  {status.msg}
                </div>
              )}

              {/* Backup list */}
              {backups.length > 0 && (
                <div>
                  <p className="section-label mb-3">Saved Backups</p>
                  <ul className="space-y-2">
                    {backups.map((f) => (
                      <li key={f.id}
                        className="glass flex items-center justify-between rounded-[14px] px-4 py-3 gap-3">
                        <span className="text-[13px] text-hi truncate">{formatBackupName(f.name)}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <button type="button" onClick={() => handleRestore(f.id)}
                            disabled={!!restoring || !!deleting}
                            className="flex items-center gap-1 text-[12px] text-accent hover:text-accent/80 transition-colors disabled:opacity-50">
                            <CloudDownload size={13} strokeWidth={2} />
                            {restoring === f.id ? 'Restoring…' : 'Restore'}
                          </button>
                          <button type="button" onClick={() => handleDelete(f.id)}
                            disabled={!!restoring || !!deleting}
                            className="flex items-center text-dim hover:text-urgent transition-colors disabled:opacity-50"
                            aria-label="Delete backup">
                            {deleting === f.id
                              ? <span className="text-[11px] text-lo">…</span>
                              : <Trash2 size={14} strokeWidth={1.8} />}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {backups.length === 0 && !loading && (
                <p className="text-lo text-[13px]">No backups yet. Tap Backup Now to create one.</p>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
