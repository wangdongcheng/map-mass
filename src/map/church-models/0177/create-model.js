import * as THREE from "three";
import { addBox, createArch } from "../shared/geometry.js";

const FRONT = -19.84;
const WIDTH = 9.97;
const WALL = 13.2;

function createMaterials() {
  const stone = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.96 });
  return {
    stone: stone(0xc9b18c), trim: stone(0xe0c9a5), inset: stone(0xa48b6b),
    roof: stone(0xb3a99a), dome: stone(0xa86e70), door: stone(0x4c3c2f),
    dark: new THREE.MeshStandardMaterial({ color: 0x242a28, roughness: 0.86, side: THREE.DoubleSide }),
    metal: new THREE.MeshStandardMaterial({ color: 0x53534a, roughness: 0.65, metalness: 0.3 })
  };
}

function facadeMesh(parent, geometry, material, x, y, z, name) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.name = name ?? "";
  parent.add(mesh);
  return mesh;
}

function outline(points, depth) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}

function beam(parent, start, end, radius, material) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 6), material);
  mesh.position.copy(a.add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(mesh);
  return mesh;
}

function cross(parent, x, y, z, height, material) {
  addBox(parent, [0.18, height, 0.18], [x, y, z], material);
  addBox(parent, [0.2, 0.18, height * 0.65], [x, y + height * 0.16, z], material);
}

function addBody(church, m) {
  addBox(church, [39.68, WALL, WIDTH], [0, WALL / 2, 0], m.stone).name = "church-body";
  addBox(church, [39.9, 0.36, WIDTH + 0.35], [0, WALL, 0], m.trim);
  // Shallow pitched nave roof, followed by the rear octagonal drum.
  const roof = new THREE.Mesh(outline([[-5.02, 0], [0, 2.25], [5.02, 0]], 28.5), m.roof);
  roof.rotation.y = -Math.PI / 2;
  roof.position.set(8.6, WALL + 0.2, 0);
  roof.name = "pitched-nave-roof";
  church.add(roof);
  addBox(church, [28.8, 0.16, 0.2], [-5.65, WALL + 2.46, 0], m.inset);
  for (let x = -19.5; x < 8.6; x += 1.25) {
    [-1, 1].forEach((side) => beam(church, [x, WALL + 2.5, 0], [x, WALL + 0.28, side * 4.98], 0.035, m.inset));
  }
  [-1, 1].forEach((side) => {
    const z = side * (WIDTH / 2 + 0.02);
    [-13, -5, 3].forEach((x) => {
      addBox(church, [0.5, WALL, 0.24], [x, WALL / 2, z], m.trim);
      addBox(church, [1.55, 2.7, 0.12], [x + 3, 9.6, z + side * 0.07], m.trim);
      addBox(church, [1.16, 2.25, 0.12], [x + 3, 9.6, z + side * 0.15], m.dark);
    });
    addBox(church, [39.8, 0.35, 0.3], [0, 1.2, z], m.inset);
  });
}

function addPilaster(church, z, m) {
  addBox(church, [0.44, 1.05, 1.05], [FRONT - 0.12, 0.53, z], m.inset);
  addBox(church, [0.42, 9.3, 0.69], [FRONT - 0.16, 5.66, z], m.trim);
  addBox(church, [0.54, 0.28, 1.04], [FRONT - 0.2, 1.15, z], m.trim);
  addBox(church, [0.58, 0.5, 1.03], [FRONT - 0.25, 10.55, z], m.trim);
  [-0.39, 0.39].forEach((offset) => {
    facadeMesh(church, new THREE.TorusGeometry(0.2, 0.065, 6, 12), m.trim, FRONT - 0.55, 10.62, z + offset);
  });
  for (const offset of [-0.2, 0, 0.2]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), m.trim);
    leaf.scale.set(0.65, 1.7, 0.8);
    leaf.position.set(FRONT - 0.42, 10.25, z + offset);
    church.add(leaf);
  }
}

