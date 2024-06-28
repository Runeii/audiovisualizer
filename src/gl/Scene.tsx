import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react";
import { loadPath } from "../phobos";
import { Mesh } from "three";
import { Tracks } from "../phobos/constants";
import HermiteCurve3 from "../phobos/utils/HermiteCurve3";
import Ship from "./Ship/Ship";
import Spline from "./Spline/Spline";
import Level from "./Level/Level";

const Scene = () => {
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

  const playerSpline = useRef<HermiteCurve3>(null);
  const ship1Spline = useRef<HermiteCurve3>(null);
  const ship2Spline = useRef<HermiteCurve3>(null);

  if (!objects) {
    return null;
  }

  return (
    <>
      <Level land={objects.land} scenery={objects.scenery} sky={objects.sky} />
     <Ship mesh={objects.ships.children[1]} splineRef={playerSpline} speed={1} track={objects.land} />
     <Ship isPlayer mesh={objects.ships.children[0]} splineRef={ship2Spline} speed={1} track={objects.land} />
     <Ship mesh={objects.ships.children[2]} splineRef={ship1Spline} speed={1} track={objects.land} />
     <Spline spline={spline} ref={playerSpline} />
     <Spline spline={spline} ref={ship1Spline} x={600} />
     <Spline spline={spline} ref={ship2Spline} x={-800} />
    </>
  );
}

export default Scene;