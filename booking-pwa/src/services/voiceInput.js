import { useState, useRef, useCallback, useEffect } from 'react'

const IDLE_MS = 60_000

export function useVoiceInput({ onResult } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  const finalRef = useRef('')
  const activeRef = useRef(false)
  const recRef = useRef(null)
  const idleRef = useRef(null)
  const restartRef = useRef(null)
  const onResultRef = useRef(onResult)

  useEffect(() => { onResultRef.current = onResult }, [onResult])

  const isSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  // Deliver accumulated transcript and close
  function finish() {
    activeRef.current = false
    clearTimeout(idleRef.current)
    clearTimeout(restartRef.current)
    try { recRef.current?.stop() } catch {}
    setIsListening(false)
    setTranscript('')
    const text = finalRef.current.trim()
    finalRef.current = ''
    if (text) onResultRef.current?.(text)
  }

  // Create a new recognition instance and start it
  function launch() {
    if (!activeRef.current) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = false   // more reliable on mobile; we handle restart in onend
    rec.interimResults = true
    recRef.current = rec

    rec.onresult = (event) => {
      // Any speech resets the idle timer
      clearTimeout(idleRef.current)
      idleRef.current = setTimeout(finish, IDLE_MS)

      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) finalRef.current += r[0].transcript + ' '
        else interim += r[0].transcript
      }
      // Show everything heard so far + current interim word
      setTranscript((finalRef.current + interim).trim())
    }

    rec.onend = () => {
      if (activeRef.current) {
        // Natural silence pause — restart to keep listening
        restartRef.current = setTimeout(launch, 300)
      } else {
        setIsListening(false)
        setTranscript('')
      }
    }

    rec.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        finish()
        return
      }
      console.warn('Voice error:', e.error)
    }

    try {
      rec.start()
    } catch (e) {
      console.warn('Recognition start failed:', e)
    }
  }

  const start = useCallback(() => {
    if (!isSupported || activeRef.current) return
    finalRef.current = ''
    activeRef.current = true
    setIsListening(true)
    setTranscript('')

    // Start 60s idle timer; resets on every word heard
    clearTimeout(idleRef.current)
    idleRef.current = setTimeout(finish, IDLE_MS)

    launch()
  }, [isSupported])

  const stop = useCallback(() => {
    finish()
  }, [])

  return { isListening, interimText: transcript, isSupported, start, stop }
}
