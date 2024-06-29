import useStore from '../../store';
import styles from './HUD.module.css';
import { Html } from "@react-three/drei"

const HUD = () => {
  const tempo = useStore(state => state.tempo);
  return (
    <Html fullscreen visible wrapperClass={styles.hud}>
      <div className={styles.speed}>{tempo ?? 0}<div className={styles.bpm}>bpm</div></div>
    </Html>
  );
}

export default HUD;