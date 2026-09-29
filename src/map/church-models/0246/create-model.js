import * as THREE from "three";
import { addBox, createArch } from "../shared/geometry.js";
import { createChurchMaterials } from "../shared/materials.js";

const FACADE_X = -6.35;

function createMaterials() {
  const materials = createChurchMaterials();

  return {
    ...materials,
    weatheredStone: new THREE.MeshStandardMaterial({
      color: 0xc8c0aa,
      roughness: 1
    }),
    paleStone: new THREE.MeshStandardMaterial({
      color: 0xddd4be,
      roughness: 0.98
    }),
    roofPlaster: new THREE.MeshStandardMaterial({
      color: 0xd7d1c2,
      roughness: 0.96
    }),
    recess: new THREE.MeshStandardMaterial({
      color: 0x292b27,
      roughness: 0.9,
      side: THREE.DoubleSide
    }),
    door: new THREE.MeshStandardMaterial({
      color: 0xbca778,
      roughness: 0.9
    }),
    whitePaint: new THREE.MeshStandardMaterial({
      color: 0xe8e3d7,
      roughness: 0.82
    }),
    bronze: new THREE.MeshStandardMaterial({
      color: 0x4b4c3e,
      roughness: 0.62,
      metalness: 0.32
    }),
    courtyard: new THREE.MeshStandardMaterial({
      color: 0xb7ab91,
      roughness: 0.98
    })
  };
}

function placeOnFacade(mesh, y, z, x = FACADE_X) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function createFacadeShape(points, material, x = FACADE_X) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([z, y]) => shape.lineTo(z, y));
  shape.closePath();

  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  mesh.position.x = x;
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function addBody(chapel, materials) {
  addBox(
    chapel,
    [9.2, 6.2, 13],
    [-1.75, 3.1, 0],
    materials.weatheredStone
  );
  addBox(
    chapel,
    [4.8, 5.9, 5.4],
    [5.25, 2.95, -3.7],
    materials.weatheredStone
  );

  addBox(chapel, [9.5, 0.32, 13.25], [-1.75, 6.25, 0], materials.roofPlaster);
  addBox(chapel, [5.05, 0.3, 5.65], [5.25, 6.08, -3.7], materials.roofPlaster);

  [-6.35, 2.75].forEach((x) => {
    [-6.35, 6.35].forEach((z) => {
      addBox(chapel, [0.55, 6.3, 0.55], [x, 3.15, z], materials.paleStone);
    });
  });
}

function addDoor(chapel, materials) {
  addBox(chapel, [0.16, 3.05, 1.85], [FACADE_X - 0.08, 1.53, 0], materials.paleStone);
  addBox(chapel, [0.12, 2.72, 1.48], [FACADE_X - 0.18, 1.36, 0], materials.door);

  addBox(
    chapel,
    [0.1, 1.35, 0.16],
    [FACADE_X - 0.27, 1.62, 0],
    materials.whitePaint
  );
  addBox(
    chapel,
    [0.1, 0.16, 0.82],
    [FACADE_X - 0.27, 1.82, 0],
    materials.whitePaint
  );
}

function addFacadeDetails(chapel, materials) {
  addBox(
    chapel,
    [0.58, 6.25, 13],
    [FACADE_X + 0.27, 3.12, 0],
    materials.weatheredStone
  );
  addDoor(chapel, materials);

  [-3.55, 3.55].forEach((z) => {
    addBox(
      chapel,
      [0.16, 1.25, 1.08],
      [FACADE_X - 0.08, 3.45, z],
      materials.paleStone
    );
    addBox(
      chapel,
      [0.1, 0.88, 0.7],
      [FACADE_X - 0.18, 3.45, z],
      materials.recess
    );
  });

  [-5.2, -1.8, 1.8, 5.2].forEach((z) => {
    const spout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.18, 0.92, 10),
      materials.paleStone
    );
    spout.position.set(FACADE_X - 0.45, 4.8, z);
    spout.rotation.z = Math.PI / 2;
    chapel.add(spout);
  });
}

function addBell(chapel, x, y, z, materials) {
  const bell = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.72, 16),
    materials.bronze
  );
  bell.position.set(x, y, z);
  chapel.add(bell);

  const clapper = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 8),
    materials.bronze
  );
  clapper.position.set(x, y - 0.42, z);
  chapel.add(clapper);
}

function addBellOpening(chapel, z, height, materials) {
  const outer = createArch(2.05, height, materials.paleStone);
  placeOnFacade(outer, 6.25, z, FACADE_X - 0.08);
  chapel.add(outer);

  const opening = createArch(1.28, height - 0.62, materials.recess);
  placeOnFacade(opening, 6.55, z, FACADE_X - 0.16);
  chapel.add(opening);

  addBell(
    chapel,
    FACADE_X - 0.28,
    6.55 + (height - 0.62) * 0.48,
    z,
    materials
  );
}

function addCross(chapel, materials) {
  addBox(
    chapel,
    [0.22, 1.18, 0.22],
    [FACADE_X - 0.12, 11.08, 0],
    materials.paleStone
  );
  addBox(
    chapel,
    [0.24, 0.22, 0.78],
    [FACADE_X - 0.12, 11.25, 0],
    materials.paleStone
  );
}

function addBellGable(chapel, materials) {
  addBox(
    chapel,
    [0.68, 0.72, 7.7],
    [FACADE_X + 0.2, 6.58, 0],
    materials.weatheredStone
  );

  chapel.add(
    createFacadeShape(
      [[-1.38, 8.45], [0, 10.72], [1.38, 8.45]],
      materials.paleStone,
      FACADE_X - 0.06
    )
  );

  addBellOpening(chapel, -2.25, 3.25, materials);
  addBellOpening(chapel, 0, 3.85, materials);
  addBellOpening(chapel, 2.25, 3.25, materials);
  addCross(chapel, materials);
}

function addSideWindows(chapel, materials) {
  [-3.6, -0.4].forEach((x) => {
    [-6.54, 6.54].forEach((z) => {
      addBox(chapel, [0.82, 1.05, 0.1], [x, 3.45, z], materials.recess);
      addBox(chapel, [1.04, 0.18, 0.16], [x, 4.04, z], materials.paleStone);
    });
  });
}

function addCourtyard(chapel, materials) {
  addBox(chapel, [6.8, 0.16, 12.6], [-9.75, 0.08, 0], materials.courtyard);

  [-6.25, 6.25].forEach((z) => {
    addBox(chapel, [6.8, 1.05, 0.42], [-9.7, 0.52, z], materials.weatheredStone);
    addBox(chapel, [6.9, 0.18, 0.55], [-9.7, 1.08, z], materials.paleStone);
  });

  [-4.45, 4.45].forEach((z) => {
    addBox(chapel, [0.42, 1.05, 3.4], [-13.12, 0.52, z], materials.weatheredStone);
    addBox(chapel, [0.55, 0.18, 3.5], [-13.12, 1.08, z], materials.paleStone);
  });
}

export function createModel() {
  const chapel = new THREE.Group();
  const materials = createMaterials();

  addBody(chapel, materials);
  addFacadeDetails(chapel, materials);
  addBellGable(chapel, materials);
  addSideWindows(chapel, materials);
  addCourtyard(chapel, materials);

  return chapel;
}
