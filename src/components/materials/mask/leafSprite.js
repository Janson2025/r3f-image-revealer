// Use the PNG's alpha silhouette, not its dark RGB values, for the reveal mask.
export async function loadLeafSprite(src, signal) {
  const response = await fetch(src, { signal });
  if (!response.ok) throw new Error(`Could not load leaf image: ${src}`);
  const image = await createImageBitmap(await response.blob());
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 512 / Math.max(image.width, image.height));
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        // The supplied PNG has near-transparent background pixels (alpha 1).
        if (pixels.data[offset + 3] <= 8) pixels.data[offset + 3] = 0;
        else { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
      }
    }
    if (right < left) throw new Error('Leaf image has no visible silhouette');
    ctx.putImageData(pixels, 0, 0);
    const tint = (color) => {
      const sprite = document.createElement('canvas');
      sprite.width = right - left + 1; sprite.height = bottom - top + 1;
      const target = sprite.getContext('2d');
      target.drawImage(canvas, left, top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
      target.globalCompositeOperation = 'source-in';
      target.fillStyle = color; target.fillRect(0, 0, sprite.width, sprite.height);
      return sprite;
    };
    return { white: tint('white'), black: tint('black') };
  } finally { image.close(); }
}