function addFacade(church, m) {
  [-4.6, -2.02, 2.02, 4.6].forEach((z) => addPilaster(church, z, m));
  [10.95, 11.35, 12.2, 13.18].forEach((y, index) => {
    addBox(church, [0.64 + index * 0.1, 0.27, WIDTH + 0.6], [FRONT - 0.23, y, 0], m.trim);
  });
  // A solid triangular pediment with an oval oculus and raking cornice.
  facadeMesh(church, outline([[-5.05, 0], [0, 2.7], [5.05, 0]], 0.45), m.stone, FRONT - 0.2, 13.3, 0, "front-pediment");
  [-1, 1].forEach((side) => {
    beam(church, [FRONT - 0.73, 13.35, side * 5.18], [FRONT - 0.73, 16.16, 0], 0.16, m.trim);
    beam(church, [FRONT - 0.65, 13.64, side * 4.64], [FRONT - 0.65, 16.13, 0], 0.07, m.inset);
  });
  const oculus = facadeMesh(church, new THREE.CircleGeometry(0.47, 24), m.dark, FRONT - 0.68, 14.18, 0);
  oculus.scale.set(1.25, 0.86, 1);
  const ring = facadeMesh(church, new THREE.TorusGeometry(0.55, 0.095, 8, 24), m.trim, FRONT - 0.72, 14.18, 0);
  ring.scale.set(1.25, 0.86, 1);
  cross(church, FRONT - 0.4, 16.55, 0, 0.9, m.trim);

  [-3.27, 3.27].forEach((z) => {
    addBox(church, [0.24, 3.45, 1.62], [FRONT - 0.15, 7.55, z], m.trim);
    addBox(church, [0.12, 2.98, 1.24], [FRONT - 0.32, 7.55, z], m.dark);
    for (let offset = -0.48; offset <= 0.48; offset += 0.24) {
      addBox(church, [0.06, 2.85, 0.035], [FRONT - 0.4, 7.55, z + offset], m.metal);
    }
    for (let y = 6.3; y <= 8.8; y += 0.35) {
      addBox(church, [0.06, 0.035, 1.18], [FRONT - 0.4, y, z], m.metal);
    }
    addBox(church, [0.5, 0.23, 1.92], [FRONT - 0.22, 5.75, z], m.trim);
  });

  const door = addBox(church, [0.14, 4.05, 2.25], [FRONT - 0.18, 2.03, 0], m.door);
  door.name = "main-entrance";
  [-1.32, 1.32].forEach((z) => {
    addBox(church, [0.52, 4.5, 0.35], [FRONT - 0.26, 2.25, z], m.trim);
    [-0.65, 0.65].forEach((offset) => addBox(church, [0.06, 3.5, 0.07], [FRONT - 0.28, 2.04, offset], m.inset));
  });
  addBox(church, [0.66, 0.32, 3.18], [FRONT - 0.36, 4.53, 0], m.trim);
  const canopy = new THREE.Shape();
  canopy.moveTo(-1.6, 0);
  canopy.quadraticCurveTo(0, 1.28, 1.6, 0);
  canopy.lineTo(1.6, 0.21);
  canopy.quadraticCurveTo(0, 1.53, -1.6, 0.21);
  canopy.closePath();
  facadeMesh(church, new THREE.ExtrudeGeometry(canopy, { depth: 0.65, bevelEnabled: false }), m.trim, FRONT - 0.08, 4.69, 0);

  // Relief plaque and simplified crowned Franciscan coat of arms.
  addBox(church, [0.25, 3.28, 3.05], [FRONT - 0.16, 8.05, 0], m.trim);
  addBox(church, [0.12, 2.85, 2.63], [FRONT - 0.34, 8.05, 0], m.inset);
  facadeMesh(church, outline([[-0.7, 0.7], [-0.6, -0.3], [0, -0.85], [0.6, -0.3], [0.7, 0.7]], 0.16), m.trim, FRONT - 0.48, 8.0, 0, "coat-of-arms");
  cross(church, FRONT - 0.7, 8.02, 0, 0.88, m.inset);
  [-1, 1].forEach((side) => {
    const scroll = facadeMesh(church, new THREE.TorusGeometry(0.41, 0.105, 8, 18, Math.PI * 1.7), m.trim, FRONT - 0.57, 8.03, side * 0.88);
    scroll.scale.y = 1.6;
  });
  addBox(church, [0.3, 0.24, 1.25], [FRONT - 0.55, 9.06, 0], m.trim);
  for (let z = -0.45; z <= 0.46; z += 0.225) {
    addBox(church, [0.2, 0.27, 0.12], [FRONT - 0.57, 9.29, z], m.trim);
  }
  addBox(church, [1.25, 0.18, 3.15], [FRONT - 0.56, 0.09, 0], m.inset);
}

