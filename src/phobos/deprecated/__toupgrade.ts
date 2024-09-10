/* eslint-disable */
// @ts-nocheck

import { Color, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Vector2, Vector3 } from "three";
import { POLYGON_TYPE, TRACK_FACE_FLAGS } from "../structs";
import { Face3, Geometry } from "./Geometry";
import { int32ToColor } from "../utils/utils";

// Note: since the initial implementation by Phobos, Three.js deprecated Geometry and Face3 in favor of BufferGeometry and BufferAttributes.
// Despite being able to rebuild the geometry as Buffer, the UVs were a mess. Rather than spending more time on a behind the scenes change
// for now I've opted to use Geometry.
// The following functions are deprecated and should be upgraded to use BufferGeometry and BufferAttributes.
// There is a version of the previous Three.js Geometry class in the same folder that I have modified to work with modern Three.
export const __deprecated_createModelFromObject = (object: WipeoutObject, sceneMaterial: MeshBasicMaterial[]) => {
  const model = new Mesh();
  const geometry = new Geometry();

  geometry.vertices = object.vertices.map((v) => new Vector3(v.x, -v.y, -v.z));

  const whiteColor = new Color(1, 1, 1);
  const nullVector = new Vector2(0, 0);

  // Create faces
  for (let i = 0; i < object.polygons.length; i++) {
    const p = object.polygons[i];

    // Sprite
    if (
      p.header.type === POLYGON_TYPE.SPRITE_BOTTOM_ANCHOR ||
      p.header.type === POLYGON_TYPE.SPRITE_TOP_ANCHOR
    ) {
      const v = geometry.vertices[p.index];
      const color = int32ToColor(p.color);
      const yOffset = p.header.type === POLYGON_TYPE.SPRITE_BOTTOM_ANCHOR
        ? p.height / 2
        : -p.height / 2;

      // We can't use Sprite here, because they rotate to the camera on
      // all axis. We just want rotation around the Y axis, so we do it manually.
      const spriteMaterial = new MeshBasicMaterial({ map: sceneMaterial[p.texture].map, color: color, alphaTest: 0.5 });
      const spriteMesh = new Mesh(new PlaneGeometry(p.width, p.height), spriteMaterial);

      const sprite = new Object3D();
      sprite.position.set(v.x, v.y + yOffset, v.z);
      sprite.add(spriteMesh);
      model.add(sprite);

      // We have to collect sprites separately, so we can go through all of them 
      // and rotate them to the camera before rendering the frame
    }

    // Tris or Quad
    else if (p.indices) {
      let materialIndex = sceneMaterial.flatMaterialIndex;
      const c = [whiteColor, whiteColor, whiteColor, whiteColor];
      const uv = [nullVector, nullVector, nullVector, nullVector];

      // Textured
      if (typeof (p.texture) !== 'undefined') {
        materialIndex = p.texture;

        const img = sceneMaterial[materialIndex].map.image;
        for (let j = 0; j < p.uv.length; j++) {
          uv[j] = new Vector2(p.uv[j].u / img.width, 1 - p.uv[j].v / img.height);
        }
      }

      // Face or Vertex color?
      if (p.color || p.colors) {
        for (let j = 0; j < p.indices.length; j++) {
          c[j] = int32ToColor(p.color || p.colors[j]);
        }
      }

      geometry.faceVertexUvs[0].push([uv[2], uv[1], uv[0]]);
      geometry.faces.push(new Face3(p.indices[2], p.indices[1], p.indices[0], null, [c[2], c[1], c[0]], materialIndex));

      // Push extra UV and Face for Quads
      if (p.indices.length === 4) {
        geometry.faceVertexUvs[0].push([uv[2], uv[3], uv[1]]);
        geometry.faces.push(new Face3(p.indices[2], p.indices[3], p.indices[1], null, [c[2], c[3], c[1]], materialIndex));
      }
    }
  }

  if (geometry.faces.length) {
    const mesh = new Mesh(geometry.toBufferGeometry(), sceneMaterial);
    model.add(mesh);
  }
  return model;
};

type PolygonWithFlags = Polygon & { flags: number, tile: number }

export const __deprecated_createTrack = ({
  vertices,
  polygons,
  trackMaterials
}: {
  vertices: Vertex[]
  polygons: PolygonWithFlags[]
  trackMaterials: MeshBasicMaterial[]
}) => {
  const geometry = new Geometry();

  geometry.vertices = vertices.map((v) => new Vector3(v.x, -v.y, -v.z));

  const faces = polygons.flatMap(({ color: sourceColor, flags, indices, tile }) => {
    let color = int32ToColor(sourceColor);

    if (flags & TRACK_FACE_FLAGS.BOOST) {
      color = new Color(0.25, 0.25, 2);
    }

    return [
      new Face3(indices[0], indices[1], indices[2], undefined, color, tile),
      new Face3(indices[2], indices[3], indices[0], undefined, color, tile)
    ];
  });

  const faceVertexUvs = polygons.flatMap(({ flags }) => {
    const flipx = (flags & TRACK_FACE_FLAGS.FLIP) ? 1 : 0;

    return [
      [
        new Vector2(1 - flipx, 1),
        new Vector2(0 + flipx, 1),
        new Vector2(0 + flipx, 0)
      ],
      [
        new Vector2(0 + flipx, 0),
        new Vector2(1 - flipx, 0),
        new Vector2(1 - flipx, 1)
      ]
    ];
  });

  geometry.faces = faces;
  geometry.faceVertexUvs[0] = faceVertexUvs;

  geometry.computeFaceNormals();
  geometry.computeFlatVertexNormals();

  const track = new Mesh(geometry.toBufferGeometry(), trackMaterials);

  return track;
}
