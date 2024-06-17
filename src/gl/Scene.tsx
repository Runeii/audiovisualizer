import { useThree } from "@react-three/fiber"
import { useEffect, useState } from "react";
import { Tracks, loadTrack } from "../wipeout";
import { Object3D } from "three";

const Scene = () => {
  const scene = useThree(state => state.scene);
  const [mesh, setMesh] = useState<Object3D>();
  const [mesh2, setMesh2] = useState<Object3D>();
  const [mesh3, setMesh3] = useState<Object3D>();

  useEffect(() => {
    loadTrack(Tracks.Wipeout2097[0].path,  Tracks.Wipeout2097[0].hasTEXFile ?? false).then(({ sky, scene, track }) => {
      setMesh(sky)
      setMesh2(track)
      setMesh3(scene)

    });
  }, [scene]);

  if (!mesh || !mesh2 || !mesh3 ) {
    return null;
  }

  return (
    <>
      <primitive object={mesh} />
      <primitive object={mesh2} />
      <primitive object={mesh3} />
    </>
  );
}

export default Scene;