import React, { useState, useCallback } from 'react'
import { Upload, Trash2, Camera } from 'lucide-react'
import { resizeImageFile } from '../lib/imageUtils'

const ACCENT_BTN = {
  primary: 'bg-primary shadow-primary/30 hover:bg-primary-hover',
  error: 'bg-error shadow-error/30 hover:bg-red-600',
  success: 'bg-success shadow-success/30 hover:bg-emerald-600',
  warning: 'bg-warning shadow-warning/30 hover:bg-amber-600',
}

const ACCENT_ICON = {
  primary: 'bg-primary/10 text-primary',
  error: 'bg-error/10 text-error',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
}

export default function ImageUploadZone({
  accentColor = 'primary',
  image,
  preview,
  loading,
  onFileSelect,
  onClear,
  onPredict,
  showPredict = true,
  predictLabel = 'Run Classification',
  acceptTypes = 'image/*',
  uploadHint = 'Supports JPG, PNG, WEBP (Max 10MB)',
  sampleImages = null,
  onSampleClick = null,
  maxDimension = 1024,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [optimizing, setOptimizing] = useState(false)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setOptimizing(true)
    try {
      const resized = await resizeImageFile(file, maxDimension, 0.85)
      onFileSelect(resized)
    } finally {
      setOptimizing(false)
    }
  }, [onFileSelect, maxDimension])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }, [handleFile])

  return (
    <div className="space-y-6">
      {!preview ? (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all group ${
            dragOver
              ? `border-${accentColor} bg-${accentColor}/10 scale-[1.02]`
              : 'border-border hover:border-border-subtle hover:bg-border/5'
          }`}
        >
          <input type="file" className="hidden" accept={acceptTypes} onChange={(e) => handleFile(e.target.files[0])} />
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${ACCENT_ICON[accentColor]}`}>
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="font-bold text-text-primary mb-1">
              {optimizing ? 'Optimizing image…' : dragOver ? 'Drop image here' : 'Upload or drag & drop'}
            </p>
            <p className="text-xs text-text-muted">{uploadHint}</p>
          </div>
        </label>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl group bg-black flex items-center justify-center">
            <img
              src={preview}
              alt="Upload"
              className="w-full h-auto max-h-[500px] object-contain"
            />
            <button
              onClick={onClear}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 backdrop-blur-md text-white hover:bg-error transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {showPredict && (
            <button
              onClick={onPredict}
              disabled={loading}
              className={`w-full py-5 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-3 shadow-lg transition-colors ${ACCENT_BTN[accentColor]}`}
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Camera className="w-5 h-5" /> {predictLabel}</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Sample Images */}
      {sampleImages && sampleImages.length > 0 && !preview && (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Or try a sample</p>
          <div className="grid grid-cols-4 gap-3">
            {sampleImages.map((sample) => (
              <button
                key={sample.label}
                onClick={() => onSampleClick?.(sample)}
                disabled={loading}
                className="group rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:scale-105 aspect-square relative"
              >
                <img src={sample.url} alt={sample.label} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <span className="text-[10px] font-bold text-white">{sample.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
