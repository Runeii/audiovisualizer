import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react";
import { loadPath } from "../phobos";
import { BufferGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { Tracks } from "../phobos/constants";
import { createCameraSpline } from "../phobos/camera";
import HermiteCurve3 from "../phobos/utils/HermiteCurve3";
import { Sphere } from "@react-three/drei";

const Scene = () => {
  const scene = useThree(state => state.scene);

  const [mesh, setMesh] = useState<Mesh>();
  const [mesh2, setMesh2] = useState<Object3D>();
  const [mesh3, setMesh3] = useState<Object3D>();
  const [mesh4, setMesh4] = useState<Object3D>();
  const [spline, setSpline] = useState<HermiteCurve3>();


  useEffect(() => {
    loadPath(Tracks.Wipeout2097[0].path).then(({ spline, sky, scene, ships, track }) => {
      setMesh(track)
     setMesh2(scene)
     setMesh3(sky)
     setMesh4(ships)
     setSpline(spline)
    });
  }, [scene]);

  useFrame(({camera, scene}) => {
    scene.traverse((object) => {
      if (object.userData.isFacingCamera) {
        object.rotation.set(object.rotation.x, camera.rotation.y, object.rotation.z);
      }
    });
  });

  const shipRef = useRef<Mesh>(); 
  useFrame(({camera, clock}) => {
    if (!spline || !shipRef.current) {
      return;
    }
  
    const SPEED = 50000;
    const time = clock.elapsedTime;
    const tubeLength = spline.getLength();
    const loopTime = tubeLength / SPEED;
  
    // Calculate the position along the spline
    const tmod = (time % loopTime) / loopTime;
    const position = spline.getPointAt(tmod);
    const tangent = spline.getTangentAt(tmod).normalize();

    // Update the mesh position and orientation
    if (position && tangent) {
      shipRef.current.position.copy(position);
      shipRef.current.lookAt(position.clone().add(tangent));
    }
  });

  return (
    <>
     {mesh && <primitive object={mesh} />}
     {mesh2 && <primitive object={mesh2} />}
     {mesh3 && <primitive object={mesh3} scale={48} />}
     {mesh4 && <primitive object={mesh4.children[3]} ref={shipRef} scale={4} />}
     {spline  && (
      <mesh>
        <tubeGeometry args={[spline, spline.points.length, 50, 5, true]} />
        <meshBasicMaterial color={0xff00ff} />
      </mesh>
     )}
    </>
  );
}

export default Scene;