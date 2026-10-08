import * as THREE from "three";
import { addBox } from "../shared/geometry.js";

const LENGTH = 40.73;
const WIDTH = 25.84;
const FRONT = -LENGTH / 2;
const WALL = 17.8;

function createMaterials() {
  const stone = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.96 });
  return {
    stone: stone(0xe2c89e), trim: stone(0xf1dab0), shade: stone(0xbfa37b),
    roof: stone(0xc4c0b3), dome: stone(0xc48f84), door: stone(0x756149),
    statue: stone(0xe1dfd4),
    glass: new THREE.MeshStandardMaterial({ color: 0x36484a, roughness: 0.45, side: THREE.DoubleSide }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x617b61, roughness: 0.7, metalness: 0.3 })
  };
}

function shapeGeometry(points, depth) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 16 });
}

function frontMesh(parent, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = -Math.PI / 2;
  parent.add(mesh);
  return mesh;
}

function archedPanel(width, height, material) {
  const radius = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(radius, 0);
  shape.lineTo(radius, height - radius);
  shape.absarc(0, height - radius, radius, 0, Math.PI, false);
  shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 20), material);
}

function frontArch(parent, width, height, x, y, z, material) {
  const mesh = archedPanel(width, height, material);
  mesh.rotation.y = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function beam(parent, start, end, radius, material) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
  mesh.position.copy(a.add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(mesh);
}

function cross(parent, position, height, material) {
  const [x, y, z] = position;
  addBox(parent, [0.19, height, 0.19], position, material);
  addBox(parent, [0.2, 0.18, height * 0.6], [x, y + height * 0.15, z], material);
}

function capital(parent, x, y, z, width, m) {
  addBox(parent, [0.58, 0.3, width + 0.28], [x, y + 0.25, z], m.trim);
  [-1, 1].forEach((side) => {
    frontMesh(parent, new THREE.TorusGeometry(width * 0.23, 0.065, 6, 12), m.trim, x - 0.34, y, z + side * width * 0.36);
  });
  for (let offset = -width * 0.3; offset <= width * 0.31; offset += width * 0.3) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), m.trim);
    leaf.scale.set(0.7, 1.7, 0.9);
    leaf.position.set(x - 0.28, y - 0.27, z + offset);
    parent.add(leaf);
  }
}

function pilaster(parent, x, z, bottom, height, width, m) {
  addBox(parent, [0.4, height, width], [x, bottom + height / 2, z], m.trim);
  addBox(parent, [0.62, 0.38, width + 0.28], [x - 0.08, bottom + 0.15, z], m.shade);
  capital(parent, x, bottom + height - 0.3, z, width, m);
}

function curvedPediment(parent, x, y, z, width, m) {
  const points = [];
  for (let i = 0; i <= 20; i += 1) {
    const offset = -width / 2 + width * i / 20;
    points.push(new THREE.Vector3(x, y + Math.sin(i / 20 * Math.PI) * 0.6, z + offset));
  }
  parent.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.13, 6, false), m.trim));
}

function addBody(church, m) {
  addBox(church, [LENGTH, WALL, WIDTH], [0, WALL / 2, 0], m.stone).name = "church-body";
  addBox(church, [LENGTH + 0.2, 0.3, WIDTH + 0.2], [0, WALL + 0.15, 0], m.roof);
  // The aerial shows a flat nave roof continuing behind the dome.
  addBox(church, [24.8, 0.2, 17.1], [7.85, WALL + 0.34, 0], m.roof).name = "rear-flat-roof";
  [-1, 1].forEach((side) => {
    const z = side * (WIDTH / 2 + 0.08);
    for (const y of [1.15, 9.7, 10.12, 17.55]) {
      addBox(church, [LENGTH + 0.3, 0.28, 0.5], [0, y, z], y === 1.15 ? m.shade : m.trim);
    }
    [-13, -4.5, 4, 12.5, 19.5].forEach((x) => {
      const pier = new THREE.Group();
      pier.position.set(x, 0, z);
      pier.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      church.add(pier);
      pilaster(pier, 0, 0, 1.35, 7.9, 0.85, m);
      pilaster(pier, 0, 0, 10.35, 6.8, 0.68, m);
    });
    [-8.75, -0.25, 8.25, 16.4].forEach((x) => {
      addBox(church, [1.9, 3.2, 0.15], [x, 14.5, z + side * 0.04], m.trim);
      addBox(church, [1.42, 2.65, 0.1], [x, 14.5, z + side * 0.16], m.glass);
      addBox(church, [0.09, 2.7, 0.14], [x, 14.5, z + side * 0.23], m.trim);
      addBox(church, [1.45, 0.09, 0.14], [x, 14.5, z + side * 0.23], m.trim);
    });
    addBox(church, [LENGTH, 0.65, 0.3], [0, 18.32, z], m.stone);
  });
}

