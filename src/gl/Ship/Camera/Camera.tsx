
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

const CAMERA_VERTICAL_OFFSET = new Vector3(0, 350, 0);
const CAMERA_BEHIND_OFFSET = 2000;

type CameraProps = {
  currentSplinePosition: Vector3;
  normalizedCurrentSplineTangent: Vector3;
};

const Camera = ({
  currentSplinePosition,
  normalizedCurrentSplineTangent,
}: CameraProps) => {
  useFrame(({ camera }) => {
    const scaledTangent = normalizedCurrentSplineTangent.multiplyScalar(CAMERA_BEHIND_OFFSET);
    const pointBehind = currentSplinePosition.clone().sub(scaledTangent).add(CAMERA_VERTICAL_OFFSET);
  
   camera.position.copy(pointBehind);

   camera.lookAt(currentSplinePosition);
  });

  return null;
};

export default Camera;