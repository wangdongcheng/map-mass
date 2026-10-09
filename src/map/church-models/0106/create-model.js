import * as THREE from "three";
import { addBox } from "../shared/geometry.js";

// Metre coordinates traced from building:56576890-1272 in the pinned context.
export const FOOTPRINT = [
  [4.3345388548, 2.2118633703], [-3.9706516028, 2.4116452338],
  [-4.1989739416, -2.4116452343], [3.8350866883, -2.2118633707]
];
const FRONT = -4.09;

function createArch(width, height, material) {
  const radius = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0); shape.lineTo(radius, 0); shape.lineTo(radius, height - radius);
  shape.absarc(0, height - radius, radius, 0, Math.PI, false);
  shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), material);
}

function extrude(points, height, material) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geometry, material);
}

function front(parent, mesh, y, z, x = FRONT - 0.17) {
  mesh.rotation.y = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function createModel() {
  const chapel = new THREE.Group();
  chapel.name = "0106-lunzjata";
  const stone = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.98 });
  const m = { plaster: stone(0xd2cbbb), trim: stone(0xe0d7bf), roof: stone(0xa7a397),
    weather: stone(0xb1ab9a), dark: stone(0x20292e), door: stone(0x51392b), iron: stone(0x403a32) };
  const body = extrude(FOOTPRINT, 4.65, m.plaster);
  body.name = "chapel-body";
  chapel.add(body);
  const roof = extrude(FOOTPRINT, 0.16, m.roof);
  roof.position.y = 4.65;
  roof.name = "flat-nave-roof";
  chapel.add(roof);

  // The aerial reference shows a taller, flat-roofed rear service volume.
  const rear = extrude([[1.9, 2.27], FOOTPRINT[0], FOOTPRINT[3], [1.9, -2.26]], 1.6, m.plaster);
  rear.position.y = 4.65;
  rear.name = "raised-rear-annex";
  chapel.add(rear);
  addBox(chapel, [2.15, 0.17, 4.6], [2.94, 6.33, 0], m.trim);
  for (const z of [-2.27, 2.27]) {
    addBox(chapel, [2.1, 0.45, 0.18], [2.94, 6.57, z], m.plaster);
    addBox(chapel, [0.85, 1.05, 0.08], [2.85, 5.32, z + Math.sign(z) * 0.06], m.dark);
  }
  addBox(chapel, [0.12, 1.8, 0.85], [4.22, 1.5, 0.6], m.door);

  const facade = new THREE.Shape();
  facade.moveTo(-2.4, 0); facade.lineTo(2.4, 0); facade.lineTo(2.4, 4.65);
  facade.lineTo(0.45, 5.05); facade.lineTo(-2.4, 4.72); facade.closePath();
  front(chapel, new THREE.Mesh(new THREE.ExtrudeGeometry(facade, { depth: 0.22, bevelEnabled: false }), m.plaster), 0, 0, FRONT + 0.12);
  for (const z of [-2.34, 2.34]) addBox(chapel, [0.3, 4.8, 0.24], [FRONT - 0.12, 2.4, z], m.trim);
  front(chapel, createArch(1.42, 2.65, m.weather), 0.12, 0);
  const door = front(chapel, createArch(1.27, 2.55, m.door), 0.14, 0, FRONT - 0.2);
  door.name = "main-entrance";
  addBox(chapel, [0.05, 2, 0.025], [FRONT - 0.23, 1.16, 0], m.iron);
  addBox(chapel, [0.28, 0.08, 1.5], [FRONT - 0.2, 0.08, 0], m.trim);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 24), m.trim);
  front(chapel, rim, 3.94, 0.18, FRONT - 0.26);
  const oculus = front(chapel, new THREE.Mesh(new THREE.CircleGeometry(0.255, 24), m.dark), 3.94, 0.18, FRONT - 0.23);
  oculus.name = "facade-oculus";
  addBox(chapel, [0.28, 0.45, 0.35], [FRONT - 0.08, 5.21, 0.45], m.trim);
  const cross = new THREE.Group();
  cross.name = "facade-cross";
  cross.position.set(FRONT - 0.08, 5.44, 0.45);
  addBox(cross, [0.075, 0.65, 0.075], [0, 0.32, 0], m.iron);
  addBox(cross, [0.075, 0.075, 0.43], [0, 0.45, 0], m.iron);
  chapel.add(cross);
  // Notice board and plaques visible beside the entrance.
  addBox(chapel, [0.09, 0.55, 0.68], [FRONT - 0.18, 1.55, 1.48], m.door);
  addBox(chapel, [0.1, 0.43, 0.55], [FRONT - 0.23, 1.55, 1.48], m.weather);
  for (const [y, z] of [[2.6, 1.75], [2.45, -1.95]]) addBox(chapel, [0.08, 0.32, 0.35], [FRONT - 0.18, y, z], m.weather);
  for (const z of [-2.35, 2.35]) {
    for (const x of [-2, 0.6]) {
      addBox(chapel, [0.4, 0.6, 0.1], [x, 3.65, z], m.dark);
      addBox(chapel, [0.24, 0.14, 0.55], [x, 4.45, z], m.trim);
    }
    addBox(chapel, [5.8, 0.2, 0.22], [-1.03, 4.83, z], m.trim);
  }

  const court = new THREE.Group();
  court.name = "entrance-forecourt";
  addBox(court, [2.5, 0.12, 5.25], [FRONT - 1.4, 0.06, 0], m.weather);
  for (const side of [-1, 1]) {
    addBox(court, [2.5, 0.72, 0.22], [FRONT - 1.4, 0.42, side * 2.52], m.plaster);
    addBox(court, [0.24, 0.95, 1.85], [FRONT - 2.62, 0.54, side * 1.63], m.plaster);
    // Low inner return walls leave the central pedestrian approach open.
    addBox(court, [1.15, 0.88, 0.2], [FRONT - 2.17, 0.5, side * 0.73], m.trim);
  }
  chapel.add(court);
  return chapel;
}
