import * as THREE from "three";
import { addBox, createArch } from "../shared/geometry.js";
import { createChurchMaterials } from "../shared/materials.js";

function createMaterials() {
  const materials = createChurchMaterials();

  return {
    ...materials,
    cathedralStone: new THREE.MeshStandardMaterial({
      color: 0xd8c29d,
      roughness: 0.96
    }),
    cathedralLight: new THREE.MeshStandardMaterial({
      color: 0xead9b8,
      roughness: 0.92
    }),
    roofPale: new THREE.MeshStandardMaterial({
      color: 0xd8d4c8,
      roughness: 0.84
    }),
    recess: new THREE.MeshStandardMaterial({
      color: 0x423b33,
      roughness: 0.82,
      side: THREE.DoubleSide
    }),
    clockFace: new THREE.MeshStandardMaterial({
      color: 0xf1eee2,
      roughness: 0.76,
      side: THREE.DoubleSide
    }),
    clockHand: new THREE.MeshStandardMaterial({
      color: 0x2d302d,
      roughness: 0.65
    })
  };
}

function createGableRoof(length, width, eaveHeight, rise, material) {
  const halfLength = length / 2;
  const halfWidth = width / 2;
  const ridgeHeight = eaveHeight + rise;
  const vertices = [
    -halfLength, eaveHeight, -halfWidth,
    halfLength, eaveHeight, -halfWidth,
    halfLength, ridgeHeight, 0,
    -halfLength, eaveHeight, -halfWidth,
    halfLength, ridgeHeight, 0,
    -halfLength, ridgeHeight, 0,

    -halfLength, ridgeHeight, 0,
    halfLength, ridgeHeight, 0,
    halfLength, eaveHeight, halfWidth,
    -halfLength, ridgeHeight, 0,
    halfLength, eaveHeight, halfWidth,
    -halfLength, eaveHeight, halfWidth,

    -halfLength, eaveHeight, -halfWidth,
    -halfLength, ridgeHeight, 0,
    -halfLength, eaveHeight, halfWidth,

    halfLength, eaveHeight, -halfWidth,
    halfLength, eaveHeight, halfWidth,
    halfLength, ridgeHeight, 0
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function placeOnFacade(mesh, y, z, x = -30.65) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function placeOnSouth(mesh, x, y, z = -10.15) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI;
  return mesh;
}

function placeOnNorth(mesh, x, y, z = 10.15) {
  mesh.position.set(x, y, z);
  return mesh;
}

function createFacadeShape(points, material, x = -30.55) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([z, y]) => shape.lineTo(z, y));
  shape.closePath();

  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  mesh.position.x = x;
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function addSideChapels(church, materials) {
  [-21, -13, -5, 3, 11, 19, 27].forEach((x) => {
    [-12.4, 12.4].forEach((z) => {
      addBox(church, [7.1, 9.2, 5], [x, 4.6, z], materials.cathedralStone);
      addBox(church, [7.45, 0.48, 5.35], [x, 9.3, z], materials.cathedralLight);
    });
  });

  [-25, -17, -9, -1, 7, 15, 23, 30].forEach((x) => {
    [-14.85, 14.85].forEach((z) => {
      addBox(church, [0.72, 10, 0.78], [x, 5, z], materials.cathedralLight);
    });
  });
}

function addClerestoryWindows(church, materials) {
  [-20, -13, -6, 1, 8, 15, 22].forEach((x) => {
    const southSurround = createArch(1.75, 3.7, materials.cathedralLight);
    placeOnSouth(southSurround, x, 10.2, -10.17);
    church.add(southSurround);

    const southWindow = createArch(1.15, 3.15, materials.recess);
    placeOnSouth(southWindow, x, 10.48, -10.22);
    church.add(southWindow);

    const northSurround = createArch(1.75, 3.7, materials.cathedralLight);
    placeOnNorth(northSurround, x, 10.2, 10.17);
    church.add(northSurround);

    const northWindow = createArch(1.15, 3.15, materials.recess);
    placeOnNorth(northWindow, x, 10.48, 10.22);
    church.add(northWindow);
  });
}

