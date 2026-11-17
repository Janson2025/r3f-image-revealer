import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import RevealCard from '../components/RevealCard';
import { revealers } from '../revealConfig';

export default function Scene(props) {
  const width = useThree((state) => state.size.width);
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.04);
    const previous = scene.environment;
    scene.environment = environment.texture;
    room.dispose(); generator.dispose();
    return () => { scene.environment = previous; environment.dispose(); };
  }, [gl, scene]);
  return (
    <group scale={width < 600 ? 0.78 : 1}>
      {revealers.map((config, index) => (
        <RevealCard key={config.id} {...props} config={config} index={index}
          imageUrl={props.images[index]} backgroundImageUrl={config.backgroundImage ?? props.images[(index + 1) % props.images.length]} angle={-props.active * Math.PI / 3} radius={3.5} />
      ))}
    </group>
  );
}
