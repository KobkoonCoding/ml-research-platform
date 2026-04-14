import React, { useRef, useState, useEffect } from 'react'

// COCO 17-keypoint skeleton edges, grouped by limb for color coding.
// Each entry: [keypointA, keypointB]
const SKELETON_EDGES = {
  face: [
    [0, 1], [0, 2], [1, 3], [2, 4],
  ],
  torso: [
    [5, 6], [5, 11], [6, 12], [11, 12],
  ],
  arms: [
    [5, 7], [7, 9], [6, 8], [8, 10],
  ],
  legs: [
    [11, 13], [13, 15], [12, 14], [14, 16],
  ],
}

const LIMB_COLORS = {
  face: '#FBBF24',   // amber
  torso: '#A78BFA',  // violet
  arms: '#22D3EE',   // cyan
  legs: '#34D399',   // emerald
}

function personColor(personIndex) {
  // Distinct hue per person, cycle nicely
  const hue = (personIndex * 67) % 360
  return `hsl(${hue}, 80%, 60%)`
}

export default function PoseSkeletonOverlay({
  imageSrc,
  detections = [],
  imageWidth,
  imageHeight,
  confThreshold = 0.25,
  kpThreshold = 0.3,
  className = '',
}) {
  const imgRef = useRef(null)
  const [rendered, setRendered] = useState({ w: 0, h: 0, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    const updateDims = () => {
      const el = imgRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()

      const imgAspect = imageWidth / imageHeight
      const boxAspect = rect.width / rect.height
      let renderedW, renderedH, offsetX, offsetY
      if (imgAspect > boxAspect) {
        renderedW = rect.width
        renderedH = rect.width / imgAspect
        offsetX = 0
        offsetY = (rect.height - renderedH) / 2
      } else {
        renderedH = rect.height
        renderedW = rect.height * imgAspect
        offsetX = (rect.width - renderedW) / 2
        offsetY = 0
      }
      setRendered({ w: renderedW, h: renderedH, offsetX, offsetY })
    }

    updateDims()
    const observer = new ResizeObserver(updateDims)
    if (imgRef.current) observer.observe(imgRef.current)
    window.addEventListener('resize', updateDims)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateDims)
    }
  }, [imageSrc, imageWidth, imageHeight])

  const scaleX = rendered.w / (imageWidth || 1)
  const scaleY = rendered.h / (imageHeight || 1)

  const visible = detections.filter(d => (d.confidence ?? 0) >= confThreshold)

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-black flex items-center justify-center ${className}`}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Pose source"
        className="w-full h-auto max-h-[500px] object-contain"
        onLoad={() => {
          if (imgRef.current) window.dispatchEvent(new Event('resize'))
        }}
      />

      {rendered.w > 0 && visible.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        >
          {visible.map((det, personIdx) => {
            const color = personColor(personIdx)
            const kps = det.keypoints || []
            const [x1, y1, x2, y2] = det.box || [0, 0, 0, 0]
            const bx = rendered.offsetX + x1 * scaleX
            const by = rendered.offsetY + y1 * scaleY
            const bw = (x2 - x1) * scaleX
            const bh = (y2 - y1) * scaleY

            const projected = kps.map((kp) => ({
              x: rendered.offsetX + kp.x * scaleX,
              y: rendered.offsetY + kp.y * scaleY,
              conf: kp.conf ?? 0,
              name: kp.name,
            }))

            return (
              <g key={personIdx}>
                {/* Faint bbox */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.35}
                  rx={6}
                />
                {/* Person label */}
                <text
                  x={bx + 6}
                  y={by + 14}
                  fill={color}
                  fontSize={11}
                  fontWeight={900}
                  style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 2 }}
                >
                  Person {personIdx + 1} · {Math.round((det.confidence ?? 0) * 100)}%
                </text>

                {/* Skeleton edges */}
                {Object.entries(SKELETON_EDGES).map(([limb, edges]) =>
                  edges.map(([a, b], ei) => {
                    const pa = projected[a]
                    const pb = projected[b]
                    if (!pa || !pb) return null
                    if (pa.conf < kpThreshold || pb.conf < kpThreshold) return null
                    return (
                      <line
                        key={`${limb}-${ei}`}
                        x1={pa.x}
                        y1={pa.y}
                        x2={pb.x}
                        y2={pb.y}
                        stroke={LIMB_COLORS[limb]}
                        strokeWidth={3}
                        strokeLinecap="round"
                        opacity={0.9}
                      />
                    )
                  })
                )}

                {/* Keypoint dots */}
                {projected.map((kp, ki) => {
                  if (kp.conf < kpThreshold) return null
                  return (
                    <circle
                      key={ki}
                      cx={kp.x}
                      cy={kp.y}
                      r={4}
                      fill={color}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>
      )}

      {/* Stat chip */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-black text-white uppercase tracking-widest">
        {visible.length} {visible.length === 1 ? 'person' : 'people'}
      </div>
    </div>
  )
}
