import * as THREE from "three";
import { addBox, createArch } from "../shared/geometry.js";
import { createChurchMaterials } from "../shared/materials.js";

function createMaterials() {
  const shared = createChurchMaterials();

  return {
    ...shared,
    warmStone: new THREE.MeshStandardMaterial({
      color: 0xd6b986,
      roughness: 0.96
    }),
    paleStone: new THREE.MeshStandardMaterial({
      color: 0xe5d1a8,
      roughness: 0.93
    }),
    shadowStone: new THREE.MeshStandardMaterial({
      color: 0xb99769,
      roughness: 0.98
    }),
    opening: new THREE.MeshStandardMaterial({
      color: 0x332d27,
      roughness: 0.86,
      side: THREE.DoubleSide
    }),
    clock: new THREE.MeshStandardMaterial({
      color: 0xf0e8d6,
      roughness: 0.62,
      side: THREE.DoubleSide
    })
  };
}

function placeOnFront(mesh, y, z, x = -25.61) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function placeOnBack(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI / 2;
  return mesh;
}

function placeOnSouth(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI;
  return mesh;
}

function addFrontArch(church, y, z, width, height, surround, inset, x = -25.65) {
  const frame = createArch(width + 0.7, height + 0.7, surround);
  placeOnFront(frame, y, z, x);
  church.add(frame);

  const opening = createArch(width, height, inset);
  placeOnFront(opening, y + 0.18, z, x - 0.05);
  church.add(opening);
}

function addNave(church, materials) {
  addBox(church, [48, 13, 18], [0, 6.5, 0], materials.warmStone);
  addBox(church, [47, 2.9, 14.4], [0.5, 14.45, 0], materials.warmStone);
  addBox(church, [49, 0.55, 19], [0, 13.05, 0], materials.paleStone);
  addBox(church, [48, 0.45, 15.2], [0.5, 16.1, 0], materials.paleStone);

  // The flat Maltese roof has a slightly raised central crown.
  addBox(church, [43, 0.38, 12.8], [2.5, 16.5, 0], materials.roof);

  [-20, -12.5, -5, 2.5, 10, 17.5].forEach((x) => {
    [-9.38, 9.38].forEach((z) => {
      addBox(church, [0.8, 13.2, 0.9], [x, 6.6, z], materials.shadowStone);
      addBox(church, [1.15, 0.5, 1.2], [x, 12.8, z], materials.paleStone);
    });
  });

  [-16.2, -8.7, -1.2, 6.3, 13.8, 21.1].forEach((x) => {
    const northWindow = createArch(2.15, 5.4, materials.opening);
    northWindow.position.set(x, 5.2, 9.51);
    northWindow.rotation.y = Math.PI;
    church.add(northWindow);

    const southWindow = createArch(2.15, 5.4, materials.opening);
    southWindow.position.set(x, 5.2, -9.51);
    church.add(southWindow);
  });

  // Shallow sanctuary block and parapet at the east end.
  addBox(church, [6.5, 12, 15.2], [25.2, 6, 0], materials.warmStone);
  addBox(church, [7.2, 0.55, 16], [25.2, 12.05, 0], materials.paleStone);
  const apseWindow = createArch(2.3, 5.6, materials.opening);
  placeOnBack(apseWindow, 28.51, 4.9, 0);
  church.add(apseWindow);
}

function addPediment(church, materials) {
  const shape = new THREE.Shape();
  shape.moveTo(-5.5, 17.5);
  shape.lineTo(0, 22.7);
  shape.lineTo(5.5, 17.5);
  shape.closePath();

  const pediment = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    materials.warmStone
  );
  placeOnFront(pediment, 0, 0, -25.75);
  church.add(pediment);

  [[-5.7, 17.55], [0, 23.1], [5.7, 17.55]].forEach(([z, y]) => {
    addBox(church, [0.75, 0.48, 1], [-25.82, y, z], materials.paleStone);
  });

  const leftTrim = addBox(
    church,
    [0.72, 0.5, 7.4],
    [-25.83, 20.1, -2.75],
    materials.paleStone
  );
  leftTrim.rotation.x = -Math.atan2(5.2, 5.5);
  const rightTrim = addBox(
    church,
    [0.72, 0.5, 7.4],
    [-25.83, 20.1, 2.75],
    materials.paleStone
  );
  rightTrim.rotation.x = Math.atan2(5.2, 5.5);

  const statue = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 2.6, 10),
    materials.paleStone
  );
  body.position.y = 1.35;
  statue.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 8),
    materials.paleStone
  );
  head.position.y = 2.85;
  statue.add(head);
  statue.position.set(-25.9, 23.3, 0);
  church.add(statue);
}

