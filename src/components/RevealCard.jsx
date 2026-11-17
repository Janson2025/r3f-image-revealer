import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createParticles, paintParticles, updateInteraction } from './materials/mask/particleMask';
import { loadMediaMask } from './materials/mask/mediaMask';
import { loadLeafSprite } from './materials/mask/leafSprite';

const vertexShader = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const fragmentShader = `
uniform sampler2D uImage;
uniform sampler2D uMask;
uniform sampler2D uBackground;
uniform vec2 uCover;
uniform vec2 uBackgroundCover;
uniform float uInvert;
uniform float uDualImage;
varying vec2 vUv;
void main() {
  vec4 mask = texture2D(uMask, vUv);
  float reveal = dot(mask.rgb, vec3(.2126, .7152, .0722));
  reveal = mix(reveal, 1. - reveal, uInvert);
  vec3 image = texture2D(uImage, (vUv - .5) * uCover + .5).rgb;
  vec3 background = texture2D(uBackground, (vUv - .5) * uBackgroundCover + .5).rgb;
  gl_FragColor = vec4(mix(image, mix(background, image, reveal), uDualImage), mix(reveal, 1., uDualImage));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export default function RevealCard({ config, imageUrl, backgroundImageUrl, index, angle, radius, playing, restart, speed, onSelect, onStatus }) {
  const group = useRef();
  const shadow = useRef();
  const time = useRef(0);
  const media = useRef(null);
  const leafSprite = useRef(null);
  const pointer = useRef({ hovered: false, x: 0.5, y: 0.5 });
  const bursts = useRef([]);
  const motion = useRef({ orbitTime: 0, speedMul: 1, sizeMul: 1, lastSpawn: -1, seed: 1234 + index });
  const [image, setImage] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const resources = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 512;
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const placeholder = new THREE.DataTexture(new Uint8Array([36, 48, 42, 255]), 1, 1);
    placeholder.needsUpdate = true;
    return { canvas, ctx: canvas.getContext('2d'), texture, placeholder };
  }, []);
  const particles = useMemo(() => createParticles(config.count || 40, index * 937 + 17, config), [config, index]);
  const uniforms = useMemo(() => ({
    uImage: { value: resources.placeholder }, uMask: { value: resources.texture },
    uCover: { value: new THREE.Vector2(1, 1) }, uInvert: { value: 0 }, uDualImage: { value: config.mask ? 1 : 0 },
    uBackground: { value: resources.placeholder }, uBackgroundCover: { value: new THREE.Vector2(1, 1) },
  }), [resources]);

  useEffect(() => {
    let active = true;
    let loaded;
    onStatus(config.id, 'Loading image…');
    new THREE.TextureLoader().load(imageUrl, (texture) => {
      loaded = texture;
      if (!active) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      setImage(texture); onStatus(config.id, '');
    }, undefined, () => { if (active) onStatus(config.id, 'Image unavailable — choose another image in revealConfig.js'); });
    return () => { active = false; loaded?.dispose(); };
  }, [imageUrl, config.id, onStatus]);
  useEffect(() => {
    if (!config.mask) return;
    let active = true, loaded;
    new THREE.TextureLoader().load(backgroundImageUrl, (texture) => {
      loaded = texture;
      if (!active) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      setBackgroundImage(texture);
    }, undefined, () => { if (active) onStatus(config.id, 'Background image unavailable — check backgroundImage in revealConfig.js'); });
    return () => { active = false; loaded?.dispose(); };
  }, [backgroundImageUrl, config, onStatus]);
  useEffect(() => {
    if (!config.mask) return;
    const controller = new AbortController();
    let active = true;
    loadMediaMask(config.mask, controller.signal).then((loaded) => {
      if (!active) { loaded.dispose(); return; }
      media.current = loaded;
    }).catch((error) => { if (active && error.name !== 'AbortError') onStatus(config.id, `Mask unavailable: ${error.message}`); });
    return () => { active = false; controller.abort(); media.current?.dispose(); media.current = null; };
  }, [config, onStatus]);
  useEffect(() => {
    if (!config.leafImage) return;
    const controller = new AbortController();
    let active = true;
    loadLeafSprite(config.leafImage, controller.signal).then((sprite) => {
      if (active) leafSprite.current = sprite;
    }).catch((error) => {
      if (active && error.name !== 'AbortError') onStatus(config.id, `Leaf unavailable: ${error.message}`);
    });
    return () => { active = false; controller.abort(); leafSprite.current = null; };
  }, [config.leafImage, config.id, onStatus]);
  useEffect(() => {
    time.current = 0; bursts.current = [];
    Object.assign(motion.current, { orbitTime: 0, speedMul: 1, sizeMul: 1, lastSpawn: -1 });
    delete motion.current.lastBloomTime;
    particles.forEach((p) => { delete p.blownAt; delete p.bloomCycle; delete p.bloomBoost; });
  }, [restart, particles]);
  useEffect(() => () => { resources.texture.dispose(); resources.placeholder.dispose(); }, [resources]);

  useFrame((_, dt) => {
    const target = angle + index * Math.PI / 3;
    const position = new THREE.Vector3(Math.sin(target) * radius, 0, Math.cos(target) * radius - radius);
    group.current.position.lerp(position, 1 - Math.exp(-dt * 7));
    shadow.current.opacity = 1 - Math.exp(Math.min(0, group.current.position.z) * 0.28);
    const rotation = Math.atan2(Math.sin(target), Math.cos(target));
    const tilt = pointer.current.hovered ? 1 : 0;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, rotation * 0.48 + (pointer.current.x - 0.5) * 0.12 * tilt, 7, dt);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, (pointer.current.y - 0.5) * 0.10 * tilt, 7, dt);
    const front = Math.pow(Math.max(0, Math.cos(target)), 8);
    const scale = 0.85 + front * 0.55;
    group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 1 - Math.exp(-dt * 7));
    if (front < 0.3) pointer.current.hovered = false;
    if (playing) {
      const delta = Math.min(dt, 0.1) * speed;
      time.current += delta;
      const current = motion.current;
      const hovered = pointer.current.hovered;
      current.speedMul = THREE.MathUtils.damp(current.speedMul, hovered ? (config.fastSpeedMul ?? 5.5) : 1, 1.5, dt);
      current.sizeMul = THREE.MathUtils.damp(current.sizeMul, hovered ? (config.hoverSizeMul ?? 2.5) : 1, 3, dt);
      current.orbitTime += delta * current.speedMul;
      updateInteraction(particles, bursts.current, pointer.current, config, time.current, current);
    }
    const { ctx, canvas, texture } = resources;
    if (config.mask) {
      ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      media.current?.draw(ctx, time.current);
    } else paintParticles(ctx, bursts.current.length ? [...particles, ...bursts.current] : particles, config, time.current, leafSprite.current, motion.current);
    texture.needsUpdate = true;
    uniforms.uImage.value = image || resources.placeholder;
    if (image) {
      const imageAspect = image.image.width / image.image.height;
      const cardAspect = 3 / 4;
      uniforms.uCover.value.set(Math.min(1, cardAspect / imageAspect), Math.min(1, imageAspect / cardAspect));
    }
    uniforms.uInvert.value = config.mask?.invert ? 1 : 0;
    uniforms.uBackground.value = backgroundImage || resources.placeholder;
    if (backgroundImage) {
      const ratio = backgroundImage.image.width / backgroundImage.image.height;
      uniforms.uBackgroundCover.value.set(Math.min(1, 0.75 / ratio), Math.min(1, ratio / 0.75));
    }
  });
  return (
    <group ref={group} position={[Math.sin(index * Math.PI / 3) * radius, 0, Math.cos(index * Math.PI / 3) * radius - radius]}>
      <mesh position={[0, 0, -0.035]}>
        <boxGeometry args={[2.52, 3.34, 0.06]} /><meshStandardMaterial color={config.borderColor ?? '#75613a'} metalness={0.6} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[2.46, 3.28]} />
        <meshPhysicalMaterial color="#59645f" metalness={0.96} roughness={config.roughness ?? 0.18} clearcoat={1} clearcoatRoughness={0.12} envMapIntensity={2.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh onClick={(event) => { event.stopPropagation(); onSelect(index); }}
        onPointerMove={(event) => {
          event.stopPropagation();
          if (event.uv) Object.assign(pointer.current, { hovered: true, x: event.uv.x, y: 1 - event.uv.y });
        }}
        onPointerOver={(event) => { event.stopPropagation(); pointer.current.hovered = true; document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { pointer.current.hovered = false; document.body.style.cursor = ''; }}>
        <planeGeometry args={[2.46, 3.28]} />
        <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} side={THREE.DoubleSide} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.003]} raycast={() => null}>
        <planeGeometry args={[2.52, 3.34]} />
        <meshBasicMaterial ref={shadow} color="black" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
