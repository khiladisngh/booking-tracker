import { LogIn, LogOut, BedDouble } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function TodayBanner() {
  const getTodayStats = useStore((s) => s.getTodayStats)
  const { arrivingToday, departingToday, occupied } = getTodayStats()

  if (arrivingToday.length === 0 && departingToday.length === 0 && occupied.length === 0) {
    return null
  }

  return (
    <div className="glass rounded-[16px] px-3 py-3 flex items-center justify-between gap-2">
      <StatPill value={arrivingToday.length}  label="Arriving"  accent="var(--ds-red)"   Icon={LogIn}    />
      <div className="w-px h-5 bg-white/10 shrink-0" />
      <StatPill value={departingToday.length} label="Departing" accent="var(--ds-amber)" Icon={LogOut}   />
      <div className="w-px h-5 bg-white/10 shrink-0" />
      <StatPill value={occupied.length}       label="Occupied"  accent="var(--ds-green)" Icon={BedDouble} />
    </div>
  )
}

function StatPill({ value, label, accent, Icon }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon size={13} style={{ color: accent }} strokeWidth={2} className="shrink-0" />
      <span className="text-lg font-bold tabular-nums leading-none shrink-0" style={{ color: accent }}>
        {value}
      </span>
      <span className="text-[12px] text-lo truncate">{label}</span>
    </div>
  )
}
