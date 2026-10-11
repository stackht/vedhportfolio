// The drive's lighting and pace for each page. Opening a tile blends the world into its mood,
// the way a film cuts to a new time of day for a new scene.

export type Mood = {
  /** Sky at the zenith and at the horizon. */
  top: string
  horizon: string
  /** Distance haze; also tints the far ridges. */
  fog: string
  /** Mountain ridges, near and far. */
  ridgeNear: string
  ridgeFar: string
  /** 0..1: how many stars and how much of the Milky Way show. */
  stars: number
  /** 0..1: the sun's glow on the horizon, and its colour. */
  sun: number
  sunColor: string
  /** Base road speed (world units per second) before the visitor adds their own. */
  speed: number
  /** Camera pitch in radians: positive looks up at the sky. */
  pitch: number
  /** 0..1: how lit the road is (street-lamp glow on asphalt). */
  lamps: number
}

export const MOODS: Record<string, Mood> = {
  // The dashboard: a clear, moonlit night on a mountain road.
  drive: {
    top: "#050914",
    horizon: "#2a3a66",
    fog: "#18213d",
    ridgeNear: "#04060c",
    ridgeFar: "#121a33",
    stars: 1,
    // A low moon: the same horizon glow as the sun, in cold light.
    sun: 0.5,
    sunColor: "#b9c8ff",
    speed: 26,
    pitch: 0,
    lamps: 1,
  },
  // About: blue hour before dawn, unhurried.
  about: {
    top: "#0b1430",
    horizon: "#6b6fa8",
    fog: "#3b4372",
    ridgeNear: "#141a33",
    ridgeFar: "#2c3460",
    stars: 0.45,
    sun: 0.35,
    sunColor: "#ffb59a",
    speed: 14,
    pitch: 0.02,
    lamps: 0.5,
  },
  // Projects: the glow of a city just over the horizon.
  projects: {
    top: "#050611",
    horizon: "#3d1d18",
    fog: "#24130f",
    ridgeNear: "#07070b",
    ridgeFar: "#1a0f0d",
    stars: 0.6,
    sun: 0.55,
    sunColor: "#ff7a2a",
    speed: 34,
    pitch: 0,
    lamps: 1,
  },
  // Skills: flat out, everything streaking.
  skills: {
    top: "#08030a",
    horizon: "#3a0b12",
    fog: "#1e070b",
    ridgeNear: "#060306",
    ridgeFar: "#170609",
    stars: 0.35,
    sun: 0.25,
    sunColor: "#ff3b30",
    speed: 70,
    pitch: -0.01,
    lamps: 1,
  },
  // Journey: golden hour over the ridges.
  journey: {
    top: "#2a2350",
    horizon: "#f2a35a",
    fog: "#b06a48",
    ridgeNear: "#2a1626",
    ridgeFar: "#6d3f4a",
    stars: 0,
    sun: 1,
    sunColor: "#ffd27a",
    speed: 18,
    pitch: 0.01,
    lamps: 0,
  },
  // Off-track: pulled over, looking up at the Milky Way.
  offtrack: {
    top: "#010208",
    horizon: "#101833",
    fog: "#0a1022",
    ridgeNear: "#020309",
    ridgeFar: "#0a0f1f",
    stars: 1,
    sun: 0,
    sunColor: "#ffb020",
    speed: 0,
    pitch: 0.42,
    lamps: 0.25,
  },
  // Contact: sunrise, a new road ahead.
  contact: {
    top: "#3c5fa8",
    horizon: "#ffcf9e",
    fog: "#d99c7c",
    ridgeNear: "#36304a",
    ridgeFar: "#8a6f86",
    stars: 0,
    sun: 1,
    sunColor: "#fff1c4",
    speed: 12,
    pitch: 0.03,
    lamps: 0,
  },
}
