/**
 * OptimaScene — the WebGL world behind the landing page.
 *
 * One particle cloud morphs through the page's story (uMorph 0..5):
 *   0 neural net (signals flowing along bezier edges)
 *   1 sphere — "every dataset begins as a cloud of points"
 *   2 tesseract — a 4D hypercube double-rotating ("optimization folds
 *     it into structure"); particles stream along its edges
 *   3 AI core — pulsing nucleus + three gyroscopic rings + orbit dust
 *   4 NEXUS wordmark — particles spell the brand
 *   5 developer portrait — true photo colors, plus a second particle
 *     system (PORTRAIT_EXTRA_COUNT) that flies in for double density
 *
 * Plus: a loss-landscape shader terrain with gradient-descent particles,
 * starfield, nebula sprites, bloom + film-grade post. Stages 2 and 3 are
 * fully procedural in the vertex shader; 4 and 5 sample raster targets.
 *
 * The React layer owns the rAF loop and scroll math and calls
 * `frame(state)` once per tick.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const DEFAULTS = Object.freeze({
  pointDensity: 6000,
  rotationSpeed: 1,
  flowSpeed: 0.3,
})

// Extra particles that exist only for the developer-portrait finale —
// they fly in from a far shell as the last morph engages, roughly
// doubling the portrait's density versus every other formation.
const PORTRAIT_EXTRA_COUNT = 7000

// Camera keyframes over whole-page scroll fraction (t in [0..1]).
const CAMERA_KEYS = [
  // First two keys look from higher up so the net sits in the lower half
  // of the screen and the intro copy owns the top half.
  { t: 0.0, p: [0, 0.3, 5.2], l: [0, 0.32, 0] },
  { t: 0.08, p: [0.35, 0.3, 4.75], l: [0.1, 0.24, 0] },
  { t: 0.16, p: [0.95, 0.42, 4.0], l: [0.22, 0.06, 0] },
  { t: 0.26, p: [-0.85, -0.34, 3.55], l: [-0.16, 0.04, 0] },
  { t: 0.36, p: [0, 0.24, 3.95], l: [0, 0, 0] },
  { t: 0.5, p: [0.7, 0.52, 4.65], l: [0.26, 0.1, 0] },
  { t: 0.64, p: [-0.8, 0.2, 4.25], l: [-0.2, 0.02, 0] },
  { t: 0.72, p: [0.7, 0.55, 5.4], l: [0.18, 0.06, 0] },
  { t: 0.8, p: [-0.5, 0.4, 5.0], l: [-0.12, 0.08, 0] },
  // head-on framing while the particles spell NEXUS at the CTA
  { t: 0.88, p: [0, 0.35, 5.1], l: [0, 0.1, 0] },
  // gentle lift as the wordmark hands over to the portrait
  { t: 0.93, p: [0.2, 0.85, 5.7], l: [0, 0.3, 0] },
  // finale frames the developer portrait head-on against the dark sky
  { t: 0.97, p: [0, 0.5, 4.9], l: [0, 0.52, 0] },
  { t: 1.0, p: [0.1, 0.46, 4.3], l: [0.03, 0.55, 0] },
]

const smooth = (x) => {
  const c = Math.max(0, Math.min(1, x))
  return c * c * (3 - 2 * c)
}
const clamp01 = (x) => Math.max(0, Math.min(1, x))

export default class OptimaScene {
  /**
   * @param {HTMLCanvasElement} canvas fixed, full-viewport canvas
   * @param {Partial<typeof DEFAULTS>} [opts]
   */
  constructor(canvas, opts = {}) {
    this.opts = { ...DEFAULTS, ...opts }
    this.densScale = 1
    this.usePost = false
    this.morph = 0

    // The prototype was authored for r128 (no color management, linear
    // output). Reproduce that pipeline, then restore the global flag on
    // dispose so r3f components on other routes are unaffected.
    this._prevColorManagement = THREE.ColorManagement.enabled
    THREE.ColorManagement.enabled = false

    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25))
    this.renderer.setSize(w, h, false)
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x06070c, 0.052)
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
    this.camera.position.z = 4.5
    this._camP = [0, 0.3, 5.2]
    this._camL = [0, 0.32, 0]

    this.world = new THREE.Group()
    this.scene.add(this.world)
    this.spinner = new THREE.Group()
    this.world.add(this.spinner)

    // fewer particles on small screens — mobile GPUs pay dearly for fill
    if (window.innerWidth < 768) {
      this.opts.pointDensity = Math.min(this.opts.pointDensity, 4200)
    }

    this.sprite = this._makeSprite()
    this._buildStars()
    this._buildTerrain()
    this._buildPost(w, h)
    this._buildNebula()
    this._buildSmoke()
    this.rebuildCloud()
    this._loadPortrait()
    // the wordmark uses the display serif — refill once fonts are ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (this.renderer) this._buildWordTargets()
      })
    }
  }

  /* ── textures ─────────────────────────────────────────────── */

  _makeSprite() {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    rg.addColorStop(0, 'rgba(255,255,255,1)')
    rg.addColorStop(0.22, 'rgba(216,232,255,0.85)')
    rg.addColorStop(1, 'rgba(120,160,255,0)')
    g.fillStyle = rg
    g.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }

  _makeGlow(rgba) {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')
    const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    rg.addColorStop(0, rgba)
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = rg
    g.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }

  _makeNoiseTex() {
    const S = 256
    const cv = document.createElement('canvas')
    cv.width = cv.height = S
    const ctx2 = cv.getContext('2d')
    const img = ctx2.createImageData(S, S)
    const hash = (x, y, o) => {
      const s = Math.sin(x * 127.1 + y * 311.7 + o * 74.7) * 43758.5453
      return s - Math.floor(s)
    }
    const vn = (px, py, cells, o) => {
      const x = px * cells
      const y = py * cells
      const ix = Math.floor(x)
      const iy = Math.floor(y)
      let fx = x - ix
      let fy = y - iy
      fx = fx * fx * (3 - 2 * fx)
      fy = fy * fy * (3 - 2 * fy)
      const i0 = ix % cells
      const i1 = (ix + 1) % cells
      const j0 = iy % cells
      const j1 = (iy + 1) % cells
      const a = hash(i0, j0, o)
      const b = hash(i1, j0, o)
      const c = hash(i0, j1, o)
      const d = hash(i1, j1, o)
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
    }
    const fbm = (px, py, oct, seed) => {
      let amp = 0.5
      let s = 0
      let cells = 8
      for (let o = 0; o < oct; o++) {
        s += amp * vn(px, py, cells, o + seed)
        cells *= 2
        amp *= 0.5
      }
      return s
    }
    let k = 0
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const px = i / S
        const py = j / S
        img.data[k++] = fbm(px, py, 4, 0) * 255
        img.data[k++] = fbm(px, py, 4, 10) * 255
        img.data[k++] = fbm(px, py, 3, 20) * 255
        img.data[k++] = 255
      }
    ctx2.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(cv)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  }

  /* ── static scenery ───────────────────────────────────────── */

  _buildStars() {
    const SN = 900
    const sp = new Float32Array(SN * 3)
    for (let i = 0; i < SN; i++) {
      const r = 13 + Math.random() * 16
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(Math.random() * 2 - 1)
      sp[i * 3] = r * Math.sin(ph) * Math.cos(th)
      sp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
      sp[i * 3 + 2] = r * Math.cos(ph)
    }
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3))
    this.stars = new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        map: this.sprite, size: 0.075, color: 0x9fc0ff,
        transparent: true, opacity: 0.36,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    )
    this.scene.add(this.stars)
  }

  /** Soft fbm smoke puff with a radial falloff — tinted per sprite. */
  _makeSmokeTex() {
    const S = 256
    const cv = document.createElement('canvas')
    cv.width = cv.height = S
    const ctx2 = cv.getContext('2d')
    const img = ctx2.createImageData(S, S)
    const hash = (x, y, o) => {
      const s = Math.sin(x * 127.1 + y * 311.7 + o * 74.7) * 43758.5453
      return s - Math.floor(s)
    }
    const vn = (px, py, cells, o) => {
      const x = px * cells
      const y = py * cells
      const ix = Math.floor(x)
      const iy = Math.floor(y)
      let fx = x - ix
      let fy = y - iy
      fx = fx * fx * (3 - 2 * fx)
      fy = fy * fy * (3 - 2 * fy)
      const i0 = ix % cells
      const i1 = (ix + 1) % cells
      const j0 = iy % cells
      const j1 = (iy + 1) % cells
      const a = hash(i0, j0, o)
      const b = hash(i1, j0, o)
      const c = hash(i0, j1, o)
      const d = hash(i1, j1, o)
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
    }
    let k = 0
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const px = i / S
        const py = j / S
        let v = 0
        let amp = 0.5
        let cells = 3
        for (let o = 0; o < 5; o++) {
          v += amp * vn(px, py, cells, o * 7)
          cells *= 2
          amp *= 0.55
        }
        const dx = px - 0.5
        const dy = py - 0.5
        const fall = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2.15)
        const a = Math.max(0, (v - 0.32) * 1.9) * fall * fall
        img.data[k++] = 168
        img.data[k++] = 196
        img.data[k++] = 255
        img.data[k++] = Math.min(255, a * 255)
      }
    ctx2.putImageData(img, 0, 0)
    return new THREE.CanvasTexture(cv)
  }

  /**
   * Volumetric-feeling mist: large soft smoke sprites drifting slowly
   * around the scene. Faded out during the neural-net stage (the net wants
   * clean darkness) and eased back everywhere else.
   */
  _buildSmoke() {
    const tex = this._makeSmokeTex()
    this.smoke = []
    const COUNT = window.innerWidth < 768 ? 16 : 36
    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        rotation: Math.random() * Math.PI * 2,
      })
      const s = new THREE.Sprite(mat)
      const a = (i / COUNT) * Math.PI * 2 + Math.random() * 0.7
      const r = 1.4 + Math.random() * 5.4
      s.position.set(Math.cos(a) * r, -1.0 + Math.random() * 3.2, Math.sin(a) * r - 1.0)
      s.scale.setScalar(2.4 + Math.random() * 6.0)
      this.scene.add(s)
      this.smoke.push({
        s,
        baseO: 0.06 + Math.random() * 0.11,
        rot: (Math.random() - 0.5) * 0.0012,
        drift: Math.random() * 100,
        y0: s.position.y,
        x0: s.position.x,
      })
    }
    this._buildFogDust()
  }

  /**
   * Ultra-fine mist: thousands of tiny soft points drifting in slow curls.
   * Individually invisible — together they read as smooth volumetric smoke.
   */
  _buildFogDust() {
    const N = window.innerWidth < 768 ? 2600 : 6000
    const pos = new Float32Array(N * 3)
    const seed = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 13
      pos[i * 3 + 1] = -1.3 + Math.random() * 4.4
      pos[i * 3 + 2] = -5 + Math.random() * 8.6
      seed[i * 3] = Math.random()
      seed[i * 3 + 1] = Math.random()
      seed[i * 3 + 2] = 0.4 + Math.random() * 1.2
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geom.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3))
    this.fogMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFog: { value: 0 },
        uPR: { value: Math.min(devicePixelRatio, 1.25) },
        uVh: { value: window.innerHeight / 850 },
      },
      vertexShader: [
        'uniform float uTime; uniform float uFog; uniform float uPR; uniform float uVh;',
        'attribute vec3 aSeed;',
        'varying float vA;',
        'void main(){',
        '  vec3 p = position;',
        '  p.x += sin(uTime * 0.05 * aSeed.z + aSeed.x * 43.0) * 0.9;',
        '  p.y += sin(uTime * 0.04 * aSeed.z + aSeed.y * 31.0) * 0.4;',
        '  p.z += cos(uTime * 0.045 * aSeed.z + aSeed.x * 57.0) * 0.7;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  float tw = 0.65 + 0.35 * sin(uTime * (0.3 + aSeed.z * 0.5) + aSeed.y * 90.0);',
        '  vA = uFog * tw * (0.16 + aSeed.y * 0.2);',
        '  gl_PointSize = (0.035 + aSeed.x * 0.075) * uPR * uVh * (260.0 / -mv.z);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying float vA;',
        'void main(){',
        '  vec2 q = gl_PointCoord - 0.5;',
        '  float a = smoothstep(0.5, 0.0, length(q));',
        '  gl_FragColor = vec4(vec3(0.5, 0.6, 0.85), a * vA);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.fogDust = new THREE.Points(geom, this.fogMat)
    this.fogDust.frustumCulled = false
    this.fogDust.visible = false
    this.scene.add(this.fogDust)
  }

  _buildNebula() {
    const defs = [
      [-6, 2.5, -9, 16, 'rgba(38,60,128,0.5)'],
      [5.5, -3, -10, 18, 'rgba(52,38,110,0.5)'],
      [1.5, 4.5, -11, 20, 'rgba(20,40,92,0.5)'],
    ]
    this.nebula = defs.map((d) => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this._makeGlow(d[4]), transparent: true, opacity: 0.4,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      )
      s.position.set(d[0], d[1], d[2])
      s.scale.setScalar(d[3])
      this.scene.add(s)
      return s
    })
  }

  _buildPost(w, h) {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    // Bloom at a middle setting — enough glow to feel alive, not enough
    // to wash out the DOM text overlay (prototype used 0.85; 0.3 was flat).
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.55, 0.75, 0.22)
    this.composer.addPass(this.bloom)
    this.gradePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null }, uTime: { value: 0 },
        uCA: { value: 1 }, uGrain: { value: 0.035 },
      },
      vertexShader:
        'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tDiffuse; uniform float uTime; uniform float uCA; uniform float uGrain;',
        'varying vec2 vUv;',
        'vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }',
        'void main(){',
        '  vec2 c = vUv - 0.5; float r2 = dot(c, c);',
        '  float ca = uCA * (0.0012 + r2 * 0.0045);',
        '  vec3 col;',
        '  col.r = texture2D(tDiffuse, vUv + c * ca).r;',
        '  col.g = texture2D(tDiffuse, vUv).g;',
        '  col.b = texture2D(tDiffuse, vUv - c * ca).b;',
        '  col = aces(col * 1.06);',
        '  col = mix(col, col * col * (3.0 - 2.0 * col), 0.16);',
        '  col *= mix(0.8, 1.0, smoothstep(0.62, 0.18, r2));',
        '  float g = fract(sin(dot(vUv * 1517.0 + fract(uTime * 7.0), vec2(12.9898, 78.233))) * 43758.5453);',
        '  col += (g - 0.5) * uGrain;',
        '  gl_FragColor = vec4(col, 1.0);',
        '}',
      ].join('\n'),
    })
    this.composer.addPass(this.gradePass)
    this.composer.setPixelRatio(Math.min(devicePixelRatio, 1.25))
    this.composer.setSize(w, h)
    this.usePost = true
  }

  /* ── loss-landscape terrain ───────────────────────────────── */

  terrHeight(x, z) {
    let h =
      Math.sin(x * 0.12 + 1.7) * Math.cos(z * 0.14 - 0.4) * 1.05 +
      Math.sin(x * 0.24 - 0.8) * Math.sin(z * 0.2 + 2.1) * 0.5 +
      Math.sin((x + z) * 0.08) * 0.8
    h = h * 0.7 + Math.abs(Math.sin(x * 0.18) * Math.cos(z * 0.16)) * 1.0
    h += Math.sin(x * 0.55 + z * 0.35) * 0.14 + Math.sin(x * 0.9 - z * 0.7 + 1.3) * 0.08
    const r = Math.sqrt(x * x + z * z)
    return h + r * 0.045 - 3.4 * Math.exp(-(r * r) / 84.5)
  }

  _buildTerrain() {
    const noiseTex = this._makeNoiseTex()
    const geo = new THREE.PlaneGeometry(90, 90, 140, 140)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) pos.setY(i, this.terrHeight(pos.getX(i), pos.getZ(i)))
    geo.computeVertexNormals()
    this.terrMat = new THREE.ShaderMaterial({
      uniforms: {
        uLow: { value: new THREE.Vector3(0.009, 0.032, 0.09) },
        uHigh: { value: new THREE.Vector3(0.034, 0.13, 0.22) },
        uContour: { value: new THREE.Vector3(0.17, 0.52, 0.6) },
        uFog: { value: new THREE.Vector3(0.023, 0.028, 0.047) },
        uCamPos: { value: new THREE.Vector3() },
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uSimple: { value: 0 },
        uNoise: { value: noiseTex },
      },
      vertexShader: [
        'varying vec3 vW; varying vec3 vN;',
        'void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uLow; uniform vec3 uHigh; uniform vec3 uContour; uniform vec3 uFog; uniform vec3 uCamPos; uniform float uTime; uniform float uReveal; uniform float uSimple; uniform sampler2D uNoise;',
        'varying vec3 vW; varying vec3 vN;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
        'void main(){',
        '  vec2 xz = vW.xz;',
        '  vec3 V = normalize(uCamPos - vW);',
        '  float hf = clamp((vW.y + 2.6) / 4.4, 0.0, 1.0);',
        '  float distC = length(uCamPos - vW);',
        '  vec3 L1 = normalize(vec3(0.35, 0.8, 0.25));',
        '  vec3 col;',
        '  if (uSimple > 0.5) {',
        '    vec3 Ns = normalize(vN);',
        '    col = mix(uLow, uHigh, hf) * (0.45 + 0.6 * clamp(dot(Ns, L1), 0.0, 1.0));',
        '  } else {',
        '    vec2 nuv = xz * 0.175;',
        '    float dtl = texture2D(uNoise, nuv).r;',
        '    float dtl2 = texture2D(uNoise, xz * 0.625 + 0.31).g;',
        '    float bx = texture2D(uNoise, nuv + vec2(0.05, 0.0)).r - dtl;',
        '    float bz = texture2D(uNoise, nuv + vec2(0.0, 0.05)).r - dtl;',
        '    vec3 N = normalize(normalize(vN) + vec3(-bx, 0.0, -bz) * 2.2);',
        '    float slope = 1.0 - clamp(N.y, 0.0, 1.0);',
        '    float snow = smoothstep(0.35, 0.75, hf + (dtl - 0.5) * 0.5) * smoothstep(0.55, 0.15, slope);',
        '    vec3 rock = mix(uLow, uHigh, hf) * (0.7 + 0.55 * dtl2);',
        '    vec3 ice = mix(vec3(0.5, 0.66, 0.82), vec3(0.72, 0.86, 0.98), dtl2) * 0.32;',
        '    vec3 alb = mix(rock, ice, snow);',
        '    vec3 L2 = normalize(vec3(-0.5, 0.4, -0.6));',
        '    float dif = clamp(dot(N, L1), 0.0, 1.0);',
        '    col = alb * (0.15 + 0.62 * dif) + alb * vec3(0.35, 0.5, 0.75) * 0.18 * clamp(dot(N, L2), 0.0, 1.0);',
        '    vec3 H = normalize(L1 + V);',
        '    col += vec3(0.75, 0.9, 1.0) * pow(clamp(dot(N, H), 0.0, 1.0), 42.0) * (0.03 + 0.16 * snow);',
        '    float gl = hash(floor(xz * 34.0));',
        '    float tw2 = 0.5 + 0.5 * sin(uTime * 2.0 + gl * 40.0);',
        '    col += vec3(0.9, 0.97, 1.0) * smoothstep(0.997, 1.0, gl * tw2) * snow * 0.5 * dif;',
        '    col += vec3(0.3, 0.55, 0.85) * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0) * 0.07;',
        '    float vein = smoothstep(0.6, 0.7, texture2D(uNoise, xz * 0.325 + 0.43).b) * smoothstep(0.45, 0.05, hf);',
        '    col += uContour * vein * (0.1 + 0.05 * sin(uTime * 0.8 + dtl * 9.0));',
        '  }',
        '  float rr = length(xz);',
        '  float fv = fract(vW.y * 2.3 - uTime * 0.04);',
        '  float dd = min(fv, 1.0 - fv);',
        '  float w = fwidth(vW.y * 2.3) * 1.3 + 0.02;',
        '  float line = (1.0 - smoothstep(0.0, w, dd)) * exp(-rr * 0.22);',
        '  col += uContour * line * 0.13;',
        '  float fog = 1.0 - exp(-distC * distC * 0.0016);',
        '  col = mix(col, uFog, fog);',
        '  col = mix(uFog, col, uReveal);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}',
      ].join('\n'),
    })
    this.terrain = new THREE.Mesh(geo, this.terrMat)
    this.terrain.position.y = 0.4
    this.scene.add(this.terrain)

    const bg = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, 40),
      new THREE.MeshBasicMaterial({
        map: this._makeGlow('rgba(70,190,255,0.5)'), color: 0x46e2ff,
        blending: THREE.AdditiveBlending, depthWrite: false,
        transparent: true, opacity: 0,
      })
    )
    bg.rotation.x = -Math.PI / 2
    bg.position.y = this.terrHeight(0, 0) + 0.9
    this.basinGlow = bg
    this.scene.add(bg)

    // Gradient-descent particles rolling down the loss surface.
    const PN = (this.descN = 240)
    this.descPos = new Float32Array(PN * 3)
    this.descPts = []
    for (let i = 0; i < PN; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 7 + Math.random() * 12
      this.descPts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r })
    }
    this.descGeo = new THREE.BufferGeometry()
    this.descGeo.setAttribute('position', new THREE.BufferAttribute(this.descPos, 3))
    this.descPoints = new THREE.Points(
      this.descGeo,
      new THREE.PointsMaterial({
        map: this.sprite, color: 0x6ff0ff, size: 0.12, sizeAttenuation: true,
        transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    )
    this.descPoints.frustumCulled = false
    this.scene.add(this.descPoints)
  }

  /* ── morphing point cloud ─────────────────────────────────── */

  _genSphere(N) {
    const a = new Float32Array(N * 3)
    const gr = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const t = gr * i
      a[i * 3] = Math.cos(t) * r * 1.4
      a[i * 3 + 1] = y * 1.4
      a[i * 3 + 2] = Math.sin(t) * r * 1.4
    }
    return a
  }

  _buildNet() {
    const heights = [2.3, 1.5, 1.05, 0.95, 0.9, 0.9, 0.9, 0.95, 1.0, 1.05]
    const L = heights.length
    const x0 = -2.65
    const x1 = 2.65
    const layers = heights.map((h) => Math.max(9, Math.round(h * 11)))
    const nodes = []
    const layerX = []
    const layerOff = []
    for (let li = 0; li < L; li++) {
      const cnt = layers[li]
      const x = x0 + ((x1 - x0) * li) / (L - 1)
      const h = heights[li]
      layerX.push(x)
      layerOff.push(nodes.length)
      for (let k = 0; k < cnt; k++) {
        const y = (cnt === 1 ? 0 : k / (cnt - 1) - 0.5) * h
        nodes.push([
          x + (Math.random() - 0.5) * 0.03,
          y + (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.1,
        ])
      }
    }
    const edges = []
    for (let li = 0; li < L - 1; li++) {
      const aC = layers[li]
      const bC = layers[li + 1]
      const aO = layerOff[li]
      const bO = layerOff[li + 1]
      const fan = li === 0 ? 3 : 2
      for (let i = 0; i < aC; i++)
        for (let d = 0; d < fan; d++) {
          const j =
            Math.random() < 0.55
              ? Math.max(0, Math.min(bC - 1, Math.round((i * (bC - 1)) / (aC - 1)) + ((Math.random() * 5) | 0) - 2))
              : (Math.random() * bC) | 0
          const A = nodes[aO + i]
          const B = nodes[bO + j]
          const my = (A[1] + B[1]) / 2
          const bulge = 1.7 + Math.random() * 1.1
          edges.push([
            A[0], A[1], A[2], B[0], B[1], B[2],
            (A[0] + B[0]) / 2,
            my * bulge + (Math.random() - 0.5) * 0.14,
            (A[2] + B[2]) / 2 + (Math.random() - 0.5) * 0.5,
          ])
        }
    }
    this.netEdges = edges
    this.netGroup = new THREE.Group()
    const np = new Float32Array(nodes.length * 3)
    nodes.forEach((n, i) => {
      np[i * 3] = n[0]
      np[i * 3 + 1] = n[1]
      np[i * 3 + 2] = n[2]
    })
    const ng = new THREE.BufferGeometry()
    ng.setAttribute('position', new THREE.BufferAttribute(np, 3))
    this.netNodesPts = new THREE.Points(
      ng,
      new THREE.PointsMaterial({
        map: this.sprite, size: 0.055, color: 0xeaf2ff,
        transparent: true, opacity: 0.75,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    )
    const S = 8
    const lp = new Float32Array(edges.length * S * 6)
    const lc = new Float32Array(edges.length * S * 6)
    const pal = [
      new THREE.Color('#6fb6ff'), new THREE.Color('#7ea6ff'),
      new THREE.Color('#b79dff'), new THREE.Color('#ffd9a8'),
      new THREE.Color('#8fe3ff'),
    ]
    const bez = (e, t, out) => {
      const u = 1 - t
      out[0] = u * u * e[0] + 2 * u * t * e[6] + t * t * e[3]
      out[1] = u * u * e[1] + 2 * u * t * e[7] + t * t * e[4]
      out[2] = u * u * e[2] + 2 * u * t * e[8] + t * t * e[5]
    }
    let w = 0
    const pA = [0, 0, 0]
    const pB = [0, 0, 0]
    edges.forEach((e) => {
      const col = pal[(Math.random() * pal.length) | 0]
      for (let s = 0; s < S; s++) {
        bez(e, s / S, pA)
        bez(e, (s + 1) / S, pB)
        lp[w] = pA[0]; lp[w + 1] = pA[1]; lp[w + 2] = pA[2]
        lc[w] = col.r; lc[w + 1] = col.g; lc[w + 2] = col.b
        w += 3
        lp[w] = pB[0]; lp[w + 1] = pB[1]; lp[w + 2] = pB[2]
        lc[w] = col.r; lc[w + 1] = col.g; lc[w + 2] = col.b
        w += 3
      }
    })
    const lg = new THREE.BufferGeometry()
    lg.setAttribute('position', new THREE.BufferAttribute(lp, 3))
    lg.setAttribute('color', new THREE.BufferAttribute(lc, 3))
    this.netLines = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.12,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    )
    const bigN = 2
    const gpA = new Float32Array(bigN * 3)
    const gpB = new Float32Array((L - bigN) * 3)
    for (let li = 0; li < L; li++) {
      const t = li < bigN ? gpA : gpB
      const k = li < bigN ? li : li - bigN
      t[k * 3] = layerX[li]
      t[k * 3 + 1] = 0
      t[k * 3 + 2] = 0
    }
    const ggA = new THREE.BufferGeometry()
    ggA.setAttribute('position', new THREE.BufferAttribute(gpA, 3))
    this.netCoresA = new THREE.Points(
      ggA,
      new THREE.PointsMaterial({
        map: this.sprite, size: 0.44, color: 0xfff0dc,
        transparent: true, opacity: 0.38,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    )
    const ggB = new THREE.BufferGeometry()
    ggB.setAttribute('position', new THREE.BufferAttribute(gpB, 3))
    this.netCoresB = new THREE.Points(
      ggB,
      new THREE.PointsMaterial({
        map: this.sprite, size: 0.3, color: 0xffe9c9,
        transparent: true, opacity: 0.24,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    )
    this.netGroup.add(this.netNodesPts, this.netLines, this.netCoresA, this.netCoresB)
    this.spinner.add(this.netGroup)
  }

  rebuildCloud() {
    if (this.points) {
      this.spinner.remove(this.points)
      this.points.geometry.dispose()
      this.points.material.dispose()
    }
    if (this.netGroup) {
      this.spinner.remove(this.netGroup)
      this.netGroup.children.forEach((o) => {
        o.geometry.dispose()
        o.material.dispose()
      })
    }
    const N = (this.N = Math.round(this.opts.pointDensity * this.densScale))
    this._buildNet()
    const sph = this._genSphere(N)
    const netA = new Float32Array(N * 3)
    const netB = new Float32Array(N * 3)
    const netC = new Float32Array(N * 3)
    const flow = new Float32Array(N * 2)
    const misc = new Float32Array(N * 2)
    const colA = new Float32Array(N * 3)
    // Raster-based targets (wordmark, portrait) default to the sphere so
    // an un-loaded asset degrades to a graceful non-event.
    const word = new Float32Array(N * 3)
    const port = new Float32Array(N * 4)
    const portC = new Float32Array(N * 3)
    const cols = [
      [0.49, 0.65, 1], [0.49, 0.65, 1], [0.44, 0.71, 1],
      [0.72, 0.62, 1], [1, 0.85, 0.66],
    ]
    const E = this.netEdges
    for (let i = 0; i < N; i++) {
      const e = E[(Math.random() * E.length) | 0]
      const j = i * 3
      netA[j] = e[0]; netA[j + 1] = e[1]; netA[j + 2] = e[2]
      netB[j] = e[3]; netB[j + 1] = e[4]; netB[j + 2] = e[5]
      netC[j] = e[6]; netC[j + 1] = e[7]; netC[j + 2] = e[8]
      const sig = i % 6 === 0
      flow[i * 2] = Math.random()
      flow[i * 2 + 1] = sig ? 0.5 + Math.random() * 0.6 : 0.08 + Math.random() * 0.26
      misc[i * 2] = Math.random()
      misc[i * 2 + 1] = sig ? 0.085 + Math.random() * 0.03 : 0.045 + Math.random() * 0.03
      const c = sig ? [1, 1, 1] : cols[(Math.random() * cols.length) | 0]
      colA[j] = c[0]; colA[j + 1] = c[1]; colA[j + 2] = c[2]
      word[j] = sph[j]; word[j + 1] = sph[j + 1]; word[j + 2] = sph[j + 2]
      port[i * 4] = sph[j]; port[i * 4 + 1] = sph[j + 1]; port[i * 4 + 2] = sph[j + 2]
      port[i * 4 + 3] = 0.55
      portC[j] = 0.6; portC[j + 1] = 0.7; portC[j + 2] = 1.0
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(sph, 3))
    geom.setAttribute('aWord', new THREE.BufferAttribute(word, 3))
    geom.setAttribute('aPort', new THREE.BufferAttribute(port, 4))
    geom.setAttribute('aPortC', new THREE.BufferAttribute(portC, 3))
    geom.setAttribute('aNetA', new THREE.BufferAttribute(netA, 3))
    geom.setAttribute('aNetB', new THREE.BufferAttribute(netB, 3))
    geom.setAttribute('aNetC', new THREE.BufferAttribute(netC, 3))
    geom.setAttribute('aFlowD', new THREE.BufferAttribute(flow, 2))
    geom.setAttribute('aMisc', new THREE.BufferAttribute(misc, 2))
    geom.setAttribute('aCol', new THREE.BufferAttribute(colA, 3))
    this.pMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uMorph: { value: 0 }, uFlow: { value: 1 },
        uIntro: { value: 0 }, uPR: { value: Math.min(devicePixelRatio, 1.25) },
        uVh: { value: window.innerHeight / 850 },
      },
      vertexShader: [
        'uniform float uTime; uniform float uMorph; uniform float uFlow; uniform float uIntro; uniform float uPR; uniform float uVh;',
        'attribute vec3 aWord; attribute vec4 aPort; attribute vec3 aPortC;',
        'attribute vec3 aNetA; attribute vec3 aNetB; attribute vec3 aNetC; attribute vec3 aCol;',
        'attribute vec2 aFlowD; attribute vec2 aMisc;',
        'varying vec3 vCol; varying float vA;',
        'float ss(float x){ x = clamp(x, 0.0, 1.0); return x*x*(3.0-2.0*x); }',
        'void main(){',
        '  float seed = aMisc.x;',
        '  float fr = fract(aFlowD.x + uTime * aFlowD.y * uFlow);',
        '  float u = 1.0 - fr;',
        '  vec3 net = u*u*aNetA + 2.0*u*fr*aNetC + fr*fr*aNetB;',
        // ── tesseract: particles stream along 4D hypercube edges while it
        //    double-rotates in the (x,w) and (y,z) planes ──
        '  float axSel = floor(fract(seed * 13.73) * 4.0);',
        '  vec3 oc = step(0.5, fract(seed * vec3(3.17, 5.31, 7.97))) * 2.0 - 1.0;',
        '  float et = fract(aFlowD.x + uTime * (0.05 + aFlowD.y * 0.12));',
        '  float ec = et * 2.0 - 1.0;',
        '  vec4 v4;',
        '  if (axSel < 0.5) v4 = vec4(ec, oc.x, oc.y, oc.z);',
        '  else if (axSel < 1.5) v4 = vec4(oc.x, ec, oc.y, oc.z);',
        '  else if (axSel < 2.5) v4 = vec4(oc.x, oc.y, ec, oc.z);',
        '  else v4 = vec4(oc.x, oc.y, oc.z, ec);',
        '  float ra = uTime * 0.4; float c1 = cos(ra); float s1 = sin(ra);',
        '  v4 = vec4(v4.x * c1 - v4.w * s1, v4.y, v4.z, v4.x * s1 + v4.w * c1);',
        '  float rb = uTime * 0.29; float c2 = cos(rb); float s2 = sin(rb);',
        '  v4 = vec4(v4.x, v4.y * c2 - v4.z * s2, v4.y * s2 + v4.z * c2, v4.w);',
        '  float persp = 2.6 / (2.6 - clamp(v4.w, -1.15, 1.15));',
        '  vec3 tess = v4.xyz * persp * 0.36 + vec3(0.0, 0.18, 0.0);',
        '  float tessGlow = clamp((persp - 0.65) * 1.3, 0.25, 1.5);',
        // ── AI core: pulsing nucleus + three gyroscopic rings + dust ──
        '  float kind = fract(seed * 9.13);',
        '  vec3 core; float coreGlow; vec3 coreCol;',
        '  if (kind < 0.2) {',
        '    vec3 dirN = normalize(vec3(sin(seed*231.0), sin(seed*57.0), cos(seed*113.0)) + 1e-3);',
        '    float rr = 0.26 * pow(fract(seed * 17.3), 0.34) * (1.0 + 0.06 * sin(uTime * 2.6));',
        '    core = dirN * rr + vec3(0.0, 0.12, 0.0);',
        '    coreGlow = 1.15;',
        // golden-white reactor heart
        '    coreCol = vec3(1.12, 0.98, 0.72);',
        '  } else if (kind < 0.82) {',
        '    float ri = floor((kind - 0.2) * 4.83);',
        // decorrelated angle so each ring fills evenly instead of clumping
        '    float ang = fract(seed * 37.719) * 6.2831 + uTime * (0.55 - ri * 0.34);',
        '    float rad = 0.82 + ri * 0.3 + (fract(seed * 53.71) - 0.5) * 0.05;',
        '    vec3 ring = vec3(cos(ang) * rad, (fract(seed * 71.13) - 0.5) * 0.06, sin(ang) * rad);',
        '    float tl = ri * 1.05 + uTime * 0.08;',
        '    float ct = cos(tl); float st = sin(tl);',
        '    ring = vec3(ring.x, ring.y * ct - ring.z * st, ring.y * st + ring.z * ct);',
        '    float ry = ri * 2.1;',
        '    float cy = cos(ry); float sy = sin(ry);',
        '    ring = vec3(ring.x * cy + ring.z * sy, ring.y, -ring.x * sy + ring.z * cy);',
        '    core = ring + vec3(0.0, 0.12, 0.0);',
        '    coreGlow = 0.95;',
        // rings sweep cyan → magenta from inner to outer
        '    coreCol = mix(vec3(0.3, 0.9, 1.1), vec3(0.95, 0.42, 1.02), ri * 0.5);',
        '  } else {',
        '    vec3 dirD = normalize(vec3(sin(seed*77.0), 0.35 * sin(seed*141.0), cos(seed*99.0)) + 1e-3);',
        '    float raD = 1.7 + fract(seed * 31.7) * 0.7;',
        '    float ao = uTime * (0.05 + fract(seed*5.9) * 0.06) + seed * 6.2831;',
        '    core = vec3(cos(ao) * dirD.x - sin(ao) * dirD.z, dirD.y, sin(ao) * dirD.x + cos(ao) * dirD.z) * raD + vec3(0.0, 0.12, 0.0);',
        '    coreGlow = 0.45;',
        '    coreCol = vec3(0.55, 0.52, 0.95);',
        '  }',
        // ── morph chain ──
        '  float w1 = ss(uMorph);',
        '  float w2 = ss(uMorph - 1.0);',
        '  float w3 = ss(uMorph - 2.0);',
        '  float w4 = ss(uMorph - 3.0);',
        '  float w5 = ss(uMorph - 4.0);',
        '  float sphW = w1 * (1.0 - w2);',
        '  float tessW = w2 * (1.0 - w3);',
        '  float coreW = w3 * (1.0 - w4);',
        '  float wordW = w4 * (1.0 - w5);',
        '  float portW = w5;',
        '  vec3 p = mix(net, position, w1);',
        '  p = mix(p, tess, w2);',
        '  p = mix(p, core, w3);',
        '  p = mix(p, aWord, w4);',
        '  p = mix(p, aPort.xyz, w5);',
        '  float sw = sphW * 0.16 * sin(uTime*0.28 + p.y*2.2 + seed*0.9);',
        '  float cs = cos(sw); float sn = sin(sw);',
        '  p.xz = mat2(cs, -sn, sn, cs) * p.xz;',
        '  p += normalize(p + vec3(1e-4)) * (0.05 * sphW * sin(uTime*0.6 + seed*38.0));',
        // formed shapes stay crisp — only a faint breathing remains
        '  float crisp = 1.0 - 0.85 * max(max(tessW, coreW), max(wordW, portW));',
        '  p += 0.025 * crisp * vec3(sin(uTime*0.7+seed*40.0), cos(uTime*0.55+seed*70.0), sin(uTime*0.85+seed*55.0));',
        '  float ig = ss(uIntro);',
        '  p *= mix(1.7 + seed * 0.6, 1.0, ig);',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  float tw = 0.72 + 0.28 * sin(uTime * (1.2 + seed*2.8) + seed*80.0);',
        '  float twP = mix(tw, 0.88 + 0.12 * sin(uTime * (1.2 + seed*2.8) + seed*80.0), portW);',
        // the oversized "signal" particles look great flowing along the
        // net, but read as fat blobs inside the structured formations —
        // clamp them down while any formed shape is active
        '  float formedW = max(max(tessW, coreW), max(wordW, portW));',
        '  float sizeBase = mix(aMisc.y, min(aMisc.y, 0.062), formedW);',
        // ── per-stage color ──
        // tesseract: deep electric violet far → glowing cyan near (4th-D depth cue)
        '  vec3 tessCol = mix(vec3(0.5, 0.34, 1.05), vec3(0.5, 1.0, 1.12), clamp((persp - 0.72) * 1.5, 0.0, 1.0));',
        '  float wnx = clamp(aWord.x / 3.6 + 0.5, 0.0, 1.0);',
        '  float sweep = 0.7 + 0.5 * sin(uTime * 1.2 - wnx * 5.2);',
        '  vec3 wordCol = mix(vec3(0.87, 0.92, 1.05), vec3(0.49, 0.65, 1.0), wnx) * sweep;',
        '  vec3 portCol = aPortC * (0.5 + aPort.w * 0.65);',
        '  vec3 c = mix(aCol, tessCol, w2);',
        '  c = mix(c, coreCol, w3);',
        '  c = mix(c, wordCol, w4);',
        '  c = mix(c, portCol, w5);',
        '  vCol = c;',
        // ── per-stage alpha & size ──
        '  float aStage = 1.0;',
        '  aStage = mix(aStage, 0.8 * tessGlow, tessW);',
        '  aStage = mix(aStage, 0.7 * coreGlow, coreW);',
        '  aStage = mix(aStage, 0.55 + 0.35 * sweep, wordW);',
        '  float portA = 0.13 + aPort.w * 0.5;',
        '  vA = twP * ig * mix(aStage, portA, portW);',
        '  float sizeStage = 1.0 + 0.35 * sphW + (0.25 * tessGlow) * tessW + (0.2 * coreGlow) * coreW + 0.1 * wordW;',
        '  gl_PointSize = sizeBase * uPR * uVh * twP * sizeStage * mix(1.0, 0.5 + aPort.w * 0.85, portW) * (260.0 / -mv.z);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vCol; varying float vA;',
        'void main(){',
        '  vec2 q = gl_PointCoord - 0.5;',
        '  float d = length(q);',
        '  float a = smoothstep(0.5, 0.06, d);',
        '  float core = 1.0 + 1.6 * smoothstep(0.22, 0.0, d);',
        '  gl_FragColor = vec4(vCol * core, a * vA);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.points = new THREE.Points(geom, this.pMat)
    this.points.frustumCulled = false
    this.spinner.add(this.points)
    // degrade() rebuilds after the raster assets may already be available
    this._buildWordTargets()
    this._setPortraitTargets()
  }

  /* ── NEXUS wordmark (morph stage 4) ───────────────────────── */

  _buildWordTargets() {
    if (!this.points) return
    const attr = this.points.geometry.getAttribute('aWord')
    if (!attr) return
    const cw = 1024
    const ch = 300
    const cv = document.createElement('canvas')
    cv.width = cw
    cv.height = ch
    const c2 = cv.getContext('2d')
    c2.fillStyle = '#fff'
    c2.textAlign = 'center'
    c2.textBaseline = 'middle'
    c2.font = '400 210px Fraunces, Georgia, serif'
    c2.fillText('NEXUS', cw / 2, ch / 2 + 8)
    const data = c2.getImageData(0, 0, cw, ch).data
    const cands = []
    for (let y = 0; y < ch; y += 2)
      for (let x = 0; x < cw; x += 2) {
        if (data[(y * cw + x) * 4 + 3] < 128) continue
        cands.push(x, y)
      }
    if (!cands.length) return
    const M = cands.length / 2
    const scale = 3.7 / cw
    const a = attr.array
    for (let i = 0; i < this.N; i++) {
      const s = ((Math.random() * M) | 0) * 2
      a[i * 3] = (cands[s] - cw / 2) * scale + (Math.random() - 0.5) * 0.01
      a[i * 3 + 1] = (ch / 2 - cands[s + 1]) * scale + 0.35 + (Math.random() - 0.5) * 0.01
      a[i * 3 + 2] = (Math.random() - 0.5) * 0.14
    }
    attr.needsUpdate = true
  }

  /* ── developer portrait (morph stage 5) ───────────────────── */

  /**
   * Loads the baked portrait asset (RGB = photo color, A = person mask)
   * and turns it into weighted 3D targets: X/Y from the image plane, Z a
   * small luminance relief, plus the true photo color per point.
   */
  _loadPortrait() {
    const img = new Image()
    img.src = '/dev-portrait.png'
    img.onload = () => {
      if (!this.renderer) return
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const cv = document.createElement('canvas')
      cv.width = iw
      cv.height = ih
      const c2 = cv.getContext('2d')
      c2.drawImage(img, 0, 0)
      const data = c2.getImageData(0, 0, iw, ih).data
      const alphaAt = (x, y) => {
        if (x < 0 || y < 0 || x >= iw || y >= ih) return 0
        return data[(y * iw + x) * 4 + 3]
      }
      const H = 2.35
      const scale = H / ih
      const pts = []
      for (let y = 0; y < ih; y += 2)
        for (let x = 0; x < iw; x += 2) {
          const i = (y * iw + x) * 4
          if (data[i + 3] < 120) continue
          const r = data[i] / 255
          const g = data[i + 1] / 255
          const b = data[i + 2] / 255
          let lum = Math.pow(0.299 * r + 0.587 * g + 0.114 * b, 0.75)
          const edge =
            alphaAt(x - 2, y) < 120 || alphaAt(x + 2, y) < 120 ||
            alphaAt(x, y - 2) < 120 || alphaAt(x, y + 2) < 120
          if (edge) lum = Math.max(lum, 0.55)
          // soften the hard crop line at the bottom of the bust
          if (y > ih * 0.88) lum *= 0.35 + 0.65 * ((ih - y) / (ih * 0.12))
          const px = (x - iw / 2) * scale
          const py = (ih / 2 - y) * scale + 0.55
          const pz = (lum - 0.45) * 0.32
          // brighter pixels get extra copies → face stays dense
          const copies = 1 + Math.round(lum * 2)
          for (let k = 0; k < copies; k++) pts.push(px, py, pz, lum, r, g, b)
        }
      this.portPts = pts
      this._setPortraitTargets()
      this._buildPortraitExtra()
    }
  }

  /** Fill aPort/aPortC on the main cloud from the sampled portrait points. */
  _setPortraitTargets() {
    if (!this.portPts || !this.points) return
    const attr = this.points.geometry.getAttribute('aPort')
    const cAttr = this.points.geometry.getAttribute('aPortC')
    if (!attr || !cAttr) return
    const src = this.portPts
    const M = src.length / 7
    const a = attr.array
    const c = cAttr.array
    for (let i = 0; i < this.N; i++) {
      const s = ((Math.random() * M) | 0) * 7
      const j = i * 4
      a[j] = src[s] + (Math.random() - 0.5) * 0.012
      a[j + 1] = src[s + 1] + (Math.random() - 0.5) * 0.012
      a[j + 2] = src[s + 2] + (Math.random() - 0.5) * 0.05
      a[j + 3] = src[s + 3]
      c[i * 3] = src[s + 4]
      c[i * 3 + 1] = src[s + 5]
      c[i * 3 + 2] = src[s + 6]
    }
    attr.needsUpdate = true
    cAttr.needsUpdate = true
  }

  /**
   * Second particle system for the finale only: extra points fly in from
   * a far shell as the portrait forms, carrying true photo colors.
   */
  _buildPortraitExtra() {
    if (this.portExtra || !this.portPts) return
    const M = window.innerWidth < 768 ? 3500 : PORTRAIT_EXTRA_COUNT
    const src = this.portPts
    const S = src.length / 7
    const tgt = new Float32Array(M * 4)
    const col = new Float32Array(M * 3)
    const scat = new Float32Array(M * 3)
    const seed = new Float32Array(M * 2)
    for (let i = 0; i < M; i++) {
      const s = ((Math.random() * S) | 0) * 7
      tgt[i * 4] = src[s] + (Math.random() - 0.5) * 0.01
      tgt[i * 4 + 1] = src[s + 1] + (Math.random() - 0.5) * 0.01
      tgt[i * 4 + 2] = src[s + 2] + (Math.random() - 0.5) * 0.04
      tgt[i * 4 + 3] = src[s + 3]
      col[i * 3] = src[s + 4]
      col[i * 3 + 1] = src[s + 5]
      col[i * 3 + 2] = src[s + 6]
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(Math.random() * 2 - 1)
      const rr = 3.2 + Math.random() * 3.5
      scat[i * 3] = rr * Math.sin(ph) * Math.cos(th)
      scat[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th) * 0.6 + 0.5
      scat[i * 3 + 2] = rr * Math.cos(ph)
      seed[i * 2] = Math.random()
      seed[i * 2 + 1] = Math.random()
    }
    const geom = new THREE.BufferGeometry()
    // three requires a position attribute even though the shader ignores it
    geom.setAttribute('position', new THREE.BufferAttribute(scat.slice(), 3))
    geom.setAttribute('aTgt', new THREE.BufferAttribute(tgt, 4))
    geom.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    geom.setAttribute('aScat', new THREE.BufferAttribute(scat, 3))
    geom.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2))
    this.portExtraMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPortW: { value: 0 },
        uPR: { value: Math.min(devicePixelRatio, 1.25) },
        uVh: { value: window.innerHeight / 850 },
      },
      vertexShader: [
        'uniform float uTime; uniform float uPortW; uniform float uPR; uniform float uVh;',
        'attribute vec4 aTgt; attribute vec3 aColor; attribute vec3 aScat; attribute vec2 aSeed;',
        'varying vec3 vCol; varying float vA;',
        'float ss(float x){ x = clamp(x, 0.0, 1.0); return x*x*(3.0-2.0*x); }',
        'void main(){',
        // staggered fly-in: each particle starts once uPortW passes its slot
        '  float e = ss((uPortW - aSeed.y * 0.45) / 0.55);',
        '  float dr = uTime * 0.05 + aSeed.x * 6.2831;',
        '  vec3 sc = aScat + vec3(sin(dr), cos(dr * 0.7), sin(dr * 1.3)) * 0.35;',
        '  vec3 p = mix(sc, aTgt.xyz, e);',
        '  p += 0.006 * vec3(sin(uTime*1.1+aSeed.x*50.0), cos(uTime*0.9+aSeed.y*60.0), sin(uTime*1.3+aSeed.x*70.0));',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  float tw = 0.85 + 0.15 * sin(uTime * (1.0 + aSeed.x * 2.0) + aSeed.y * 80.0);',
        '  vA = e * uPortW * tw * (0.08 + aTgt.w * 0.38);',
        '  vCol = aColor * (0.5 + aTgt.w * 0.65);',
        '  gl_PointSize = (0.03 + aTgt.w * 0.05) * uPR * uVh * tw * (260.0 / -mv.z);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vCol; varying float vA;',
        'void main(){',
        '  vec2 q = gl_PointCoord - 0.5;',
        '  float d = length(q);',
        '  float a = smoothstep(0.5, 0.06, d);',
        '  float core = 1.0 + 1.4 * smoothstep(0.22, 0.0, d);',
        '  gl_FragColor = vec4(vCol * core, a * vA);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.portExtra = new THREE.Points(geom, this.portExtraMat)
    this.portExtra.frustumCulled = false
    this.portExtra.visible = false
    this.spinner.add(this.portExtra)
  }

  /* ── runtime ──────────────────────────────────────────────── */

  setSize(w, h) {
    if (!this.renderer) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    if (this.composer) this.composer.setSize(w, h)
    const vh = h / 850
    if (this.pMat) this.pMat.uniforms.uVh.value = vh
    if (this.portExtraMat) this.portExtraMat.uniforms.uVh.value = vh
    if (this.fogMat) this.fogMat.uniforms.uVh.value = vh
  }

  /**
   * Quality degradation, called by the harness when FPS drops.
   * Level 1: pixelRatio 1, post off. Level 2: fewer particles, simple terrain.
   */
  degrade(level) {
    if (level === 1) {
      this.renderer.setPixelRatio(1)
      this.usePost = false
      if (this.pMat) this.pMat.uniforms.uPR.value = 1
      if (this.portExtraMat) this.portExtraMat.uniforms.uPR.value = 1
      this.setSize(window.innerWidth, window.innerHeight)
    }
    if (level === 2) {
      this.densScale = 0.45
      this.rebuildCloud()
      if (this.descPoints) this.descPoints.visible = false
      if (this.terrMat) this.terrMat.uniforms.uSimple.value = 1
    }
  }

  /**
   * Render one frame.
   * @param {{time:number, targetMorph:number, intro:number, scrollFrac:number,
   *          mx:number, my:number, velS:number, shiftX?:number, snap:boolean,
   *          flowSpeed?:number}} s
   * @returns {{stageChanged:boolean, morph:number}}
   */
  frame(s) {
    if (!this.points || !this.renderer) return { stageChanged: false, morph: this.morph }
    const time = s.time
    const fs = s.flowSpeed ?? this.opts.flowSpeed
    this.morph = s.snap ? s.targetMorph : this.morph + (s.targetMorph - this.morph) * 0.07
    const p = this.morph
    const U = this.pMat.uniforms
    U.uTime.value = time
    U.uMorph.value = p
    U.uFlow.value = fs
    U.uIntro.value = s.intro

    const netW = 1 - clamp01(p)
    const w4 = smooth(clamp01(p - 3))
    const w5 = smooth(clamp01(p - 4))
    const wordW = w4 * (1 - w5)
    const portW = w5

    const stg = Math.round(s.targetMorph)
    let stageChanged = false
    if (this._stg === undefined) this._stg = stg
    if (stg !== this._stg) {
      this._stg = stg
      this.pulse = 1
      stageChanged = true
    }
    this.pulse = (this.pulse || 0) * (s.snap ? 0 : 0.955)
    if (this.bloom) this.bloom.strength = 0.55 + this.pulse * 0.7 + portW * 0.2 + netW * 0.35
    if (this.gradePass) {
      this.gradePass.uniforms.uTime.value = time
      this.gradePass.uniforms.uCA.value = 1 + this.pulse * 7 + Math.min(3, Math.abs(s.velS) * 0.5)
    }
    if (this.nebula)
      this.nebula.forEach((sp, i) => {
        sp.material.opacity = 0.3 + 0.08 * Math.sin(time * 0.07 + i * 1.7)
        sp.position.y += Math.sin(time * 0.05 + i * 2) * 0.0008
      })

    if (this.netGroup) {
      this.netGroup.visible = netW > 0.02
      this.netLines.material.opacity = netW * (0.15 + 0.05 * Math.sin(time * 1.4))
      this.netNodesPts.material.opacity = netW * 0.95
      this.netNodesPts.material.size = 0.062 + 0.01 * Math.sin(time * 2.3)
      this.netCoresA.material.opacity = netW * (0.55 + 0.14 * Math.sin(time * 1.9))
      this.netCoresA.material.size = 0.52 + 0.05 * Math.sin(time * 1.9)
      this.netCoresB.material.opacity = netW * (0.36 + 0.08 * Math.sin(time * 2.6 + 1.3))
    }

    if (this.portExtra) {
      this.portExtra.visible = portW > 0.01
      this.portExtraMat.uniforms.uTime.value = time
      this.portExtraMat.uniforms.uPortW.value = portW
    }

    // drifting mist — everywhere except the neural-net stage, and at its
    // THICKEST around the developer portrait (the figure emerges from it)
    if (this.smoke) {
      const smokeO = (1 - netW) * (1 + portW * 0.85) * s.intro
      for (let i = 0; i < this.smoke.length; i++) {
        const m = this.smoke[i]
        m.s.material.opacity = Math.min(0.24, m.baseO * smokeO * (0.75 + 0.25 * Math.sin(time * 0.1 + m.drift)))
        m.s.material.rotation += m.rot
        m.s.position.y = m.y0 + Math.sin(time * 0.06 + m.drift) * 0.4
        m.s.position.x = m.x0 + Math.sin(time * 0.04 + m.drift * 1.7) * 0.5
      }
    }
    if (this.fogDust) {
      const fogO = (1 - netW) * (0.7 + portW * 0.8) * s.intro
      this.fogDust.visible = fogO > 0.01
      this.fogMat.uniforms.uTime.value = time
      this.fogMat.uniforms.uFog.value = fogO
    }

    const spd = this.opts.rotationSpeed
    if (netW > 0.5 || wordW > 0.25 || portW > 0.05) {
      // net, wordmark, and portrait stages must face the camera squarely
      const tgt = Math.round(this.spinner.rotation.y / (Math.PI * 2)) * Math.PI * 2
      this.spinner.rotation.y += (tgt - this.spinner.rotation.y) * (0.06 + (wordW + portW) * 0.06)
    } else {
      this.spinner.rotation.y += 0.0016 * spd * (1 - netW)
    }
    this.world.position.x += ((s.shiftX || 0) - this.world.position.x) * (s.snap ? 1 : 0.06)
    this.world.position.y += (netW * -0.78 - this.world.position.y) * 0.06
    this.world.rotation.y += (s.mx * 0.35 * (1 - netW * 0.55) - this.world.rotation.y) * 0.04
    this.world.rotation.x += (-s.my * 0.22 * (1 - netW * 0.55) - this.world.rotation.x) * 0.04
    if (this.stars) {
      this.stars.rotation.y += 0.0004
      this.stars.rotation.x = -s.my * 0.08
    }

    // camera path
    const sf = s.scrollFrac
    const keys = CAMERA_KEYS
    let ka = keys[0]
    let kb = keys[keys.length - 1]
    for (let i = 0; i < keys.length - 1; i++)
      if (sf >= keys[i].t && sf <= keys[i + 1].t) {
        ka = keys[i]
        kb = keys[i + 1]
        break
      }
    const kt = smooth((sf - ka.t) / Math.max(1e-5, kb.t - ka.t))
    const asp = window.innerWidth / Math.max(1, window.innerHeight)
    const aspX = Math.min(1, asp / 1.5)
    for (let c = 0; c < 3; c++) {
      const par =
        c === 0
          ? s.mx * 0.3 + Math.sin(time * 0.3) * 0.05
          : c === 1
            ? -s.my * 0.22 + Math.cos(time * 0.24) * 0.04
            : 0
      let tp = ka.p[c] + (kb.p[c] - ka.p[c]) * kt
      if (c === 0) tp *= aspX
      tp += par
      const tl = ka.l[c] + (kb.l[c] - ka.l[c]) * kt
      this._camP[c] += (tp - this._camP[c]) * (s.snap ? 1 : 0.055)
      this._camL[c] += (tl - this._camL[c]) * (s.snap ? 1 : 0.055)
    }
    this.camera.position.set(this._camP[0], this._camP[1], this._camP[2])
    const roll = s.velS * 0.004 + Math.sin(time * 0.13) * 0.008
    this.camera.up.set(Math.sin(roll), Math.cos(roll), 0)
    this.camera.lookAt(this._camL[0], this._camL[1], this._camL[2])
    const fovT = 50 + Math.max(0, 1.15 - asp) * 16 + Math.min(4, Math.abs(s.velS) * 0.9)
    if (Math.abs(this.camera.fov - fovT) > 0.05) {
      this.camera.fov += (fovT - this.camera.fov) * 0.1
      this.camera.updateProjectionMatrix()
    }

    // terrain reveal (once the net dissolves); dims while the wordmark and
    // portrait own the frame
    const tw = s.intro * (1 - netW) * (1 - wordW * 0.35 - portW * 0.55)
    if (this.terrMat) {
      this.terrain.visible = tw > 0.01
      this.terrMat.uniforms.uTime.value = time
      this.terrMat.uniforms.uCamPos.value.copy(this.camera.position)
      this.terrMat.uniforms.uReveal.value = tw
    }
    if (this.descPts && this.descPoints.visible && tw > 0.02) {
      const e2 = 0.4
      const sp2 = 0.045 * fs
      const dpp = this.descPos
      const dts = this.descPts
      for (let i = 0; i < this.descN; i++) {
        const q = dts[i]
        const gx = (this.terrHeight(q.x + e2, q.z) - this.terrHeight(q.x - e2, q.z)) / (2 * e2)
        const gz = (this.terrHeight(q.x, q.z + e2) - this.terrHeight(q.x, q.z - e2)) / (2 * e2)
        q.x -= gx * sp2
        q.z -= gz * sp2
        if (q.x * q.x + q.z * q.z < 1.6) {
          const a2 = Math.random() * Math.PI * 2
          const r2 = 8 + Math.random() * 10
          q.x = Math.cos(a2) * r2
          q.z = Math.sin(a2) * r2
        }
        dpp[i * 3] = q.x
        dpp[i * 3 + 1] = this.terrHeight(q.x, q.z) + 0.55
        dpp[i * 3 + 2] = q.z
      }
      this.descGeo.attributes.position.needsUpdate = true
      this.descPoints.material.opacity = 0.5 * tw
    }
    if (this.basinGlow) this.basinGlow.material.opacity = (0.055 + 0.02 * Math.sin(time * 1.2)) * tw

    if (this.composer && this.usePost) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
    return { stageChanged, morph: p }
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => {
          Object.values(m.uniforms || {}).forEach((u) => {
            if (u.value && u.value.isTexture) u.value.dispose()
          })
          if (m.map) m.map.dispose()
          m.dispose()
        })
      }
    })
    this.sprite.dispose()
    if (this.composer) this.composer.dispose()
    this.renderer.dispose()
    this.renderer = null
    this.points = null
    THREE.ColorManagement.enabled = this._prevColorManagement
  }
}
