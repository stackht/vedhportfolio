"use client"

import { useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { MOODS, type Mood } from "./moods"
import { startTelemetry, telemetry } from "./telemetry"

const ROAD_LEN = 600
const LANE_X = -2 // India drives on the left: we keep left, oncoming traffic passes on the right.

/** The current, blended look of the world. Every frame it eases toward the target mood. */
type Live = {
  top: THREE.Color
  horizon: THREE.Color
  fog: THREE.Color
  ridgeNear: THREE.Color
  ridgeFar: THREE.Color
  sunColor: THREE.Color
  stars: number
  sun: number
  speed: number
  pitch: number
  lamps: number
  /** Distance driven, in world units: scrolls the road and everything on it. */
  odo: number
}

function liveFrom(m: Mood): Live {
  return {
    top: new THREE.Color(m.top),
    horizon: new THREE.Color(m.horizon),
    fog: new THREE.Color(m.fog),
    ridgeNear: new THREE.Color(m.ridgeNear),
    ridgeFar: new THREE.Color(m.ridgeFar),
    sunColor: new THREE.Color(m.sunColor),
    stars: m.stars,
    sun: m.sun,
    speed: m.speed,
    pitch: m.pitch,
    lamps: m.lamps,
    odo: 0,
  }
}

/** A soft round glow, drawn once, for every light in the scene. */
function glowTexture() {
  const c = document.createElement("canvas")
  c.width = c.height = 64
  const g = c.getContext("2d")!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, "rgba(255,255,255,1)")
  grad.addColorStop(0.18, "rgba(255,255,255,0.85)")
  grad.addColorStop(0.45, "rgba(255,255,255,0.18)")
  grad.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const SKY_FRAG = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uFog; uniform vec3 uSunColor;
uniform float uStars; uniform float uSun; uniform float uTime;
varying vec3 vDir;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.55, h));
  col = mix(uFog, col, smoothstep(-0.08, 0.02, h));
  float up = smoothstep(0.0, 0.12, h);
  // Stars: one in a few hundred cells, twinkling.
  vec3 cell = floor(d * 380.0);
  float s = hash(cell);
  float star = step(0.9965, s) * (0.55 + 0.45 * sin(uTime * (1.0 + s * 3.0) + s * 40.0));
  col += vec3(star) * uStars * up * 1.2;
  // The Milky Way: a soft, mottled band across the sky.
  float band = abs(dot(d, normalize(vec3(0.55, 0.62, 0.55))));
  float mw = exp(-band * band * 26.0) * (0.45 + 0.55 * noise(d * 9.0)) * (0.6 + 0.4 * noise(d * 31.0));
  col += vec3(0.62, 0.66, 0.85) * mw * uStars * up * 0.42;
  col += vec3(1.0) * step(0.9985, hash(floor(d * 900.0))) * mw * uStars * up;
  // The sun just below / on the horizon: a disc, its glow, and a warm band along the skyline.
  vec3 sd = normalize(vec3(0.15, 0.035, -1.0));
  float sa = max(dot(d, sd), 0.0);
  col += uSunColor * (pow(sa, 900.0) * 3.0 + pow(sa, 40.0) * 0.55 + pow(sa, 6.0) * 0.22) * uSun;
  col += uSunColor * exp(-abs(h) * 16.0) * 0.28 * uSun;
  gl_FragColor = vec4(col, 1.0);
}`

function Sky({ liveRef }: { liveRef: React.RefObject<Live> }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uFog: { value: new THREE.Color() },
      uSunColor: { value: new THREE.Color() },
      uStars: { value: 1 },
      uSun: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  )
  useFrame((st) => {
    const u = mat.current?.uniforms
    const l = liveRef.current
    if (!u) return
    u.uTop.value.copy(l.top)
    u.uHorizon.value.copy(l.horizon)
    u.uFog.value.copy(l.fog)
    u.uSunColor.value.copy(l.sunColor)
    u.uStars.value = l.stars
    u.uSun.value = l.sun
    u.uTime.value = st.clock.elapsedTime
  })
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[400, 48, 24]} />
      <shaderMaterial ref={mat} side={THREE.BackSide} depthWrite={false} fog={false} uniforms={uniforms} vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} />
    </mesh>
  )
}

/** Three ridgelines of mountains, darker as they come closer. */
function Ridges({ liveRef }: { liveRef: React.RefObject<Live> }) {
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const geos = useMemo(() => {
    const make = (seed: number, amp: number, base: number) => {
      const n = 160
      const pos: number[] = []
      const hgt = (i: number) => {
        const x = i / n
        return (
          base +
          amp *
            (0.55 * Math.sin(x * 9.0 + seed) +
              0.3 * Math.sin(x * 23.0 + seed * 2.1) +
              0.15 * Math.sin(x * 61.0 + seed * 3.7) +
              0.5 * Math.exp(-Math.pow((x - 0.5 - seed * 0.03) * 6, 2)))
        )
      }
      for (let i = 0; i < n; i++) {
        const x0 = -700 + (1400 * i) / n
        const x1 = -700 + (1400 * (i + 1)) / n
        const y0 = hgt(i)
        const y1 = hgt(i + 1)
        pos.push(x0, -20, 0, x1, -20, 0, x1, y1, 0, x0, -20, 0, x1, y1, 0, x0, y0, 0)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
      return g
    }
    return [make(1.3, 26, 22), make(4.1, 20, 12), make(7.7, 12, 4)]
  }, [])
  const zs = [-330, -240, -160]
  useFrame(() => {
    const l = liveRef.current
    mats.current.forEach((m, i) => {
      if (!m) return
      // Far ridges fade toward the haze; the nearest is almost black.
      m.color.copy(l.ridgeFar).lerp(l.ridgeNear, i / 2)
    })
  })
  return (
    <>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} position={[0, 0, zs[i]]}>
          <meshBasicMaterial
            ref={(m) => {
              mats.current[i] = m
            }}
            fog={false}
          />
        </mesh>
      ))}
    </>
  )
}

const ROAD_VERT = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`

