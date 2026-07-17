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

/** @returns {Promise<any>} resolves with window.Plotly */
export function loadPlotly() {
  if (window.Plotly) return Promise.resolve(window.Plotly)
  if (promise) return promise

  promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PLOTLY_CDN}"]`)
    const script = existing || document.createElement('script')
    const onLoad = () => resolve(window.Plotly)
    const onError = () => {
      promise = null // allow a retry on the next chart mount
      reject(new Error('Failed to load Plotly'))
    }
    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })
    if (!existing) {
      script.src = PLOTLY_CDN
      script.async = true
      script.charset = 'utf-8'
      document.head.appendChild(script)
    }
  })
  return promise
}
