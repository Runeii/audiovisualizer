import { useMemo } from 'react';
import useStore from '../../store';
import styles from './HUD.module.css';
import { Html } from "@react-three/drei"
import { NUMBER_OF_PLAYERS } from '../constants';

const HUD = () => {
  const loudness = useStore(state => state.loudness);
  const tempo = useStore(state => state.tempo);

  const positions = useMemo(() => {
    // 24 bands of loudness 
    const bandsPerPlayer = Math.round(24 / NUMBER_OF_PLAYERS);

    return [...new Array(NUMBER_OF_PLAYERS)].map((_, index) => {
      const startOfThisPlayerBands = (bandsPerPlayer * index);
      const currentLoudnessOfPlayer = loudness.slice(startOfThisPlayerBands, startOfThisPlayerBands + bandsPerPlayer).reduce((acc, val) => acc + val, 0) / (bandsPerPlayer / 2);

      return (
        <div key={index} className={styles.row}>
          Ship {index + 1}: {Number(currentLoudnessOfPlayer).toFixed(2)}
        </div>
      )
    })
  }, [loudness]);

  return (
    <Html fullscreen visible wrapperClass={styles.hud}>
      <div className={styles.positions}>{positions}</div>
      <div className={styles.speed}>{tempo ?? 0}<div className={styles.bpm}>bpm</div></div>
    </Html>
  );
}

export default HUD;