const ROAD_FRAG = /* glsl */ `
uniform float uOdo; uniform float uLamps; uniform vec3 uFog; uniform vec3 uSky;
varying vec3 vWorld;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float x = vWorld.x;
  float z = vWorld.z - uOdo;           // road-space distance, scrolling with the drive
  float dist = -vWorld.z;
  vec3 col = vec3(0.028, 0.03, 0.036) + hash(floor(vWorld.xz * 9.0)) * 0.012;
  // Painted lines: solid white edges, a dashed centre line.
  float edge = smoothstep(0.1, 0.03, abs(abs(x) - 6.6));
  float dash = step(0.5, fract(z / 7.0));
  float centre = smoothstep(0.1, 0.03, abs(x)) * dash;
  col += vec3(0.75) * edge + vec3(0.95, 0.68, 0.18) * centre;
  // Our headlights: a warm pool on the lane ahead.
  float beam = exp(-pow(x - ${LANE_X.toFixed(1)}, 2.0) / 7.0) * exp(-max(dist - 4.0, 0.0) / 22.0) * smoothstep(0.0, 6.0, dist);
  col += vec3(1.0, 0.86, 0.62) * beam * 0.22;
  // Street lamps every 34 m on the left verge throw amber pools onto the asphalt.
  float lampZ = fract(z / 34.0) - 0.5;
  float pool = exp(-lampZ * lampZ * 90.0) * exp(-pow(x + 5.5, 2.0) / 22.0);
  col += vec3(1.0, 0.62, 0.2) * pool * 0.3 * uLamps;
  // Wet sheen: the sky's horizon colour mirrored faintly in the far road.
  col += uSky * 0.18 * smoothstep(60.0, 260.0, dist);
  float fogK = 1.0 - exp(-dist * 0.0095);
  gl_FragColor = vec4(mix(col, uFog, fogK), 1.0);
}`

function Road({ liveRef }: { liveRef: React.RefObject<Live> }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uOdo: { value: 0 }, uLamps: { value: 1 }, uFog: { value: new THREE.Color() }, uSky: { value: new THREE.Color() } }), [])
  useFrame(() => {
    const u = mat.current?.uniforms
    const l = liveRef.current
    if (!u) return
    u.uOdo.value = l.odo
    u.uLamps.value = l.lamps
    u.uFog.value.copy(l.fog)
    u.uSky.value.copy(l.horizon)
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -ROAD_LEN / 2 + 6]}>
      <planeGeometry args={[60, ROAD_LEN, 1, 1]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={ROAD_VERT} fragmentShader={ROAD_FRAG} />
    </mesh>
  )
}

