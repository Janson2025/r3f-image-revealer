// scene/Scene.jsx
import { Environment } from "@react-three/drei";
import OrbitRig from "../controls/orbitRig.jsx";
import Card from "../components/Card.jsx";
import MaskedImageMat from "../components/materials/MaskedImageMat.jsx";

export default function Scene() {
  const url =
    "https://images.unsplash.com/photo-1591608971376-46e64aa7fd19?q=80&w=2043&auto=format&fit=crop&ixlib=rb-4.0.3";

  return (
    <>
      <color attach="background" args={["#111222"]} />
      <ambientLight intensity={0.6} />
      <Environment preset="sunset" />
      <directionalLight position={[3, 5, 2]} intensity={0.9} />

      <OrbitRig
        target={[0, 0, 0]}
        azimuth={[20, 105]}  // clamp left/right sweep (degrees)
        polar={[25, 10]}    // 25° above, 10° below equator
        // lockVertical   // uncomment to force level view (no vertical tilt)
        minDistance={2.0}
        maxDistance={6.0}
        damping={0.08}
        rotateSpeed={0.85}
        enablePan={false}
        // autoRotate
        // autoRotateSpeed={0.6}
      />

      <Card
        position={[0, 0, 0]}
        rotation-y={1.10}
        rotation-x={-0.5}
        rotation-z={0.4}
        width={2.5}
        height={3.5}
        depth={0.01}
        cornerRadius={0.2}
        bodyColor="#D4D4D4"
        edgeColor="#d9d9d9"
        imageMargin={0.08}
        frontImageUrl={url}
        frontMaterial={
          <MaskedImageMat
            imageUrl={url}
            numCircles={80}
            minSize={0.01}
            maxSize={0.10}
            minOpacity={0.01}
            maxOpacity={1.0}
            slowSpeedMin={0.0001}
            slowSpeedMax={-0.0001}
            fastSpeedMul={5.5}
            hoverSizeMul={2.5}
            speedLerp={0.025}
            sizeLerp={0.05}
            minDistanceRatio={0.05}
            maxDistanceRatio={0.85}
            distanceExponent={0.7}
          />
        }
      />
    </>
  );
}
