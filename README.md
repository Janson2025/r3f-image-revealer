# Unfold · Image reveal studies

A React Three Fiber circular carousel with six animated image masks: orbital circles, falling leaves, windblown leaves, blooming flowers, snowflakes, and an animated horse workflow GIF.

## Run

```sh
npm install
npm run dev
npm run build
```

## Choose images and settings

Edit `src/revealConfig.js`. `imagePool` is the shared photo pool; six different images are randomly assigned on launch. Shuffle images reassigns them. Add photos to `public/images` and use paths such as `/images/forest.jpg` for offline/local images. The included remote Unsplash photos require internet access.

Each revealer accepts `count` (particle count), `duration` (seconds per lifecycle), and an optional `images` array to restrict that card's random choices. Use a one-item array to pin a photograph. Images use centered cover cropping without distortion.

Falling leaves start small, follow irregular semicircular paths, spin, grow, settle, hold still, and fade. Flowers grow from tight buds into seven spreading petals, hold, and fade. Snowflakes drift down, settle, and fade. Windblown leaves are opaque cover shapes: they tumble away to uncover the fixed photograph, and are replaced individually. Animations loop and start with staggered particle ages.

## Media masks

The Horse workflow card uses `public/images/Horses-workflow.gif`. GIF frames are decoded with gifuct-js, including frame delays, transparency, and disposal. Grayscale luminance drives the mask; normally white reveals and black hides. `invert: true` reverses this. The card uses the supplied Horses-workflow.gif; inversion is enabled by default. For a clean silhouette, replace it with a black-background/white-subject animation and set invert to false.

Replace the card's `mask` setting with one of:

```js
{ type: 'gif', src: '/images/Horses-workflow.gif', invert: true }
{ type: 'video', src: '/images/mask.webm', invert: false }
{ type: 'sequence', frames: ['/images/001.png', '/images/002.png'], fps: 24, invert: false }
```

Prefer same-origin media in `public/images`; remote media needs CORS permission. Video masks are silent and sampled to the shared animation clock, so pause, replay, and tempo controls apply. GIFs and image sequences are predecoded in memory: use modest dimensions/frame counts. Media masks currently stretch to the portrait card; author portrait masks for precise proportions.

## Controls

Click a side card, use the arrow buttons, or scroll over the gallery. The active effect is identified by its title. Left/right arrows navigate; space pauses. Replay restarts the animation clocks. Tempo changes playback speed. Animations play by default; press Pause or space to stop.

## Implementation

`src/components/materials/mask/particleMask.js` draws procedural masks into small canvases. `mediaMask.js` supplies GIF, video, and sequence frames. `RevealCard.jsx` uploads masks as CanvasTextures and combines them with photographs in a Three.js shader. The carousel stays in a single WebGL canvas. The original Card and circle-shader components remain available for reuse.

Both leaf effects use the transparent silhouette of `public/images/dark_leaf1.png`. Change `leafImage` on either card in `src/revealConfig.js` to use a different PNG. Alpha defines the silhouette, so dark artwork works without dimming the reveal; original proportions and animation timing are preserved.

## Hover and carousel interaction

Animations play on launch. Scroll the mouse wheel or trackpad over the gallery to rotate the carousel. The active card grows larger than its neighbors. The title and description follow an arch above the front card.

Hover Orbital circles to smoothly accelerate rotation to 5.5x and grow the circles to 2.5x. Its 80 apertures use small sizes, variable opacity, and a central orbital field. Hover Autumn descent or Quiet snowfall to add falling particles that settle near the pointer. Hover In full bloom to plant extra flowers at the pointer; petals unfurl farther and grow wider. These three effects have denser central clusters. Carried away keeps most cover leaves stationary, continuously blows away a staggered minority and replaces them, and blows away nearby leaves on hover.

Particle size ranges (`minSize`, `maxSize`), `count`, `spread`, `duration`, and `hoverInterval` can be adjusted per card in `src/revealConfig.js`. Circle controls include `minDistanceRatio`, `maxDistanceRatio`, `distanceExponent`, `fastSpeedMul`, and `hoverSizeMul`. Hidden image areas are a reflective physical metal material with roughness 0.18 (override with a card's `roughness`), illuminated by a locally generated room environment. A slight cursor-driven tilt moves the reflections.

Hover response is configurable per card: hoverInterval controls emission, hoverDuration controls the cursor particle lifecycle, hoverArrival and hoverFallDistance control leaf/snow landing, and hoverBloom / hoverBloomSpeed control flower opening. Cursor leaves and snow now land in about half a second. All image frames use dull dark gold (borderColor defaults to #75613a).

The layout fits the viewport with controls on one row (Pause, Replay, Shuffle, and Tempo). Distant carousel cards fade into shadow. Horse workflow uses complementary image masks: the main photo appears in revealed regions and a different photo fills hidden regions. Set backgroundImage on the media card to pin that second photo; otherwise another image from the shuffled pool is used. Both images preserve their proportions with independent cover cropping. Flower sizes have been reduced slightly.
