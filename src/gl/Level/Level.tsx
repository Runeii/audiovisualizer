import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Color, Mesh } from "three";

type LevelProps = {
  land: Mesh;
  scenery: Mesh;
  sky: Mesh;
}
const Level = ({ land, scenery, sky }: LevelProps) => {
  const weaponTileMaterial = useMemo(() => {
    if (!land.material) {
      return;
    }
    return land.material.find((material) => material.name === "tile-weapon");
  }, [land.material]);

  useFrame(({ clock })=> {
    // Purple -> blue -> cyan -> yellow -> amber (never 100% red or green)
    const colors = [0x800080, 0x0000ff, 0x00ffff, 0xffff00, 0xff8000];
    const t = clock.elapsedTime * 5;
    const index = Math.floor(t);
    const alpha = t - index;

    const colorA = new Color(colors[index % colors.length]);
    const colorB = new Color(colors[(index + 1) % colors.length]);
    weaponTileMaterial.color = colorA.lerp(colorB, alpha).multiplyScalar(1.5);
  });

  return (
    <>
      <primitive object={land} />
      <primitive object={scenery} />
      <primitive object={sky} scale={48} />
    </>
  )
}

export default Level;