import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react";
import { loadPath } from "../phobos";
import { Mesh } from "three";
import { Tracks } from "../phobos/constants";
import HermiteCurve3 from "../phobos/utils/HermiteCurve3";
import Ship from "./Ship/Ship";
import Level from "./Level/Level";
import useStore from "../store";

type SceneProps = {
  isWorldVisible: boolean;
  hasMountedScene: boolean;
  setHasMountedScene: (hasMountedScene: boolean) => void;
}
const Scene = ({ isWorldVisible, hasMountedScene, setHasMountedScene }: SceneProps) => {
  const [objects, setObjects] = useState<LevelObject[]>();

  const [currentTrack, setCurrentTrack] = useState(0);

  useEffect(() => {
    if (objects) {
      return;
    }
    Promise.all([...new Array(Tracks.Wipeout2097.length)].map(async (_, index) => loadPath(Tracks.Wipeout2097[index].path))).then((results) => {
      setObjects(results);
    })
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

  useEffect(() => {
    if (!isWorldVisible) {
      return;
    }
    setCurrentTrack(current => (current + 1) % Tracks.Wipeout2097.length);
    return () => {
      setHasMountedScene(false);
    }
  }, [isWorldVisible, setHasMountedScene]);

  if (!objects || !objects[currentTrack] || !isWorldVisible) {
    return null;
  }

  const { scenery, sky, ships, spline, track } = objects[currentTrack];

  return (
    <>
      <Level land={track} scenery={scenery} sky={sky} trackRef={trackRef} />
      {hasMountedScene && (
        <>
          {spline && ships.children.map((ship, index) => (
            <Ship
              key={ship.id}
              isPlayer={index === Math.round(ships.children.length / 2)}
              playerIndex={index}
              mesh={ship as Mesh}
              spline={spline}
              track={track}
              x={(index - ships.children.length / 2) * 750}
            />
          ))}
        </>
      )}
    </>
  );
}

export default Scene;