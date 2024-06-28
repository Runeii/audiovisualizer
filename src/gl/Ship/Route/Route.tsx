
import { useSpring } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useRef } from "react";
import { Vector3 } from "three";
import HermiteCurve3 from "../../../phobos/utils/HermiteCurve3";

const LOOKAHEAD_DISTANCE = 0.004;

type RouteProps = {
  isPlayer: boolean;
  splineRef: MutableRefObject<HermiteCurve3>;
  speedBoostLastTouched: number;
  speed: number;
  setCurrentSplinePosition: (position: Vector3) => void;
  setCurrentSplineTangent: (tangent: Vector3) => void;
  setUpcomingSplineTangent: (tangent: Vector3) => void;
  setNormalizedCurrentSplineTangent: (tangent: Vector3) => void;
};

const Route = ({
  isPlayer,
  splineRef,
  speedBoostLastTouched,
  speed,
  setCurrentSplinePosition,
  setCurrentSplineTangent,
  setUpcomingSplineTangent,
  setNormalizedCurrentSplineTangent,
}: RouteProps) => {
  const currentProgress = useRef<number>(0);

  const [{speedBoostMultiplier}, speedApi] = useSpring(() => ({
    speedBoostMultiplier: 1,
  }), []);

  useFrame(() => {
    if (!splineRef || !splineRef.current ) {
      return;
    }
  
    const spline = splineRef.current;

    const BASE_MOVEMENT = 0.00008;
    //currentProgress.current += STEPS * 10;
    const isSpeedBoostActive = Date.now() - speedBoostLastTouched < 2000; 

    const currentSpeedBoostMultiplier = speedBoostMultiplier.get()
    if (isSpeedBoostActive && currentSpeedBoostMultiplier === 1) {
      speedApi.start({
        speedBoostMultiplier: 2,
        config: { mass: 1, tension: 1000, friction: 20 }
      });
    }
    if (!isSpeedBoostActive && currentSpeedBoostMultiplier === 3) {
      speedApi.start({
        speedBoostMultiplier: 1,
        config: { mass: 5, tension: 150, friction: 50, clamp: true}
      });
    }
    let progressChange = speed * BASE_MOVEMENT * currentSpeedBoostMultiplier;

    if (!isPlayer) {
      progressChange *= (Math.random() + 0.5);
    }

    currentProgress.current += progressChange;
    currentProgress.current %= 1;

    const currentSplineTangent = spline.getTangentAt(currentProgress.current).clone()
    setCurrentSplinePosition(spline.getPointAt(currentProgress.current).clone());
    setCurrentSplineTangent(currentSplineTangent);

    const nextProgress = (currentProgress.current + LOOKAHEAD_DISTANCE) % 1;
    setUpcomingSplineTangent(spline.getTangentAt(nextProgress).clone());
    setNormalizedCurrentSplineTangent(currentSplineTangent.clone().normalize());
  })

  return null;
};

export default Route;