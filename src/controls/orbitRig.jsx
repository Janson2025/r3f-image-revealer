// controls/OrbitRig.jsx
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * OrbitRig
 * Centralizes OrbitControls configuration & constraints.
 *
 * Props:
 * - target: [x,y,z] to orbit around (default [0,0,0])
 * - azimuth: [minDeg, maxDeg] left/right sweep limits in degrees (e.g., [-35, 35])
 * - polar: [upDeg, downDeg] limits ABOVE/BELOW the equator (π/2), in degrees.
 *          Example [25, 10] = 25° above, 10° below the frontal equator.
 * - lockVertical: if true, keeps camera at the equator (no vertical tilt)
 * - minDistance, maxDistance: zoom limits
 * - enablePan: allow/disallow panning
 * - damping: dampingFactor for smooth motion
 * - rotateSpeed: rotation speed
 * - autoRotate, autoRotateSpeed: optional autorotation
 * - makeDefault: register as default controls for the canvas
 *
 * Advanced:
 * - follow: ref to an Object3D to smoothly retarget the controls each frame
 * - followLerp: 0..1 smoothing for follow targeting
 */
export default function OrbitRig({
  target = [0, 0, 0],

  azimuth = [-35, 35],
  polar = [25, 10],
  lockVertical = false,

  minDistance = 2.0,
  maxDistance = 6.0,

  enablePan = false,
  damping = 0.08,
  rotateSpeed = 0.85,

  autoRotate = false,
  autoRotateSpeed = 0.0,

  makeDefault = true,

  // Advanced: smooth-follow a moving object
  follow = null,          // React ref to an Object3D
  followLerp = 0.15,      // how quickly to lerp the target toward follow

  ...rest
}) {
  const controls = useRef(null);
  const tmp = new THREE.Vector3();

  // Convert degrees to radians for limits
  const R = THREE.MathUtils.degToRad;
  const [azMin, azMax] = [R(azimuth[0]), R(azimuth[1])];

  // Polar angles are clamped around the equator (π/2)
  const equator = Math.PI / 2;
  const minPolarAngle = lockVertical ? equator : equator - R(polar[0]); // up
  const maxPolarAngle = lockVertical ? equator : equator + R(polar[1]); // down

  // Follow a moving target smoothly (optional)
  useFrame(() => {
    if (!controls.current) return;

    // Keep the target fixed if not following a ref
    if (!follow?.current) {
      controls.current.target.set(target[0], target[1], target[2]);
      return;
    }

    // Smoothly lerp target to the followed object's world position
    follow.current.getWorldPosition(tmp);
    controls.current.target.lerp(tmp, THREE.MathUtils.clamp(followLerp, 0, 1));
    controls.current.update();
  });

  return (
    <OrbitControls
      ref={controls}
      // base target (overridden per-frame if "follow" is set)
      target={target}

      // feel
      enableDamping
      dampingFactor={damping}
      rotateSpeed={rotateSpeed}
      enablePan={enablePan}

      // zoom limits
      minDistance={minDistance}
      maxDistance={maxDistance}

      // orbit limits
      minAzimuthAngle={azMin}
      maxAzimuthAngle={azMax}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}

      // optional autorotation
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}

      // register with R3F so <useThree((s)=>s.controls)> works
      makeDefault={makeDefault}

      {...rest}
    />
  );
}
