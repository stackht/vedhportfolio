// All visitor-facing content lives here.
// PLACEHOLDERS: everything below except Vedh's name and the broad interests is a stand-in.
// Replace it with his real details, then flip `PLACEHOLDER` to false to hide the notes.

export const PLACEHOLDER = true

export const DRIVER = {
  name: "Vedh Pokharkar",
  first: "Vedh",
  last: "Pokharkar",
  initials: "VP",
  role: "Software engineer",
  line: "I build fast, dependable software, and spend the rest of my time chasing horizons, night skies and good roads.",
  status: "Open to software engineering roles and internships",
  /** Shown on the Off-track map tile. */
  base: { place: "India", coords: "18.52° N, 73.85° E" },
}

export const LINKS = {
  email: "hello@vedhpokharkar.dev",
  github: "https://github.com/",
  linkedin: "https://linkedin.com/",
  resume: null as string | null,
}

export const ABOUT = {
  bio: "I'm Vedh, a software engineer who likes systems that are quick, clear and hard to break. I care about the whole path a request takes, from the interface someone taps to the code and data behind it, and I like making each step a little faster.",
  facts: [
    { k: "Role", v: "Software engineer" },
    { k: "Focus", v: "Full-stack, performance" },
    { k: "Based in", v: "India" },
    { k: "Status", v: "Open to roles" },
  ],
}

/** The three things he's into off the clock, used across the Off-track tile. */
export const OFF_TRACK = [
  { name: "Space & science", note: "Night skies, launches and how the universe works", icon: "planet" },
  { name: "Travel & photography", note: "Roads, mountains and the light at golden hour", icon: "camera" },
  { name: "Cars & speed", note: "Motorsport, machines and a well-taken corner", icon: "car" },
] as const

export const PROJECTS: { id: string; title: string; kind: string; year: string; summary: string; stack: string[]; metric: string }[] = [
  {
    id: "p1",
    title: "Project one",
    kind: "Web app",
    year: "Year",
    summary: "One or two lines on what it does, who it's for and what made it hard.",
    stack: ["Stack", "Goes", "Here"],
    metric: "Key result",
  },
  {
    id: "p2",
    title: "Project two",
    kind: "Backend",
    year: "Year",
    summary: "One or two lines on what it does, who it's for and what made it hard.",
    stack: ["Stack", "Goes", "Here"],
    metric: "Key result",
  },
  {
    id: "p3",
    title: "Project three",
    kind: "Mobile",
    year: "Year",
    summary: "One or two lines on what it does, who it's for and what made it hard.",
    stack: ["Stack", "Goes", "Here"],
    metric: "Key result",
  },
  {
    id: "p4",
    title: "Project four",
    kind: "Tooling",
    year: "Year",
    summary: "One or two lines on what it does, who it's for and what made it hard.",
    stack: ["Stack", "Goes", "Here"],
    metric: "Key result",
  },
]

/** Skills as rev meters: `level` 0 to 1. Sample values until the real ones are in. */
export const SKILLS = [
  { group: "Languages", items: [{ name: "Language one", level: 0.9 }, { name: "Language two", level: 0.8 }, { name: "Language three", level: 0.65 }] },
  { group: "Frameworks", items: [{ name: "Framework one", level: 0.85 }, { name: "Framework two", level: 0.7 }] },
  { group: "Data & cloud", items: [{ name: "Database", level: 0.75 }, { name: "Cloud platform", level: 0.6 }] },
  { group: "Tools", items: [{ name: "Tool one", level: 0.9 }, { name: "Tool two", level: 0.7 }] },
]

export const JOURNEY = [
  { title: "Role title", where: "Company name", when: "Year to present", kind: "Work" },
  { title: "Internship title", where: "Company name", when: "Year", kind: "Work" },
  { title: "Degree, field", where: "College or university", when: "Year to year", kind: "Education" },
  { title: "Achievement or award", where: "Event or organisation", when: "Year", kind: "Award" },
]
