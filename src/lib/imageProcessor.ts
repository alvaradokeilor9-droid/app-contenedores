/**
 * Utility for client-side image optimization, thumbnailing, and fast processing for 100+ photos.
 */

export interface OptimizeOptions {
  maxDimension?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: 'image/jpeg' | 'image/webp';
}

/**
 * Optimizes an image file by scaling to maxDimension and compressing with JPEG/WebP.
 */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<{ blob: Blob; width: number; height: number }> {
  const { maxDimension = 2048, quality = 0.85, mimeType = 'image/jpeg' } = options;

  // If it's not an image (e.g. PDF or other), return raw blob
  if (!file.type.startsWith('image/')) {
    return { blob: file, width: 0, height: 0 };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Only resize if bigger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ blob: file, width: img.width, height: img.height });
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve({ blob, width, height });
          } else {
            // If optimization didn't reduce size, keep original
            resolve({ blob: file, width: img.width, height: img.height });
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback to original file
      resolve({ blob: file, width: 0, height: 0 });
    };

    img.src = objectUrl;
  });
}

/**
 * Formats bytes to human-readable string (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Builds the folder name according to selected pattern.
 */
export function buildFolderName(
  container: string,
  client: string,
  po: string,
  pattern: 'standard' | 'hyphen' | 'underscore' | 'date_first',
  dateString?: string
): string {
  const c = (container || '').trim() || 'CONTENEDOR';
  const cl = (client || '').trim() || 'CLIENTE';
  const p = (po || '').trim() || 'PO';
  const d = dateString || new Date().toISOString().slice(0, 10);

  switch (pattern) {
    case 'underscore':
      return `${c}_${cl}_${p}`;
    case 'hyphen':
      return `${c} - ${cl} - ${p}`;
    case 'date_first':
      return `${d}_${c}_${cl}_${p}`;
    case 'standard':
    default:
      return `${c} - ${cl} - PO ${p}`;
  }
}
