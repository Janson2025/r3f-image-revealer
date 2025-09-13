// components/materials/ImageMat.jsx
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useMemo, cloneElement } from "react";

/**
 * ImageMat: material-only component.
 * Usage: <ImageMat imageUrl="..." />
 * You can also pass children to replace the default MeshStandardMaterial,
 * e.g. <ImageMat>{<meshBasicMaterial />}</ImageMat>
 */
export default function ImageMat({
  imageUrl = "https://images.unsplash.com/photo-1591608971376-46e64aa7fd19?q=80&w=2043&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //imageUrl = "https://picsum.photos/200/140?random=1",
  
  anisotropy = 8,
  /** Optional child material to receive the map (defaults to meshStandardMaterial) */
  children,
  ...matProps
}) {
  const tex = useLoader(THREE.TextureLoader, imageUrl);

  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = anisotropy;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
  }, [tex, anisotropy]);

  // Default material
  const fallback = <meshStandardMaterial />;

  // Inject the texture map into whichever material element we render.
  return cloneElement(children ?? fallback, { map: tex, ...matProps });
}
