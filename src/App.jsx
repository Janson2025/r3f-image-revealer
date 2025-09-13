// App.jsx
import { Canvas } from "@react-three/fiber";
import Scene from "./scene/scene";

export default function App() {
  return (
    <Canvas shadows camera={{ position: [3, 3, 3], fov: 50 }}>
      <Scene />
    </Canvas>
  );
}