function addDoor(church, z, width, height, m, main = false) {
  const door = addBox(church, [0.18, height, width], [FRONT - 0.17, height / 2, z], m.door);
  if (main) door.name = "main-entrance";
  [-1, 1].forEach((side) => {
    addBox(church, [0.6, height + 0.4, 0.3], [FRONT - 0.28, (height + 0.4) / 2, z + side * (width / 2 + 0.18)], m.trim);
    for (let y = 1; y < height; y += 1.5) {
      addBox(church, [0.08, 1.04, width * 0.33], [FRONT - 0.31, y, z + side * width * 0.24], m.shade);
    }
  });
  addBox(church, [0.72, 0.26, width + 1.0], [FRONT - 0.3, height + 0.36, z], m.trim);
  curvedPediment(church, FRONT - 0.61, height + 0.6, z, width + 1.08, m);
  // Simplified relief cartouche over each door.
  const ring = frontMesh(church, new THREE.TorusGeometry(width * 0.22, 0.1, 8, 20), m.trim, FRONT - 0.35, height + 1.55, z);
  ring.scale.y = 1.4;
  for (const side of [-1, 1]) {
    const scroll = frontMesh(church, new THREE.TorusGeometry(0.31, 0.09, 6, 16, Math.PI * 1.6), m.trim, FRONT - 0.4, height + 1.43, z + side * width * 0.39);
    scroll.scale.y = 1.3;
  }
  curvedPediment(church, FRONT - 0.32, height + 2.35, z, width * 0.9, m);
}

function addFacade(church, m) {
  addBox(church, [0.5, 20.3, WIDTH], [FRONT + 0.2, 10.15, 0], m.stone);
  [-12.15, -10.7, -6.2, -4.8, 4.8, 6.2, 10.7, 12.15].forEach((z) => {
    pilaster(church, FRONT - 0.21, z, 1.25, 8.15, 0.7, m);
    pilaster(church, FRONT - 0.21, z, 10.7, 8.3, 0.68, m);
  });
  [9.8, 10.18, 10.55, 19.35, 19.8, 20.25].forEach((y, i) => {
    addBox(church, [0.75 + (i % 3) * 0.13, 0.27, WIDTH + 0.6], [FRONT - 0.23, y, 0], m.trim);
  });
  addDoor(church, 0, 3.9, 5.4, m, true);
  [-8.3, 8.3].forEach((z) => {
    addDoor(church, z, 2.4, 4.6, m);
    frontArch(church, 3.75, 5.95, FRONT - 0.31, 11.65, z, m.trim);
    frontArch(church, 3.26, 5.48, FRONT - 0.37, 11.85, z, m.shade);
    // Balustrades across the lower edge of the upper niches.
    addBox(church, [0.52, 0.2, 3.8], [FRONT - 0.39, 11.75, z], m.trim);
    addBox(church, [0.45, 0.16, 3.66], [FRONT - 0.43, 12.42, z], m.trim);
    for (let offset = -1.45; offset <= 1.46; offset += 0.48) {
      const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.55, 8), m.trim);
      baluster.position.set(FRONT - 0.43, 12.07, z + offset); church.add(baluster);
    }
  });
  frontArch(church, 3.6, 5.6, FRONT - 0.29, 11.9, 0, m.trim);
  frontArch(church, 3.12, 5.17, FRONT - 0.35, 12.07, 0, m.shade);
  frontArch(church, 2.05, 2.45, FRONT - 0.43, 12.0, 0, m.glass);
  curvedPediment(church, FRONT - 0.56, 14.4, 0, 2.65, m);
  // Low central crest between the two towers, rather than a triangular gable.
  frontMesh(church, shapeGeometry([[-4.0, 0], [-3.0, 0.55], [-1.35, 0.55], [-0.8, 1.5], [0.8, 1.5], [1.35, 0.55], [3.0, 0.55], [4.0, 0]], 0.48), m.stone, FRONT - 0.04, 20.45, 0);
  addBox(church, [0.64, 0.2, 7.8], [FRONT - 0.2, 20.52, 0], m.trim);
  frontMesh(church, new THREE.TorusGeometry(0.52, 0.12, 8, 20), m.trim, FRONT - 0.58, 21.25, 0);
  cross(church, [FRONT - 0.28, 22.35, 0], 1.25, m.trim);
  addBox(church, [0.95, 0.18, 5.4], [FRONT - 0.47, 0.09, 0], m.shade);
}

