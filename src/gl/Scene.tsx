import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react";
import { loadPath } from "../phobos";
import { BufferGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { Tracks } from "../phobos/constants";
import { createCameraSpline } from "../phobos/camera";
import HermiteCurve3 from "../phobos/utils/HermiteCurve3";
import { Sphere } from "@react-three/drei";
import useStore from "../store";
import Ship from "./Ship/Ship";
import Spline from "./Spline/Spline";

let hasModels = false;
const Scene = () => {

  const [mesh, setMesh] = useState<Mesh>();
  const [mesh2, setMesh2] = useState<Object3D>();
  const [mesh3, setMesh3] = useState<Object3D>();
  const [ships, setShips] = useState<Mesh[]>();
  const [spline, setSpline] = useState<HermiteCurve3>();

  useEffect(() => {
    if (hasModels) {
      return;
    }
    loadPath(Tracks.Wipeout2097[Math.round(Tracks.Wipeout2097.length * Math.random())].path).then(({ spline, sky, scene, ships, track }) => {
    setMesh(track)
     setMesh2(scene)
     setMesh3(sky)
     setShips(ships.children as Mesh[])
     setSpline(spline)
      hasModels = true;
    });
  }, []);

  const scene = useThree(state => state.scene);

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

  return (
    <>
     {mesh && <primitive object={mesh} />}
     {mesh2 && <primitive object={mesh2} />}
     {mesh3 && <primitive object={mesh3} scale={48} />}
     <Ship isPlayer mesh={ships?.[0]} splineRef={playerSpline} speed={1} />
     <Ship mesh={ships?.[2]} splineRef={ship1Spline} speed={1} />
     <Ship mesh={ships?.[1]} splineRef={ship2Spline} speed={1} />
     <Spline spline={spline} ref={playerSpline} />
     <Spline spline={spline} ref={ship1Spline} x={600} />
     <Spline spline={spline} ref={ship2Spline} x={-800} />
    </>
  );
}

export default Scene;