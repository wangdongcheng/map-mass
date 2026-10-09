import * as THREE from "three";
import { addBox, createArch } from "../shared/geometry.js";

const LENGTH = 32.7053585038;
const WIDTH = 13.3065848706;
const FRONT = -LENGTH / 2;
const STREET = FRONT - 13.2;

function createMaterials() {
  const stone = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  return {
    stone: stone(0xc4b28f), trim: stone(0xdccdba), pale: stone(0xe5e2d8),
    shadow: stone(0x99866b), roof: stone(0xb2b0a6), green: stone(0x245b48),
    greenLight: stone(0x36735b), dark: stone(0x27332c),
    glass: new THREE.MeshStandardMaterial({ color: 0x47666d, roughness: 0.38, side: THREE.DoubleSide })
  };
}

// ShapeGeometry faces +Z. A -90-degree turn puts it on the WNW street facade.
function facadeShape(parent, mesh, x, y, z) {
  mesh.rotation.y = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function addBody(church, m) {
  const body = addBox(church, [LENGTH, 17.8, WIDTH], [0, 8.9, 0], m.stone);
  body.name = "chapel-body";
  const frontage = addBox(church, [13.2, 18.4, WIDTH], [FRONT - 6.6, 9.2, 0], m.stone);
  frontage.name = "street-frontage";
  addBox(church, [LENGTH + 0.5, 0.3, WIDTH + 0.55], [0, 17.85, 0], m.trim);
  addBox(church, [LENGTH - 1.1, 2.6, WIDTH - 2.6], [0.25, 19.2, 0], m.stone);
  const roof = addBox(church, [LENGTH - 0.65, 0.22, WIDTH - 2.15], [0.25, 20.61, 0], m.roof);
  roof.name = "raised-flat-roof";
  addBox(church, [13.55, 0.32, WIDTH + 0.55], [FRONT - 6.6, 18.45, 0], m.trim);
  addBox(church, [12.8, 0.15, WIDTH - 0.7], [FRONT - 6.6, 18.68, 0], m.roof);
  for (const side of [-1, 1]) {
    addBox(church, [LENGTH - 0.4, 0.4, 0.22], [0.25, 20.82, side * (WIDTH / 2 - 1.13)], m.trim);
    for (const y of [6, 11.5, 17.35]) {
      addBox(church, [LENGTH, 0.18, 0.22], [0, y, side * (WIDTH / 2 + 0.05)], m.trim);
    }
    for (const x of [-12, -6, 0, 6, 12]) {
      addBox(church, [0.38, 17.1, 0.28], [x, 8.55, side * WIDTH / 2], m.trim);
      for (const y of [3.2, 8.5, 13.7]) {
        addBox(church, [1.55, 2.5, 0.13], [x + 2.7, y, side * (WIDTH / 2 + 0.03)], m.shadow);
        addBox(church, [1.22, 2.16, 0.15], [x + 2.7, y, side * (WIDTH / 2 + 0.08)], m.glass);
        addBox(church, [0.09, 2.18, 0.19], [x + 2.7, y, side * (WIDTH / 2 + 0.1)], m.green);
        addBox(church, [1.65, 0.16, 0.35], [x + 2.7, y - 1.3, side * WIDTH / 2], m.trim);
      }
      addBox(church, [2.15, 0.85, 0.1], [x + 1.1, 19.2, side * (WIDTH / 2 - 1.27)], m.dark);
    }
  }
  for (const z of [-4, 0, 4]) {
    addBox(church, [0.12, 2.15, 1.45], [LENGTH / 2 + 0.03, 13.7, z], m.glass);
  }
}

function addStreetWindow(church, y, z, m) {
  addBox(church, [0.2, 2.85, 1.75], [STREET - 0.05, y, z], m.shadow);
  addBox(church, [0.23, 2.5, 1.42], [STREET - 0.1, y, z], m.glass);
  for (const offset of [-0.72, 0, 0.72]) {
    addBox(church, [0.28, 2.55, 0.07], [STREET - 0.16, y, z + offset], m.green);
  }
  addBox(church, [0.29, 0.08, 1.5], [STREET - 0.17, y + 0.4, z], m.green);
  for (const side of [-1, 1]) {
    addBox(church, [0.24, 1.65, 0.62], [STREET - 0.22, y - 0.45, z + side * 1.05], m.green);
    for (let row = 0; row < 7; row++) {
      addBox(church, [0.3, 0.045, 0.5], [STREET - 0.28, y - 1.1 + row * 0.19, z + side * 1.05], m.greenLight);
    }
  }
  addBox(church, [0.42, 0.17, 2.05], [STREET - 0.08, y - 1.48, z], m.trim);
}

function addFacade(church, m) {
  for (const z of [-4.65, -1.55, 1.55, 4.65]) {
    for (const y of [11.35, 15.45]) addStreetWindow(church, y, z, m);
  }
  for (const y of [9.2, 18]) {
    addBox(church, [0.4, 0.28, WIDTH + 0.35], [STREET - 0.1, y, 0], m.trim);
  }
  for (const z of [-WIDTH / 2 + 0.2, WIDTH / 2 - 0.2]) {
    addBox(church, [0.3, 17.7, 0.45], [STREET - 0.12, 8.85, z], m.trim);
  }
  for (const z of [-3.65, 0, 3.65]) {
    facadeShape(church, createArch(2.8, 4.9, m.shadow), STREET - 0.14, 2.15, z);
    const door = facadeShape(church, createArch(2.5, 4.7, m.green), STREET - 0.18, 2.15, z);
    if (z === 0) door.name = "main-entrance";
    for (const panelZ of [-0.62, 0.62]) {
      for (const y of [3.25, 4.65, 5.95]) {
        addBox(church, [0.13, 1.05, 0.88], [STREET - 0.23, y, z + panelZ], m.greenLight);
        addBox(church, [0.15, 0.85, 0.7], [STREET - 0.25, y, z + panelZ], m.green);
      }
    }
  }
}

function archBand(width, radius, thickness, material) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius + width, 0, Math.PI, false);
  shape.lineTo(-radius, 0);
  shape.absarc(0, 0, radius, Math.PI, 0, true);
  shape.closePath();
  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 20 }), material);
}

