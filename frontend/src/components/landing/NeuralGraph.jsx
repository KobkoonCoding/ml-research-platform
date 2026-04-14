import React, { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Ambient 3-layer feed-forward neural graph rendered as SVG.
 * Pure decoration — used as a background layer inside the DeveloperCard.
 *
 * Edges animate `pathLength 0→1` on mount with a short stagger.
 * Nodes get a slow opacity pulse to feel "live".
 *
 * @typedef {Object} NeuralGraphProps
 * @property {number}   [width=420]      SVG viewBox width.
 * @property {number}   [height=220]     SVG viewBox height.
 * @property {string}   [accent]         Stroke colour for edges and nodes.
 * @property {string}   [className]      Extra classes on the root <svg>.
 *
 * @param {NeuralGraphProps} props
 */
function NeuralGraph({
  width = 420,
  height = 220,
  accent = '#8B9CF8',
  className = '',
}) {
  const prefersReducedMotion = useReducedMotion()

  // Layer node-count pattern: 3 → 4 → 3 feed-forward graph.
  const layers = useMemo(() => {
    const layerSizes = [3, 4, 3]
    const xGap = width / (layerSizes.length + 1)
    return layerSizes.map((count, layerIdx) => {
      const cx = xGap * (layerIdx + 1)
      const yGap = height / (count + 1)
      return Array.from({ length: count }, (_, nodeIdx) => ({
        id: `l${layerIdx}n${nodeIdx}`,
        cx,
        cy: yGap * (nodeIdx + 1),
      }))
    })
  }, [width, height])

  // All edges between consecutive layers.
  const edges = useMemo(() => {
    const out = []
    for (let l = 0; l < layers.length - 1; l += 1) {
      const a = layers[l]
      const b = layers[l + 1]
      for (let i = 0; i < a.length; i += 1) {
        for (let j = 0; j < b.length; j += 1) {
          out.push({
            id: `${a[i].id}-${b[j].id}`,
            x1: a[i].cx,
            y1: a[i].cy,
            x2: b[j].cx,
            y2: b[j].cy,
          })
        }
      }
    }
    return out
  }, [layers])

  const flatNodes = useMemo(() => layers.flat(), [layers])

  const drawTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: 'easeOut' }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g stroke={accent} strokeWidth={1} strokeLinecap="round" fill="none">
        {edges.map((edge, idx) => (
          <motion.line
            key={edge.id}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.65 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              ...drawTransition,
              delay: prefersReducedMotion ? 0 : idx * 0.035,
            }}
          />
        ))}
      </g>

      <g fill={accent}>
        {flatNodes.map((node, idx) => (
          <motion.circle
            key={node.id}
            cx={node.cx}
            cy={node.cy}
            r={3.5}
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.4,
              delay: prefersReducedMotion ? 0 : 0.6 + idx * 0.04,
            }}
            style={
              prefersReducedMotion
                ? undefined
                : {
                    // Gentle idle pulse via CSS custom animation delay offsets.
                    animation: `neural-pulse 2.4s ease-in-out ${idx * 0.12}s infinite`,
                  }
            }
          />
        ))}
      </g>

      {/* Keyframes scoped inline so the component is self-contained. */}
      <style>{`
        @keyframes neural-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
      `}</style>
    </svg>
  )
}

export default NeuralGraph
