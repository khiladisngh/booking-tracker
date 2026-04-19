import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

export default function SyncStatus() {
  const pendingWrites = useStore((s) => s.pendingWrites)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const up   = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online',  up)
      window.removeEventListener('offline', down)
    }
  }, [])

  const status = !online ? 'offline' : pendingWrites > 0 ? 'syncing' : 'synced'

  return (
    <div className="flex items-center gap-1.5">
      {status === 'synced' && (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-lo">Synced</span>
        </>
      )}
      {status === 'syncing' && (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] text-lo">Syncing…</span>
        </>
      )}
      {status === 'offline' && (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span className="text-[11px] text-lo">Offline</span>
        </>
      )}
    </div>
  )
}
