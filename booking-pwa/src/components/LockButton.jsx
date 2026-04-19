import { motion } from 'framer-motion'
import { Lock, LockOpen } from 'lucide-react'
import { useEditModeContext } from '../context/EditModeContext'

const SPRING = { type: 'spring', stiffness: 420, damping: 38 }

export default function LockButton({ onOpenModal }) {
  const { isEditMode, lock } = useEditModeContext()

  function handlePress() {
    if (isEditMode) {
      lock()
    } else {
      onOpenModal()
    }
  }

  return (
    <motion.button
      onClick={handlePress}
      whileTap={{ scale: 0.88 }}
      transition={SPRING}
      aria-label={isEditMode ? 'Lock editing' : 'Unlock editing'}
      className="fixed right-4 z-[45] w-11 h-11 rounded-full flex items-center justify-center pointer-events-auto transition-colors duration-200"
      style={{
        bottom: 'calc(max(env(safe-area-inset-bottom), 16px) + 72px)',
        background: isEditMode ? 'rgba(52, 199, 89, 0.18)' : 'rgba(255,255,255,0.1)',
        border: isEditMode ? '1px solid rgba(52,199,89,0.35)' : '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {isEditMode
        ? <LockOpen size={17} strokeWidth={2} style={{ color: 'rgb(52,199,89)' }} />
        : <Lock size={17} strokeWidth={2} className="text-lo" />
      }
    </motion.button>
  )
}
