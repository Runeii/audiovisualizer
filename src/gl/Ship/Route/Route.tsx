
import { useSpring } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useRef } from "react";
import { Vector3 } from "three";
import HermiteCurve3 from "../../../phobos/utils/HermiteCurve3";
import useStore from "../../../store";

const BASE_MOVEMENT = 0.00007;
const LOOKAHEAD_DISTANCE = 0.004;

const TARGET_BPM = 120;

type RouteProps = {
  isPlayer: boolean;
  splineRef: MutableRefObject<HermiteCurve3>;
  speedBoostLastTouched: number;
  setCurrentSplinePosition: (position: Vector3) => void;
  setCurrentSplineTangent: (tangent: Vector3) => void;
  setUpcomingSplinePosition: (tangent: Vector3) => void;
  setUpcomingSplineTangent: (tangent: Vector3) => void;
  setNormalizedCurrentSplineTangent: (tangent: Vector3) => void;
};

const Route = ({
  isPlayer,
  splineRef,
  speedBoostLastTouched,
  setCurrentSplinePosition,
  setCurrentSplineTangent,
  setUpcomingSplinePosition,
  setUpcomingSplineTangent,
  setNormalizedCurrentSplineTangent,
}: RouteProps) => {
  const [{speedBoostMultiplier}, speedApi] = useSpring(() => ({
    speedBoostMultiplier: 1,
  }), []);

  // Handle speed tiles
  useFrame(() => {
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
  });

  const [speed] = useSpring(() => ({
    speed: 0,
  }), []);

  const tempo = useStore(state => state.tempo);

  // Calculate current speed
  useFrame(() => {
    const tempoMultiplier = tempo / TARGET_BPM;
    
    let currentSpeed = BASE_MOVEMENT * tempoMultiplier * speedBoostMultiplier.get();
  
    if (!isPlayer) {
      currentSpeed *= (Math.random() + 0.5);
    }

    window.debug = `tempo: ${tempo}, tempoMultiplier: ${tempoMultiplier}, speedBoostMultiplier: ${speedBoostMultiplier.get()}`;
    speed.speed.start(currentSpeed);
  })

  const currentProgress = useRef<number>(0);
  // Calculate next position
  useFrame(() => {
    if (!splineRef || !splineRef.current ) {
      return;
    }
  
    const spline = splineRef.current;
    currentProgress.current += speed.speed.get();
    currentProgress.current %= 1;

    const currentSplineTangent = spline.getTangentAt(currentProgress.current).clone()
    setCurrentSplinePosition(spline.getPointAt(currentProgress.current).clone());
    setCurrentSplineTangent(currentSplineTangent);

    const nextProgress = (currentProgress.current + LOOKAHEAD_DISTANCE) % 1;
    setUpcomingSplinePosition(spline.getPointAt(nextProgress).clone());
    setUpcomingSplineTangent(spline.getTangentAt(nextProgress).clone());
    setNormalizedCurrentSplineTangent(currentSplineTangent.clone().normalize());
  })

  return null;
};

export default Route;