function addBellTower(church, m) {
  const tower = new THREE.Group();
  tower.name = "front-left-bell-tower";
  tower.position.set(-17.6, 0, -6.92);
  church.add(tower);
  addBox(tower, [4.5, 15.5, 3.9], [0, 7.75, 0], m.stone);
  [3.8, 10.6, 14.1, 15.55].forEach((y) => addBox(tower, [4.8, 0.3, 4.2], [0, y, 0], m.trim));
  // Belfry is open between four corner piers, with arches on all four faces.
  [-1.82, 1.82].forEach((x) => [-1.51, 1.51].forEach((z) => {
    addBox(tower, [0.82, 4.7, 0.88], [x, 18.03, z], m.trim);
  }));
  for (let side = 0; side < 4; side += 1) {
    const face = new THREE.Group();
    face.rotation.y = side * Math.PI / 2;
    tower.add(face);
    const shape = new THREE.Shape();
    shape.moveTo(-1.37, 0); shape.lineTo(-1.37, 1.5); shape.lineTo(1.37, 1.5); shape.lineTo(1.37, 0);
    shape.absarc(0, 0, 1.37, 0, Math.PI, false); shape.closePath();
    const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: false }), m.stone);
    arch.position.set(0, 18.75, 1.69);
    face.add(arch);
    // Lower recessed opening beneath the belfry.
    const lower = createArch(1.38, 2.35, m.dark);
    lower.position.set(0, 11.05, 1.96);
    face.add(lower);
  }
  addBox(tower, [4.85, 0.38, 4.3], [0, 20.45, 0], m.trim);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.76, 1.05, 16), m.metal);
  bell.position.set(0, 17.6, 0); tower.add(bell);
  beam(tower, [-1.5, 18.5, 0], [1.5, 18.5, 0], 0.1, m.metal);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), m.metal);
  clapper.position.set(0, 16.95, 0); tower.add(clapper);
  addBox(tower, [3.95, 0.8, 3.4], [0, 21.04, 0], m.stone);
  addBox(tower, [4.36, 0.24, 3.8], [0, 21.54, 0], m.trim);
  [-1, 1].forEach((side) => beam(tower, [-2.24, 21.65, side * 1.9], [-2.24, 22.55, 0], 0.13, m.trim));
  cross(tower, 0, 22.13, 0, 0.95, m.trim);
}

function addDome(church, m) {
  const dome = new THREE.Group();
  dome.name = "rear-dome";
  dome.position.set(13.2, 0, 0);
  church.add(dome);
  const cylinder = (top, bottom, height, y, material, segments = 8) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material);
    mesh.rotation.y = Math.PI / 8;
    mesh.position.y = y;
    dome.add(mesh);
    return mesh;
  };
  cylinder(5.08, 5.08, 3.2, 14.92, m.stone);
  cylinder(5.28, 5.28, 0.35, 13.38, m.trim);
  cylinder(5.32, 5.32, 0.42, 16.62, m.trim);
  const faceRadius = 5.08 * Math.cos(Math.PI / 8);
  for (let i = 0; i < 8; i += 1) {
    const angle = i * Math.PI / 4;
    const face = new THREE.Group();
    face.rotation.y = angle;
    dome.add(face);
    const frame = new THREE.Mesh(new THREE.CircleGeometry(0.76, 20), m.trim);
    frame.scale.set(1.18, 0.7, 1); frame.position.set(0, 15.35, faceRadius + 0.035); face.add(frame);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.57, 20), m.dark);
    glass.scale.set(1.18, 0.7, 1); glass.position.set(0, 15.35, faceRadius + 0.065); face.add(glass);
    addBox(face, [0.1, 0.7, 0.1], [0, 15.35, faceRadius + 0.12], m.trim);
  }
  const profile = [[5.06, 16.88], [4.94, 17.32], [4.67, 18.0], [4.23, 18.9], [3.58, 19.9], [2.73, 20.86], [1.71, 21.58], [0.86, 21.93]];
  const cap = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 32), m.dome);
  cap.name = "rose-dome-cap";
  dome.add(cap);
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.PI / 8 + i * Math.PI / 4;
    const points = profile.map(([r, y]) => new THREE.Vector3(Math.sin(angle) * (r + 0.06), y, Math.cos(angle) * (r + 0.06)));
    const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.11, 6, false), m.trim);
    dome.add(rib);
    const corner = new THREE.Vector3(Math.sin(angle) * 5.09, 0, Math.cos(angle) * 5.09);
    addBox(dome, [0.32, 3.15, 0.32], [corner.x, 14.98, corner.z], m.trim);
  }
  cylinder(1.02, 1.02, 0.25, 22.06, m.trim);
  cylinder(0.77, 0.77, 1.4, 22.87, m.stone);
  for (let i = 0; i < 8; i += 1) {
    const face = new THREE.Group(); face.rotation.y = i * Math.PI / 4; dome.add(face);
    addBox(face, [0.27, 0.7, 0.04], [0, 22.86, 0.72], m.dark);
  }
  cylinder(0.92, 0.92, 0.19, 23.66, m.trim);
  cylinder(0.05, 0.91, 0.82, 24.12, m.dome, 16);
  cross(dome, 0, 24.88, 0, 0.9, m.trim);
}

export function createModel() {
  const church = new THREE.Group();
  church.name = "church-0177";
  const materials = createMaterials();
  addBody(church, materials);
  addFacade(church, materials);
  addBellTower(church, materials);
  addDome(church, materials);
  return church;
}
