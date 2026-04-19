import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, BellOff, CloudUpload, CalendarCheck, ChevronRight, Lock,
} from 'lucide-react'
import PullToRefresh from '../components/PullToRefresh'
import BackupSheet from '../components/BackupSheet'
import AdminPanel  from '../components/AdminPanel'
import { useStore } from '../store/useStore'
import { useEditModeContext } from '../context/EditModeContext'
import { downloadICS } from '../services/icsExport'

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 360, damping: 36 } },
}

function NotificationBanner({ permission, onPermissionChange }) {
  if (!('Notification' in window)) return null
  if (permission === 'granted') {
    return (
      <motion.div variants={cardVariants} className="glass rounded-[16px] p-4 flex gap-3 items-start">
        <Bell size={18} strokeWidth={1.8} className="text-accent shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-hi">Reminders enabled</p>
          <p className="text-[12px] text-lo mt-0.5">You'll be notified before each arrival.</p>
        </div>
      </motion.div>
    )
  }

  async function handleEnable() {
    const result = await Notification.requestPermission()
    onPermissionChange(result)
  }

  const isDenied = permission === 'denied'

  return (
    <motion.div variants={cardVariants} className="glass rounded-[16px] p-4 flex gap-3 items-start">
      <div className="shrink-0 mt-0.5 text-accent">
        {isDenied
          ? <BellOff size={18} strokeWidth={1.8} />
          : <Bell    size={18} strokeWidth={1.8} />}
      </div>
      <div className="flex-1 min-w-0">
        {isDenied ? (
          <>
            <p className="text-[13px] font-medium text-hi">Notifications blocked</p>
            <p className="text-[12px] text-lo mt-0.5">Enable in device Settings to receive arrival reminders.</p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-medium text-hi">Enable reminders</p>
            <p className="text-[12px] text-lo mt-0.5">Get notified before each arrival.</p>
            <button
              onClick={handleEnable}
              className="mt-3 bg-accent text-white rounded-[10px] px-4 py-2 text-[13px] font-medium active:bg-accent-press transition-colors duration-[120ms] min-h-[44px]"
            >
              Enable notifications
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default function SettingsScreen() {
  const bookings     = useStore((s) => s.bookings)
  const { isEditMode } = useEditModeContext()

  const [notifPermission, setNotifPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [backupOpen, setBackupOpen] = useState(false)

  return (
    <PullToRefresh className="overflow-y-auto pb-28 px-4 space-y-5 pt-4">

      <section aria-label="Notifications">
        <h2 className="section-label mb-2">Notifications</h2>
        <NotificationBanner
          permission={notifPermission}
          onPermissionChange={setNotifPermission}
        />
      </section>

      <section aria-label="Data">
        <h2 className="section-label mb-2">Data</h2>
        <div className="glass rounded-[16px] overflow-hidden divide-y divide-white/[0.06]">
          <motion.button
            type="button"
            onClick={() => setBackupOpen(true)}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="w-full px-4 py-3 flex items-center justify-between touch-target"
          >
            <div className="flex items-center gap-3">
              <CloudUpload size={18} className="text-accent" strokeWidth={1.8} />
              <span className="text-[13px] text-hi">Backup &amp; Restore</span>
            </div>
            <ChevronRight size={16} className="text-lo" strokeWidth={2} />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => downloadICS(bookings)}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="w-full px-4 py-3 flex items-center justify-between touch-target"
          >
            <div className="flex items-center gap-3">
              <CalendarCheck size={18} className="text-accent" strokeWidth={1.8} />
              <span className="text-[13px] text-hi">Export to Calendar (.ics)</span>
            </div>
            <ChevronRight size={16} className="text-lo" strokeWidth={2} />
          </motion.button>
        </div>
      </section>

      {isEditMode ? (
        <AdminPanel />
      ) : (
        <section aria-label="Admin controls locked">
          <h2 className="section-label mb-2">Admin</h2>
          <div className="glass rounded-[16px] p-4 flex gap-3 items-start">
            <Lock size={18} className="text-lo shrink-0 mt-0.5" strokeWidth={1.8} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-hi">Unlock edit mode for admin controls</p>
              <p className="text-[12px] text-lo mt-0.5">Passcode management, access control, and active sessions.</p>
            </div>
          </div>
        </section>
      )}

      <BackupSheet isOpen={backupOpen} onClose={() => setBackupOpen(false)} />
    </PullToRefresh>
  )
}
