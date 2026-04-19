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
  const [slowLoad, setSlowLoad] = useState(false)

  const locked = authLevel === 'locked'
  const loading = authConfig === null
  const killSwitchOn = authConfig && authConfig.accessEnabled === false

  useEffect(() => {
    if (!loading) { setSlowLoad(false); return }
    const t = setTimeout(() => setSlowLoad(true), 6000)
    return () => clearTimeout(t)
  }, [loading])

  useEffect(() => {
    if (locked) {
      setDigits([])
      setShake(false)
      setErrMsg('')
    }
  }, [locked])

  const handleSubmit = useCallback((currentDigits) => {
    if (loading) {
      setErrMsg('Connecting to server — try again in a moment')
      setShake(true)
      setTimeout(() => { setShake(false); setDigits([]) }, 400)
      setTimeout(() => setErrMsg(''), 2500)
      return
    }
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
  }, [unlock, killSwitchOn, loading])

  useEffect(() => {
    if (digits.length === 4) handleSubmit(digits)
  }, [digits]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleKey(key) {
    if (key === 'clear')  { setDigits((d) => d.slice(0, -1)); return }
    if (key === 'submit') { if (digits.length > 0) handleSubmit(digits); return }
    if (digits.length < 4) setDigits((d) => [...d, key])
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
            transition={{ duration: 0.25 }}
            className="gate-scrim fixed inset-0 z-[80] flex flex-col items-center justify-center px-6"
            style={{
              paddingTop:    'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 24, opacity: 0 }}
              animate={{ scale: 1,    y: 0,  opacity: 1 }}
              exit={{    scale: 0.94, y: 12, opacity: 0 }}
              transition={SPRING}
              className="glass-heavy w-full max-w-xs rounded-[28px] px-6 pt-8 pb-7"
            >
              {/* Header icon */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--ds-overlay)', border: '1px solid var(--ds-border)' }}
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
                {loading
                  ? (slowLoad ? 'Check your connection…' : 'Connecting…')
                  : 'Enter passcode to continue'}
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
                      background: i < digits.length ? 'var(--ds-accent)' : 'var(--ds-border)',
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
                      className="text-[12px] font-medium text-urgent"
                    >
                      {errMsg}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* NumPad */}
              <div className="grid grid-cols-3 gap-2.5">
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
        className="numkey h-14 rounded-[16px] flex items-center justify-center transition-colors"
        aria-label="Clear"
      >
        <Delete size={20} strokeWidth={1.8} className="text-lo" />
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
      className="numkey h-14 rounded-[16px] text-[22px] font-semibold text-hi transition-colors"
      aria-label={value}
    >
      {value}
    </motion.button>
  )
}
