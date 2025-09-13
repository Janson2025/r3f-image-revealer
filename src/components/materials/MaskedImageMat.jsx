// components/materials/MaskedImageMat.jsx
import * as THREE from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MAX_CIRCLES, generateCircleField } from "./mask/circleField";
import { basicUVVertexShader, makeMaskedImageFragmentShader } from "./mask/shaders";

export default function MaskedImageMat({
  imageUrl,
  hovered = false,
  aspect = 1,
  
  numCircles = 80,
  minSize = 0.02,
  maxSize = 0.08,
  minOpacity = 0.2,
  maxOpacity = 0.8,
  slowSpeedMin = 0.0001,
  slowSpeedMax = -0.0001,
  fastSpeedMul = 5.5,
  hoverSizeMul = 2.5,
  speedLerp = 0.05,
  sizeLerp = 0.05,
  hoverOpacityMul = 1.1,
  opacityLerp = 0.05,
  minDistanceRatio = 0.01,
  maxDistanceRatio = 0.7,
  distanceExponent = 0.7,
  edgeFeather = 0.008,
  ...matProps
}) {
  // ✅ Fallback URL to avoid "Could not load undefined"
  const fallbackUrl =
    "https://images.unsplash.com/photo-1591608971376-46e64aa7fd19?q=80&w=1024&auto=format&fit=crop&ixlib=rb-4.0.3";
  const safeUrl = imageUrl ?? fallbackUrl;

  // texture
  const tex = useLoader(THREE.TextureLoader, safeUrl);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
  }, [tex]);

  // circle params
  const cfg = useMemo(
    () => ({
      minSize, maxSize, minOpacity, maxOpacity,
      slowSpeedMin, slowSpeedMax, minDistanceRatio, maxDistanceRatio, distanceExponent,
    }),
    [minSize, maxSize, minOpacity, maxOpacity, slowSpeedMin, slowSpeedMax, minDistanceRatio, maxDistanceRatio, distanceExponent]
  );
  const field = useMemo(() => generateCircleField(numCircles, cfg), [numCircles, cfg]);

  // uniforms
  const uniforms = useMemo(
    () => ({
      uMap: { value: tex },
      uTime: { value: 0 },
      uSpeedMul: { value: 1 },
      uSpeedMul: { value: 1 },
      uSizeMul: { value: 1 },
      upacityMul: { value: 1 },
      upacityCap: { value: hoverOpacityMul }, 
      uAspect: { value: aspect },   // h/w
      uEdge: { value: edgeFeather },
      uNum: { value: field.count },
      uBaseAngles: { value: field.baseAngles },
      uDistances: { value: field.distances },
      uSizes: { value: field.sizes },
      uSpeeds: { value: field.speeds },
      uOpacities: { value: field.opacities },
    }),
    [tex, aspect, edgeFeather, field, hoverOpacityMul]
  );

  // animate
  const cur = useRef({ speed: 1, size: 1, opacity: 1 });
  useFrame((_, dt) => {
    const tSpeed = hovered ? fastSpeedMul : 1;
    const tSize = hovered ? hoverSizeMul : 1;
    const tOpacity = hovered ? hoverOpacityMul : 1;
    cur.current.speed += (tSpeed - cur.current.speed) * speedLerp;
    cur.current.size += (tSize - cur.current.size) * sizeLerp;
    cur.current.opacity += (tOpacity - cur.current.opacity) * opacityLerp;

    uniforms.uTime.value += dt * 1000.0 * cur.current.speed;
    uniforms.uSpeedMul.value = 1.0;

    uniforms.uSizeMul.value = cur.current.size;
    uniforms.upacityMul.value = cur.current.opacity;
    uniforms.uAspect.value = aspect;
    uniforms.uEdge.value = edgeFeather;
  });

  // material
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: basicUVVertexShader,
        fragmentShader: makeMaskedImageFragmentShader(MAX_CIRCLES), // includes the aspect fix
        transparent: true,
        depthWrite: false,
      }),
    [] // uniforms are mutated via refs
  );

  return <primitive object={material} attach="material" {...matProps} />;
}
