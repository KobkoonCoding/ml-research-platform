/**
 * useLandingEngine — wires the whole landing experience together:
 *
 *   - OptimaScene (WebGL background) + SoundEngine + LossCurve
 *   - one rAF loop driving: 3D frame, custom cursor, magnetic buttons,
 *     card tilt, scroll-velocity smoothing
 *   - scroll handler driving: hero step choreography (with text decrypt),
 *     morph targets, progress bar, nav backdrop, section dots, parallax,
 *     reveal-on-scroll, loss-curve scrub, horizontal gallery
 *   - loader (skipped after first visit in the same session)
 *   - FPS watchdog with two-level quality degradation
 *
 * The page component owns the DOM; this hook only reads/writes it through
 * refs and data-attributes (data-reveal, data-word, data-plx, data-magnet,
 * data-tilt, data-dot, data-hero-step, data-grain).
 */
import { useEffect, useRef, useCallback } from 'react'
import SoundEngine from './engine/soundEngine'
import LossCurve from './engine/lossCurve'

const LOADER_SEEN_KEY = 'nexus:intro-seen'

// Hero-step visibility windows over hero progress p ∈ [0..1] and the side
// each card enters from (0 center, 1 right, -1 left).
const HERO_SEGMENTS = [
  { range: [-0.22, 0.3], side: 0 },
  { range: [0.32, 0.55], side: 1 },
  { range: [0.57, 0.8], side: -1 },
  { range: [0.82, 1.06], side: 1 },
]

// Particle morph timing. Stages 1-2 run on hero progress, stages 3-4 on
// whole-page scroll fraction, stage 5 on the developer section position:
//   net → sphere (hero 01) → tesseract (hero 02) → AI core (modules)
//   → NEXUS wordmark (CTA) → developer portrait (final section)
const MORPH_1 = [0.3, 0.48]
const MORPH_2 = [0.55, 0.78]
const MORPH_CORE = [0.34, 0.44]
const MORPH_WORD = [0.75, 0.83]

const SCRAMBLE_CHARS = '01<>#/+=*'

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const smooth = (x) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}
const ramp = (x, a, b) => clamp01((x - a) / (b - a))
const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3)

