/**
 * Image optimization utilities for storing profile pictures in localStorage.
 * Compresses, resizes, and center-crops photos to lightweight JPEG avatars (~20-40 KB)
 * preventing LocalStorage QuotaExceededError.
 */

export interface OptimizationResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  savedPercentage: number;
}

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  cropSquare?: boolean;
}

/**
 * Formats a byte number into human-readable string (Ko, Mo)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

/**
 * Optimizes an image File, Blob, or Data URL for efficient localStorage saving.
 */
export async function optimizeImageForStorage(
  source: File | Blob | string,
  options: OptimizeOptions = {}
): Promise<OptimizationResult> {
  const {
    maxWidth = 360,
    maxHeight = 360,
    quality = 0.82,
    cropSquare = true,
  } = options;

  let originalSize = 0;
  let sourceUrl = '';

  if (typeof source === 'string') {
    sourceUrl = source;
    // Estimate size of data URL or string
    originalSize = Math.round((source.length * 3) / 4);
  } else {
    originalSize = source.size;
    sourceUrl = await readFileAsDataUrl(source);
  }

  const img = await loadImage(sourceUrl);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Impossible d’initialiser le contexte de dessin 2D.');
  }

  let sX = 0;
  let sY = 0;
  let sWidth = img.naturalWidth || img.width;
  let sHeight = img.naturalHeight || img.height;
  let dWidth = maxWidth;
  let dHeight = maxHeight;

  if (cropSquare) {
    // Center crop square to make avatars uniform & lightweight
    const minEdge = Math.min(sWidth, sHeight);
    sX = Math.round((sWidth - minEdge) / 2);
    sY = Math.round((sHeight - minEdge) / 2);
    sWidth = minEdge;
    sHeight = minEdge;
    dWidth = Math.min(maxWidth, minEdge);
    dHeight = dWidth;
  } else {
    // Preserve aspect ratio within bounds
    let ratio = Math.min(maxWidth / sWidth, maxHeight / sHeight);
    if (ratio > 1) ratio = 1; // Do not upscale small images
    dWidth = Math.round(sWidth * ratio);
    dHeight = Math.round(sHeight * ratio);
  }

  canvas.width = dWidth;
  canvas.height = dHeight;

  // Smoothing for smooth facial skin and crisp edges
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill white background for any transparency (e.g. transparent PNGs)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, dWidth, dHeight);

  // Draw scaled/cropped image
  ctx.drawImage(img, sX, sY, sWidth, sHeight, 0, 0, dWidth, dHeight);

  // Export as optimized JPEG
  const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
  // Calculate size in bytes: base64 is ~4/3 of binary
  const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const savedPercentage = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

  return {
    dataUrl: compressedDataUrl,
    originalSize,
    compressedSize,
    width: dWidth,
    height: dHeight,
    savedPercentage,
  };
}

/**
 * Checks localStorage usage and remaining space
 */
export function getLocalStorageUsage(storageKey: string = 'family_genealogy_app_data_v1') {
  let itemBytes = 0;
  let totalBytes = 0;

  try {
    const item = localStorage.getItem(storageKey);
    if (item) {
      itemBytes = new Blob([item]).size;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        if (val) {
          totalBytes += new Blob([key, val]).size;
        }
      }
    }
  } catch (e) {
    console.error('Erreur de lecture du localStorage', e);
  }

  // Modern browsers typically give ~5MB to 10MB
  const estimatedLimit = 5 * 1024 * 1024;
  const percentage = Math.min(100, Math.round((totalBytes / estimatedLimit) * 100));

  return {
    itemBytes,
    totalBytes,
    itemFormatted: formatBytes(itemBytes),
    totalFormatted: formatBytes(totalBytes),
    limitFormatted: formatBytes(estimatedLimit),
    percentage,
  };
}

/**
 * Helper to read a File/Blob as Data URL
 */
function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier image.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to load an image element asynchronously
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de charger l'image pour optimisation."));
    img.src = url;
  });
}
