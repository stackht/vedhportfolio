"use client"

import { useState, type ComponentType } from "react"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  Camera,
  Car,
  Check,
  Copy,
  EnvelopeSimple,
  FlagCheckered,
  GithubLogo,
  Gauge as GaugeIcon,
  LinkedinLogo,
  MapTrifold,
  Planet,
  Radio,
  RoadHorizon,
  UserCircle,
  Wrench,
} from "@phosphor-icons/react"
import { ABOUT, DRIVER, JOURNEY, LINKS, OFF_TRACK, PLACEHOLDER, PROJECTS, SKILLS } from "@/content/site"
import TopoMap from "./TopoMap"

const EASE = [0.16, 1, 0.3, 1] as const
const OFF_ICONS = { planet: Planet, camera: Camera, car: Car } as const

/** Detail content rises in once the tile has finished growing. */
const rise = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay: 0.25 + i * 0.05 },
})

function Note() {
  return PLACEHOLDER ? <p className="ph-note">Sample data · real details coming soon</p> : null
}

/* ─────────────── About ─────────────── */

function AboutPreview() {
  return (
    <>
      <div className="ab-head">
        <span className="badge" aria-hidden="true">
          {DRIVER.initials}
        </span>
        <span>
          <b>{DRIVER.name}</b>
          <span className="dim">{DRIVER.role}</span>
        </span>
      </div>
      <p className="clamp-3">{ABOUT.bio}</p>
      <dl className="facts">
        {ABOUT.facts.slice(0, 2).map((f) => (
          <div key={f.k}>
            <dt>{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}
function AboutDetail() {
  return (
    <>
      <motion.p className="lead" {...rise(0)}>
        {ABOUT.bio}
      </motion.p>
      <motion.dl className="facts facts--wide" {...rise(1)}>
        {ABOUT.facts.map((f) => (
          <div key={f.k}>
            <dt>{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </motion.dl>
      <motion.p className="sub" {...rise(2)}>
        Off the clock
      </motion.p>
      <motion.ul className="off-list" {...rise(3)}>
        {OFF_TRACK.map((o) => {
          const Icon = OFF_ICONS[o.icon]
          return (
            <li key={o.name}>
              <Icon weight="duotone" aria-hidden="true" />
              <b>{o.name}</b>
              <span>{o.note}</span>
            </li>
          )
        })}
      </motion.ul>
    </>
  )
}

/* ─────────────── Projects: lap times ─────────────── */

function ProjectsPreview() {
  return (
    <ol className="laps">
      {PROJECTS.map((p, i) => (
        <li key={p.id}>
          <span className="lap-n">L{i + 1}</span>
          <b>{p.title}</b>
          <span className="dim">{p.kind}</span>
          <span className="lap-t">{p.year}</span>
        </li>
      ))}
    </ol>
  )
}
function ProjectsDetail() {
  return (
    <>
      <motion.p className="lead" {...rise(0)}>
        Each build logged like a lap: what it is, what it runs on, and the number that mattered.
      </motion.p>
      <ul className="proj-grid">
        {PROJECTS.map((p, i) => (
          <motion.li key={p.id} className="proj" {...rise(1 + i)}>
            <p className="proj-top">
              <span className="lap-n">LAP {i + 1}</span>
              <span className="dim">
                {p.kind} · {p.year}
              </span>
            </p>
            <b className="proj-title">{p.title}</b>
            <p>{p.summary}</p>
            <p className="proj-metric">
              <FlagCheckered weight="fill" aria-hidden="true" /> {p.metric}
            </p>
            <p className="chips">
              {p.stack.map((s) => (
                <code key={s}>{s}</code>
              ))}
            </p>
          </motion.li>
        ))}
      </ul>
    </>
  )
}

/* ─────────────── Skills: rev meters ─────────────── */

const ALL_SKILLS = SKILLS.flatMap((g) => g.items)

function SkillsPreview() {
  return (
    <div className="revs" aria-hidden="true">
      {ALL_SKILLS.map((s, i) => (
        <i key={s.name} style={{ ["--lvl" as string]: s.level, ["--d" as string]: `${i * 0.12}s` }} />
      ))}
    </div>
  )
}
function SkillsDetail() {
  return (
    <>
      <motion.p className="lead" {...rise(0)}>
        The powertrain: what gets used, and how hard it can be pushed.
      </motion.p>
      <div className="skill-groups">
        {SKILLS.map((g, gi) => (
          <motion.div key={g.group} className="skill-group" {...rise(1 + gi)}>
            <p className="sub">{g.group}</p>
            {g.items.map((s) => (
              <div key={s.name} className="meter">
                <span>{s.name}</span>
                <span className="meter-bar" aria-label={`${Math.round(s.level * 100)} percent`}>
                  {Array.from({ length: 20 }, (_, k) => (
                    <i key={k} data-on={k < Math.round(s.level * 20) || undefined} data-red={k >= 17 || undefined} />
                  ))}
                </span>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </>
  )
}

/* ─────────────── Journey: the season so far ─────────────── */

function JourneyPreview() {
  return (
    <ol className="season">
      {JOURNEY.slice(0, 3).map((j, i) => (
        <li key={i}>
          <span className="season-dot" aria-hidden="true" />
          <b>{j.title}</b>
          <span className="dim">{j.where}</span>
        </li>
      ))}
    </ol>
  )
}
function JourneyDetail() {
  return (
    <>
      <motion.p className="lead" {...rise(0)}>
        Work, study and the moments that counted, most recent first.
      </motion.p>
      <ol className="season season--full">
        {JOURNEY.map((j, i) => (
          <motion.li key={i} {...rise(1 + i)}>
            <span className="season-dot" aria-hidden="true" />
            <span className="kind">{j.kind}</span>
            <b>{j.title}</b>
            <span className="dim">
              {j.where} · {j.when}
            </span>
          </motion.li>
        ))}
      </ol>
    </>
  )
}

/* ─────────────── Off-track: travel, space, speed ─────────────── */

function OffPreview() {
  return (
    <>
      <TopoMap />
      <div className="off-over">
        <p className="coords">
          {DRIVER.base.coords}
          <span className="dim"> · base</span>
        </p>
        <p className="off-icons" aria-label="Space, travel and cars">
          {OFF_TRACK.map((o) => {
            const Icon = OFF_ICONS[o.icon]
            return <Icon key={o.name} weight="duotone" aria-hidden="true" />
          })}
        </p>
      </div>
    </>
  )
}
function OffDetail() {
  return (
    <>
      <div className="off-map">
        <TopoMap />
      </div>
      <motion.ul className="off-list" {...rise(0)}>
        {OFF_TRACK.map((o) => {
          const Icon = OFF_ICONS[o.icon]
          return (
            <li key={o.name}>
              <Icon weight="duotone" aria-hidden="true" />
              <b>{o.name}</b>
              <span>{o.note}</span>
            </li>
          )
        })}
      </motion.ul>
      <motion.p className="dim" {...rise(1)}>
        Trips, photos and favourite roads will be logged here.
      </motion.p>
    </>
  )
}

/* ─────────────── Contact: pit radio ─────────────── */

function CopyEmail() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(LINKS.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${LINKS.email}`
    }
  }
  return (
    <div className="email">
      <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
      <button type="button" className="btn btn--ghost" onClick={copy} aria-live="polite">
        {copied ? <Check weight="bold" aria-hidden="true" /> : <Copy weight="bold" aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
function ContactPreview() {
  return (
    <>
      <p className="radio-line">
        <span className="live" aria-hidden="true" />
        {DRIVER.status}
      </p>
      <p className="big-cta">Open a channel</p>
    </>
  )
}
function ContactDetail() {
  const links = [
    { label: "Email", detail: LINKS.email, href: `mailto:${LINKS.email}`, Icon: EnvelopeSimple },
    { label: "GitHub", detail: "Code and experiments", href: LINKS.github, Icon: GithubLogo },
    { label: "LinkedIn", detail: "Experience and roles", href: LINKS.linkedin, Icon: LinkedinLogo },
  ]
  return (
    <>
      <motion.p className="lead" {...rise(0)}>
        {DRIVER.status}. Radio in with a role, a project or a road worth driving.
      </motion.p>
      <motion.div {...rise(1)}>
        <CopyEmail />
      </motion.div>
      <motion.ul className="links" {...rise(2)}>
        {links.map(({ label, detail, href, Icon }) => (
          <li key={label}>
            <a href={href} {...(href.startsWith("mailto") ? {} : { target: "_blank", rel: "noreferrer" })}>
              <Icon aria-hidden="true" />
              <b>{label}</b>
              <span className="dim">{detail}</span>
              <ArrowUpRight className="arrow" aria-hidden="true" />
            </a>
          </li>
        ))}
      </motion.ul>
    </>
  )
}

export type TileDef = {
  id: string
  n: string
  label: string
  sub: string
  Icon: ComponentType<{ weight?: "duotone" | "bold" | "fill" | "regular"; "aria-hidden"?: boolean }>
  Preview: ComponentType
  Detail: ComponentType
}

export const TILES: TileDef[] = [
  { id: "about", n: "01", label: "About", sub: "Driver profile", Icon: UserCircle, Preview: AboutPreview, Detail: AboutDetail },
  { id: "projects", n: "02", label: "Projects", sub: "Lap times", Icon: RoadHorizon, Preview: ProjectsPreview, Detail: ProjectsDetail },
  { id: "skills", n: "03", label: "Skills", sub: "Powertrain", Icon: Wrench, Preview: SkillsPreview, Detail: SkillsDetail },
  { id: "journey", n: "04", label: "Journey", sub: "Season so far", Icon: GaugeIcon, Preview: JourneyPreview, Detail: JourneyDetail },
  { id: "offtrack", n: "05", label: "Off-track", sub: "Space · travel · speed", Icon: MapTrifold, Preview: OffPreview, Detail: OffDetail },
  { id: "contact", n: "06", label: "Contact", sub: "Pit radio", Icon: Radio, Preview: ContactPreview, Detail: ContactDetail },
]

export { Note }
