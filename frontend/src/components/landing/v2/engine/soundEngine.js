/**
 * SoundEngine — ambient drone + UI blips for the landing page.
 *
 * Lazy: nothing is created until the user first toggles sound on (required
 * anyway — browsers block AudioContext before a user gesture). All gains
 * ramp smoothly so toggling never clicks.
 */
export default class SoundEngine {
  constructor() {
    this.on = false
    this.ctx = null
  }

  _ensure() {
    if (this.ctx) return true
    const A = window.AudioContext || window.webkitAudioContext
    if (!A) return false
    const ctx = (this.ctx = new A())
    const g = ctx.createGain()
    g.gain.value = 0
    g.connect(ctx.destination)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 620
    f.Q.value = 0.6
    f.connect(g)
    this.droneLP = f
    // Layered detuned oscillators = the ambient drone.
    ;[[55, 'sine', 0.5], [110, 'triangle', 0.22], [164.8, 'sine', 0.12], [220.6, 'sine', 0.07]].forEach((d) => {
      const o = ctx.createOscillator()
      const og = ctx.createGain()
      o.type = d[1]
      o.frequency.value = d[0]
      og.gain.value = d[2]
      o.connect(og)
      og.connect(f)
      o.start()
      const lfo = ctx.createOscillator()
      const lg = ctx.createGain()
      lfo.frequency.value = 0.05 + Math.random() * 0.08
      lg.gain.value = d[2] * 0.5
      lfo.connect(lg)
      lg.connect(og.gain)
      lfo.start()
    })
    // Band-passed noise driven by scroll velocity ("whoosh").
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const nd = nb.getChannelData(0)
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    const ns = ctx.createBufferSource()
    ns.buffer = nb
    ns.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 220
    bp.Q.value = 0.7
    const wg = ctx.createGain()
    wg.gain.value = 0
    ns.connect(bp)
    bp.connect(wg)
    wg.connect(g)
    ns.start()
    this.whooshGain = wg
    this.whooshBP = bp
    const ug = ctx.createGain()
    ug.gain.value = 1
    ug.connect(g)
    this.uiGain = ug
    this.masterGain = g
    return true
  }

  /** @returns {boolean} the new on/off state */
  toggle() {
    if (!this._ensure()) return false
    this.on = !this.on
    if (this.ctx.state === 'suspended') this.ctx.resume()
    this.masterGain.gain.setTargetAtTime(this.on ? 0.05 : 0, this.ctx.currentTime, 0.8)
    return this.on
  }

  /** Per-frame: scroll velocity → whoosh loudness, page depth → drone timbre. */
  drive(velS, scrollFrac) {
    if (!this.ctx || !this.whooshGain) return
    const wv = this.on ? Math.min(0.9, Math.abs(velS) * 0.22) : 0
    this.whooshGain.gain.setTargetAtTime(wv, this.ctx.currentTime, 0.08)
    this.whooshBP.frequency.setTargetAtTime(180 + Math.abs(velS) * 140, this.ctx.currentTime, 0.1)
    if (this.droneLP) this.droneLP.frequency.setTargetAtTime(480 + scrollFrac * 1000, this.ctx.currentTime, 0.5)
  }

  _blip(fA, fB, dur, vol, type) {
    if (!this.ctx || !this.on || !this.uiGain) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g2 = ctx.createGain()
    o.type = type || 'sine'
    o.frequency.setValueAtTime(fA, t)
    o.frequency.exponentialRampToValueAtTime(Math.max(1, fB), t + dur)
    g2.gain.setValueAtTime(vol, t)
    g2.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g2)
    g2.connect(this.uiGain)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  hover() { this._blip(1250, 1900, 0.09, 0.28) }
  click() {
    this._blip(340, 150, 0.16, 0.85, 'triangle')
    this._blip(2100, 900, 0.05, 0.22)
  }
  chime() {
    this._blip(523.25, 522, 1.1, 0.5)
    this._blip(1046.5, 1044, 1.4, 0.2)
    this._blip(130.8, 65, 0.5, 0.5)
  }

  dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}
