import React from 'react'

/**
 * Displays a pre-composited jet-colormap heatmap image from the backend.
 *
 * The backend now returns a single RGB PNG where the X-ray and jet
 * heatmap are already alpha-blended, so no CSS mix-blend tricks are
 * needed on the frontend. This produces the classic "medical Grad-CAM"
 * visualization (blue background → cyan → green → yellow → red hotspot).
 */
export default function HeatmapOverlay({ heatmapSrc, className = '' }) {
  if (!heatmapSrc) return null

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-black flex items-center justify-center ${className}`}>
      <img
        src={heatmapSrc}
        alt="X-ray with attention heatmap"
        className="w-full h-auto max-h-[500px] object-contain"
      />

      {/* Legend chip */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 z-10">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        Attention
      </div>

      {/* Color bar legend (bottom) */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-10">
        <span className="text-[9px] font-black text-white/80 uppercase tracking-widest shrink-0 drop-shadow-lg">Low</span>
        <div
          className="flex-1 h-1.5 rounded-full"
          style={{
            background:
              'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
          }}
        />
        <span className="text-[9px] font-black text-white/80 uppercase tracking-widest shrink-0 drop-shadow-lg">High</span>
      </div>
    </div>
  )
}