function addTower(church, z, m) {
  const tower = new THREE.Group();
  tower.name = z < 0 ? "left-bell-tower" : "right-bell-tower";
  tower.position.set(FRONT + 2.25, 0, z);
  church.add(tower);
  addBox(tower, [4.5, 1.3, 4.8], [0, 20.8, 0], m.stone);
  addBox(tower, [5.0, 0.35, 5.3], [0, 21.5, 0], m.trim);
  // Four freestanding piers and arch spandrels leave the bell chamber open.
  [-1.83, 1.83].forEach((x) => [-1.98, 1.98].forEach((sideZ) => {
    addBox(tower, [0.85, 6.45, 0.85], [x, 24.92, sideZ], m.stone);
  }));
  for (let i = 0; i < 4; i += 1) {
    const face = new THREE.Group(); face.rotation.y = i * Math.PI / 2; tower.add(face);
    const arch = new THREE.Shape();
    arch.moveTo(-1.44, 0); arch.lineTo(-1.44, 1.65); arch.lineTo(1.44, 1.65); arch.lineTo(1.44, 0);
    arch.absarc(0, 0, 1.44, 0, Math.PI, false); arch.closePath();
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(arch, { depth: 0.25, bevelEnabled: false }), m.stone);
    mesh.position.set(0, 26.45, 2.1); face.add(mesh);
    [-1.8, 1.8].forEach((x) => {
      addBox(face, [0.3, 6.1, 0.32], [x, 24.9, 2.36], m.trim);
    });
    addBox(face, [3.05, 0.18, 0.36], [0, 21.94, 2.31], m.trim);
    for (let x = -1.14; x <= 1.15; x += 0.38) {
      const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.1, 0.48, 8), m.trim);
      baluster.position.set(x, 22.2, 2.3); face.add(baluster);
    }
    addBox(face, [3.05, 0.18, 0.36], [0, 22.48, 2.31], m.trim);
  }
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.81, 1.25, 16), m.bronze);
  bell.position.set(0, 24.25, 0); tower.add(bell);
  beam(tower, [-1.5, 25.3, 0], [1.5, 25.3, 0], 0.1, m.bronze);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), m.bronze);
  clapper.position.set(0, 23.55, 0); tower.add(clapper);
  [28.3, 28.66, 29.04].forEach((y, i) => addBox(tower, [4.85 + i * 0.14, 0.25, 5.15 + i * 0.14], [0, y, 0], m.trim));
  addBox(tower, [4.3, 0.7, 4.6], [0, 29.5, 0], m.stone);
  addBox(tower, [4.7, 0.22, 5], [0, 29.98, 0], m.trim);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.18, 1.4, 4), m.roof);
  cap.rotation.y = Math.PI / 4; cap.position.y = 30.75; tower.add(cap);
  cross(tower, [0, 32.0, 0], 0.85, m.bronze);
}

