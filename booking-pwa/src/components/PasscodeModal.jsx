import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Delete } from 'lucide-react'
import { useEditModeContext } from '../context/EditModeContext'

const SPRING = { type: 'spring', stiffness: 380, damping: 36 }

const PAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'submit'],
]

export default function PasscodeModal({ isOpen, onClose }) {
  const { unlock } = useEditModeContext()
  const [digits, setDigits]   = useState([])
  const [error, setError]     = useState(false)
  const [shake, setShake]     = useState(false)
  const [errMsg, setErrMsg]   = useState(false)

  // Clear state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits([])
      setError(false)
      setShake(false)
      setErrMsg(false)
    }
  }, [isOpen])

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (digits.length === 4) handleSubmit(digits)
  }, [digits]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback((currentDigits) => {
    const passcode = currentDigits.join('')
    if (unlock(passcode)) {
      onClose()
    } else {
      setShake(true)
      setErrMsg(true)
      setTimeout(() => {
        setShake(false)
        setDigits([])
      }, 400)
      setTimeout(() => setErrMsg(false), 2000)
    }
  }, [unlock, onClose])

  function handleKey(key) {
    if (key === 'clear') {
      setDigits((d) => d.slice(0, -1))
      return
    }
    if (key === 'submit') {
      if (digits.length > 0) handleSubmit(digits)
      return
    }
    if (digits.length < 4) {
      setDigits((d) => [...d, key])
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="passcode-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal card */}
          <motion.div
            key="passcode-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={SPRING}
            className="fixed inset-x-0 bottom-0 z-[61] flex items-end justify-center sm:items-center sm:inset-0"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="glass-heavy rounded-t-[28px] sm:rounded-[28px] w-full max-w-xs px-6 pt-6 pb-10 sm:pb-8"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Header */}
              <p className="text-center text-[17px] font-bold text-hi mb-1">Enter Passcode</p>
              <p className="text-center text-[13px] text-lo mb-6">4-digit code to unlock edit mode</p>

              {/* Dot indicators */}
              <motion.div
                animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center gap-4 mb-2"
              >
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: digits.length === i + 1 ? [1, 1.25, 1] : 1,
                      background: i < digits.length
                        ? (error ? 'var(--ds-urgent)' : 'var(--ds-accent)')
                        : 'rgba(255,255,255,0.15)',
                    }}
                    transition={{ duration: 0.18 }}
                    className="w-3.5 h-3.5 rounded-full"
                  />
                ))}
              </motion.div>

              {/* Error message */}
              <div className="h-5 flex items-center justify-center mb-4">
                <AnimatePresence>
                  {errMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[12px] font-medium"
                      style={{ color: 'var(--ds-urgent)' }}
                    >
                      Incorrect passcode
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* NumPad */}
              <div className="grid grid-cols-3 gap-3">
                {PAD_KEYS.flat().map((key) => (
                  <NumKey key={key} value={key} onPress={handleKey} />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function NumKey({ value, onPress }) {
  const isAction = value === 'clear' || value === 'submit'

  if (value === 'clear') {
    return (
      <motion.button
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        onClick={() => onPress('clear')}
        className="h-14 rounded-[16px] flex items-center justify-center text-lo active:text-hi transition-colors"
        style={{ background: 'rgba(255,255,255,0.07)' }}
        aria-label="Clear"
      >
        <Delete size={20} strokeWidth={1.8} />
      </motion.button>
    )
  }

  if (value === 'submit') {
    return (
      <motion.button
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        onClick={() => onPress('submit')}
        className="h-14 rounded-[16px] flex items-center justify-center text-[15px] font-semibold"
        style={{ background: 'var(--ds-accent)', color: 'white' }}
        aria-label="Submit"
      >
        OK
      </motion.button>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      onClick={() => onPress(value)}
      className="h-14 rounded-[16px] text-[22px] font-medium text-hi transition-colors"
      style={{ background: 'rgba(255,255,255,0.07)' }}
      aria-label={value}
    >
      {value}
    </motion.button>
  )
}
