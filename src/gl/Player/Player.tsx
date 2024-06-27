import { Mesh, Vector3 } from "three";
import HermiteCurve3 from "../../phobos/utils/HermiteCurve3";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import useStore from "../../store";

const TARGET_SPEED = 10;
const CAMERA_VERTICAL_OFFSET = new Vector3(0, 350, 0);
const CAMERA_BEHIND_OFFSET = 2000;

const Player = ({ mesh, spline }: {mesh?: Mesh, spline?: HermiteCurve3}) => {
  const speed = useStore(state => state.speed);
  const tempo = useStore(state => state.tempo);

  const shipRef = useRef<Mesh>();
  const currentProgress = useRef<number>(0);

  useFrame(({ camera }) => {
    if (!shipRef.current || !spline ) {
      return;
    }

    //currentProgress.current += STEPS * 10;
    currentProgress.current += 0.0002;
    currentProgress.current %= 1;

    const position = spline.getPointAt(currentProgress.current);
    // They're flying ships!
    position.y += 100;
    const tangent = spline.getTangentAt(currentProgress.current).normalize();
  
    shipRef.current.position.copy(position);
    shipRef.current.lookAt(position.clone().add(tangent));

    const normalizedTangent = tangent.clone().normalize();
    const scaledTangent = normalizedTangent.multiplyScalar(CAMERA_BEHIND_OFFSET);
    const pointBehind = position.clone().sub(scaledTangent).add(CAMERA_VERTICAL_OFFSET);

    camera.position.copy(pointBehind);
    camera.lookAt(position);
  });


  if (!mesh) {
    return null;
  }

  return <primitive object={mesh} ref={shipRef}  />
}

export default Player;