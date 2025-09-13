// components/Card.jsx
import * as THREE from "three";
import { useMemo, useState, cloneElement, isValidElement } from "react";
import { useLoader } from "@react-three/fiber";

function createRoundedRectShape(width, height, radius) {
  const s = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, Math.min(width, height) / 2);

  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + height - r);
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  s.lineTo(x + r, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export default function Card({
  // Card body
  width = 2.5,
  height = 3.5,
  depth = 0.005,
  cornerRadius = 0.2,
  bodyColor = "#D4D4D4",
  edgeColor = "#d9d9d9",

  // Front image plane (material-only slot + sizing)
  frontMaterial = null,
  frontImageUrl = "https://images.unsplash.com/photo-1591608971376-46e64aa7fd19?q=80&w=1024&auto=format&fit=crop&ixlib=rb-4.0.3",
  imageMargin = 0.08, // margin on left/right (and effectively top/bottom via aspect)
  // reserved for future modes: "width" | "height" | "contain" | "cover"
  fitMode = "width",

  // Optional back image plane
  backMaterial = null,
  backImageUrl = null,
  backImageMargin = 0.08,

  // Z offsets to avoid z-fighting with the card body
  imageZOffset = 0.0015,
  backImageZOffset = 0.0015,

  ...groupProps
}) {
  const [hovered, setHovered] = useState(false);

  // --- Geometry for the card body (flat faces, rounded corners only)
  const shape = useMemo(
    () => createRoundedRectShape(width, height, cornerRadius),
    [width, height, cornerRadius]
  );
  const extrudeSettings = useMemo(
    () => ({ depth, bevelEnabled: false }),
    [depth]
  );

  // --- Safe URLs for textures (keep hooks unconditional)
  const FALLBACK =
    "https://images.unsplash.com/photo-1591608971376-46e64aa7fd19?q=80&w=1024&auto=format&fit=crop&ixlib=rb-4.0.3";
  const frontUrl = frontImageUrl ?? FALLBACK;
  const backUrl = backImageUrl ?? frontUrl;

  // --- Load textures to measure aspect (useLoader re-renders on load)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl);
  const backTex = useLoader(THREE.TextureLoader, backUrl);

  const frontAspect = frontTex?.image
    ? frontTex.image.height / frontTex.image.width
    : 1;

  const backAspect = backTex?.image
    ? backTex.image.height / backTex.image.width
    : frontAspect;

  // --- Compute front image plane size: fit WIDTH (no stretch), auto HEIGHT by aspect
  const frontImageWidth = Math.max(0, width - imageMargin * 2);
  const frontImageHeight = frontImageWidth * frontAspect;
  const planeAspect = frontImageHeight / frontImageWidth; // h/w, for mask shader

  // --- Optional back image plane size (also fit width)
  const backImageWidth = Math.max(0, width - backImageMargin * 2);
  const backImageHeight = backImageWidth * backAspect;

  return (
    <group {...groupProps}>
      {/* Card body centered around z=0 (so front plane can sit in front cleanly) */}
      <mesh castShadow receiveShadow position={[0, 0, -depth / 2]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.0} />
      </mesh>

      {/* Subtle rim/back tint using BackSide */}
      <mesh castShadow receiveShadow position={[0, 0, -depth / 2]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={edgeColor}
          flatShading
          roughness={0.0}
          metalness={0.7}
          emissive={"#ff0000"}
          emissiveIntensity={0.2}
          fog={true}

        />
      </mesh>

      {/* Front image plane */}
      {isValidElement(frontMaterial) && (
        <mesh
          castShadow
          receiveShadow
          position={[0, 0, depth / 2 + imageZOffset]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <planeGeometry args={[frontImageWidth, frontImageHeight]} />
          {cloneElement(frontMaterial, {
            side: THREE.DoubleSide,
            hovered,                 // for animated mask materials
            aspect: planeAspect,     // keep circles round (h/w)
            imageUrl: frontMaterial.props?.imageUrl ?? frontUrl, // ensure defined
          })}
        </mesh>
      )}

      {/* Back image plane (optional) */}
      {isValidElement(backMaterial) && (
        <mesh
          castShadow
          receiveShadow
          position={[0, 0, -depth / 2 - backImageZOffset]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[backImageWidth, backImageHeight]} />
          {cloneElement(backMaterial, {
            side: THREE.DoubleSide,
            aspect: backImageHeight / backImageWidth,
            imageUrl: backMaterial.props?.imageUrl ?? backUrl,
          })}
        </mesh>
      )}
    </group>
  );
}
