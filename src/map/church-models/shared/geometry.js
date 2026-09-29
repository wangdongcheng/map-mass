import * as THREE from "three";

export function addBox(parent, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material
  );
  mesh.position.set(position[0], position[1], position[2]);
  parent.add(mesh);
  return mesh;
}

export function createArch(width, height, material) {
  const radius = width / 2;
  const springHeight = height - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(-radius, springHeight);
  shape.absarc(0, springHeight, radius, Math.PI, 0, false);
  shape.lineTo(radius, 0);
  shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), material);
}

export function createBarrelRoofBay(
  length,
  width,
  baseHeight,
  rise,
  material
) {
  const segments = 18;
  const halfLength = length / 2;
  const halfWidth = width / 2;
  const vertices = [];

  for (let index = 0; index < segments; index += 1) {
    const startRatio = index / segments;
    const endRatio = (index + 1) / segments;
    const startZ = -halfWidth + startRatio * width;
    const endZ = -halfWidth + endRatio * width;
    const startY = baseHeight + Math.sin(startRatio * Math.PI) * rise;
    const endY = baseHeight + Math.sin(endRatio * Math.PI) * rise;

    vertices.push(
      -halfLength, startY, startZ,
      halfLength, startY, startZ,
      halfLength, endY, endZ,
      -halfLength, startY, startZ,
      halfLength, endY, endZ,
      -halfLength, endY, endZ
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

export function addRoofRib(
  parent,
  x,
  width,
  baseHeight,
  rise,
  material
) {
  const points = [];

  for (let index = 0; index <= 18; index += 1) {
    const ratio = index / 18;
    points.push(
      new THREE.Vector3(
        x,
        baseHeight + Math.sin(ratio * Math.PI) * rise + 0.14,
        -width / 2 + ratio * width
      )
    );
  }

  const curve = new THREE.CatmullRomCurve3(points);
  parent.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.24, 6, false),
      material
    )
  );
}