function addPorch(church, m) {
  const porch = new THREE.Group();
  porch.name = "three-arch-portico";
  church.add(porch);
  const porchX = STREET - 3;
  addBox(porch, [3.6, 0.25, 12.3], [STREET - 1.5, 2.05, 0], m.pale);
  for (const z of [-5.5, -1.83, 1.83, 5.5]) {
    addBox(porch, [0.9, 0.45, 0.95], [porchX, 2.38, z], m.pale);
    addBox(porch, [0.57, 3.7, 0.6], [porchX, 4.45, z], m.pale);
    addBox(porch, [0.91, 0.28, 0.91], [porchX, 6.42, z], m.trim);
  }
  for (const z of [-3.665, 0, 3.665]) {
    const arch = facadeShape(porch, archBand(0.31, 1.52, 0.6, m.trim), porchX - 0.34, 6.54, z);
    arch.name = `portico-arch-${z}`;
    facadeShape(porch, archBand(0.1, 1.37, 0.67, m.shadow), porchX - 0.38, 6.54, z);
  }
  addBox(porch, [3.45, 0.65, 11.65], [STREET - 1.45, 8.35, 0], m.stone);
  addBox(porch, [3.85, 0.28, 12.15], [STREET - 1.5, 8.85, 0], m.trim);
  addBox(porch, [0.32, 0.22, 11.85], [porchX, 9.83, 0], m.trim);
  for (let z = -5.5; z <= 5.5; z += 0.55) {
    const spindle = new THREE.Mesh(new THREE.LatheGeometry([
      new THREE.Vector2(0.11, 0), new THREE.Vector2(0.15, 0.12),
      new THREE.Vector2(0.075, 0.3), new THREE.Vector2(0.13, 0.49),
      new THREE.Vector2(0.07, 0.64), new THREE.Vector2(0.11, 0.74)
    ], 8), m.pale);
    spindle.position.set(porchX, 8.98, z);
    porch.add(spindle);
  }
  const steps = new THREE.Group();
  steps.name = "entrance-steps";
  church.add(steps);
  for (let i = 0; i < 10; i++) {
    const height = (i + 1) * 0.205;
    addBox(steps, [0.42, height, 11.8], [porchX - 4.1 + i * 0.42, height / 2, 0], m.pale);
  }
  for (const z of [-6.1, 6.1]) {
    for (let i = 0; i < 5; i++) {
      addBox(steps, [0.84, 0.65 + i * 0.41, 0.4], [porchX - 3.89 + i * 0.84, (0.65 + i * 0.41) / 2, z], m.pale);
    }
  }
}

export function createModel() {
  const church = new THREE.Group();
  const materials = createMaterials();
  addBody(church, materials);
  addFacade(church, materials);
  addPorch(church, materials);
  return church;
}
