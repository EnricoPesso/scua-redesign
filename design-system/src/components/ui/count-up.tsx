import { useEffect, useRef, useState } from "react"
import { formatNumber } from "@/lib/format-number"

type CountUpProps = {
  to: number
  decimals?: number
  duration?: number
  className?: string
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

function CountUp({ to, decimals = 0, duration = 1200, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = prefersReducedMotion()
  const [display, setDisplay] = useState(0)
  const current = useRef(0)
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined")

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true)
        observer.disconnect()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!seen || reduced) return
    const from = current.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const value = from + (to - from) * easeOutCubic(progress)
      current.current = value
      setDisplay(value)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [seen, reduced, to, duration])

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {formatNumber(reduced ? to : display, decimals)}
      </span>
      <span className="sr-only">{formatNumber(to, decimals)}</span>
    </span>
  )
}

export { CountUp }
export type { CountUpProps }
