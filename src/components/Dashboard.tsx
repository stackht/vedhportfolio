"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "@phosphor-icons/react"
import { DRIVER } from "@/content/site"
import { Note, TILES } from "./Tiles"

const Drive = dynamic(() => import("./Drive"), { ssr: false })
const Gauge = dynamic(() => import("./Gauge"), { ssr: false })
const EASE = [0.16, 1, 0.3, 1] as const

/** Each page is a scene: the caption under its title says where the drive has taken us. */
const SCENES: Record<string, string> = {
  about: "Blue hour, before dawn",
  projects: "Night, a city glowing past the ridge",
  skills: "Flat out, everything streaking",
  journey: "Golden hour over the mountains",
  offtrack: "Pulled over under the Milky Way",
  contact: "Sunrise, a new road ahead",
}

const noop = () => () => {}
const introSkipped = () => document.documentElement.dataset.intro === "skip"
// Checked once: React reads this on every render, and each check would otherwise open (and
// leak) a WebGL context until the browser starts dropping the drive's own.
let webglSupport: boolean | undefined
const hasWebGL = () => {
  if (webglSupport === undefined) {
    try {
      const c = document.createElement("canvas")
      const gl = c.getContext("webgl2") || c.getContext("webgl")
      webglSupport = !!gl
      gl?.getExtension("WEBGL_lose_context")?.loseContext()
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

// Vedh's local time, ticking once a second, for the status bar.
const onSecond = (cb: () => void) => {
  const id = setInterval(cb, 1000)
  return () => clearInterval(id)
}
const clock = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date())

export default function Dashboard() {
  const skipped = useSyncExternalStore(noop, introSkipped, () => false)
  const webgl = useSyncExternalStore(noop, hasWebGL, () => true)
  const time = useSyncExternalStore(onSecond, clock, () => "--:--:--")
  const [open, setOpen] = useState<string | null>(null)
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set())
  const [ready, setReady] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Ignition: the dial sweeps and the tiles light up in turn, then the dash is live.
  useEffect(() => {
    document.documentElement.dataset.boot = ready ? "done" : "hold"
    if (ready) return
    const t = setTimeout(() => setReady(true), skipped ? 50 : 1900)
    return () => clearTimeout(t)
  }, [ready, skipped])

  const openTile = useCallback((id: string) => {
    setOpen(id)
    setSeen((s) => (s.has(id) ? s : new Set(s).add(id)))
  }, [])
  const close = useCallback(() => {
    setOpen((id) => {
      // Hand focus back to the tile that was opened, once it has folded back into place.
      if (id) setTimeout(() => document.getElementById(`tile-${id}`)?.focus(), 500)
      return null
    })
  }, [])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  const current = TILES.find((t) => t.id === open)
  const explored = seen.size / TILES.length

  return (
    <div className="dash" data-open={open ? "" : undefined}>
      <div className="world" data-webgl={webgl ? "on" : "off"} aria-hidden="true">
        {webgl && <Drive mood={open ?? "drive"} />}
      </div>
      <div className="grade" aria-hidden="true" />

      <header className="statusbar">
        <p className="sb-id">
          <span className="sb-mark" aria-hidden="true">
            {DRIVER.initials}
          </span>
          <span>{DRIVER.name}</span>
        </p>
        <ul className="lights" aria-label="Sections visited">
          {TILES.map((t, i) => (
            <li
              key={t.id}
              data-on={seen.has(t.id) || undefined}
              style={{ ["--d" as string]: `${0.2 + i * 0.12}s` }}
              title={`${t.label}${seen.has(t.id) ? " · visited" : ""}`}
            >
              <t.Icon weight="fill" aria-hidden />
              <span className="sr-only">
                {t.label} {seen.has(t.id) ? "visited" : "not visited"}
              </span>
            </li>
          ))}
        </ul>
        <p className="sb-right">
          <span className="dim">IST</span> <span className="tabular">{time}</span>
          <span className="sb-sep" aria-hidden="true" />
          <span className="dim">Explored</span> {seen.size}/{TILES.length}
        </p>
      </header>

      <main className="grid">
        <section className="tile tile--hero" aria-labelledby="hero-name">
          <div className="hero-copy">
            <p className="kicker">
              <span className="live" aria-hidden="true" />
              Engine on · {DRIVER.role}
            </p>
            <h1 id="hero-name" className="hero-name" aria-label={DRIVER.name}>
              {[DRIVER.first, DRIVER.last].map((w, i) => (
                <span key={w} className="hn-wrap" aria-hidden="true">
                  <motion.span
                    className="hn-word"
                    initial={{ y: "105%" }}
                    animate={ready || skipped ? { y: "0%" } : undefined}
                    transition={{ duration: 1.1, ease: EASE, delay: skipped ? 0 : i * 0.12 }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>
            <p className="hero-line">{DRIVER.line}</p>
            <div className="explored" aria-label={`Explored ${Math.round(explored * 100)} percent`}>
              <span className="dim">Explored</span>
              <span className="ex-bar" aria-hidden="true">
                {TILES.map((t) => (
                  <i key={t.id} data-on={seen.has(t.id) || undefined} />
                ))}
              </span>
              <span className="tabular">{Math.round(explored * 100)}%</span>
            </div>
          </div>
          <div className="hero-gauge">
            <Gauge boot={!skipped} />
            <p className="gauge-hint">move faster to drive faster</p>
          </div>
        </section>

        {TILES.map((t, i) =>
          open === t.id ? (
            <div key={t.id} className={`tile-slot tile--${t.id}`} aria-hidden="true" />
          ) : (
            <motion.button
              key={t.id}
              id={`tile-${t.id}`}
              type="button"
              layoutId={t.id}
              className={`tile tile--${t.id}`}
              data-seen={seen.has(t.id) || undefined}
              onClick={() => openTile(t.id)}
              aria-label={`Open ${t.label}`}
              initial={ready ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: ready ? 0 : 0.9 + i * 0.09, layout: { duration: 0.6, ease: EASE } }}
            >
              <span className="tile-head">
                <span className="th-n">{t.n}</span>
                <span className="th-label">{t.label}</span>
                <span className="th-sub">{t.sub}</span>
                <t.Icon weight="duotone" aria-hidden />
              </span>
              <span className="tile-body">
                <t.Preview />
              </span>
            </motion.button>
          ),
        )}
      </main>

      <footer className="hintbar" aria-hidden="true">
        <span>Click a tile to open its scene</span>
        <span>
          <kbd>Esc</kbd> to come back
        </span>
      </footer>

      {/* Scene view: letterbox bars, the scene's title over the shot, and the tile grown into a reading panel. */}
      <AnimatePresence>
        {current && (
          <>
            <motion.i
              key="bar-top"
              className="letterbox letterbox--top"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            />
            <motion.i
              key="bar-bottom"
              className="letterbox letterbox--bottom"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            />
            <motion.div key="catch" className="scene-catch" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              key={`title-${current.id}`}
              className="scene-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <motion.p className="st-kicker" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}>
                Scene {current.n} · {SCENES[current.id]}
              </motion.p>
              <span className="st-wrap">
                <motion.span className="st-word" initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}>
                  {current.label}
                </motion.span>
              </span>
              <motion.p className="st-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }}>
                {current.sub}
              </motion.p>
            </motion.div>
            <motion.section
              key="panel"
              layoutId={current.id}
              className="tile tile--open"
              role="dialog"
              aria-modal="true"
              aria-labelledby="open-title"
              transition={{ layout: { duration: 0.65, ease: EASE } }}
            >
              <header className="open-head">
                <span className="tile-head">
                  <span className="th-n">{current.n}</span>
                  <span className="th-label" id="open-title">
                    {current.label}
                  </span>
                </span>
                <button ref={closeRef} type="button" className="btn btn--close" onClick={close}>
                  <X weight="bold" aria-hidden="true" />
                  Close
                </button>
              </header>
              <div className="open-body">
                <current.Detail />
                <Note />
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
