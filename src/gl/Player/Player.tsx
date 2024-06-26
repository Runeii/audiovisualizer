import { useFrame } from "@react-three/fiber";
import useStore from "../../store";
import { useRef } from "react";
import { Euler, MathUtils, Mesh, Quaternion, Vector3 } from "three";
import HermiteCurve3 from "../../phobos/utils/HermiteCurve3";
import ValueTracker from "../../audio/ValueTracker";
import { useSpring } from "@react-spring/three";
import { clamp } from "three/src/math/MathUtils.js";

function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

function calculateSpeedFactor(tempo: number, TARGET_TEMPO: number, speed: number, spline: HermiteCurve3, currentProgress: number): number {
  const curvature = spline ? getCurvature(spline, currentProgress) : 0;
  const clampedCurvature = curvature === 10000 ? (clamp(curvature, 0, 100) / 100) : 1;
  const maxSpeed = (tempo / TARGET_TEMPO) * (TARGET_SPEED * Math.min(1, clampedCurvature * 2));
  return speed * maxSpeed;
}

function smoothTransition(current: number, target: number, deltaTime: number, smoothFactor: number): number {
  return lerp(current, target, 1 - Math.exp(-deltaTime * smoothFactor));
}

// Function to calculate the second derivative
function getSecondDerivative(curve, t) {
  const delta = 0.0005;
  const point1 = t - delta > 0 ? t - delta : 1 - delta;
  const point2 = t - delta > 1 ? t + delta : delta;
  const tangent1 = curve.getTangent(point1).normalize();
  const tangent2 = curve.getTangent(point2).normalize();
  return tangent2.clone().sub(tangent1).divideScalar(delta);
}

// Function to calculate the curvature
function getCurvature(curve: HermiteCurve3, t: number) {
  const tangent = curve.getTangent(t).normalize();
  const secondDerivative = getSecondDerivative(curve, t);
  const numerator = secondDerivative.length();
  const denominator = Math.pow(tangent.length(), 3);
  return numerator / denominator;
}


const TARGET_SPEED = 10;
const TARGET_TEMPO = 160;
const CAMERA_VERTICAL_OFFSET = 350; // Adjust this constant for vertical distance above the ship
const CAMERA_BEHIND_OFFSET = 2000; // Adjust this constant for distance behind the ship

const Player = ({ mesh, spline }: {mesh?: Mesh, spline?: HermiteCurve3}) => {
  const speed = useStore(state => state.speed);
  const tempo = useStore(state => state.tempo);

  const shipRef = useRef<Mesh>();
  const speedFactorValues = useRef<ValueTracker>(new ValueTracker(50));
  const currentProgress = useRef<number>(0);

  const {speedFactor} = useSpring({
    speedFactor: calculateSpeedFactor(tempo, TARGET_TEMPO, speed, spline, currentProgress.current),
  })

  const [{ cameraPosition, shipPosition }, set] = useSpring(() => ({
    cameraPosition: new Vector3(),
    shipPosition: new Vector3(),
  }));

  useFrame(({ camera, clock }) => {
    if (!shipRef.current || !spline) {
      return;
      }
      const deltaTime = clock.getDelta();
    // Calculate speed factor
    speedFactorValues.current.addValue(speedFactor.get());

    // Update the current progress along the spline
    currentProgress.current += 0.4 * deltaTime;
    currentProgress.current %= 1; // Ensure currentProgress stays within [0, 1]
console.log(currentProgress.current)
    // Get the position and tangent on the spline based on currentProgress
    const position = spline.getPointAt(currentProgress.current);
    const tangent = spline.getTangentAt(currentProgress.current).normalize();

    const shipPosition = shipRef.current.position.copy(position);
    shipPosition.y += 100;
  
    shipRef.current.position.copy(shipPosition);
  
    shipRef.current.lookAt(position.clone().add(tangent));

    // Position the camera behind and above the ship
    let cameraOffset = currentProgress.current - 0.0015;
    if (cameraOffset < 0) {
      cameraOffset += 1;
    }
  
    const cameraPosition = spline.getPointAt(cameraOffset);
    cameraPosition.y += CAMERA_VERTICAL_OFFSET;
    camera.lookAt(position);
  
    set({
      cameraPosition: cameraPosition,
    });
  
  });

  useFrame(({camera}) => {
    if (!shipRef.current) {
      return;
    }

    //shipRef.current.position.copy(shipPosition.get());
    camera.position.copy(cameraPosition.get());
  });

  if (!mesh) {
    return null;
  }

  return <primitive object={mesh} ref={shipRef}  />
}

export default Player;