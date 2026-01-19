/**
 * Compresses an image file or base64 string using Canvas
 * @param {string} base64 - The input base64 image string
 * @param {number} quality - Compression quality (0 to 1)
 * @param {number} maxWidth - Maximum width for the compressed image
 * @returns {Promise<string>} - The compressed base64 image string
 */
export async function compressImage(base64, quality = 0.8, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.onerror = (err) => reject(err);
  });
}

/**
 * Adaptive compression based on network speed (if supported by browser)
 * @param {string} base64 - The input base64 image string
 * @returns {Promise<string>} - The compressed base64 image string
 */
export async function adaptiveCompress(base64) {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let quality = 0.8;
  let maxWidth = 1200;

  if (connection) {
    if (connection.effectiveType === '3g') {
      quality = 0.6;
      maxWidth = 800;
    } else if (connection.effectiveType === '2g') {
      quality = 0.4;
      maxWidth = 600;
    }
  }

  return compressImage(base64, quality, maxWidth);
}
