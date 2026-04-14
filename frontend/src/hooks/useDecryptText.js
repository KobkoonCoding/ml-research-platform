import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const DEFAULT_GLYPHS = '!<>-_\\/[]{}—=+*^?#abcdefghijklmnopqrstuvwxyz'

/**
 * Animates a string by progressively resolving each character from a random
 * glyph to its final value. Useful for an ML/"decryption" text effect on mount.
 *
 * Respects `prefers-reduced-motion` — returns the final text immediately.
 *
 * @param {string}  finalText            Target string to resolve to.
 * @param {object}  [options]
 * @param {number}  [options.duration=900]  Total animation duration in ms.
 * @param {string}  [options.glyphs]     Pool of random glyphs to cycle through.
 * @param {boolean} [options.start=true] Gate to delay the animation until ready.
 * @returns {string} The currently-rendered string.
 */
export function useDecryptText(finalText, options = {}) {
  const { duration = 900, glyphs = DEFAULT_GLYPHS, start = true } = options
  const prefersReducedMotion = useReducedMotion()
  const [display, setDisplay] = useState(() =>
    prefersReducedMotion ? finalText : ''
  )

  useEffect(() => {
    if (!start) return undefined
    if (prefersReducedMotion) {
      setDisplay(finalText)
      return undefined
    }

    const startTs = performance.now()
    let rafId = 0

    const tick = (now) => {
      const elapsed = now - startTs
      const progress = Math.min(1, elapsed / duration)
      const revealCount = Math.floor(progress * finalText.length)

      let out = ''
      for (let i = 0; i < finalText.length; i += 1) {
        if (i < revealCount || finalText[i] === ' ') {
          out += finalText[i]
        } else {
          out += glyphs[Math.floor(Math.random() * glyphs.length)]
        }
      }
      setDisplay(out)

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        setDisplay(finalText)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [finalText, duration, glyphs, start, prefersReducedMotion])

  return display
}
