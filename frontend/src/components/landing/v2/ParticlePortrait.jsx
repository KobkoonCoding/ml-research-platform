import React, { useEffect, useRef } from 'react'

/**
 * ParticlePortrait — a cloud of particles that assembles into the
 * developer's portrait when scrolled into view.
 *
 * Source asset: an RGBA image whose alpha channel is the person mask and
 * whose luminance drives particle brightness (public/dev-portrait.png,
 * baked by scripts — see repo history). Pointer proximity scatters
 * particles locally; they spring back. Honors prefers-reduced-motion by
 * rendering the assembled state statically.
 */

const PALETTE = ['#dfe9ff', '#8fb6ff', '#b79dff']
const MAX_PARTICLES = 4200

export default function ParticlePortrait({ src = '/dev-portrait.png', className, style }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return undefined

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let dead = false
    let rafId = 0
    let particles = []
    let assembleStart = 0
    let visible = false
    let imgW = 1
    let imgH = 1
    const pointer = { x: -9999, y: -9999 }

    const dpr = Math.min(devicePixelRatio || 1, 2)
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.src = src

    const sizeCanvas = () => {
      const w = wrap.clientWidth
      const h = (w * imgH) / imgW
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const buildParticles = () => {
      const off = document.createElement('canvas')
      off.width = imgW
      off.height = imgH
      const octx = off.getContext('2d')
      octx.drawImage(img, 0, 0)
      const data = octx.getImageData(0, 0, imgW, imgH).data
      const w = wrap.clientWidth
      const scale = w / imgW
      const alphaAt = (x, y) => {
        if (x < 0 || y < 0 || x >= imgW || y >= imgH) return 0
        return data[(y * imgW + x) * 4 + 3]
      }
      const cands = []
      for (let y = 0; y < imgH; y += 2)
        for (let x = 0; x < imgW; x += 2) {
          const i = (y * imgW + x) * 4
          if (data[i + 3] < 120) continue
          // gamma-lift so the dark shirt still reads as a body
          const lum = Math.pow(data[i] / 255, 0.72)
          // silhouette pixels get a brightness floor — the outline must
          // survive even where the photo is dark
          const edge =
            alphaAt(x - 2, y) < 120 || alphaAt(x + 2, y) < 120 ||
            alphaAt(x, y - 2) < 120 || alphaAt(x, y + 2) < 120
          cands.push({ x, y, lum: edge ? Math.max(lum, 0.62) : lum, edge })
        }
      // keep a luminance-weighted subset so bright areas (face) stay dense
      const keepP = Math.min(1, MAX_PARTICLES / Math.max(1, cands.length * 0.78))
      particles = []
      for (const c of cands) {
        const p = c.edge ? 1 : keepP * (0.5 + c.lum * 0.85)
        if (Math.random() > p) continue
        const a = Math.random() * Math.PI * 2
        const r = Math.max(w, (imgH * scale)) * (0.55 + Math.random() * 0.55)
        particles.push({
          tx: c.x * scale,
          ty: c.y * scale,
          x: w / 2 + Math.cos(a) * r,
          y: (imgH * scale) / 2 + Math.sin(a) * r,
          vx: 0,
          vy: 0,
          lum: c.lum,
          size: 1.15 + c.lum * 1.5 + Math.random() * 0.5,
          color: PALETTE[Math.random() < 0.86 ? 0 : Math.random() < 0.7 ? 1 : 2],
          delay: Math.random() * 0.9,
          seed: Math.random() * 100,
        })
      }
    }

    const draw = (t) => {
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.clearRect(0, 0, w, h)
      const elapsed = assembleStart ? (t - assembleStart) / 1000 : 0
      for (const p of particles) {
        const prog = reduceMotion ? 1 : Math.max(0, Math.min(1, (elapsed - p.delay) / 1.6))
        const ease = prog * prog * (3 - 2 * prog)
        // spring toward target once its delay has passed
        p.x += (p.tx - p.x) * 0.085 * ease
        p.y += (p.ty - p.y) * 0.085 * ease
        // pointer repulsion
        const dx = p.x - pointer.x
        const dy = p.y - pointer.y
        const d2 = dx * dx + dy * dy
        if (d2 < 3600 && d2 > 0.01) {
          const d = Math.sqrt(d2)
          const f = ((60 - d) / 60) * 3.2
          p.x += (dx / d) * f
          p.y += (dy / d) * f
        }
        const tw = reduceMotion ? 1 : 0.78 + 0.22 * Math.sin(t * 0.0016 * (1 + p.seed * 0.02) + p.seed)
        ctx.globalAlpha = (0.36 + p.lum * 0.64) * tw * (reduceMotion ? 1 : 0.25 + ease * 0.75)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }
      ctx.globalAlpha = 1
    }

    const loop = (t) => {
      if (dead) return
      if (visible && !document.hidden) draw(t)
      rafId = requestAnimationFrame(loop)
    }

    img.onload = () => {
      if (dead) return
      imgW = img.naturalWidth
      imgH = img.naturalHeight
      sizeCanvas()
      buildParticles()
      if (reduceMotion) {
        // static assembled render, no loop
        particles.forEach((p) => {
          p.x = p.tx
          p.y = p.ty
        })
        visible = true
        draw(performance.now())
        return
      }
      rafId = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visible = e.isIntersecting
          if (e.isIntersecting && !assembleStart) assembleStart = performance.now()
        })
      },
      { threshold: 0.25 }
    )
    io.observe(wrap)

    const onPointerMove = (e) => {
      const r = canvas.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }
    const onPointerLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }
    wrap.addEventListener('pointermove', onPointerMove)
    wrap.addEventListener('pointerleave', onPointerLeave)

    const onResize = () => {
      if (!img.naturalWidth) return
      sizeCanvas()
      buildParticles()
      particles.forEach((p) => {
        if (reduceMotion || assembleStart) {
          p.x = p.tx
          p.y = p.ty
        }
      })
      if (reduceMotion) draw(performance.now())
    }
    window.addEventListener('resize', onResize)

    return () => {
      dead = true
      cancelAnimationFrame(rafId)
      io.disconnect()
      wrap.removeEventListener('pointermove', onPointerMove)
      wrap.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [src])

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', ...style }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  )
}
