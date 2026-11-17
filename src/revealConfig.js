// Add local images to public/images and reference them as /images/your-photo.jpg.
// Each card randomly selects from its own images array, or this shared pool.
export const imagePool = [
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1000&q=85',
];

export const revealers = [
  { id: 'circles', name: 'Orbital circles', subtitle: 'A study in perpetual motion', color: '#c1b6ff', count: 80, duration: 12,
    minSize: 0.01, maxSize: 0.10, minDistanceRatio: 0.05, maxDistanceRatio: 0.65, distanceExponent: 0.7, fastSpeedMul: 5.5, hoverSizeMul: 2.5 },
  { id: 'falling', name: 'Autumn descent', subtitle: 'A little beautiful disorder', color: '#e9ba7b', count: 85, duration: 9, hoverInterval: 0.045, hoverDuration: 2.6, hoverArrival: 0.2, hoverFallDistance: 0.09, minSize: 0.085, maxSize: 0.16, spread: 1.05, leafImage: '/images/dark_leaf1.png' },
  { id: 'wind', name: 'Carried away', subtitle: 'Let the landscape breathe', color: '#bad3a2', count: 78, duration: 14, minSize: 0.06, maxSize: 0.12, leafImage: '/images/dark_leaf1.png' },
  { id: 'flowers', name: 'In full bloom', subtitle: 'Small beginnings, slow unfolding', color: '#edb5ca', count: 45, duration: 9, hoverInterval: 0.065, hoverDuration: 2.4, hoverBloom: 0.18, hoverBloomSpeed: 1.8, minSize: 0.06, maxSize: 0.115, spread: 1.05 },
  { id: 'snow', name: 'Quiet snowfall', subtitle: 'A thousand fleeting impressions', color: '#b0d9ed', count: 70, duration: 10, hoverInterval: 0.045, hoverDuration: 2.6, hoverArrival: 0.18, hoverFallDistance: 0.08, minSize: 0.085, maxSize: 0.15, spread: 1.05 },
  {
    id: 'media', name: 'Horse workflow', subtitle: 'Motion revealed, frame by frame', color: '#d4c6a5', duration: 10,
    // type: 'gif' | 'video' | 'sequence'. Video should be a same-origin MP4/WebM.
    // Invert swaps the light and dark regions of the horse workflow mask.
    mask: { type: 'gif', src: '/images/Horses-workflow.gif', invert: true },
    // Optional second photo for the hidden areas. Defaults to another shuffled
    // photo in imagePool. Both photographs use independent cover cropping.
    // backgroundImage: '/images/another-photo.jpg',
    // Sequence alternative: { type: 'sequence', frames: ['/images/001.png', '/images/002.png'], fps: 24, invert: false }
    // Pin this card to specific pictures with: images: ['/images/my-photo.jpg']
  },
];

export function pickImages(previous = []) {
  const available = [...imagePool].sort(() => Math.random() - 0.5);
  return revealers.map((card, i) => {
    const pool = card.images?.length ? card.images : available;
    const alternatives = pool.filter((url) => url !== previous[i]);
    return card.images?.length
      ? (alternatives.length ? alternatives : pool)[Math.floor(Math.random() * (alternatives.length || pool.length))]
      : available[i % available.length];
  });
}

