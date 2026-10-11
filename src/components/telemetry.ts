// Live telemetry from the visitor's own hand: how fast the cursor (or finger) is moving and how
// far it has travelled. One listener and one frame loop for the whole page; the gauge, warp
// and odometer read these numbers every frame without going through React.

export const telemetry = {
  /** Smoothed pointer speed, in px per second. */
  speed: 0,
  /** Shown on the dial: pointer speed mapped onto 0 to 240 km/h. */
  kmh: 0,
  /** Total pointer travel, in px. */
  distance: 0,
}

export const MAX_KMH = 240
const PX_PER_KMH = 14

let users = 0
let raf = 0
let last: { x: number; y: number; t: number } | null = null
let burst = 0

const onMove = (e: PointerEvent) => {
  const t = performance.now()
  if (last) {
    const d = Math.hypot(e.clientX - last.x, e.clientY - last.y)
    const dt = Math.max(1, t - last.t) / 1000
    telemetry.distance += d
    // Keep the fastest reading since the last frame; the frame loop smooths it.
    burst = Math.max(burst, d / dt)
  }
  last = { x: e.clientX, y: e.clientY, t }
}

const frame = () => {
  raf = requestAnimationFrame(frame)
  // Rise quickly, coast down slowly, like a needle with some inertia.
  const target = burst
  burst *= 0.5
  const k = target > telemetry.speed ? 0.35 : 0.04
  telemetry.speed += (target - telemetry.speed) * k
  telemetry.kmh = Math.min(MAX_KMH, telemetry.speed / PX_PER_KMH)
}

/** Starts the shared listener (call from an effect); returns the matching stop. */
export function startTelemetry() {
  if (users++ === 0) {
    window.addEventListener("pointermove", onMove, { passive: true })
    raf = requestAnimationFrame(frame)
  }
  return () => {
    if (--users === 0) {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
      last = null
    }
  }
}
