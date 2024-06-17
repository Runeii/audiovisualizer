import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react";
import { Tracks, loadTrack } from "../wipeout";
import { BufferGeometry, Mesh, MeshBasicMaterial, Object3D } from "three";

const Scene = () => {
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);
  const [mesh, setMesh] = useState<Mesh>();
  const [mesh2, setMesh2] = useState<Object3D>();
  const [mesh3, setMesh3] = useState<Object3D>();

  const r3fRef = useRef();
  const primRef = useRef();

  useEffect(() => {
    loadTrack(Tracks.Wipeout2097[0].path,  Tracks.Wipeout2097[0].hasTEXFile ?? false).then(({ sky, scene, track }) => {
      setMesh(sky)
    });
  }, [scene]);

  if (!mesh) {
    return null;
  }

  return (
    <>
        <primitive object={mesh} />
    </>
  );
}

export default Scene;