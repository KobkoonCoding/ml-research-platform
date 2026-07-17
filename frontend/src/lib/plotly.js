/**
 * Plotly is a ~1MB library used only by the dashboard modules (EDA, ELM
 * results, preprocessing, verification). It used to load from a blocking
 * <script> in index.html, which delayed first paint on every route —
 * including the landing page, which never plots anything.
 *
 * This loader injects the CDN script on demand and caches the promise, so
 * the first chart on a page pays for it and everything after is instant.
 */

const PLOTLY_CDN = 'https://cdn.plot.ly/plotly-2.35.2.min.js'

let promise = null

/**
 * Loads Plotly, caching the in-flight/resolved promise.
 * @returns {Promise<any>} resolves with window.Plotly
 */
export function loadPlotly() {
  if (window.Plotly) return Promise.resolve(window.Plotly)
  if (promise) return promise

  promise = new Promise((resolve, reject) => {
    // A failed <script> stays in the DOM but never fires again. Removing
    // any previous attempt is what makes a retry actually retry — reusing
    // the dead tag left the promise pending forever, and every chart on
    // the page silently stayed blank until a full reload.
    document.querySelectorAll(`script[src="${PLOTLY_CDN}"]`).forEach((el) => el.remove())

    const script = document.createElement('script')
    script.src = PLOTLY_CDN
    script.async = true
    script.charset = 'utf-8'
    script.addEventListener(
      'load',
      () => {
        if (window.Plotly) resolve(window.Plotly)
        else {
          promise = null
          reject(new Error('Plotly script loaded but window.Plotly is missing'))
        }
      },
      { once: true }
    )
    script.addEventListener(
      'error',
      () => {
        promise = null // next chart mount gets a fresh attempt
        script.remove()
        reject(new Error('Failed to load Plotly'))
      },
      { once: true }
    )
    document.head.appendChild(script)
  })
  return promise
}
