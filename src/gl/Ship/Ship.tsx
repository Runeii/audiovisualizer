import { Mesh, Vector3 } from "three";
import HermiteCurve3 from "../../phobos/utils/HermiteCurve3";
import { useFrame } from "@react-three/fiber";
import {  useMemo, useRef, useState } from "react";
import Movement from "./Movement/Movement";
import Camera from "./Camera/Camera";
import Shadow from "./Shadow/Shadow";
import Route from "./Route/Route";
import { TILE_TYPES, queryCurrentTile } from "./utils";
import Spline from "./Spline/Spline";

type ShipProps = {
  playerIndex: number;
  isPlayer: boolean;
  mesh?: Mesh;
  setIsRunning: (isRunning: boolean) => void;
  spline: HermiteCurve3;
  track: Mesh;
  x: number;
}

const Ship = ({ isPlayer = false, mesh, playerIndex, setIsRunning, spline, track, x }: ShipProps) => {
  const shipRef = useRef<Mesh>(null);
  const splineRef = useRef<HermiteCurve3>(null);

  const shipMesh = useMemo(() => mesh?.clone(), [mesh]);

  const [speedBoostLastTouched, setSpeedBoostLastTouched] = useState<number>(0);

  const [currentSplinePosition, setCurrentSplinePosition] = useState(new Vector3(0, 0, 0));
  const [currentSplineTangent, setCurrentSplineTangent] = useState(new Vector3(0, 0, 0));
  const [upcomingSplinePosition, setUpcomingSplinePosition] = useState(new Vector3(0, 0, 0));
  const [normalizedCurrentSplineTangent, setNormalizedCurrentSplineTangent] = useState(new Vector3(0, 0, 0));
  const [upcomingSplineTangent, setUpcomingSplineTangent] = useState(new Vector3(0, 0, 0));

  useFrame(() => {
    if (!shipRef.current || !track) {
      return;
    }
    const currentTile = queryCurrentTile(shipRef.current?.position, track);

    if (currentTile === TILE_TYPES.SPEED_BOOST) {
      setSpeedBoostLastTouched(Date.now());
    }
  });

  if (!shipMesh) {
    return null;
  }

  return (
    <>
      <Spline spline={spline} ref={splineRef} track={track} x={x} />
      <primitive object={shipMesh} ref={shipRef} scale={1.5}>
        <Route
          isPlayer={isPlayer}
          playerIndex={playerIndex}
          splineRef={splineRef}
          speedBoostLastTouched={speedBoostLastTouched}
          setCurrentSplinePosition={setCurrentSplinePosition}
          setCurrentSplineTangent={setCurrentSplineTangent}
          setUpcomingSplineTangent={setUpcomingSplineTangent}
          setUpcomingSplinePosition={setUpcomingSplinePosition}
          setNormalizedCurrentSplineTangent={setNormalizedCurrentSplineTangent}
        />
        <Movement
          currentSplinePosition={currentSplinePosition}
          currentSplineTangent={currentSplineTangent}
          shipRef={shipRef}
          upcomingSplineTangent={upcomingSplineTangent}
          upcomingSplinePosition={upcomingSplinePosition}
        />
        <Camera
          currentSplinePosition={currentSplinePosition}
          normalizedCurrentSplineTangent={normalizedCurrentSplineTangent}
          onCameraReady={setIsRunning}
        />
        <Shadow mesh={shipMesh} shipRef={shipRef} />
      </primitive>
    </>
  );
}

export default Ship;