import { useStore } from '../store/useStore'

export default function TodayBanner() {
  const getTodayStats = useStore((s) => s.getTodayStats)
  const { arrivingToday, departingToday, occupied } = getTodayStats()

  if (arrivingToday.length === 0 && departingToday.length === 0 && occupied.length === 0) {
    return null
  }

  return (
    <div className="bg-surface rounded-[14px] border border-line px-4 py-3 flex items-center justify-between">
      <span className="section-label">Status</span>
      <div className="flex items-center gap-5">
        <StatPill value={arrivingToday.length} label="Arriving" accent="var(--ds-red)" />
        <div className="w-px h-5 bg-line" />
        <StatPill value={departingToday.length} label="Departing" accent="var(--ds-amber)" />
        <div className="w-px h-5 bg-line" />
        <StatPill value={occupied.length} label="Occupied" accent="var(--ds-green)" />
      </div>
    </div>
  )
}

function StatPill({ value, label, accent }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xl font-bold tabular-nums leading-none" style={{ color: accent }}>
        {value}
      </span>
      <span className="text-[12px] text-lo">{label}</span>
    </div>
  )
}
