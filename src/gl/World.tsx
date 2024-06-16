import { Canvas } from '@react-three/fiber'
import { Text } from '@react-three/drei';
import useStore from '../store';

const World = () => {
  const tempo = useStore(state => state.tempo);
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
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