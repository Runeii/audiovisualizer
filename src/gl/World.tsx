import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei';
import useStore from '../store';
import Scene from './Scene';
import { PerspectiveCamera } from 'three';

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
      <ambientLight intensity={10} />

      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <Text
        color="white"
        anchorX="center"
        anchorY="middle"
        fontSize={3}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        textAlign="center"
      >
        {tempo}
      </Text>
    </Canvas>
  );
}

export default World;