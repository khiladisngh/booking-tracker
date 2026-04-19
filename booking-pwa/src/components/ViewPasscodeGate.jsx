import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Delete, Lock, ShieldAlert } from 'lucide-react'
import { useEditModeContext } from '../context/EditModeContext'

const SPRING = { type: 'spring', stiffness: 380, damping: 36 }

const PAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'submit'],
]

export default function ViewPasscodeGate({ children }) {
  const { authLevel, authConfig, unlock } = useEditModeContext()
  const [digits, setDigits] = useState([])
  const [shake,  setShake]  = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const locked = authLevel === 'locked'
  const killSwitchOn = authConfig && authConfig.accessEnabled === false

  // Reset input whenever we re-lock (e.g. kill switch flipped remotely).
  useEffect(() => {
    if (locked) {
      setDigits([])
      setShake(false)
      setErrMsg('')
    }
  }, [locked])

  const handleSubmit = useCallback((currentDigits) => {
    const passcode = currentDigits.join('')
    const result = unlock(passcode)
    if (result) {
      setDigits([])
      setErrMsg('')
    } else {
      setShake(true)
      setErrMsg(killSwitchOn ? 'Viewing is temporarily disabled' : 'Incorrect passcode')
      setTimeout(() => { setShake(false); setDigits([]) }, 400)
      setTimeout(() => setErrMsg(''), 2500)
    }
  }, [unlock, killSwitchOn])

  useEffect(() => {
    if (digits.length === 4) handleSubmit(digits)
  }, [digits]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleKey(key) {
    if (key === 'clear')  { setDigits((d) => d.slice(0, -1)); return }
    if (key === 'submit') { if (digits.length > 0) handleSubmit(digits); return }
    if (digits.length < 4) setDigits((d) => [...d, key])
  }

  // Auth config still loading — render nothing (avoid flash of locked UI).
  if (authConfig === null && locked) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {locked && (
          <motion.div
            key="view-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-6"
            style={{
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              paddingTop:    'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={SPRING}
              className="w-full max-w-xs"
            >
              {/* Header */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  {killSwitchOn
                    ? <ShieldAlert size={24} strokeWidth={1.8} className="text-accent" />
                    : <Lock        size={22} strokeWidth={1.8} className="text-accent" />
                  }
                </div>
              </div>

              <p className="text-center text-[18px] font-bold text-hi mb-1">
                Booking Manager
              </p>
              <p className="text-center text-[13px] text-lo mb-7">
                Enter passcode to continue
              </p>

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
                      background: i < digits.length ? 'var(--ds-accent)' : 'rgba(255,255,255,0.15)',
                    }}
                    transition={{ duration: 0.18 }}
                    className="w-3.5 h-3.5 rounded-full"
                  />
                ))}
              </motion.div>

              <div className="h-6 flex items-center justify-center mb-4">
                <AnimatePresence>
                  {errMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[12px] font-medium"
                      style={{ color: 'var(--ds-urgent)' }}
                    >
                      {errMsg}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NumKey({ value, onPress }) {
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