export default function useLandingEngine({ sectionIds }) {
  const refs = {
    root: useRef(null),
    bgCanvas: useRef(null),
    loader: useRef(null),
    counter: useRef(null),
    cursor: useRef(null),
    nav: useRef(null),
    progress: useRef(null),
    heroWrap: useRef(null),
    scrollHint: useRef(null),
    lossWrap: useRef(null),
    lossCanvas: useRef(null),
    galleryWrap: useRef(null),
    galleryTrack: useRef(null),
  }
  const soundRef = useRef(null)

  const toggleSound = useCallback(() => {
    if (!soundRef.current) return false
    return soundRef.current.toggle()
  }, [])

  const scrollToId = useCallback((id) => {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + (window.scrollY || 0) - 6
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const root = refs.root.current
    const canvas = refs.bgCanvas.current
    if (!root || !canvas) return undefined

    /* ── mutable per-session state (closure, not React state) ── */
    const S = {
      dead: false,
      intro: 0,
      introStart: 0,
      targetMorph: 0,
      scrollFrac: 0,
      lastSy: undefined,
      velT: 0,
      velS: 0,
      // cursor
      cx: window.innerWidth / 2,
      cy: window.innerHeight / 2,
      ccx: window.innerWidth / 2,
      ccy: window.innerHeight / 2,
      curScale: 1,
      curScaleT: 1,
      mx: 0,
      my: 0,
      tmx: 0,
      tmy: 0,
      // perf
      frameEMA: 16,
      fCount: 0,
      qLevel: 0,
      lastF: 0,
      starve: 0,
      actDot: -1,
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePtr = window.matchMedia('(pointer:fine)').matches

    // three.js (and the whole scene) loads lazily so routes other than "/"
    // never pay for it, and the landing DOM is interactive immediately.
    let engine = null
    import('./engine/OptimaScene').then(({ default: OptimaScene }) => {
      if (S.dead) return
      engine = new OptimaScene(canvas)
    }).catch(() => { /* WebGL/network failure: page still works, static bg */ })
    const sound = new SoundEngine()
    soundRef.current = sound
    const loss = refs.lossCanvas.current ? new LossCurve(refs.lossCanvas.current) : null

    /* ── loader ───────────────────────────────────────────────── */
    let loaderIv = 0
    let loaderTimeout = 0
    const dismissLoader = () => {
      if (S.loaderDone) return
      S.loaderDone = true
      try {
        sessionStorage.setItem(LOADER_SEEN_KEY, '1')
      } catch { /* private mode — loader just replays next visit */ }
      const l = refs.loader.current
      S.introStart = performance.now()
      if (!l) return
      l.style.transform = 'translateY(-101%)'
      setTimeout(() => {
        if (l) l.style.display = 'none'
      }, 1100)
    }
    let seenIntro = false
    try {
      seenIntro = sessionStorage.getItem(LOADER_SEEN_KEY) === '1'
    } catch { /* ignore */ }
    if (seenIntro || reduceMotion) {
      S.loaderDone = true
      S.introStart = performance.now()
      const l = refs.loader.current
      if (l) l.style.display = 'none'
    } else {
      const el = refs.counter.current
      let n = 0
      loaderIv = setInterval(() => {
        n += Math.max(2, Math.round((100 - n) * 0.14))
        if (n >= 100) {
          n = 100
          clearInterval(loaderIv)
          setTimeout(dismissLoader, 260)
        }
        if (el) el.textContent = String(n).padStart(3, '0')
      }, 26)
      loaderTimeout = setTimeout(dismissLoader, 4200) // hard fallback
    }

    /* ── reveal-on-scroll initial styles ──────────────────────── */
    const revealEls = [...root.querySelectorAll('[data-reveal]')]
    revealEls.forEach((el) => {
      const k = el.parentElement
        ? [...el.parentElement.children].filter((c) => c.hasAttribute && c.hasAttribute('data-reveal')).indexOf(el)
        : 0
      el.style.opacity = '0'
      el.style.transform = 'translateY(44px) scale(0.985)'
      el.style.filter = 'blur(10px)'
      el.style.transition = `opacity 1.15s cubic-bezier(.2,.7,.2,1) ${Math.max(0, k) * 0.14}s, transform 1.15s cubic-bezier(.2,.7,.2,1) ${Math.max(0, k) * 0.14}s, filter 1.15s cubic-bezier(.2,.7,.2,1) ${Math.max(0, k) * 0.14}s`
    })
    const wordEls = [...root.querySelectorAll('[data-word]')]
    wordEls.forEach((el, i) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(0.7em) rotate(2deg)'
      el.style.filter = 'blur(7px)'
      el.style.clipPath = 'inset(0 0 110% 0)'
      el.style.transition = `opacity .9s ease ${i * 0.1}s, transform .9s cubic-bezier(.2,.8,.2,1) ${i * 0.1}s, filter .9s ease ${i * 0.1}s, clip-path .9s cubic-bezier(.2,.8,.2,1) ${i * 0.1}s`
    })
    const revealPass = () => {
      const vh = window.innerHeight
      const trig = vh * 0.86
      const show = (el) => {
        if (el.dataset.shown) return
        el.dataset.shown = '1'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0) scale(1) rotate(0deg)'
        el.style.filter = 'blur(0px)'
        if (el.style.clipPath) el.style.clipPath = 'inset(-20% -10% -20% -10%)'
      }
      revealEls.forEach((el) => {
        if (el.getBoundingClientRect().top < trig) show(el)
      })
      if (wordEls.length && wordEls[0].getBoundingClientRect().top < trig) wordEls.forEach(show)
    }

    /* ── interactive element collections ──────────────────────── */
    const magnets = [...root.querySelectorAll('[data-magnet]')].map((el) => ({ el, x: 0, y: 0, on: false }))
    const tilts = [...root.querySelectorAll('[data-tilt]')].map((el) => ({ el, rx: 0, ry: 0, on: false }))
    const dotEls = [...root.querySelectorAll('[data-dot]')]
    const secEls = sectionIds.map((id) => root.querySelector('#' + id))
    const devEl = root.querySelector('#developer')
    const plxEls = [...root.querySelectorAll('[data-plx]')]
    const heroSteps = [...root.querySelectorAll('[data-hero-step]')].map((el) => ({ el, kids: [...el.children] }))

    /* ── cursor + sound-on-hover ──────────────────────────────── */
    const onPointerMove = (e) => {
      S.cx = e.clientX
      S.cy = e.clientY
      S.tmx = (e.clientX / window.innerWidth) * 2 - 1
      S.tmy = (e.clientY / window.innerHeight) * 2 - 1
    }
    let lastHov = null
    const onPointerOver = (e) => {
      const hit = e.target && e.target.closest && e.target.closest('a,button,input')
      S.curScaleT = hit ? 2.1 : 1
      if (hit && hit !== lastHov) {
        lastHov = hit
        sound.hover()
      }
      if (!hit) lastHov = null
    }
    const onPointerDown = (e) => {
      if (e.target && e.target.closest && e.target.closest('a,button')) sound.click()
    }
    if (finePtr) window.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerover', onPointerOver)
    document.addEventListener('pointerdown', onPointerDown)

    /* ── quality degradation ──────────────────────────────────── */
    const degrade = () => {
      S.qLevel++
      if (engine) engine.degrade(S.qLevel)
      if (S.qLevel === 2) {
        root.querySelectorAll('[data-hero-step]').forEach((el) => {
          el.style.backdropFilter = 'none'
          el.style.webkitBackdropFilter = 'none'
          el.style.background = 'rgba(7,9,15,0.74)'
        })
        root.querySelectorAll('[data-grain]').forEach((el) => {
          el.style.display = 'none'
        })
      }
    }

    /* ── scroll choreography ──────────────────────────────────── */
    const handleScroll = () => {
      if (S.introStart) S.intro = clamp01((performance.now() - S.introStart) / 1400)
      const vh = window.innerHeight
      const sy = window.scrollY || document.documentElement.scrollTop || 0
      const docH = document.documentElement.scrollHeight - vh
      S.scrollFrac = clamp01(docH > 0 ? sy / docH : 0)
      const dvel = sy - (S.lastSy ?? sy)
      S.lastSy = sy
      if (Math.abs(dvel) > 0.1) S.velT = Math.max(-5, Math.min(5, dvel * 0.05))
      revealPass()

      if (refs.progress.current) refs.progress.current.style.width = S.scrollFrac * 100 + '%'
      if (refs.nav.current) {
        const on = sy > 40
        const nav = refs.nav.current
        nav.style.background = on ? 'rgba(6,7,12,0.72)' : 'transparent'
        nav.style.backdropFilter = on ? 'blur(14px)' : 'none'
        nav.style.borderColor = on ? 'rgba(255,255,255,0.08)' : 'transparent'
      }
      if (dotEls.length && secEls.length) {
        let act = 0
        secEls.forEach((s, i) => {
          if (s && s.getBoundingClientRect().top <= vh * 0.5) act = i
        })
        if (act !== S.actDot) {
          S.actDot = act
          dotEls.forEach((d, i) => {
            const on = i === act
            d.style.background = on ? '#8fb6ff' : 'transparent'
            d.style.borderColor = on ? '#8fb6ff' : 'rgba(180,205,255,0.4)'
            d.style.transform = on ? 'scale(1.4)' : 'scale(1)'
          })
        }
      }
      plxEls.forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.bottom > -60 && r.top < vh + 60)
          el.style.transform = `translateY(${((r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.plx)).toFixed(1)}px)`
      })

      // hero: pinned 520vh scroll story
      const hw = refs.heroWrap.current
      if (hw) {
        const r = hw.getBoundingClientRect()
        const total = hw.offsetHeight - vh
        const p = clamp01(-r.top / Math.max(1, total))
        S.baseMorph = smooth(ramp(p, MORPH_1[0], MORPH_1[1])) + smooth(ramp(p, MORPH_2[0], MORPH_2[1]))
        heroSteps.forEach((st, i) => {
          const seg = HERO_SEGMENTS[i] || HERO_SEGMENTS[HERO_SEGMENTS.length - 1]
          const [a, b] = seg.range
          const raw = (p - a) / (b - a)
          const side = seg.side
          const vis = raw > 0 && raw < 1
          let inRaw = vis ? raw / 0.22 : raw >= 1 ? 99 : 0
          if (i === 0) inRaw = Math.min(inRaw, S.intro * 3)
          const inF = easeOut(inRaw)
          const outF = smooth(clamp01((raw - 0.74) / 0.26))
          const dwell = clamp01((raw - 0.22) / 0.52)
          const o = vis ? 1 - outF : 0
          const sc = 0.84 + inF * 0.16 + dwell * 0.05 + outF * 0.55
          const bl = (1 - inF) * 14 + outF * 11
          const ty = (1 - inF) * 64 - dwell * 30 - outF * 26
          const tx = (1 - inF) * 90 * side
          st.el.style.opacity = o.toFixed(3)
          st.el.style.filter = `blur(${Math.max(0, bl).toFixed(1)}px)`
          st.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${sc.toFixed(3)})`
          st.kids.forEach((k, ki) => {
            const kf = easeOut(inRaw - ki * 0.34)
            k.style.opacity = kf.toFixed(3)
            k.style.transform = `translateY(${((1 - kf) * 30).toFixed(1)}px)`
            k.style.filter = `blur(${((1 - kf) * 6).toFixed(1)}px)`
            k.style.clipPath = `inset(-12% -6% ${((1 - kf) * 112).toFixed(1)}% -6%)`
            // decrypt-scramble on the step label while it enters
            // (plain-text nodes only — scrambling would destroy markup)
            if (ki === 0 && vis && k.children.length === 0) {
              const orig = k.dataset.txt || (k.dataset.txt = k.textContent)
              const n = orig.length
              const rev = Math.round(clamp01(inRaw) * n)
              if (rev !== +(k.dataset.rev || -1)) {
                k.dataset.rev = rev
                let sTxt = orig.slice(0, rev)
                for (let q = rev; q < n; q++)
                  sTxt += orig[q] === ' ' ? ' ' : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0]
                k.textContent = sTxt
              }
            }
          })
        })
        if (refs.scrollHint.current) refs.scrollHint.current.style.opacity = (1 - clamp01(p * 6)).toFixed(2)

        // Slide the 3D object away from whichever side card is on screen,
        // so the cards never cover it (intro step keeps it centered).
        let shiftX = 0
        heroSteps.forEach((st, i) => {
          if (i === 0) return
          const seg = HERO_SEGMENTS[i] || HERO_SEGMENTS[HERO_SEGMENTS.length - 1]
          const [a, b] = seg.range
          const raw = (p - a) / (b - a)
          if (raw <= 0 || raw >= 1) return
          const env = smooth(Math.min(raw / 0.25, 1)) * (1 - smooth((raw - 0.72) / 0.28))
          shiftX = -seg.side * 0.75 * env
        })
        S.shiftX = shiftX
      }

      // mid-page stages ride whole-page scroll: tesseract → AI core around
      // the module sections, core → NEXUS wordmark arriving at the CTA
      const mCore = smooth(ramp(S.scrollFrac, MORPH_CORE[0], MORPH_CORE[1]))
      const mWord = smooth(ramp(S.scrollFrac, MORPH_WORD[0], MORPH_WORD[1]))

      // final stage: wordmark → developer portrait as the last section
      // scrolls in. The portrait slides right so the text panel owns the
      // left half (scaled down on narrow screens).
      let mPort = 0
      if (devEl) {
        const r = devEl.getBoundingClientRect()
        mPort = smooth(clamp01((vh * 0.92 - r.top) / (vh * 0.8)))
      }
      S.targetMorph = (S.baseMorph || 0) + mCore + mWord + mPort
      if (mPort > 0.01) {
        const aspX = Math.min(1, window.innerWidth / Math.max(1, window.innerHeight) / 1.5)
        S.shiftX = 0.6 * mPort * aspX
      }

      // loss curve scrub
      const lw = refs.lossWrap.current
      if (lw && loss) {
        const r = lw.getBoundingClientRect()
        const p = clamp01((vh * 0.82 - r.top) / (vh * 0.7))
        if (Math.abs(p - loss.prog) > 0.002) loss.draw(p)
      }

      // horizontal gallery
      const gw = refs.galleryWrap.current
      const gt = refs.galleryTrack.current
      if (gw && gt) {
        const r = gw.getBoundingClientRect()
        const total = gw.offsetHeight - vh
        const p = clamp01(-r.top / Math.max(1, total))
        const dist = gt.scrollWidth - window.innerWidth
        gt.style.transform = `translateX(${-p * Math.max(0, dist)}px) skewX(${S.velS.toFixed(2)}deg)`
      }
    }

    /* ── main loop ────────────────────────────────────────────── */
    let rafId = 0
    const animate = () => {
      if (S.dead) return
      const now = performance.now()
      const dt = now - (S.lastF || now)
      S.lastF = now
      S.fCount++
      // Ignore pauses (tab switches, debugger, long GC) so a single gap
      // can't drag the EMA over the degrade threshold; genuinely slow
      // frames (<450ms) still count so degradation can trigger.
      if (dt < 450) S.frameEMA += (dt - S.frameEMA) * 0.06
      if (S.fCount > 40 && S.fCount % 60 === 0) {
        if (S.frameEMA > 55 && S.qLevel === 0) degrade()
        else if (S.frameEMA > 70 && S.qLevel === 1) degrade()
      }
      handleScroll()
      S.velT *= 0.92
      S.velS += (S.velT - S.velS) * 0.09
      sound.drive(S.velS, S.scrollFrac)

      // cursor + magnet + tilt (fine pointers only)
      const cu = refs.cursor.current
      if (cu && finePtr) {
        S.ccx += (S.cx - S.ccx) * 0.2
        S.ccy += (S.cy - S.ccy) * 0.2
        S.curScale += (S.curScaleT - S.curScale) * 0.16
        cu.style.left = S.ccx + 'px'
        cu.style.top = S.ccy + 'px'
        cu.style.transform = `translate(-50%,-50%) scale(${S.curScale.toFixed(3)})`
      }
      if (finePtr) {
        magnets.forEach((m) => {
          const r = m.el.getBoundingClientRect()
          const dx = S.ccx - (r.left + r.width / 2)
          const dy = S.ccy - (r.top + r.height / 2)
          const d = Math.hypot(dx, dy)
          const f = d < 130 ? 1 - d / 130 : 0
          m.x += (dx * f * 0.34 - m.x) * 0.18
          m.y += (dy * f * 0.34 - m.y) * 0.18
          const act = Math.abs(m.x) > 0.05 || Math.abs(m.y) > 0.05
          if (act || m.on) {
            m.on = act
            m.el.style.transform = `translate(${m.x.toFixed(1)}px,${m.y.toFixed(1)}px)`
          }
        })
        tilts.forEach((t) => {
          const r = t.el.getBoundingClientRect()
          const inside = S.ccx >= r.left && S.ccx <= r.right && S.ccy >= r.top && S.ccy <= r.bottom
          const tx = inside ? ((S.ccy - r.top) / r.height - 0.5) * -7 : 0
          const ty = inside ? ((S.ccx - r.left) / r.width - 0.5) * 9 : 0
          t.rx += (tx - t.rx) * 0.12
          t.ry += (ty - t.ry) * 0.12
          const act = Math.abs(t.rx) > 0.02 || Math.abs(t.ry) > 0.02
          if (act || t.on) {
            t.on = act
            t.el.style.transform = `perspective(900px) rotateX(${t.rx.toFixed(2)}deg) rotateY(${t.ry.toFixed(2)}deg)`
          }
        })
      }
      S.mx += (S.tmx - S.mx) * 0.05
      S.my += (S.tmy - S.my) * 0.05

      const skipFrame = S.qLevel >= 2 && S.fCount % 2
      if (!skipFrame) {
        const res = engine && engine.frame({
          time: now * 0.001,
          targetMorph: S.targetMorph,
          intro: S.intro,
          scrollFrac: S.scrollFrac,
          mx: S.mx,
          my: S.my,
          velS: S.velS,
          shiftX: S.shiftX || 0,
          snap: false,
        })
        if (res && res.stageChanged) sound.chime()
      }
      rafId = requestAnimationFrame(animate)
    }

    /* ── watchdog: keep visuals coherent if rAF starves ───────── */
    const watchdog = setInterval(() => {
      if (S.dead) return
      // A hidden tab legitimately stops rAF — that's not starvation, and
      // degrading quality there would punish the user for switching tabs.
      if (document.hidden) {
        S.lastF = performance.now()
        return
      }
      if (performance.now() - (S.lastF || 0) > 500) {
        S.starve++
        handleScroll()
        if (S.starve % 4 === 0 && S.qLevel < 2) degrade()
        if (S.starve % 3 === 0 && engine)
          engine.frame({
            time: performance.now() * 0.001,
            targetMorph: S.targetMorph,
            intro: S.intro,
            scrollFrac: S.scrollFrac,
            mx: S.mx,
            my: S.my,
            velS: S.velS,
            shiftX: S.shiftX || 0,
            snap: true,
          })
      }
    }, 300)

    /* ── listeners + kickoff ──────────────────────────────────── */
    const onScroll = () => handleScroll()
    const onResize = () => {
      if (engine) engine.setSize(window.innerWidth, window.innerHeight)
      if (loss) loss.resize()
      handleScroll()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    handleScroll()
    rafId = requestAnimationFrame(animate)

    // Dev-only: synchronous WebGL snapshot at any scroll fraction, so the
    // scene can be visually verified even when the tab is hidden (rAF off).
    if (import.meta.env.DEV) {
      window.__lv2Snap = (frac = 0) => {
        const docH = document.documentElement.scrollHeight - window.innerHeight
        // 'instant' sidesteps css scroll-behavior:smooth, which never
        // finishes in a hidden tab (its animation rides on rAF).
        window.scrollTo({ top: frac * Math.max(0, docH), behavior: 'instant' })
        S.intro = 1
        S.introStart = performance.now() - 5000
        handleScroll()
        if (!engine) return null
        engine.frame({
          time: performance.now() * 0.001,
          targetMorph: S.targetMorph,
          intro: 1,
          scrollFrac: S.scrollFrac,
          mx: 0,
          my: 0,
          velS: 0,
          shiftX: S.shiftX || 0,
          snap: true,
        })
        return engine.renderer.domElement.toDataURL('image/jpeg', 0.6)
      }
    }

    return () => {
      S.dead = true
      if (import.meta.env.DEV) delete window.__lv2Snap
      cancelAnimationFrame(rafId)
      clearInterval(watchdog)
      clearInterval(loaderIv)
      clearTimeout(loaderTimeout)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (finePtr) window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerdown', onPointerDown)
      sound.dispose()
      soundRef.current = null
      if (engine) engine.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { refs, toggleSound, scrollToId }
}
