import * as THREE from "three";
import { addBox, createArch } from "../shared/geometry.js";
import { COMPLEX_FOOTPRINT, SCHOOL_FOOTPRINT } from "./footprint.js";

const LENGTH = 32.7053585038;
const WIDTH = 13.3065848706;
// Street edge of the complete pinned school spine at the church entrance.
const STREET = -27.8949;

function createMaterials() {
  const stone = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  return {
    stone: stone(0xc4b28f), trim: stone(0xdccdba), pale: stone(0xe5e2d8),
    shadow: stone(0x99866b), roof: stone(0xb2b0a6), green: stone(0x245b48),
    greenLight: stone(0x36735b), dark: stone(0x27332c),
    solar: new THREE.MeshStandardMaterial({ color: 0x253a58, roughness: 0.38, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xa9b1b5, roughness: 0.65, metalness: 0.35 }),
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
  addBox(church, [LENGTH + 0.5, 0.3, WIDTH + 0.55], [0, 17.85, 0], m.trim);
  addBox(church, [LENGTH - 1.1, 2.6, WIDTH - 2.6], [0.25, 19.2, 0], m.stone);
  const roof = addBox(church, [LENGTH - 0.65, 0.22, WIDTH - 2.15], [0.25, 20.61, 0], m.roof);
  roof.name = "raised-flat-roof";
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

function outlineMesh(points, height, material) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => index ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geometry, material);
}

function schoolWindow(parent, width, y, arched, m) {
  const height = 2.3;
  addBox(parent, [width + 0.3, height + 0.25, 0.16], [0, y, 0.04], m.shadow);
  if (arched) {
    const radius = width / 2, spring = height - radius;
    const shape = new THREE.Shape();
    shape.moveTo(-radius, 0); shape.lineTo(radius, 0); shape.lineTo(radius, spring);
    shape.absarc(0, spring, radius, 0, Math.PI, false); shape.closePath();
    const pane = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), m.glass);
    pane.position.set(0, y - height / 2, 0.14);
    parent.add(pane);
  } else {
    addBox(parent, [width, height, 0.16], [0, y, 0.12], m.glass);
  }
  addBox(parent, [0.07, height - 0.2, 0.19], [0, y - 0.08, 0.15], m.green);
  addBox(parent, [width, 0.07, 0.2], [0, y - 0.15, 0.16], m.green);
  addBox(parent, [width + 0.5, 0.15, 0.38], [0, y - height / 2 - 0.12, 0.12], m.trim);
}

function addSchool(church, m) {
  const school = new THREE.Group();
  school.name = "connected-school-wings";
  church.add(school);
  const body = outlineMesh(COMPLEX_FOOTPRINT, 17.8, m.stone);
  body.name = "complex-footprint-body";
  school.add(body);
  const upper = outlineMesh(SCHOOL_FOOTPRINT, 0.6, m.stone);
  upper.position.y = 17.8;
  school.add(upper);
  const roof = outlineMesh(SCHOOL_FOOTPRINT, 0.2, m.roof);
  roof.position.y = 18.4;
  roof.name = "school-flat-roof";
  school.add(roof);

  // Decorate each exterior school edge in its own frame, including courtyard walls.
  for (let i = 0; i < COMPLEX_FOOTPRINT.length; i++) {
    if ([2, 3, 4].includes(i)) continue; // Chapel elevations are detailed separately.
    const [x, z] = COMPLEX_FOOTPRINT[i];
    const [nx, nz] = COMPLEX_FOOTPRINT[(i + 1) % COMPLEX_FOOTPRINT.length];
    const dx = nx - x, dz = nz - z, length = Math.hypot(dx, dz);
    const normalX = dz / length, normalZ = -dx / length;
    const elevation = new THREE.Group();
    elevation.position.set((x + nx) / 2, 0, (z + nz) / 2);
    elevation.rotation.y = Math.atan2(normalX, normalZ);
    school.add(elevation);
    for (const y of [4.5, 8.5, 12.6, 17.95]) {
      addBox(elevation, [length, 0.16, 0.25], [0, y, 0.08], m.trim);
    }
    addBox(elevation, [length, 0.6, 0.22], [0, 18.9, -0.1], m.stone);
    addBox(elevation, [length + 0.1, 0.16, 0.4], [0, 19.24, -0.1], m.trim);
    const count = Math.floor((length - 1.5) / 3.6);
    for (let bay = 0; bay < count; bay++) {
      const position = -length / 2 + (bay + 1) * length / (count + 1);
      const worldZ = elevation.position.z - Math.sin(elevation.rotation.y) * position;
      // Preserve the detailed church portico and green facade in the spine's centre.
      if ([16, 17, 18, 19].includes(i) && Math.abs(worldZ) < 8) continue;
      const windows = new THREE.Group();
      windows.position.x = position;
      for (const y of [2.65, 6.65, 10.65, 14.65]) schoolWindow(windows, 1.5, y, y === 14.65, m);
      elevation.add(windows);
      addBox(elevation, [0.25, 17.7, 0.28], [position + 1.5, 8.85, 0.07], m.trim);
    }
  }
}

