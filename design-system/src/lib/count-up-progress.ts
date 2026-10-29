export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

export function countUpProgress(now: number, start: number, duration: number) {
  if (duration <= 0) return 1
  return Math.max(0, Math.min((now - start) / duration, 1))
}
