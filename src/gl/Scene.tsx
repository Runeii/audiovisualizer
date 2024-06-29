import { useFrame } from "@react-three/fiber"
import { useEffect, useState } from "react";
import { loadPath } from "../phobos";
import { Mesh } from "three";
import { Tracks } from "../phobos/constants";
import Ship from "./Ship/Ship";
import Level from "./Level/Level";

type SceneProps = {
  isWorldVisible: boolean;
  setIsRunning: (hasMountedScene: boolean) => void;
}
const Scene = ({ isWorldVisible, setIsRunning }: SceneProps) => {
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

  useEffect(() => {
    if (!isWorldVisible) {
      return;
    }
    setCurrentTrack(current => (current + 1) % Tracks.Wipeout2097.length);
    return () => {
      setIsRunning(false);
    }
  }, [isWorldVisible, setIsRunning]);

  if (!objects || !objects[currentTrack] || !isWorldVisible) {
    return null;
  }

  const { scenery, sky, ships, spline, track } = objects[currentTrack];

  return (
    <>
      <Level land={track} scenery={scenery} sky={sky}  />
      {spline && ships.children.map((ship: Mesh, index: number) => (
        <Ship
          key={ship.id}
          isPlayer={index === Math.round(ships.children.length / 2)}
          playerIndex={index}
          mesh={ship as Mesh}
          setIsRunning={setIsRunning}
          spline={spline}
          track={track}
          x={(index - ships.children.length / 2) * 750}
        />
      ))}
    </>
  );
}

export default Scene;