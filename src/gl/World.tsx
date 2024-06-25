import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei';
import useStore from '../store';
import Scene from './Scene';

const World = () => {
  const tempo = useStore(state => state.tempo);

  return (
    <Canvas camera={{
      position: [0, 10000, 50000],
      rotation: [0, 0, 0],
      fov: 45,
      near: 64,
      far: 2048576,
    }}>
      <Scene />
      <OrbitControls />


      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </Canvas>
  );
}

export default World;