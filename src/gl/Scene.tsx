import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react";
import { loadPath } from "../phobos";
import { Mesh } from "three";
import { Tracks } from "../phobos/constants";
import HermiteCurve3 from "../phobos/utils/HermiteCurve3";
import Ship from "./Ship/Ship";
import Level from "./Level/Level";

const Scene = () => {
  const [hasMountedScene, setHasMountedScene] = useState(false);
  const [objects, setObjects] = useState<Record<string, Mesh>>();
  const [spline, setSpline] = useState<HermiteCurve3>();

  useEffect(() => {
    if (objects) {
      return;
    }
    const index = Math.round(Tracks.Wipeout2097.length * Math.random());
    loadPath(Tracks.Wipeout2097[index].path).then(({ spline, sky, scene, ships, track }) => {
      setObjects({ land: track, scenery: scene, sky, ships });
      setSpline(spline)
    });
  }, [objects]);

  useFrame(({camera, scene}) => {
    scene.traverse((object) => {
      if (object.userData.isFacingCamera) {
        object.rotation.set(object.rotation.x, camera.rotation.y, object.rotation.z);
      }
    });
  });

  const trackRef = useRef<Mesh>(null);

  useFrame(() => {
    if (hasMountedScene || !trackRef.current) {
      return;
    }
    
    setHasMountedScene(true);
  })

  if (!objects) {
    return null;
  }

  return (
    <>
      <Level land={objects.land} scenery={objects.scenery} sky={objects.sky} trackRef={trackRef} />
      {hasMountedScene && (
        <>
          {spline && objects.ships.children.map((ship, index) => (
            <Ship
              key={ship.id}
              isPlayer={index === Math.round(objects.ships.children.length / 2)}
              playerIndex={index}
              mesh={ship as Mesh}
              spline={spline}
              track={objects.land}
              x={(index - objects.ships.children.length / 2) * 750}
            />
          ))}
        </>
      )}
    </>
  );
}

export default Scene;