function addMainBody(church, materials) {
  addBox(church, [59, 14, 20], [0, 7, 0], materials.cathedralStone);
  addBox(church, [59.8, 0.62, 20.8], [0, 14.15, 0], materials.cathedralLight);
  church.add(createGableRoof(58.5, 20.5, 14.4, 7.2, materials.roofPale));

  addSideChapels(church, materials);
  addClerestoryWindows(church, materials);
}

function addFacadePilasters(church, materials) {
  [-17.2, -9.2, 9.2, 17.2].forEach((z) => {
    addBox(church, [1, 18.2, 0.82], [-30.55, 9.1, z], materials.cathedralLight);
  });

  [-17.6, -8.8, 8.8, 17.6].forEach((z) => {
    addBox(church, [1.35, 0.7, 1.2], [-30.62, 12.15, z], materials.cathedralLight);
  });
}

function addPortal(church, materials) {
  const outer = createArch(5.6, 8.1, materials.cathedralLight);
  placeOnFacade(outer, 0.7, 0, -30.72);
  church.add(outer);

  const door = createArch(3.9, 6.35, materials.wood);
  placeOnFacade(door, 0.82, 0, -30.8);
  church.add(door);

  [-3.05, 3.05].forEach((z) => {
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.46, 6.1, 12),
      materials.cathedralLight
    );
    column.position.set(-31.05, 3.7, z);
    church.add(column);
    addBox(church, [0.95, 0.42, 0.95], [-31.05, 6.85, z], materials.trim);
    addBox(church, [1, 0.36, 1], [-31.05, 0.58, z], materials.trim);
  });

  addBox(church, [1.6, 0.72, 8], [-31.1, 7.2, 0], materials.cathedralLight);
  for (let z = -3.2; z <= 3.2; z += 1.6) {
    addBox(church, [0.34, 1.15, 0.3], [-31.35, 7.9, z], materials.cathedralLight);
  }
}

function addCentralFacade(church, materials) {
  addBox(church, [2, 17.5, 18], [-29.55, 8.75, 0], materials.cathedralStone);
  church.add(
    createFacadeShape(
      [[-9, 17.2], [0, 21.1], [9, 17.2]],
      materials.cathedralStone
    )
  );

  const pedimentTrim = createFacadeShape(
    [[-9.4, 17.25], [0, 21.65], [9.4, 17.25], [9, 16.75], [0, 20.55], [-9, 16.75]],
    materials.cathedralLight,
    -30.7
  );
  church.add(pedimentTrim);

  const upperWindowSurround = createArch(3.6, 4.1, materials.cathedralLight);
  placeOnFacade(upperWindowSurround, 11.8, 0, -30.72);
  church.add(upperWindowSurround);

  const upperWindow = createArch(2.65, 3.35, materials.recess);
  placeOnFacade(upperWindow, 12.15, 0, -30.8);
  church.add(upperWindow);

  [-6.5, 6.5].forEach((z) => {
    const niche = createArch(2.1, 4.6, materials.cathedralLight);
    placeOnFacade(niche, 3.1, z, -30.7);
    church.add(niche);

    const inset = createArch(1.5, 4, materials.cathedralStone);
    placeOnFacade(inset, 3.35, z, -30.77);
    church.add(inset);
  });

  addPortal(church, materials);
}

function addClock(church, materials, y, z) {
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(1.45, 1.75, 32),
    materials.cathedralLight
  );
  placeOnFacade(rim, y, z, -31.05);
  church.add(rim);

  const face = new THREE.Mesh(
    new THREE.CircleGeometry(1.46, 32),
    materials.clockFace
  );
  placeOnFacade(face, y, z, -31.12);
  church.add(face);

  const hourHand = addBox(
    church,
    [0.12, 1.05, 0.12],
    [-31.18, y + 0.35, z],
    materials.clockHand
  );
  hourHand.rotation.x = 0.35;
  const minuteHand = addBox(
    church,
    [0.12, 0.12, 1.15],
    [-31.18, y, z + 0.4],
    materials.clockHand
  );
  minuteHand.rotation.x = -0.2;
}

