import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './scene/scene';
import { pickImages, revealers } from './revealConfig';

export default function App() {
  const [active, setActive] = useState(0);
  const [images, setImages] = useState(pickImages);
  const [playing, setPlaying] = useState(true);
  const gallery = useRef(null);
  const [restart, setRestart] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [statuses, setStatuses] = useState({});
  const onStatus = useCallback((id, value) => setStatuses((previous) => ({ ...previous, [id]: value })), []);
  const move = useCallback((direction) => setActive((value) => value + direction), []);
  useEffect(() => {
    let accumulated = 0, lastMove = 0;
    const wheel = (event) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      if (performance.now() - lastMove < 380) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      accumulated += delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
      if (Math.abs(accumulated) > 45) { move(Math.sign(accumulated)); accumulated = 0; lastMove = performance.now(); }
    };
    const element = gallery.current;
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [move]);
  const selected = ((active % revealers.length) + revealers.length) % revealers.length;
  const card = revealers[selected];
  const select = useCallback((index) => setActive((current) => {
    const position = ((current % 6) + 6) % 6;
    let difference = index - position;
    if (difference > 3) difference -= 6;
    if (difference < -3) difference += 6;
    return current + difference;
  }), []);
  useEffect(() => {
    const handler = (event) => {
      if (['INPUT', 'SELECT', 'BUTTON'].includes(event.target.tagName)) return;
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
      if (event.code === 'Space') { event.preventDefault(); setPlaying((value) => !value); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [move]);
  return (
    <main className="studio" style={{ '--accent': card.color }}>
      <header className="topbar">
        <a className="brand" href="./"><span className="brand-mark">◌</span> UNFOLD<span className="brand-caption">/ motion experiments</span></a>
        <span className="edition">INTERACTIVE COLLECTION <span>001 — 006</span></span>
      </header>
      <section className="intro">
        <div className="eyebrow"><span /> THE ART OF REVEALING</div>
        <svg className="curved-intro" viewBox="0 0 1000 200" role="img" aria-labelledby="intro-title intro-description">
          <title id="intro-title">A glimpse. Then, a little more.</title>
          <desc id="intro-description">Six ways to let an image find its way into view. An exploration of nature, movement, and the space between.</desc>
          <defs>
            <path id="title-arc" d="M 55,165 Q 500,-35 945,165" />
            <path id="description-arc" d="M 80,190 Q 500,42 920,190" />
          </defs>
          <text className="arc-title"><textPath href="#title-arc" startOffset="50%" textAnchor="middle">A glimpse. <tspan fontStyle="italic">Then, a little more.</tspan></textPath></text>
          <text className="arc-description"><textPath href="#description-arc" startOffset="50%" textAnchor="middle">Six ways to let an image find its way into view. An exploration of nature, movement, and the space between.</textPath></text>
        </svg>
      </section>
      <section ref={gallery} className="gallery" aria-label="Image reveal carousel — scroll to explore" aria-roledescription="carousel">
        <div className="orbit-line" />
        <Canvas camera={{ position: [0, 0, 7.5], fov: 39 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
          <Suspense fallback={null}>
            <Scene active={active} images={images} playing={playing} restart={restart} speed={speed} onSelect={select} onStatus={onStatus} />
          </Suspense>
        </Canvas>
        <button className="arrow previous" onClick={() => move(-1)} aria-label="Previous revealer">←</button>
        <button className="arrow next" onClick={() => move(1)} aria-label="Next revealer">→</button>
        <div className="card-caption" aria-live="polite">
          <span className="card-number">0{selected + 1} / 06</span>
          <h2>{card.name}</h2><p>{card.subtitle}</p>
          {statuses[card.id] && <span className="status" role="status">{statuses[card.id]}</span>}
        </div>
      </section>
      <footer className="toolbar">
        <div className="playback"><button onClick={() => setPlaying(!playing)}>{playing ? 'Ⅱ Pause' : '▷ Play'}</button><button onClick={() => setRestart((value) => value + 1)}>↺ Replay</button><button onClick={() => setImages((previous) => pickImages(previous))}>⤨ Shuffle</button></div>
        <label className="speed">Tempo <select aria-label="Animation speed" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label>
      </footer>
      <div className="footnote"><span>MADE OF MOMENTS, REVEALED IN MOTION.</span><span>SCROLL OR ← → TO EXPLORE · HOVER TO REVEAL · SPACE TO PAUSE</span></div>
    </main>
  );
}
