import * as THREE from "three";
import { addBox, createArch } from "../shared/geometry.js";
import { createChurchMaterials } from "../shared/materials.js";

function createMaterials() {
  const materials = createChurchMaterials();

  return {
    ...materials,
    limestonePink: new THREE.MeshStandardMaterial({
      color: 0xc99572,
      roughness: 0.97
    }),
    limestonePale: new THREE.MeshStandardMaterial({
      color: 0xd9c7aa,
      roughness: 0.95
    }),
    recess: new THREE.MeshStandardMaterial({
      color: 0x4c4339,
      roughness: 0.82,
      side: THREE.DoubleSide
    }),
    window: new THREE.MeshStandardMaterial({
      color: 0x303c3f,
      roughness: 0.35,
      metalness: 0.08,
      side: THREE.DoubleSide
    }),
    roofStone: new THREE.MeshStandardMaterial({
      color: 0xb69070,
      roughness: 0.94
    })
  };
}

function placeOnSouth(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI;
  return mesh;
}

function placeOnNorth(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

function placeOnEast(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI / 2;
  return mesh;
}

function placeOnWest(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function addArchedOpening(
  church,
  placement,
  position,
  width,
  height,
  surroundMaterial,
  insetMaterial
) {
  const surround = createArch(width + 0.55, height + 0.55, surroundMaterial);
  placement(surround, ...position);
  church.add(surround);

  const inset = createArch(width, height, insetMaterial);
  const insetPosition = [...position];
  if (placement === placeOnSouth) insetPosition[2] -= 0.06;
  if (placement === placeOnNorth) insetPosition[2] += 0.06;
  if (placement === placeOnEast) insetPosition[0] += 0.06;
  if (placement === placeOnWest) insetPosition[0] -= 0.06;
  placement(inset, ...insetPosition);
  church.add(inset);
}

function addCorbelRowX(church, startX, endX, y, z, materials) {
  for (let x = startX; x <= endX; x += 1.15) {
    addBox(church, [0.62, 0.72, 0.75], [x, y, z], materials.limestonePale);
  }
}

function addCorbelRowZ(church, x, startZ, endZ, y, materials) {
  for (let z = startZ; z <= endZ; z += 1.15) {
    addBox(church, [0.75, 0.72, 0.62], [x, y, z], materials.limestonePale);
  }
}

function addNave(church, materials) {
  addBox(church, [44, 10.5, 16], [0, 5.25, 0], materials.limestonePink);
  addBox(church, [34, 3.8, 12.4], [-5, 12.35, 0], materials.limestonePink);

  addBox(church, [44.8, 0.55, 16.8], [0, 10.6, 0], materials.limestonePale);
  addBox(church, [34.8, 0.55, 13.2], [-5, 14.35, 0], materials.limestonePale);

  addCorbelRowX(church, -21, 17, 10.05, -8.38, materials);
  addCorbelRowX(church, -21, 17, 10.05, 8.38, materials);

  [-17, -13.2, -9.4, -5.6, -1.8].forEach((x) => {
    addArchedOpening(
      church,
      placeOnSouth,
      [x, 9.9, -8.31],
      1.15,
      3.25,
      materials.limestonePale,
      materials.window
    );
    addArchedOpening(
      church,
      placeOnNorth,
      [x, 9.9, 8.31],
      1.15,
      3.25,
      materials.limestonePale,
      materials.window
    );
  });

  [-20.8, -17.2].forEach((x) => {
    addBox(church, [0.75, 10.8, 0.85], [x, 5.4, -8.35], materials.limestonePale);
    addBox(church, [0.75, 10.8, 0.85], [x, 5.4, 8.35], materials.limestonePale);
  });
}

function addRoseWindow(church, placement, position, materials, radius = 1.6) {
  const outer = new THREE.Mesh(
    new THREE.RingGeometry(radius, radius + 0.48, 32),
    materials.limestonePale
  );
  placement(outer, ...position);
  church.add(outer);

  const insetPosition = [...position];
  if (placement === placeOnSouth) insetPosition[2] -= 0.06;
  if (placement === placeOnWest) insetPosition[0] -= 0.06;

  const inset = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    materials.recess
  );
  placement(inset, ...insetPosition);
  church.add(inset);

  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    let spoke;

    if (placement === placeOnSouth) {
      spoke = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.75, 0.13, 0.12),
        materials.limestonePale
      );
      spoke.position.set(...insetPosition);
      spoke.rotation.y = Math.PI;
      spoke.rotation.z = angle;
    } else {
      spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.13, radius * 1.75),
        materials.limestonePale
      );
      spoke.position.set(...insetPosition);
      spoke.rotation.x = angle;
    }

    church.add(spoke);
  }

  const hub = new THREE.Mesh(
    new THREE.CircleGeometry(0.27, 16),
    materials.limestonePale
  );
  const hubPosition = [...insetPosition];
  if (placement === placeOnSouth) hubPosition[2] -= 0.08;
  if (placement === placeOnWest) hubPosition[0] -= 0.08;
  placement(hub, ...hubPosition);
  church.add(hub);
}

