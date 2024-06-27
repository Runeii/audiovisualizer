import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react";
import { loadPath } from "../phobos";
import { BufferGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { Tracks } from "../phobos/constants";
import { createCameraSpline } from "../phobos/camera";
import HermiteCurve3 from "../phobos/utils/HermiteCurve3";
import { Sphere } from "@react-three/drei";
import useStore from "../store";
import Player from "./Player/Player";

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

  return (
    <>
     {mesh && <primitive object={mesh} />}
     {mesh2 && <primitive object={mesh2} />}
     {mesh3 && <primitive object={mesh3} scale={48} />}
     <Player mesh={ships?.[0]} spline={spline} />
     {spline  && (
      <mesh visible={false}>
        <tubeGeometry args={[spline, spline.points.length, 50, 5, true]} />
        <meshBasicMaterial color={0xff00ff} />
      </mesh>
     )}
    </>
  );
}

export default Scene;