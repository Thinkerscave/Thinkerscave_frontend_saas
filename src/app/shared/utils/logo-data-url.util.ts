/**
 * Compresses an image file into a data URL suitable for logoUrl fields.
 * Backend accepts up to ~350k chars; we keep a safer ceiling after resize.
 */

export const LOGO_MAX_SOURCE_BYTES = 2 * 1024 * 1024;
/** Max encoded data-URL length sent to the API (must stay under DTO @Size). */
export const LOGO_MAX_DATA_URL_CHARS = 280_000;
const LOGO_MAX_EDGE_PX = 512;
const LOGO_JPEG_QUALITY = 0.82;

export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

export async function fileToCompressedLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a PNG, JPG, or WebP image.');
  }
  if (file.size > LOGO_MAX_SOURCE_BYTES) {
    throw new Error('Logo must be 2 MB or smaller before upload.');
  }

  const raw = await readAsDataUrl(file);
  const compressed = await resizeDataUrl(raw, LOGO_MAX_EDGE_PX, LOGO_JPEG_QUALITY);

  if (compressed.length > LOGO_MAX_DATA_URL_CHARS) {
    throw new Error(
      'Logo is still too large after compression. Use a simpler image under ~200 KB, or skip the logo for now.'
    );
  }

  return compressed;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

function resizeDataUrl(dataUrl: string, maxEdge: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process the logo image.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Prefer JPEG for photos; keep PNG when source has transparency and stays small.
      const preferPng = dataUrl.startsWith('data:image/png') && (width * height < 80_000);
      const out = preferPng
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', quality);
      resolve(out);
    };
    img.onerror = () => reject(new Error('Could not load the selected image.'));
    img.src = dataUrl;
  });
}