function addStatue(church, materials) {
  const statue = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 2.25, 10),
    materials.limestonePale
  );
  body.position.y = 1.15;
  statue.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 8),
    materials.limestonePale
  );
  head.position.y = 2.45;
  statue.add(head);

  statue.position.set(7, 3.7, -11.32);
  church.add(statue);
  addBox(church, [1.5, 0.38, 0.72], [7, 3.55, -11.22], materials.trim);
}

function addTransept(church, materials) {
  addBox(church, [15, 15, 21], [7, 7.5, 0], materials.limestonePink);
  addBox(church, [15.8, 0.62, 21.8], [7, 15.05, 0], materials.limestonePale);

  [-0.25, 14.25].forEach((x) => {
    addBox(church, [0.85, 15.2, 0.9], [x, 7.6, -10.65], materials.limestonePale);
    addBox(church, [0.85, 15.2, 0.9], [x, 7.6, 10.65], materials.limestonePale);
  });

  addCorbelRowX(church, 0.3, 13.7, 14.5, -10.72, materials);
  addCorbelRowX(church, 0.3, 13.7, 14.5, 10.72, materials);
  addCorbelRowZ(church, -0.72, -9.7, 9.7, 14.5, materials);
  addCorbelRowZ(church, 14.72, -9.7, 9.7, 14.5, materials);

  addRoseWindow(church, placeOnSouth, [7, 9.4, -10.86], materials, 1.55);
  addRoseWindow(church, placeOnWest, [-0.81, 9.3, 0], materials, 1.45);
  addStatue(church, materials);

  addArchedOpening(
    church,
    placeOnWest,
    [-0.84, 1.05, 0],
    3.7,
    5.8,
    materials.limestonePale,
    materials.wood
  );
}

function addTowerOpening(church, placement, position, materials, scale = 1) {
  addArchedOpening(
    church,
    placement,
    position,
    0.72 * scale,
    2.35 * scale,
    materials.limestonePale,
    materials.recess
  );
}

function addTowerFaceOpenings(church, towerX, towerZ, materials) {
  [16, 23.5, 31].forEach((y) => {
    [-0.62, 0.62].forEach((offset) => {
      addTowerOpening(
        church,
        placeOnSouth,
        [towerX + offset, y, towerZ - 3.01],
        materials,
        0.82
      );
      addTowerOpening(
        church,
        placeOnNorth,
        [towerX + offset, y, towerZ + 3.01],
        materials,
        0.82
      );
      addTowerOpening(
        church,
        placeOnEast,
        [towerX + 3.01, y, towerZ + offset],
        materials,
        0.82
      );
      addTowerOpening(
        church,
        placeOnWest,
        [towerX - 3.01, y, towerZ + offset],
        materials,
        0.82
      );
    });
  });
}

function addBelfryOpenings(church, towerX, towerZ, materials) {
  [-1.65, 0, 1.65].forEach((offset) => {
    addTowerOpening(
      church,
      placeOnSouth,
      [towerX + offset, 38.1, towerZ - 3.36],
      materials,
      1.32
    );
    addTowerOpening(
      church,
      placeOnNorth,
      [towerX + offset, 38.1, towerZ + 3.36],
      materials,
      1.32
    );
    addTowerOpening(
      church,
      placeOnEast,
      [towerX + 3.36, 38.1, towerZ + offset],
      materials,
      1.32
    );
    addTowerOpening(
      church,
      placeOnWest,
      [towerX - 3.36, 38.1, towerZ + offset],
      materials,
      1.32
    );
  });
}

function addBellTower(church, materials) {
  const towerX = 22;
  const towerZ = -7.5;

  addBox(church, [8.5, 8, 8.5], [towerX, 4, towerZ], materials.limestonePale);
  addBox(church, [9.1, 0.75, 9.1], [towerX, 8.15, towerZ], materials.trim);
  addBox(church, [6, 26.5, 6], [towerX, 21.65, towerZ], materials.limestonePale);

  [-2.75, 2.75].forEach((xOffset) => {
    [-2.75, 2.75].forEach((zOffset) => {
      addBox(
        church,
        [0.38, 26.7, 0.38],
        [towerX + xOffset, 21.7, towerZ + zOffset],
        materials.trim
      );
    });
  });

  addTowerFaceOpenings(church, towerX, towerZ, materials);

  addBox(church, [7.3, 1.15, 7.3], [towerX, 35.25, towerZ], materials.trim);
  addBox(church, [6.7, 7.5, 6.7], [towerX, 39.45, towerZ], materials.limestonePale);
  addBelfryOpenings(church, towerX, towerZ, materials);
  addBox(church, [7.35, 0.75, 7.35], [towerX, 43.45, towerZ], materials.trim);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.75, 7.2, 4),
    materials.roofStone
  );
  roof.position.set(towerX, 47.35, towerZ);
  roof.rotation.y = Math.PI / 4;
  church.add(roof);

  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 8),
    materials.cross
  );
  finial.position.set(towerX, 51.15, towerZ);
  church.add(finial);

  addBox(church, [0.18, 1.45, 0.18], [towerX, 52, towerZ], materials.cross);
  addBox(church, [0.18, 0.18, 0.9], [towerX, 52.2, towerZ], materials.cross);
}

export function createModel() {
  const church = new THREE.Group();
  const materials = createMaterials();

  addNave(church, materials);
  addTransept(church, materials);
  addBellTower(church, materials);

  return church;
}
