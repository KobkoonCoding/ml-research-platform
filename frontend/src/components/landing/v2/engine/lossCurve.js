/**
 * LossCurve — 2D canvas drawing of a gradient-descent path over contour
 * ellipses. `draw(prog)` reveals the path up to prog ∈ [0..1]; the page
 * scrubs it with scroll position (ELM Studio section).
 */
export default class LossCurve {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas
    this.prog = 0
    // Damped spiral descending into the minimum at (mx, my).
    const pts = []
    const steps = 90
    const x = 0.16
    const y = 0.2
    const mx = 0.66
    const my = 0.6
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const damp = Math.exp(-t * 2.6)
      const px = mx + (x - mx) * Math.exp(-t * 3) + Math.sin(t * 22) * 0.05 * damp
      const py = my + (y - my) * Math.exp(-t * 3) + Math.cos(t * 22) * 0.05 * damp
      pts.push([px, py])
    }
    this.path = pts
    this.min = [mx, my]
    this.resize()
  }

  resize() {
    const c = this.canvas
    if (!c) return
    const dpr = Math.min(devicePixelRatio, 2)
    c.width = c.clientWidth * dpr
    c.height = c.clientHeight * dpr
    this.ctx = c.getContext('2d')
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.draw(this.prog)
  }

  draw(prog) {
    const c = this.canvas
    const ctx = this.ctx
    if (!ctx) return
    this.prog = prog
    const W = c.clientWidth
    const H = c.clientHeight
    ctx.clearRect(0, 0, W, H)
    const cx = this.min[0] * W
    const cy = this.min[1] * H
    for (let r = 9; r >= 1; r--) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, r * W * 0.052, r * H * 0.05, -0.5, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(109,168,255,${0.05 + (9 - r) * 0.02})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
    const path = this.path
    const n = Math.max(1, Math.floor(prog * (path.length - 1)))
    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      const px = path[i][0] * W
      const py = path[i][1] * H
      if (i) ctx.lineTo(px, py)
      else ctx.moveTo(px, py)
    }
    ctx.strokeStyle = '#6da8ff'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()
    const head = path[n]
    const hx = head[0] * W
    const hy = head[1] * H
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 28)
    g.addColorStop(0, 'rgba(109,168,255,0.55)')
    g.addColorStop(1, 'rgba(109,168,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(hx, hy, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#eef1f8'
    ctx.beginPath()
    ctx.arc(hx, hy, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#8890a3'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText('loss ' + ((1 - prog) * 0.94 + 0.03).toFixed(3), 16, 26)
  }
}
