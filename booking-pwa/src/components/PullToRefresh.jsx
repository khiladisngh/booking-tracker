import { useState, useRef, useEffect, useCallback } from 'react'

const THRESHOLD = 60
const MAX_PULL  = 80
const DEAD_ZONE = 6   // px of movement before we commit to PTR vs scroll

export default function PullToRefresh({ children, onRefresh, className = '' }) {
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef    = useRef(false)
  const containerRef     = useRef(null)
  const indicatorRef     = useRef(null)
  const circleRef        = useRef(null)
  const startY           = useRef(0)
  const scrollTopAtStart = useRef(0)  // captured on touchstart — avoids race with passive scroll
  const gesture          = useRef(null) // 'ptr' | 'scroll' | null
  const pullY            = useRef(0)

  useEffect(() => { refreshingRef.current = refreshing }, [refreshing])

  function applyIndicator(y) {
    pullY.current = y
    if (!indicatorRef.current || !circleRef.current) return
    indicatorRef.current.style.height     = `${y}px`
    indicatorRef.current.style.transition = y > 0 ? 'none' : 'height 0.22s ease'
    const p = Math.min(y / THRESHOLD, 1)
    circleRef.current.style.opacity   = String(p)
    circleRef.current.style.transform = `rotate(${p * 270}deg)`
  }

  const onTouchStart = useCallback((e) => {
    startY.current           = e.touches[0].clientY
    scrollTopAtStart.current = containerRef.current?.scrollTop ?? 0
    gesture.current          = null
  }, [])

  const onTouchMove = useCallback((e) => {
    const dy = e.touches[0].clientY - startY.current

    // Classify gesture once we have enough movement
    if (gesture.current === null) {
      if (Math.abs(dy) < DEAD_ZONE) return
      // PTR only when list was at top AND user pulls down
      gesture.current = (scrollTopAtStart.current === 0 && dy > 0) ? 'ptr' : 'scroll'
    }

    if (gesture.current !== 'ptr') return
    applyIndicator(Math.min(dy * 0.45, MAX_PULL))
  }, [])

  const onTouchEnd = useCallback(() => {
    if (gesture.current === 'ptr') {
      if (pullY.current >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true
        setRefreshing(true)
        if (indicatorRef.current) {
          indicatorRef.current.style.height     = `${THRESHOLD}px`
          indicatorRef.current.style.transition = 'none'
        }
        Promise.resolve(onRefresh?.()).finally(() => {
          setTimeout(() => { setRefreshing(false); applyIndicator(0) }, 700)
        })
      } else {
        applyIndicator(0)
      }
    }
    gesture.current = null
  }, [onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove',  onTouchMove,  { passive: true })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  return (
    <div ref={containerRef} className={className} style={{ overscrollBehavior: 'contain' }}>
      {/* Indicator height is driven imperatively — no React state during drag */}
      <div
        ref={indicatorRef}
        className="flex items-end justify-center overflow-hidden pointer-events-none"
        style={{ height: 0, transition: 'height 0.22s ease' }}
      >
        {refreshing ? (
          <div
            className="mb-3 w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--ds-accent)', borderTopColor: 'transparent' }}
          />
        ) : (
          <div
            ref={circleRef}
            className="mb-3 w-7 h-7 rounded-full border-2"
            style={{ borderColor: 'var(--ds-accent)', opacity: 0 }}
          />
        )}
      </div>
      {children}
    </div>
  )
}