function addSolarArray(parent, x, z, columns, rows, bearing, m) {
  const array = new THREE.Group();
  array.name = "solar-array";
  array.position.set(x, 19.15, z);
  array.rotation.y = bearing;
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const panel = new THREE.Group();
    panel.position.set((column - (columns - 1) / 2) * 1.13, 0, (row - (rows - 1) / 2) * 1.95);
    panel.rotation.x = -0.1;
    addBox(panel, [1.09, 0.09, 1.86], [0, 0, 0], m.metal);
    addBox(panel, [1.0, 0.04, 1.76], [0, 0.065, 0], m.solar);
    for (const offset of [-0.28, 0.28]) {
      addBox(panel, [1, 0.012, 0.015], [0, 0.09, offset], m.metal);
    }
    array.add(panel);
  }
  parent.add(array);
}

function addRoofEquipment(church, m) {
  const equipment = new THREE.Group();
  equipment.name = "school-roof-equipment";
  church.add(equipment);
  for (const z of [-39, -23, 0, 20, 35]) {
    const x = z < 0 ? -23.4 + z * 0.035 : -20.6;
    addSolarArray(equipment, x, z === 35 ? 33 : z, 5, z === 35 ? 4 : 6, 0.06, m);
  }
  const angle = Math.atan2(41.8635 - 49.9306, 52.255 + 24.4128);
  for (const x of [-3, 15, 33, 45]) {
    addSolarArray(equipment, x, 41 - x * 0.105, 5, x === 45 ? 4 : 8, -Math.PI / 2 - angle, m);
  }
  const stairs = addBox(equipment, [8.5, 3.2, 7.5], [-18.8, 20.2, 42], m.pale);
  stairs.name = "corner-stairwell";
  addBox(equipment, [8.9, 0.25, 7.9], [-18.8, 21.93, 42], m.trim);
  const chimney = addBox(equipment, [2.5, 5.3, 2.2], [-18.6, 21.05, -10.1], m.stone);
  chimney.name = "school-chimney";
  addBox(equipment, [2.85, 0.28, 2.55], [-18.6, 23.84, -10.1], m.trim);
  for (const [x, z] of [[-23, -47], [-21, 11], [-15, 42], [40, 36]]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.15, 12), m.pale);
    tank.position.set(x, 19.2, z);
    equipment.add(tank);
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
  const frontage = addBox(church, [0.5, 18.4, WIDTH], [STREET + 0.12, 9.2, 0], m.stone);
  frontage.name = "street-frontage";
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
  addSchool(church, materials);
  addRoofEquipment(church, materials);
  addFacade(church, materials);
  addPorch(church, materials);
  return church;
}
