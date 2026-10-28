export const MAX_IMAGE_MB = 15;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function validateImageFile(file) {
  if (!file) return 'Selecciona una imagen para subir.';
  if (file.size > MAX_IMAGE_BYTES) return `La imagen debe pesar ${MAX_IMAGE_MB} MB o menos para poder subirla.`;
  if (!ACCEPTED_TYPES.has(file.type)) return 'Usa una imagen JPG, PNG, WEBP o GIF.';
  return '';
}

export function getImageUploadError(error) {
  const response = error?.response;
  if (response?.status === 413 || response?.data?.error?.code === 'IMAGE_TOO_LARGE') {
    return `La imagen debe pesar ${MAX_IMAGE_MB} MB o menos para poder subirla.`;
  }
  return response?.data?.error?.message || error?.message || 'No se pudo subir la imagen.';
}

async function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close?.() };
    } catch {
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const source = new Image();
    await new Promise((resolve, reject) => {
      source.onload = resolve;
      source.onerror = reject;
      source.src = url;
    });
    return { source, width: source.naturalWidth, height: source.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareImageForUpload(file, { maxWidth = 1500, maxHeight = 1800, quality = 0.78 } = {}) {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);
  if (file.type === 'image/gif') return file;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return file;

  let image;
  try {
    image = await loadImage(file);
    if (!image.width || !image.height) return file;
    const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
    if (ratio === 1 && file.type === 'image/webp' && file.size < 300 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image.source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
      type: 'image/webp',
      lastModified: Date.now()
    });
  } catch {
    return file;
  } finally {
    image?.close();
  }
}
