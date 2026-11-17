import { parseGIF, decompressFrames } from 'gifuct-js';

export async function loadMediaMask(config, signal) {
  if (config.type === 'video') {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; video.muted = true; video.loop = true; video.playsInline = true;
    video.src = config.src; video.preload = 'auto';
    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve;
      video.onerror = () => reject(new Error('Could not load mask video'));
      signal.addEventListener('abort', () => { video.removeAttribute('src'); video.load(); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    });
    return {
      draw(ctx, time) {
        const desired = Number.isFinite(video.duration) ? time % video.duration : time;
        if (Math.abs(video.currentTime - desired) > 0.065 && !video.seeking) video.currentTime = desired;
        if (video.readyState >= 2) ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
      },
      dispose() { video.pause(); video.removeAttribute('src'); video.load(); },
    };
  }
  if (config.type === 'sequence') {
    if (!config.frames?.length) throw new Error('Mask sequence needs at least one frame');
    const frames = await Promise.all(config.frames.map(async (src) => {
      const response = await fetch(src, { signal });
      if (!response.ok) throw new Error(`Could not load mask frame: ${src}`);
      return createImageBitmap(await response.blob());
    }));
    return {
      draw(ctx, time) { ctx.drawImage(frames[Math.floor(time * (config.fps || 24)) % frames.length], 0, 0, ctx.canvas.width, ctx.canvas.height); },
      dispose() { frames.forEach((frame) => frame.close()); },
    };
  }
  const response = await fetch(config.src, { signal });
  if (!response.ok) throw new Error('Could not load mask GIF');
  const gif = parseGIF(await response.arrayBuffer());
  const decoded = decompressFrames(gif, true);
  if (!decoded.length) throw new Error('Mask GIF contains no frames');
  const composite = document.createElement('canvas');
  composite.width = gif.lsd.width; composite.height = gif.lsd.height;
  const ctx = composite.getContext('2d', { willReadFrequently: true });
  const patch = document.createElement('canvas');
  const patchCtx = patch.getContext('2d');
  let duration = 0;
  const frames = decoded.map((frame) => {
    const { width, height, left, top } = frame.dims;
    const previous = frame.disposalType === 3 ? ctx.getImageData(0, 0, composite.width, composite.height) : null;
    patch.width = width; patch.height = height;
    patchCtx.putImageData(new ImageData(frame.patch, width, height), 0, 0);
    ctx.drawImage(patch, left, top);
    const canvas = document.createElement('canvas');
    canvas.width = composite.width; canvas.height = composite.height;
    canvas.getContext('2d').drawImage(composite, 0, 0);
    duration += Math.max(frame.delay || 100, 20) / 1000;
    if (frame.disposalType === 2) ctx.clearRect(left, top, width, height);
    if (previous) ctx.putImageData(previous, 0, 0);
    return { canvas, end: duration };
  });
  return {
    draw(ctx, time) {
      const position = time % duration;
      const frame = frames.find((item) => position < item.end) || frames[0];
      ctx.drawImage(frame.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
    },
    dispose() { frames.forEach(({ canvas }) => { canvas.width = canvas.height = 0; }); },
  };
}