function addDome(church, m) {
  const dome = new THREE.Group(); dome.name = "front-octagonal-dome";
  dome.position.set(-6.0, 0, 0); church.add(dome);
  const cylinder = (top, bottom, height, y, material) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 8), material);
    mesh.rotation.y = Math.PI / 8; mesh.position.y = y; dome.add(mesh);
  };
  cylinder(8.8, 8.8, 5.5, 20.7, m.stone);
  cylinder(9.02, 9.02, 0.34, 18.09, m.trim);
  cylinder(9.08, 9.08, 0.36, 23.62, m.trim);
  const radius = 8.8 * Math.cos(Math.PI / 8);
  for (let i = 0; i < 8; i += 1) {
    const face = new THREE.Group(); face.rotation.y = i * Math.PI / 4; dome.add(face);
    const outer = archedPanel(2.75, 3.7, m.trim); outer.position.set(0, 19.22, radius + 0.04); face.add(outer);
    const inset = archedPanel(2.28, 3.22, m.glass); inset.position.set(0, 19.42, radius + 0.09); face.add(inset);
    addBox(face, [0.12, 2.95, 0.12], [0, 20.9, radius + 0.16], m.trim);
    addBox(face, [2.16, 0.1, 0.12], [0, 20.92, radius + 0.16], m.trim);
    [-3.15, 3.15].forEach((x) => addBox(face, [0.33, 5.3, 0.25], [x, 20.8, radius + 0.05], m.trim));
  }
  // A low eight-sided cap is visible in both aerials, with a tall lantern.
  cylinder(1.87, 8.85, 3.7, 25.65, m.dome);
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.PI / 8 + i * Math.PI / 4;
    beam(dome, [Math.sin(angle) * 8.92, 23.85, Math.cos(angle) * 8.92], [Math.sin(angle) * 1.91, 27.56, Math.cos(angle) * 1.91], 0.16, m.trim);
  }
  cylinder(2.06, 2.06, 0.22, 27.65, m.trim);
  cylinder(1.73, 1.73, 3.6, 29.52, m.stone);
  for (let i = 0; i < 8; i += 1) {
    const face = new THREE.Group(); face.rotation.y = i * Math.PI / 4; dome.add(face);
    addBox(face, [0.62, 2.6, 0.08], [0, 29.55, 1.62], m.glass);
    [-0.58, 0.58].forEach((x) => addBox(face, [0.14, 3.5, 0.18], [x, 29.5, 1.65], m.trim));
  }
  cylinder(1.98, 1.98, 0.24, 31.46, m.trim);
  cylinder(0.16, 1.97, 1.05, 32.1, m.dome);
  cross(dome, [0, 33.14, 0], 0.9, m.bronze);
}

function addCornerStatue(church, m) {
  const statue = new THREE.Group(); statue.name = "corner-saint-statue";
  statue.position.set(FRONT - 0.35, 0, WIDTH / 2 + 0.28); church.add(statue);
  addBox(statue, [1.1, 1.45, 1.1], [0, 0.73, 0], m.shade);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.58, 1.95, 8), m.statue);
  pedestal.position.y = 2.38; statue.add(pedestal);
  addBox(statue, [0.95, 0.3, 0.95], [0, 3.5, 0], m.statue);
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.44, 1.65, 10), m.statue);
  robe.position.y = 4.46; statue.add(robe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), m.statue);
  head.position.y = 5.49; statue.add(head);
  const mitre = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.42, 4), m.statue);
  mitre.position.y = 5.77; statue.add(mitre);
  beam(statue, [-0.22, 5.0, -0.25], [-0.36, 4.3, -0.25], 0.09, m.statue);
  beam(statue, [0.23, 4.98, 0.22], [0.28, 4.51, 0.28], 0.09, m.statue);
}

export function createModel() {
  const church = new THREE.Group(); church.name = "church-0047";
  const materials = createMaterials();
  addBody(church, materials);
  addFacade(church, materials);
  [-9.45, 9.45].forEach((z) => addTower(church, z, materials));
  addDome(church, materials);
  addCornerStatue(church, materials);
  return church;
}
