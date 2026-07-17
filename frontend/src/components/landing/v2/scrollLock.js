/**
 * Body scroll lock with a reference count.
 *
 * Two overlays can be open in sequence (drawer → module modal). When each
 * saved and restored `body.style.overflow` itself, the second could capture
 * the first's 'hidden' as the "previous" value and restore it forever,
 * leaving the page permanently unscrollable. One owner, one counter.
 */

let depth = 0
let previous = ''

export function lockScroll() {
  if (depth === 0) {
    previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  depth++
}

export function unlockScroll() {
  depth = Math.max(0, depth - 1)
  if (depth === 0) document.body.style.overflow = previous
}
