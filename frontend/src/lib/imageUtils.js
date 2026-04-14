/**
 * Client-side image preprocessing utilities.
 *
 * Resizing large phone photos in the browser before upload is one of the
 * biggest UX wins for ML inference apps on free CPU hosting:
 *   - A 4 MB phone photo becomes ~150 KB after resize to 1024px + JPEG 0.85
 *   - Network upload goes from 5-15 s to <1 s on mobile
 *   - Backend downstream inference is unchanged (it was re-resizing anyway)
 */

/**
 * Resize an image File to a maximum dimension while preserving aspect ratio.
 * Returns a new File object (JPEG) that is safe to upload via FormData.
 *
 * Small files (<200 KB) are passed through unchanged.
 *
 * @param {File} file - Input image file (any format supported by createImageBitmap)
 * @param {number} maxDimension - Maximum width or height in pixels (default 1024)
 * @param {number} quality - JPEG quality 0..1 (default 0.85)
 * @returns {Promise<File>} Resized JPEG file (or original if already small)
 */
export async function resizeImageFile(file, maxDimension = 1024, quality = 0.85) {
  if (!file || !file.type?.startsWith('image/')) return file

  // Small files don't need processing — network transfer isn't the bottleneck
  if (file.size < 200 * 1024) return file

  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap

    // Already small enough — skip canvas work
    const maxSide = Math.max(width, height)
    if (maxSide <= maxDimension) {
      bitmap.close?.()
      return file
    }

    const scale = maxDimension / maxSide
    const newW = Math.round(width * scale)
    const newH = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = newW
    canvas.height = newH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return file
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, newW, newH)
    bitmap.close?.()

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })

    if (!blob) return file

    const newName = file.name.replace(/\.[^.]+$/, '.jpg')
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() })
  } catch (err) {
    // Fall back to original file if browser doesn't support OffscreenCanvas / createImageBitmap
    console.warn('Image resize failed, uploading original:', err)
    return file
  }
}