/** Reflector posts on both verges and lamp heads on the left, recycled as the road scrolls. */
function Roadside({ liveRef, glow }: { liveRef: React.RefObject<Live>; glow: THREE.Texture }) {
  const posts = useRef<THREE.InstancedMesh>(null)
  const eyes = useRef<THREE.InstancedMesh>(null)
  const lamps = useRef<THREE.Group>(null)
  const SPACING = 17
  const COUNT = 24
  const LAMP_SPACING = 34
  const LAMPS = 10
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const l = liveRef.current
    const p = posts.current
    const e = eyes.current
    if (!p || !e) return
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < COUNT; i++) {
        const zz = 8 - ((i * SPACING + l.odo) % (SPACING * COUNT))
        const x = side ? 7.6 : -7.6
        dummy.position.set(x, 0.45, zz)
        // Posts that have passed the windscreen would loom huge at the screen's edge: hide them.
        dummy.scale.setScalar(zz > -3 ? 0 : 1)
        dummy.updateMatrix()
        p.setMatrixAt(side * COUNT + i, dummy.matrix)
        dummy.position.set(x, 0.78, zz + 0.07)
        dummy.scale.setScalar(zz > -3 ? 0 : 1)
        dummy.updateMatrix()
        e.setMatrixAt(side * COUNT + i, dummy.matrix)
      }
    }
    p.instanceMatrix.needsUpdate = true
    e.instanceMatrix.needsUpdate = true
    // Lamp heads: glowing sprites on poles along the left verge.
    lamps.current?.children.forEach((c, i) => {
      const zz = 8 - ((i * LAMP_SPACING + l.odo + 17) % (LAMP_SPACING * LAMPS))
      c.position.z = zz
      c.visible = l.lamps > 0.05
      const s = c.children[1] as THREE.Sprite | undefined
      if (s) (s.material as THREE.SpriteMaterial).opacity = l.lamps
    })
  })
  return (
    <>
      <instancedMesh ref={posts} args={[undefined, undefined, COUNT * 2]}>
        <boxGeometry args={[0.14, 0.9, 0.14]} />
        <meshBasicMaterial color="#9aa0aa" />
      </instancedMesh>
      <instancedMesh ref={eyes} args={[undefined, undefined, COUNT * 2]}>
        <boxGeometry args={[0.16, 0.12, 0.02]} />
        <meshBasicMaterial color="#ffb020" toneMapped={false} />
      </instancedMesh>
      <group ref={lamps}>
        {Array.from({ length: LAMPS }, (_, i) => (
          <group key={i} position={[-8.6, 0, 0]}>
            <mesh position={[0, 3.2, 0]}>
              <boxGeometry args={[0.12, 6.4, 0.12]} />
              <meshBasicMaterial color="#1a1c22" />
            </mesh>
            <sprite position={[1.2, 6.3, 0]} scale={[3.2, 3.2, 1]}>
              <spriteMaterial map={glow} color="#ffb24a" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </sprite>
          </group>
        ))}
      </group>
    </>
  )
}

/** Other cars: headlights coming toward us on the right, taillights pulling away on the left. */
function Traffic({ liveRef, glow }: { liveRef: React.RefObject<Live>; glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null)
  const cars = useMemo(
    () => [
      { oncoming: true, z: -260, lane: 2.3 },
      { oncoming: true, z: -520, lane: 2.5 },
      { oncoming: false, z: -90, lane: LANE_X - 0.1 },
      { oncoming: false, z: -210, lane: LANE_X + 0.2 },
    ],
    [],
  )
  useFrame((_, dt) => {
    const l = liveRef.current
    const g = group.current
    if (!g) return
    cars.forEach((c, i) => {
      // Oncoming cars close at our speed plus theirs; the cars ahead drift slowly back toward us.
      c.z += (c.oncoming ? l.speed + 30 : l.speed - 22) * dt
      if (c.z > 10) c.z = -380 - Math.random() * 200
      if (c.z < -420) c.z = -40 - Math.random() * 60
      const car = g.children[i]
      car.position.set(c.lane, 0.65, c.z)
    })
  })
  return (
    <group ref={group}>
      {cars.map((c, i) => (
        <group key={i}>
          {[-0.75, 0.75].map((dx) => (
            <sprite key={dx} position={[dx, 0, 0]} scale={c.oncoming ? [2.6, 2.6, 1] : [1.5, 1.5, 1]}>
              <spriteMaterial
                map={glow}
                color={c.oncoming ? "#fff4e0" : "#ff2a1a"}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </sprite>
          ))}
        </group>
      ))}
    </group>
  )
}

