"use client"

import { useEffect, useRef } from "react"

/** Terrain height at (x, y) in 0..1 space: a few hills plus a slow ripple. */
function height(x: number, y: number) {
  const hill = (cx: number, cy: number, r: number, a: number) => a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (r * r))
  return (
    hill(0.28, 0.35, 0.22, 1) +
    hill(0.72, 0.62, 0.26, 0.9) +
    hill(0.58, 0.2, 0.14, 0.55) +
    hill(0.2, 0.82, 0.16, 0.5) +
    0.06 * Math.sin(x * 11 + y * 4) +
    0.05 * Math.sin(y * 13 - x * 3)
  )
}

/** The route, in 0..1 space: base camp to the far ridge. */
const ROUTE: [number, number][] = [
  [0.1, 0.9],
  [0.22, 0.7],
  [0.38, 0.62],
  [0.47, 0.44],
  [0.62, 0.38],
  [0.74, 0.22],
  [0.9, 0.14],
]

/**
 * The Off-track tile's map: contour lines traced from a terrain field (marching squares, drawn
 * once per size), with a route that draws itself and a marker moving along it.
 */
export default function TopoMap() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    let w = 0
    let h = 0
    let base: HTMLCanvasElement | null = null

    const drawContours = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      base = document.createElement("canvas")
      base.width = canvas.width
      base.height = canvas.height
      const b = base.getContext("2d")!
      b.setTransform(dpr, 0, 0, dpr, 0, 0)
      const step = 5
      const cols = Math.ceil(w / step) + 1
      const rows = Math.ceil(h / step) + 1
      const f = new Float32Array(cols * rows)
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) f[j * cols + i] = height((i * step) / w, (j * step) / h)
      for (let L = 0; L < 14; L++) {
        const level = -0.1 + L * 0.085
        const major = L % 4 === 0
        b.strokeStyle = major ? "rgba(255,176,32,0.45)" : "rgba(235,238,245,0.16)"
        b.lineWidth = major ? 1.1 : 0.8
        b.beginPath()
        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const a = f[j * cols + i]
            const c1 = f[j * cols + i + 1]
            const c2 = f[(j + 1) * cols + i + 1]
            const c3 = f[(j + 1) * cols + i]
            const idx = (a > level ? 8 : 0) | (c1 > level ? 4 : 0) | (c2 > level ? 2 : 0) | (c3 > level ? 1 : 0)
            if (idx === 0 || idx === 15) continue
            const x = i * step
            const y = j * step
            const lerp = (p: number, q: number) => (level - p) / (q - p || 1e-6)
            const top: [number, number] = [x + lerp(a, c1) * step, y]
            const right: [number, number] = [x + step, y + lerp(c1, c2) * step]
            const bottom: [number, number] = [x + lerp(c3, c2) * step, y + step]
            const left: [number, number] = [x, y + lerp(a, c3) * step]
            const seg = (p: [number, number], q: [number, number]) => {
              b.moveTo(p[0], p[1])
              b.lineTo(q[0], q[1])
            }
            switch (idx) {
              case 1:
              case 14:
                seg(left, bottom)
                break
              case 2:
              case 13:
                seg(bottom, right)
                break
              case 3:
              case 12:
                seg(left, right)
                break
              case 4:
              case 11:
                seg(top, right)
                break
              case 5:
                seg(left, top)
                seg(bottom, right)
                break
              case 6:
              case 9:
                seg(top, bottom)
                break
              case 7:
              case 8:
                seg(left, top)
                break
              case 10:
                seg(left, bottom)
                seg(top, right)
                break
            }
          }
        }
        b.stroke()
      }
    }
    drawContours()
    const ro = new ResizeObserver(drawContours)
    ro.observe(canvas)

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)

    // Route length, for drawing it progressively.
    const pts = () => ROUTE.map(([x, y]) => [x * w, y * h] as [number, number])
    let raf = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible || !base) return
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(base, 0, 0, w, h)
      const p = pts()
      const segs = p.slice(1).map((q, i) => Math.hypot(q[0] - p[i][0], q[1] - p[i][1]))
      const total = segs.reduce((s, x) => s + x, 0)
      const t = ((now / 1000) % 7) / 7
      const reach = total * Math.min(1, t * 1.25)
      // The trail so far, then the marker at its head.
      ctx.setLineDash([5, 5])
      ctx.lineDashOffset = -now / 60
      ctx.strokeStyle = "#ffb020"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(p[0][0], p[0][1])
      let run = 0
      let head = p[0]
      for (let i = 0; i < segs.length; i++) {
        if (run + segs[i] >= reach) {
          const k = (reach - run) / segs[i]
          head = [p[i][0] + (p[i + 1][0] - p[i][0]) * k, p[i][1] + (p[i + 1][1] - p[i][1]) * k]
          ctx.lineTo(head[0], head[1])
          break
        }
        run += segs[i]
        ctx.lineTo(p[i + 1][0], p[i + 1][1])
        head = p[i + 1]
      }
      ctx.stroke()
      ctx.setLineDash([])
      // Base camp, pulsing.
      const pulse = (now / 1000) % 1.6
      ctx.strokeStyle = `rgba(255,176,32,${1 - pulse / 1.6})`
      ctx.beginPath()
      ctx.arc(p[0][0], p[0][1], 4 + pulse * 10, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = "#ffb020"
      ctx.beginPath()
      ctx.arc(p[0][0], p[0][1], 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#fff"
      ctx.beginPath()
      ctx.arc(head[0], head[1], 4, 0, Math.PI * 2)
      ctx.fill()
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="topo" aria-hidden="true" />
}
