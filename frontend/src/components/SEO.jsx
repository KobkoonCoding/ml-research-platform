import React from 'react'
import { Helmet } from 'react-helmet-async'

/**
 * Per-route SEO component.
 *
 * Drop into any page to override the document <title>, meta description,
 * Open-Graph, Twitter Card, and canonical URL. Falls back to the static
 * defaults in index.html when omitted.
 *
 * Also renders an optional JSON-LD <script> for structured data — pass any
 * Schema.org-compatible object as `jsonLd`.
 */

const SITE_URL = 'https://ml-research-platform.vercel.app'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export default function SEO({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd = null,
}) {
  const url = `${SITE_URL}${path}`
  // Prepend brand to short titles, leave long ones alone.
  const fullTitle = title
    ? title.length < 50 && !title.toLowerCase().includes('nexus')
      ? `${title} · NEXUS — ML Research Platform`
      : title
    : 'NEXUS — ML Research Platform · Mathematical Optimization for Machine Learning'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter Card */}
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />

      {/* Per-page robots override */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Optional structured data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