function Rig({ mood, liveRef }: { mood: string; liveRef: React.RefObject<Live> }) {
  const pointer = useRef({ x: 0, y: 0 })
  const lookRef = useRef(new THREE.Vector3())
  const targetRef = useRef(liveFrom(MOODS.drive))
  const fogRef = useRef<THREE.Fog>(null)
  useEffect(() => {
    targetRef.current = liveFrom(MOODS[mood] ?? MOODS.drive)
  }, [mood])
  useEffect(() => {
    const stop = startTelemetry()
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      stop()
      window.removeEventListener("pointermove", onMove)
    }
  }, [])

  useFrame((st, dt) => {
    const l = liveRef.current
    const target = targetRef.current
    const look = lookRef.current
    // A scene change is a slow grade, not a cut: about two seconds to settle.
    const k = 1 - Math.exp(-dt * 1.6)
    for (const key of ["top", "horizon", "fog", "ridgeNear", "ridgeFar", "sunColor"] as const) l[key].lerp(target[key], k)
    for (const key of ["stars", "sun", "pitch", "lamps"] as const) l[key] += (target[key] - l[key]) * k
    // Speed: the mood's cruise plus whatever the visitor's hand adds.
    const want = target.speed + (target.speed > 0 ? telemetry.kmh * 0.35 : 0)
    l.speed += (want - l.speed) * (1 - Math.exp(-dt * 1.2))
    l.odo += l.speed * dt
    fogRef.current?.color.copy(l.fog)

    const cam = st.camera as THREE.PerspectiveCamera
    const t = st.clock.elapsedTime
    const p = pointer.current
    // Seated in the car: a little road rumble at speed and a glance toward the pointer.
    const rumble = Math.min(1, l.speed / 60) * 0.02
    cam.position.set(LANE_X + p.x * 0.35, 1.35 + Math.sin(t * 19) * rumble + Math.sin(t * 0.7) * 0.03, 4)
    look.set(LANE_X + p.x * 2.4 + Math.sin(t * 0.25) * 0.6, 1.15 + l.pitch * 60 - p.y * 0.8, -40)
    cam.lookAt(look)
    // Faster feels wider, like a lens pulling back.
    const fov = 52 + Math.min(1, l.speed / 90) * 14
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov += (fov - cam.fov) * 0.08
      cam.updateProjectionMatrix()
    }
  })
  return <fog ref={fogRef} attach="fog" args={[MOODS.drive.fog, 40, 300]} />
}

function World({ mood }: { mood: string }) {
  const liveRef = useRef<Live>(liveFrom(MOODS.drive))
  const glow = useMemo(() => glowTexture(), [])
  useEffect(() => () => glow.dispose(), [glow])
  return (
    <>
      <Rig mood={mood} liveRef={liveRef} />
      <Sky liveRef={liveRef} />
      <Ridges liveRef={liveRef} />
      <Road liveRef={liveRef} />
      <Roadside liveRef={liveRef} glow={glow} />
      <Traffic liveRef={liveRef} glow={glow} />
    </>
  )
}

/** The world outside the windscreen: a night road through the mountains, graded per page. */
export default function Drive({ mood }: { mood: string }) {
  const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, window.innerWidth < 900 ? 1.5 : 1.75)
  return (
    <Canvas
      className="drive"
      dpr={dpr}
      camera={{ fov: 52, near: 0.1, far: 900, position: [LANE_X, 1.35, 4] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <World mood={mood} />
    </Canvas>
  )
}