function addPortico(church, materials) {
  addBox(church, [4.3, 0.62, 11], [-28.1, 8.75, 0], materials.paleStone);

  [-4.35, -1.45, 1.45, 4.35].forEach((z) => {
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.52, 7.6, 16),
      materials.paleStone
    );
    column.position.set(-29.45, 4.55, z);
    church.add(column);
    addBox(church, [1.05, 0.38, 1.05], [-29.45, 8.45, z], materials.paleStone);
    addBox(church, [1.12, 0.32, 1.12], [-29.45, 0.62, z], materials.paleStone);
  });

  const canopy = new THREE.Shape();
  canopy.moveTo(-5.8, 8.95);
  canopy.lineTo(0, 12.15);
  canopy.lineTo(5.8, 8.95);
  canopy.closePath();
  const canopyFace = new THREE.Mesh(
    new THREE.ShapeGeometry(canopy),
    materials.paleStone
  );
  placeOnFront(canopyFace, 0, 0, -29.7);
  church.add(canopyFace);

  [
    [-30.2, 0.48, 12.8],
    [-30.9, 0.32, 14.1],
    [-31.6, 0.18, 15.4]
  ].forEach(([x, y, width], index) => {
    addBox(church, [1.5, 0.32 - index * 0.04, width], [x, y, 0], materials.paleStone);
  });
}

function addFacade(church, materials) {
  addBox(church, [2.2, 17.5, 22], [-24.8, 8.75, 0], materials.warmStone);
  addBox(church, [2.35, 0.65, 23], [-25, 13.1, 0], materials.paleStone);
  addBox(church, [2.4, 0.6, 23.4], [-25.05, 17.35, 0], materials.paleStone);

  [-10.6, -6.3, 6.3, 10.6].forEach((z) => {
    addBox(church, [0.75, 17.6, 0.8], [-26.05, 8.8, z], materials.shadowStone);
    addBox(church, [1, 0.5, 1.1], [-26.08, 16.8, z], materials.paleStone);
  });

  addFrontArch(church, 0.55, 0, 4, 6.9, materials.paleStone, materials.wood);
  [-7.9, 7.9].forEach((z) => {
    addFrontArch(church, 0.55, z, 2.4, 5, materials.paleStone, materials.wood);
  });

  [-2.35, 0, 2.35].forEach((z) => {
    addFrontArch(church, 10.3, z, 1.65, 4.3, materials.paleStone, materials.opening);
  });

  const niche = createArch(1.5, 3.9, materials.opening);
  placeOnFront(niche, 11, 0, -25.77);
  church.add(niche);
  const nicheStatue = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1.8, 10),
    materials.paleStone
  );
  nicheStatue.position.set(-25.85, 12.05, 0);
  church.add(nicheStatue);

  addPediment(church, materials);
  addPortico(church, materials);
}

function addClock(church, towerZ, materials) {
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 28),
    materials.clock
  );
  placeOnFront(face, 20.15, towerZ, -26.24);
  church.add(face);

  const rim = new THREE.Mesh(
    new THREE.RingGeometry(1.18, 1.42, 28),
    materials.shadowStone
  );
  placeOnFront(rim, 20.15, towerZ, -26.3);
  church.add(rim);

  addBox(church, [0.12, 0.12, 1.35], [-26.35, 20.15, towerZ], materials.shadowStone)
    .rotation.x = 0.55;
}

function addTowerOpenings(church, towerZ, materials) {
  const front = createArch(2.7, 6.1, materials.opening);
  placeOnFront(front, 23.1, towerZ, -26.17);
  church.add(front);

  [-1.55, 1.55].forEach((offset) => {
    const south = createArch(2.2, 5.5, materials.opening);
    placeOnSouth(south, -23.4 + offset, 23.35, towerZ + Math.sign(towerZ) * 3.21);
    church.add(south);
  });
}

function addTower(church, towerZ, materials) {
  addBox(church, [6.7, 18.2, 6.7], [-23.1, 9.1, towerZ], materials.warmStone);
  addBox(church, [7.4, 0.7, 7.4], [-23.1, 17.65, towerZ], materials.paleStone);
  addClock(church, towerZ, materials);

  addBox(church, [6.15, 8, 6.15], [-23.1, 22.5, towerZ], materials.warmStone);
  [-2.75, 2.75].forEach((xOffset) => {
    [-2.75, 2.75].forEach((zOffset) => {
      addBox(
        church,
        [0.52, 8.1, 0.52],
        [-23.1 + xOffset, 22.55, towerZ + zOffset],
        materials.paleStone
      );
    });
  });
  addTowerOpenings(church, towerZ, materials);
  addBox(church, [7, 0.62, 7], [-23.1, 26.6, towerZ], materials.paleStone);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3.35, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.warmStone
  );
  dome.position.set(-23.1, 26.9, towerZ);
  church.add(dome);

  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 1.05, 2.3, 12),
    materials.paleStone
  );
  lantern.position.set(-23.1, 30.25, towerZ);
  church.add(lantern);
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(1.15, 1.65, 12),
    materials.warmStone
  );
  cap.position.set(-23.1, 32.2, towerZ);
  church.add(cap);
  addBox(church, [0.16, 1.6, 0.16], [-23.1, 33.65, towerZ], materials.cross);
  addBox(church, [0.16, 0.16, 0.9], [-23.1, 33.85, towerZ], materials.cross);
}

export function createModel() {
  const church = new THREE.Group();
  const materials = createMaterials();

  addNave(church, materials);
  addFacade(church, materials);
  addTower(church, -8.25, materials);
  addTower(church, 8.25, materials);

  return church;
}
