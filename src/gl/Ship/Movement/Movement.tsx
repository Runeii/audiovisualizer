
import { Matrix4, Mesh, Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { clamp } from "three/src/math/MathUtils.js";
import { RefObject } from "react";
import { useSpring } from "@react-spring/three";
import { SHIP_HOVER_HEIGHT } from "../../constants";

const ROLL_STRENGTH = 1;
const ROLL_MAX = 0.5;
const UP = new Vector3(0, 1, 0);

type MovementProps = {
  currentSplinePosition: Vector3;
  currentSplineTangent: Vector3;
  shipRef: RefObject<Mesh>;
  upcomingSplineTangent: Vector3;
  upcomingSplinePosition: Vector3;
};

const Movement = ({
    currentSplinePosition,
    currentSplineTangent,
    shipRef,
    upcomingSplineTangent,
}: MovementProps) => {
  const [roll] = useSpring(() => ({
    roll: 0,
    config: { mass: 10 , tension: 500, friction: 100 }
  }), []);

  useFrame(() => {
    if (typeof shipRef === 'function' || !shipRef || !shipRef.current) {
      return;
    }

    // Calculate current turning direction
    const curvature = currentSplineTangent.angleTo(upcomingSplineTangent);

    const crossProduct = new Vector3().crossVectors(currentSplineTangent, upcomingSplineTangent);
    const direction = crossProduct.dot(UP) > 0 ? 1 : -1;

    roll.roll.start(clamp(curvature * ROLL_STRENGTH * direction, -ROLL_MAX, ROLL_MAX));

    // Set ship values
    shipRef.current.position.copy(currentSplinePosition);
    shipRef.current.position.y += SHIP_HOVER_HEIGHT;

    // Look at the next point
    const lookAtMatrix = new Matrix4();
    lookAtMatrix.lookAt(currentSplinePosition, currentSplinePosition.clone().add(currentSplineTangent), UP);

    // Apply roll
    const lookAtQuaternion = new Quaternion().setFromRotationMatrix(lookAtMatrix);
    const rollQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll.roll.get());
    lookAtQuaternion.multiply(rollQuaternion);

    // Ensure the ship rotates 180 degrees to face the right way
    const correctiveQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);
    lookAtQuaternion.multiply(correctiveQuaternion);
    shipRef.current.quaternion.copy(lookAtQuaternion);
  });

  return null;
};

export default Movement;