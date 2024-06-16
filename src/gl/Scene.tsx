import { useThree } from "@react-three/fiber"
import { useEffect, useState } from "react";
import { Tracks, loadTrack } from "../wipeout";
import { Object3D } from "three";

const Scene = () => {
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);
  const [mesh, setMesh] = useState<Object3D>();
  useEffect(() => {
    loadTrack(Tracks.Wipeout2097[0].path,  Tracks.Wipeout2097[0].hasTEXFile ?? false).then((mesh) => {
      setMesh(mesh)

    });
  }, [scene]);

  if (!mesh) {
    return null;
  }
  return <primitive object={mesh} />;
}

export default Scene;