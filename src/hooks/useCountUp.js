import { useEffect, useRef, useState } from 'react'

export function useCountUp(target, duration = 1600, start = false) {
  const [value, setValue] = useState(0)
  const frame = useRef(null)

  useEffect(() => {
    if (!start) return undefined
    const isNumber = typeof target === 'number'
    const end = isNumber ? target : parseFloat(String(target).replace(/[^\d.]/g, '')) || 0
    const startTime = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * end))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [target, duration, start])

  return value
}

export function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.25, ...options },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [options])

  return [ref, inView]
}
