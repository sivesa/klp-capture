/**
 * processing.ts
 *
 * Client-side image pipeline using the Canvas 2D API.
 * Available inside Capacitor's WKWebView / AndroidWebView.
 *
 * Pipeline per captured page:
 *   1. Decode source (URI or data-URI) into HTMLImageElement
 *   2. Apply rotation (0 / 90 / 180 / 270 °)
 *   3. Scale to targetWidth (default 1 600 px) preserving aspect ratio
 *   4. Optional grayscale conversion
 *   5. Optional S-curve contrast boost (improves handwriting legibility)
 *   6. Re-encode as JPEG at quality 0.88
 */

import type { ProcessingOptions, ProcessedImage } from '../../types';

// ── Image loader ──────────────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img   = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 60)}`));
    img.src     = src;
  });
}

// ── Main processor ────────────────────────────────────────────────────────────
export async function processImage(
  src:  string,
  opts: ProcessingOptions = {},
): Promise<ProcessedImage> {
  const {
    rotation     = 0,
    targetWidth  = 1600,
    quality      = 0.88,
    grayscale    = true,
    contrastBoost = true,
  } = opts;

  const img    = await loadImage(src);
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d')!;

  const rotated = rotation === 90 || rotation === 270;
  const srcW    = img.naturalWidth;
  const srcH    = img.naturalHeight;

  // Compute scaled output dimensions
  const scale  = targetWidth / (rotated ? srcH : srcW);
  const outW   = rotated ? Math.round(srcH * scale) : Math.round(srcW * scale);
  const outH   = rotated ? Math.round(srcW * scale) : Math.round(srcH * scale);

  canvas.width  = outW;
  canvas.height = outH;

  // Draw with rotation
  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  if (rotated) {
    ctx.drawImage(img, -(srcH * scale) / 2, -(srcW * scale) / 2, srcH * scale, srcW * scale);
  } else {
    ctx.drawImage(img, -outW / 2, -outH / 2, outW, outH);
  }
  ctx.restore();

  // Pixel-level transforms
  if (grayscale || contrastBoost) {
    const imageData = ctx.getImageData(0, 0, outW, outH);
    const d         = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];

      if (grayscale) {
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        r = g = b = gray;
      }

      if (contrastBoost) {
        // S-curve: darkens darks, lightens lights → crisper handwriting
        const curve = (v: number) => {
          const n = v / 255;
          return Math.round(255 * (n < 0.5 ? 2 * n * n : 1 - 2 * (1 - n) * (1 - n)));
        };
        r = curve(r); g = curve(g); b = curve(b);
      }

      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const dataUrl   = canvas.toDataURL('image/jpeg', quality);
  const base64    = dataUrl.split(',')[1];
  const sizeBytes = Math.round((base64.length * 3) / 4);

  return { base64, width: outW, height: outH, sizeBytes, mimeType: 'image/jpeg' };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Heuristic rotation detection from capture dimensions.
 * If image is landscape (width > height × 1.2) assume portrait content rotated 90°.
 */
export function detectRotation(width: number, height: number): 0 | 90 {
  return width > height * 1.2 ? 90 : 0;
}

/**
 * Laplacian-variance blurriness estimate.
 * Returns 0–100 (higher = sharper). Values below 15 typically indicate
 * motion blur or severe out-of-focus capture.
 */
export async function assessSharpness(base64: string): Promise<number> {
  const img    = await loadImage(`data:image/jpeg;base64,${base64}`);
  const size   = 200;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx    = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  let variance = 0;
  for (let i = 0; i < data.length - 4; i += 4) {
    const diff = data[i] - data[i + 4];
    variance += diff * diff;
  }
  return Math.min(100, (variance / (size * size)) * 0.5);
}
