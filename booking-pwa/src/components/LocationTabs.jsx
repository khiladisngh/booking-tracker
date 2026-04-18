import { useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function LocationTabs() {
  const bookings = useStore((s) => s.bookings)
  const activeLocation = useStore((s) => s.activeLocation)
  const setActiveLocation = useStore((s) => s.setActiveLocation)

  const uniqueLocations = useMemo(
    () => [...new Set(bookings.map((b) => b.location).filter(Boolean))].sort(),
    [bookings]
  )

  const tabs = [{ id: 'all', name: 'All' }, ...uniqueLocations.map((loc) => ({ id: loc, name: loc }))]

  return (
    <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeLocation === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveLocation(tab.id)}
            className={[
              'h-8 px-4 rounded-full text-[13px] font-medium whitespace-nowrap',
              'transition-colors duration-[120ms] focus-ring',
              isActive
                ? 'bg-accent text-white'
                : 'bg-raised text-lo border border-line',
            ].join(' ')}
          >
            {tab.name}
          </button>
        )
      })}
    </div>
  )
}
