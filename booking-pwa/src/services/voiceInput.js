import { useState, useRef, useCallback } from 'react'

export function useVoiceInput({ onResult } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef(null)
  const finalRef = useRef('')

  const isSupported = Boolean(
    typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
  )

  const start = useCallback(() => {
    if (!isSupported) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition
    finalRef.current = ''

    recognition.onstart = () => {
      setIsListening(true)
      setInterimText('')
    }

    recognition.onresult = (event) => {
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

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
      const text = finalRef.current.trim()
      if (text) onResult?.(text)
    }

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech error:', e.error)
      }
      setIsListening(false)
      setInterimText('')
    }

    recognition.start()
  }, [isSupported, onResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { isListening, interimText, isSupported, start, stop }
}
