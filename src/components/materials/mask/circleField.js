// components/materials/mask/circleField.js
import * as THREE from "three";

export const MAX_CIRCLES = 128;

/**
 * Build typed arrays for the circle field (fixed-length, GLSL-friendly).
 * Returns { baseAngles, distances, sizes, speeds, opacities, count }.
 */
export function generateCircleField(count, cfg) {
  const n = Math.min(count, MAX_CIRCLES);

  const baseAngles = new Float32Array(MAX_CIRCLES);
  const distances  = new Float32Array(MAX_CIRCLES);
  const sizes      = new Float32Array(MAX_CIRCLES);
  const speeds     = new Float32Array(MAX_CIRCLES);
  const opacities  = new Float32Array(MAX_CIRCLES);

  for (let i = 0; i < n; i++) {
    const t = Math.pow(Math.random(), cfg.distanceExponent);
    const d = cfg.minDistanceRatio + t * (cfg.maxDistanceRatio - cfg.minDistanceRatio);

    baseAngles[i] = Math.random() * Math.PI * 2.0;
    distances[i]  = d; // 0..1
    sizes[i]      = THREE.MathUtils.lerp(cfg.minSize, cfg.maxSize, 1 - d); // bigger near center
    speeds[i]     = THREE.MathUtils.lerp(cfg.slowSpeedMin, cfg.slowSpeedMax, Math.random());
    opacities[i]  = THREE.MathUtils.lerp(cfg.minOpacity, cfg.maxOpacity, Math.random());
  }

  return { baseAngles, distances, sizes, speeds, opacities, count: n };
}
