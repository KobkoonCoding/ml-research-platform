import React, { useRef, useState, useEffect } from 'react'

function classColor(classId) {
  const hue = ((classId ?? 0) * 137) % 360
  return `hsl(${hue}, 70%, 55%)`
}

export default function BoundingBoxOverlay({
  imageSrc,
  detections = [],
  imageWidth,
  imageHeight,
  confThreshold = 0,
  className = '',
}) {
  const imgRef = useRef(null)
  const [rendered, setRendered] = useState({ w: 0, h: 0, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    const updateDims = () => {
      const el = imgRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const containerRect = el.parentElement.getBoundingClientRect()

      // For object-contain, compute actual rendered image area
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

  const visible = detections.filter(d => d.confidence >= confThreshold)

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-black flex items-center justify-center ${className}`}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Detection source"
        className="w-full h-auto max-h-[500px] object-contain"
        onLoad={() => {
          // Trigger recompute after load
          if (imgRef.current) {
            const event = new Event('resize')
            window.dispatchEvent(event)
          }
        }}
      />
      {/* Bounding boxes */}
      {rendered.w > 0 && visible.map((det, i) => {
        const color = classColor(det.class_id)
        const [x1, y1, x2, y2] = det.box
        const left = rendered.offsetX + x1 * scaleX
        const top = rendered.offsetY + y1 * scaleY
        const width = (x2 - x1) * scaleX
        const height = (y2 - y1) * scaleY

        return (
          <div
            key={i}
            className="absolute border-2 rounded-md pointer-events-none"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
              borderColor: color,
              boxShadow: `0 0 12px ${color}88`,
            }}
          >
            <span
              className="absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-black text-white rounded whitespace-nowrap"
              style={{ background: color }}
            >
              {det.class_name} {(det.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )
      })}
      {/* Stat chip */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-black text-white uppercase tracking-widest">
        {visible.length} detected
      </div>
    </div>
  )
}
