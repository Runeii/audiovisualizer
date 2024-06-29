import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei';
import useStore from '../store';
import Scene from './Scene';
import Debug from './Debug/Debug';
import HUD from './HUD/HUD';
import styles from './World.module.css';
import { useEffect, useState } from 'react';
const World = () => {
  const tempo = useStore(state => state.tempo);
  
  const [isWorldVisible, setIsWorldVisible] = useState(false);
  const [hasMountedScene, setHasMountedScene] = useState(false);

  const hasAudio = tempo > 0;

  useEffect(() => {
    if (!hasAudio) {
      return;
    }
    setIsWorldVisible(true);
  
    return () => {
      setIsWorldVisible(false);
    }
  }, [hasAudio]);

  const [isFadedOut, setIsFadedOut] = useState(false);
  useEffect(() => {
    if (isWorldVisible) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIsFadedOut(true);
    }, 1000);
  
    return () => {
      window.clearTimeout(timer);
      setIsFadedOut(false);
    }
  }, [isWorldVisible]);

  return (
    <Canvas
      camera={{
        position: [0, 10000, 50000],
        rotation: [0, 0, 0],
        fov: 45,
        near: 64,
        far: 2048576,
      }}
      className={`${styles.world} ${isWorldVisible && hasMountedScene ? styles.isVisible : ''}`}
    >
      <Scene
        isWorldVisible={isWorldVisible || !isFadedOut}
        hasMountedScene={hasMountedScene}
        setHasMountedScene={setHasMountedScene}
      />
      <OrbitControls />
      <HUD />
      <Debug />
    </Canvas>
  );
}

export default World;