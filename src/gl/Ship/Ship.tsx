import { Mesh, Vector3 } from "three";
import HermiteCurve3 from "../../phobos/utils/HermiteCurve3";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useMemo, useRef, useState } from "react";
import Movement from "./Movement/Movement";
import Camera from "./Camera/Camera";
import Shadow from "./Shadow/Shadow";
import Route from "./Route/Route";
import { TILE_TYPES, queryCurrentTile } from "./utils";

type ShipProps = {
  isPlayer: boolean;
  mesh?: Mesh;
  speed: number;
  splineRef: MutableRefObject<HermiteCurve3>;
  track: Mesh;
}

const Ship = ({ isPlayer = false, mesh, speed, splineRef, track }: ShipProps) => {
  const shipRef = useRef<Mesh>(null);

  const shipMesh = useMemo(() => mesh?.clone(), [mesh]);

  const [speedBoostLastTouched, setSpeedBoostLastTouched] = useState<number>(0);

  const [currentSplinePosition, setCurrentSplinePosition] = useState(new Vector3(0, 0, 0));
  const [currentSplineTangent, setCurrentSplineTangent] = useState(new Vector3(0, 0, 0));
  const [normalizedCurrentSplineTangent, setNormalizedCurrentSplineTangent] = useState(new Vector3(0, 0, 0));
  const [upcomingSplineTangent, setUpcomingSplineTangent] = useState(new Vector3(0, 0, 0));

  useFrame(() => {
    if (!shipRef.current || !track || !isPlayer) {
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
      <primitive object={shipMesh} ref={shipRef} />
      <Route
        isPlayer={isPlayer}
        splineRef={splineRef}
        speedBoostLastTouched={speedBoostLastTouched}
        speed={speed}
        setCurrentSplinePosition={setCurrentSplinePosition}
        setCurrentSplineTangent={setCurrentSplineTangent}
        setUpcomingSplineTangent={setUpcomingSplineTangent}
        setNormalizedCurrentSplineTangent={setNormalizedCurrentSplineTangent}
      />
      <Movement
        currentSplinePosition={currentSplinePosition}
        currentSplineTangent={currentSplineTangent}
        shipRef={shipRef}
        upcomingSplineTangent={upcomingSplineTangent}
      />
      <Camera
        currentSplinePosition={currentSplinePosition}
        normalizedCurrentSplineTangent={normalizedCurrentSplineTangent}
      />
      <Shadow />
    </>
  );
}

export default Ship;