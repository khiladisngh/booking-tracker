import { motion } from 'framer-motion'

const TABS = [
  { id: 'all',        label: 'All' },
  { id: 'room',       label: 'Rooms' },
  { id: 'helicopter', label: 'Helicopters' },
]

const SPRING = { type: 'spring', stiffness: 420, damping: 38 }

export default function TypeFilterTabs({ value, onChange }) {
  return (
    <div className="flex gap-2 px-4 pt-2.5 pb-1 overflow-x-auto scrollbar-none">
      {TABS.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          whileTap={{ scale: 0.93 }}
          transition={SPRING}
          className={[
            'shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150',
            value === tab.id
              ? 'bg-accent text-white'
              : 'glass text-lo',
          ].join(' ')}
        >
          {tab.label}
        </motion.button>
      ))}
    </div>
  )
}