function addBellOpening(church, towerZ, materials) {
  const surround = createArch(3.3, 5.1, materials.cathedralLight);
  placeOnFacade(surround, 20.1, towerZ, -31.04);
  church.add(surround);

  const opening = createArch(2.45, 4.4, materials.recess);
  placeOnFacade(opening, 20.45, towerZ, -31.12);
  church.add(opening);

  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.cross
  );
  bell.position.set(-31.23, 21.2, towerZ);
  bell.rotation.z = Math.PI / 2;
  church.add(bell);
}

function addPyramidRoof(church, z, materials) {
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(5.2, 5.8, 4),
    materials.roofPale
  );
  roof.position.set(-26.5, 29.9, z);
  roof.rotation.y = Math.PI / 4;
  church.add(roof);
}

function addCross(church, position, materials) {
  addBox(church, [0.24, 2.1, 0.24], position, materials.cross);
  addBox(
    church,
    [0.28, 0.24, 1.35],
    [position[0], position[1] + 0.35, position[2]],
    materials.cross
  );
}

function addBellTowers(church, materials) {
  [-13.4, 13.4].forEach((z) => {
    addBox(church, [8.4, 26.8, 8.4], [-26.5, 13.4, z], materials.cathedralStone);
    addBox(church, [9, 0.72, 9], [-26.5, 12.2, z], materials.cathedralLight);
    addBox(church, [9, 0.72, 9], [-26.5, 19.1, z], materials.cathedralLight);
    addBox(church, [9.1, 0.72, 9.1], [-26.5, 26.95, z], materials.cathedralLight);

    [-17.2, -9.6].forEach((pilasterZ) => {
      const actualZ = z < 0 ? pilasterZ : -pilasterZ;
      addBox(
        church,
        [0.85, 26.5, 0.72],
        [-30.65, 13.25, actualZ],
        materials.cathedralLight
      );
    });

    addBellOpening(church, z, materials);
  });

  const leftMiddleWindow = createArch(1.8, 3, materials.recess);
  placeOnFacade(leftMiddleWindow, 14.1, -13.4, -31.02);
  church.add(leftMiddleWindow);

  addClock(church, materials, 14.8, 13.4);
  addPyramidRoof(church, -13.4, materials);
  addCross(church, [-26.5, 33.5, -13.4], materials);

  [-29.9, -23.1].forEach((x) => {
    [10.1, 16.7].forEach((z) => {
      const pinnacle = new THREE.Mesh(
        new THREE.ConeGeometry(0.48, 2.6, 4),
        materials.roofPale
      );
      pinnacle.position.set(x, 28.5, z);
      pinnacle.rotation.y = Math.PI / 4;
      church.add(pinnacle);
    });
  });
  addCross(church, [-26.5, 29.3, 13.4], materials);
}

function addSteps(church, materials) {
  [
    { x: -31.2, y: 0.26, h: 0.52, width: 21 },
    { x: -32.1, y: 0.18, h: 0.36, width: 24 },
    { x: -33, y: 0.11, h: 0.22, width: 27 }
  ].forEach((step) => {
    addBox(
      church,
      [1.8, step.h, step.width],
      [step.x, step.y, 0],
      materials.cathedralLight
    );
  });
}

export function createModel() {
  const church = new THREE.Group();
  const materials = createMaterials();

  addMainBody(church, materials);
  addCentralFacade(church, materials);
  addFacadePilasters(church, materials);
  addBellTowers(church, materials);
  addSteps(church, materials);

  return church;
}
