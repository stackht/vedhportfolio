"use client"

import { useEffect, useRef } from "react"
import { MAX_KMH, startTelemetry, telemetry } from "./telemetry"

const CX = 200
const CY = 200
const R = 168
const START = 135 // degrees; the dial sweeps 270° clockwise from bottom-left
const SWEEP = 270
const REDLINE = 200

const angle = (v: number) => START + (v / MAX_KMH) * SWEEP
const at = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r] as const
}
const arc = (from: number, to: number, r: number) => {
  const [x0, y0] = at(angle(from), r)
  const [x1, y1] = at(angle(to), r)
  const large = angle(to) - angle(from) > 180 ? 1 : 0
  return `M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

/**
 * The speedometer. Its needle reads how fast the visitor moves the cursor; on the first visit
 * it sweeps to the redline and back, like a car's instrument check at ignition. Everything that
 * moves is written to the SVG directly each frame.
 */
export default function Gauge({ boot }: { boot: boolean }) {
  const needle = useRef<SVGGElement>(null)
  const sweep = useRef<SVGPathElement>(null)
  const digits = useRef<SVGTextElement>(null)
  const odo = useRef<SVGTextElement>(null)
  const gear = useRef<SVGTextElement>(null)

  useEffect(() => {
    const stop = startTelemetry()
    const t0 = performance.now()
    let raf = 0
    let shown = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      let v = telemetry.kmh
      if (boot) {
        const t = (now - t0) / 1000
        if (t < 0.85) v = MAX_KMH * ease(t / 0.85)
        else if (t < 1.7) v = Math.max(v, MAX_KMH * (1 - ease((t - 0.85) / 0.85)))
      }
      shown += (v - shown) * 0.25
      needle.current?.setAttribute("transform", `rotate(${angle(shown)} ${CX} ${CY})`)
      sweep.current?.setAttribute("stroke-dashoffset", String(1 - shown / MAX_KMH))
      sweep.current?.setAttribute("stroke", shown > REDLINE ? "#ff3b30" : "#ffb020")
      if (digits.current) digits.current.textContent = String(Math.round(shown)).padStart(3, "0")
      if (gear.current) gear.current.textContent = shown < 2 ? "N" : String(Math.min(6, 1 + Math.floor(shown / 40)))
      // 1 km of odometer per 2,000 px of real pointer travel.
      if (odo.current) odo.current.textContent = (telemetry.distance / 2000).toFixed(2).padStart(7, "0")
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      stop()
    }
  }, [boot])

  const ticks = []
  for (let v = 0; v <= MAX_KMH; v += 10) {
    const major = v % 20 === 0
    const [x0, y0] = at(angle(v), R - (major ? 22 : 12))
    const [x1, y1] = at(angle(v), R - 2)
    ticks.push(<line key={v} x1={x0} y1={y0} x2={x1} y2={y1} className={major ? "tk tk--major" : "tk"} data-red={v >= REDLINE || undefined} />)
    if (major) {
      const [lx, ly] = at(angle(v), R - 42)
      ticks.push(
        <text key={`l${v}`} x={lx} y={ly} className="tk-label" data-red={v >= REDLINE || undefined}>
          {v}
        </text>,
      )
    }
  }

  return (
    <svg className="gauge" viewBox="0 0 400 400" role="img" aria-label="Speedometer showing how fast you move the cursor">
      <defs>
        <radialGradient id="dial" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#1b1e24" />
          <stop offset="0.85" stopColor="#0f1114" />
          <stop offset="1" stopColor="#08090b" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={R + 14} className="dial-bezel" />
      <circle cx={CX} cy={CY} r={R + 6} fill="url(#dial)" className="dial-face" />
      <path d={arc(0, MAX_KMH, R - 6)} className="track" />
      <path d={arc(REDLINE, MAX_KMH, R - 6)} className="redline" />
      <path ref={sweep} d={arc(0, MAX_KMH, R - 6)} className="sweep" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
      {ticks}
      <text x={CX} y={CY + 62} className="digits" ref={digits}>
        000
      </text>
      <text x={CX} y={CY + 84} className="unit">
        KM/H
      </text>
      <text x={CX - 74} y={CY + 128} className="mini-k">
        ODO
      </text>
      <text x={CX - 74} y={CY + 146} className="mini-v" ref={odo}>
        0000.00
      </text>
      <text x={CX + 74} y={CY + 128} className="mini-k">
        GEAR
      </text>
      <text x={CX + 74} y={CY + 148} className="mini-v mini-v--gear" ref={gear}>
        N
      </text>
      <g ref={needle} transform={`rotate(${START} ${CX} ${CY})`}>
        <path d={`M${CX - 18} ${CY - 3} L${CX + R - 18} ${CY - 1} L${CX + R - 18} ${CY + 1} L${CX - 18} ${CY + 3} Z`} className="needle" />
      </g>
      <circle cx={CX} cy={CY} r={13} className="hub" />
      <circle cx={CX} cy={CY} r={4} className="hub-dot" />
    </svg>
  )
}
