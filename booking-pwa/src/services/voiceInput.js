import { useState, useRef, useCallback, useEffect } from 'react'

const IDLE_TIMEOUT_MS = 60_000

export function useVoiceInput({ onResult } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')

  const recognitionRef = useRef(null)
  const finalRef = useRef('')
  const activeRef = useRef(false)
  const idleTimerRef = useRef(null)
  const onResultRef = useRef(onResult)
  // Forward ref so onend can call startInstance without stale closure
  const startInstanceRef = useRef(null)

  useEffect(() => { onResultRef.current = onResult }, [onResult])

  const isSupported = Boolean(
    typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
  )

  function deliverResult() {
    const text = finalRef.current.trim()
    finalRef.current = ''
    if (text) onResultRef.current?.(text)
  }

  function deactivate() {
    activeRef.current = false
    clearTimeout(idleTimerRef.current)
    setIsListening(false)
    setInterimText('')
  }

  function resetIdleTimer() {
    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      if (activeRef.current) {
        recognitionRef.current?.stop()
        deactivate()
        deliverResult()
      }
    }, IDLE_TIMEOUT_MS)
  }

  startInstanceRef.current = function startInstance() {
    if (!activeRef.current || !isSupported) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = false   // false is more reliable on mobile; we handle restart manually
    rec.interimResults = true
    recognitionRef.current = rec

    rec.onresult = (event) => {
      resetIdleTimer()
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) {
          finalRef.current += r[0].transcript + ' '
        } else {
          interim += r[0].transcript
        }
      }
      setInterimText(interim)
    }

    rec.onend = () => {
      setInterimText('')
      if (activeRef.current) {
        // Short silence ended the session — restart immediately
        setTimeout(() => startInstanceRef.current?.(), 200)
      } else {
        setIsListening(false)
      }
    }

    rec.onerror = (e) => {
      if (e.error === 'aborted') return
      if (e.error === 'no-speech') return  // onend fires next, which restarts
      console.warn('Speech recognition error:', e.error)
      // Attempt recovery after non-fatal errors
      if (activeRef.current) setTimeout(() => startInstanceRef.current?.(), 500)
    }

    try {
      rec.start()
      setIsListening(true)
    } catch {
      // Already running — ignore
    }
  }

  const start = useCallback(() => {
    if (!isSupported || activeRef.current) return
    finalRef.current = ''
    activeRef.current = true
    resetIdleTimer()
    startInstanceRef.current()
  }, [isSupported])

  const stop = useCallback(() => {
    if (!activeRef.current) return
    recognitionRef.current?.stop()
    deactivate()
    deliverResult()
  }, [])

  return { isListening, interimText, isSupported, start, stop }
}
