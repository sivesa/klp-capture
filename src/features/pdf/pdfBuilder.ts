/**
 * pdfBuilder.ts
 *
 * Generates an A4 PDF from captured pages using pdf-lib.
 * Runs 100 % on-device — no server round-trip needed.
 * pdf-lib is lazy-imported to keep it out of the initial JS bundle (~200 KB).
 *
 * Page layout
 * ───────────
 *  ┌─────────────────────┐  A4 = 595 × 842 pt
 *  │  ← 20 pt margin →  │
 *  │                     │
 *  │   [image centered   │
 *  │    in available     │
 *  │    area]            │
 *  │                     │
 *  ├─────────────────────┤
 *  │ ████ footer ████████│  24 pt – navy background
 *  └─────────────────────┘
 */

import type { CapturedPage, PDFBuildOptions, PDFResult } from '../../types';
import { processImage } from '../../services/image/processing';

const A4_W    = 595;
const A4_H    = 842;
const MARGIN  = 20;
const FOOTER  = 24;

export async function buildPDF(
  pages: CapturedPage[],
  opts:  PDFBuildOptions = {},
): Promise<PDFResult> {
  // Lazy import – excluded from initial bundle
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const doc = await PDFDocument.create();

  if (opts.includeMetadata !== false) {
    doc.setTitle(opts.assignmentTitle ?? 'Student Assessment');
    doc.setAuthor(opts.studentName   ?? 'KLP Student');
    doc.setCreator('Kaizen Learning Platform');
    doc.setCreationDate(new Date());
  }

  const font   = await doc.embedFont(StandardFonts.Helvetica);
  const sorted = [...pages].sort((a, b) => a.order - b.order);
  const avW    = A4_W - MARGIN * 2;
  const avH    = A4_H - MARGIN * 2 - FOOTER;

  for (let i = 0; i < sorted.length; i++) {
    const captured = sorted[i];
    const src      = captured.base64
      ? `data:image/jpeg;base64,${captured.base64}`
      : captured.localUri;

    const processed = await processImage(src, {
      rotation:     captured.rotation,
      targetWidth:  1600,
      quality:      0.88,
      grayscale:    true,
      contrastBoost: true,
    });

    const imgBytes = base64ToBytes(processed.base64);
    const embedded = await doc.embedJpg(imgBytes);

    // Fit image inside available area, preserving aspect ratio
    const imgAspect = processed.width / processed.height;
    const boxAspect = avW / avH;
    let drawW: number, drawH: number;
    if (imgAspect > boxAspect) {
      drawW = avW; drawH = avW / imgAspect;
    } else {
      drawH = avH; drawW = avH * imgAspect;
    }

    const x = MARGIN + (avW - drawW) / 2;
    const y = FOOTER + MARGIN + (avH - drawH) / 2;

    const page = doc.addPage([A4_W, A4_H]);
    page.drawImage(embedded, { x, y, width: drawW, height: drawH });

    // Footer strip
    page.drawRectangle({ x: 0, y: 0, width: A4_W, height: FOOTER, color: rgb(0.059, 0.106, 0.208) });

    const footerParts: string[] = [];
    if (opts.assignmentTitle) footerParts.push(opts.assignmentTitle);
    if (opts.studentName)     footerParts.push(opts.studentName);
    footerParts.push(`Page ${i + 1} of ${sorted.length}`);

    page.drawText(footerParts.join('  ·  '), {
      x: MARGIN, y: 7, size: 7, font, color: rgb(0.85, 0.85, 0.85),
    });
  }

  const pdfBytes = await doc.save();
  const base64   = bytesToBase64(pdfBytes);

  return {
    base64,
    sizeBytes:   pdfBytes.byteLength,
    pageCount:   sorted.length,
    generatedAt: new Date().toISOString(),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function base64ToBytes(b64: string): Uint8Array {
  const bin   = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let out = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(out);
}
