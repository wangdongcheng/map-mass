import * as THREE from "three";
import { addBox } from "../shared/geometry.js";

const FRONT = 17.39;
// Metres in the model frame, traced from the pinned OpenFreeMap building polygon.
const FOOTPRINT = [
  [9.38, 17.39], [-10.19, 17.39], [-10.48, 5.01], [-12.21, 5.2],
  [-12.11, 0.06], [-9.69, -0.08], [-10.28, -9.05], [-13.38, -8.98],
  [-13.34, -17.22], [14.15, -17.56], [14.37, -8.27], [8.86, -8.07],
  [8.95, -1.19], [11.67, -0.95], [11.51, 4.87], [9.09, 5]
];

function createMaterials() {
  const stone = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  return {
    stone: stone(0xc9b393), trim: stone(0xe0ceb0), inset: stone(0xac9679),
    roof: stone(0xc3c1b7), door: stone(0xa9a99c),
    glass: new THREE.MeshStandardMaterial({ color: 0x48616a, roughness: 0.4, side: THREE.DoubleSide }),
    dark: stone(0x34342e), iron: stone(0x30463f),
    solar: new THREE.MeshStandardMaterial({ color: 0x283d63, roughness: 0.32, metalness: 0.22 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xa5adb2, roughness: 0.6, metalness: 0.45 })
  };
}

function extrudeOutline(points, depth, material) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 20 }), material);
}

function archShape(width, height) {
  const radius = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(radius, 0);
  shape.lineTo(radius, height - radius);
  shape.absarc(0, height - radius, radius, 0, Math.PI, false);
  shape.closePath();
  return shape;
}

function addWindow(parent, width, height, position, rotation, m) {
  const window = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.ShapeGeometry(archShape(width + 0.4, height + 0.2), 18), m.trim);
  frame.position.y = -0.1;
  window.add(frame);
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(archShape(width, height), 18), m.glass);
  glass.position.z = 0.035;
  window.add(glass);
  for (let x = -width / 2 + 0.26; x < width / 2; x += 0.3) {
    const top = height - width / 2 + Math.sqrt(Math.max(0, (width / 2) ** 2 - x ** 2));
    addBox(window, [0.035, top, 0.04], [x, top / 2, 0.06], m.metal);
  }
  for (let y = 0.45; y < height - width / 2; y += 0.5) {
    addBox(window, [width, 0.035, 0.04], [0, y, 0.06], m.metal);
  }
  addBox(window, [width + 0.65, 0.22, 0.4], [0, -0.13, 0.08], m.trim);
  window.position.set(...position);
  window.rotation.y = rotation;
  parent.add(window);
  return window;
}

function addBody(church, m) {
  // Rotate the extruded XY polygon into XZ; its depth becomes wall height.
  const body = extrudeOutline(FOOTPRINT.map(([x, z]) => [x, -z]), 10.4, m.stone);
  body.rotation.x = -Math.PI / 2;
  body.name = "aisles-and-rear-body";
  church.add(body);
  const roof = extrudeOutline(FOOTPRINT.map(([x, z]) => [x, -z]), 0.22, m.roof);
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = 10.4;
  church.add(roof);
  for (let i = 0; i < FOOTPRINT.length; i++) {
    const [x, z] = FOOTPRINT[i], [nx, nz] = FOOTPRINT[(i + 1) % FOOTPRINT.length];
    const length = Math.hypot(nx - x, nz - z);
    for (const [y, h, w, material] of [[10.9, 0.6, 0.26, m.stone], [11.25, 0.18, 0.42, m.trim]]) {
      const parapet = addBox(church, [length, h, w], [(x + nx) / 2, y, (z + nz) / 2], material);
      parapet.rotation.y = -Math.atan2(nz - z, nx - x);
    }
  }
  const nave = addBox(church, [10.8, 5, 34.5], [0, 12.9, -0.05], m.stone);
  nave.name = "raised-nave";
  addBox(church, [11.2, 0.26, 34.7], [0, 15.53, -0.05], m.trim);
  addBox(church, [10.6, 0.18, 34.4], [0, 15.73, -0.05], m.roof);
  for (const sign of [-1, 1]) {
    addBox(church, [0.22, 0.5, 34.7], [sign * 5.45, 16, -0.05], m.stone);
    for (const z of [-13, -8, -3, 2, 7, 12]) {
      addWindow(church, 1.15, 2.35, [sign * 5.43, 12, z], sign * Math.PI / 2, m);
      addBox(church, [0.22, 4.7, 0.35], [sign * 5.49, 13, z + 2], m.trim);
    }
    for (const [z, x] of [[10, 9.9], [2, 11.85], [-4.5, 9.85], [-13, 13.75]]) {
      addWindow(church, 1.4, 3.4, [sign * x, 4.6, z], sign * Math.PI / 2, m);
    }
  }
  const panels = new THREE.Group();
  panels.name = "roof-solar-panels";
  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < 5; column++) {
      const panel = new THREE.Group();
      addBox(panel, [1.62, 0.09, 1.75], [0, 0, 0], m.metal);
      addBox(panel, [1.52, 0.025, 1.65], [0, 0.06, 0], m.solar);
      for (const x of [-0.38, 0, 0.38]) addBox(panel, [0.012, 0.015, 1.65], [x, 0.079, 0], m.metal);
      panel.rotation.x = -0.1;
      panel.position.set((column - 2) * 1.7, 16.05, -8.5 + row * 2.5);
      panels.add(panel);
    }
  }
  church.add(panels);
}

function addFacade(church, m) {
  const facade = new THREE.Group();
  facade.name = "entrance-facade";
  facade.position.z = FRONT + 0.08;
  // Curved shoulders rise from the nave to the single central bell opening.
  const shape = new THREE.Shape();
  shape.moveTo(-5.4, 10.4); shape.lineTo(5.4, 10.4); shape.lineTo(5.4, 17.3);
  shape.bezierCurveTo(3.6, 17.45, 2.2, 18.6, 2.15, 19.6);
  shape.lineTo(1.65, 19.6); shape.lineTo(1.65, 21.8);
  shape.lineTo(-1.65, 21.8); shape.lineTo(-1.65, 19.6); shape.lineTo(-2.15, 19.6);
  shape.bezierCurveTo(-2.2, 18.6, -3.6, 17.45, -5.4, 17.3); shape.closePath();
  const opening = archShape(1.85, 2.35);
  const hole = new THREE.Path();
  hole.copy(opening); hole.curves.forEach((curve) => {
    for (const key of ["v1", "v2", "v0", "v3"]) if (curve[key]) curve[key].y += 18.85;
    if ("aY" in curve) curve.aY += 18.85;
  });
  shape.holes.push(hole);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.65, bevelEnabled: false, curveSegments: 24 }), m.stone);
  gable.position.z = -0.4;
  facade.add(gable);
  for (const x of [-3.25, 0, 3.25]) addWindow(facade, 1.55, 3, [x, 13.35, 0.3], 0, m);
  for (const x of [-9.7, -5.25, 5.25, 9.05]) {
    addBox(facade, [0.55, 10.9, 0.38], [x, 5.7, 0.2], m.trim);
  }
  for (const x of [-7.3, 7]) addWindow(facade, 1.8, 6.1, [x, 2.4, 0.32], 0, m);
  addBox(facade, [7.5, 9.4, 0.5], [0, 4.9, 0.43], m.trim);
  addBox(facade, [6.65, 9.15, 0.15], [0, 4.85, 0.77], m.stone);
  const portal = new THREE.Mesh(new THREE.ShapeGeometry(archShape(3.8, 6.7), 24), m.inset);
  portal.position.set(0, 0.25, 0.87); facade.add(portal);
  const surround = new THREE.Mesh(new THREE.TorusGeometry(1.98, 0.17, 8, 32, Math.PI), m.trim);
  surround.position.set(0, 4.96, 0.94); facade.add(surround);
  const door = addBox(facade, [3.1, 4.8, 0.12], [0, 2.65, 0.98], m.door);
  door.name = "main-entrance";
  for (const x of [-1.04, -0.52, 0, 0.52, 1.04]) addBox(facade, [0.06, 4.7, 0.06], [x, 2.65, 1.07], m.trim);
  for (const y of [0.7, 1.6, 2.5, 3.4, 4.3, 5]) addBox(facade, [3.08, 0.06, 0.06], [0, y, 1.07], m.trim);
  for (const x of [-2.05, 2.05]) addBox(facade, [0.25, 4.8, 0.35], [x, 2.65, 0.87], m.trim);
  const rose = new THREE.Mesh(new THREE.CircleGeometry(0.76, 32), m.glass);
  rose.position.set(0, 8.3, 0.92); facade.add(rose);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.2, 10, 32), m.trim);
  rim.position.set(0, 8.3, 0.95); facade.add(rim);
  const roseRing = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.035, 6, 24), m.metal);
  roseRing.position.set(0, 8.3, 0.97); facade.add(roseRing);
  for (const angle of [0, Math.PI / 3, 2 * Math.PI / 3]) {
    const bar = addBox(facade, [1.45, 0.035, 0.035], [0, 8.3, 0.97], m.metal);
    bar.rotation.z = angle;
  }
  const pediment = extrudeOutline([[-4.1, 9.6], [0, 11.9], [4.1, 9.6]], 0.35, m.trim);
  pediment.position.z = 0.67; facade.add(pediment);
  const tympanum = extrudeOutline([[-3.2, 9.85], [0, 11.65], [3.2, 9.85]], 0.06, m.stone);
  tympanum.position.z = 1.03; facade.add(tympanum);
  for (const sign of [-1, 1]) {
    const slope = addBox(facade, [4.72, 0.2, 0.62], [sign * 2.05, 10.78, 0.92], m.trim);
    slope.rotation.z = -sign * Math.atan2(2.3, 4.1);
    addBox(facade, [0.46, 6.8, 0.34], [sign * 5.1, 13.9, 0.31], m.trim);
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 4), m.trim);
    finial.position.set(sign * 5.1, 17.7, 0.15); facade.add(finial);
  }
  church.add(facade);
}

function addBelfry(church, m) {
  const belfry = new THREE.Group();
  belfry.name = "central-belfry";
  belfry.position.set(0, 0, FRONT - 0.7);
  for (const x of [-1.3, 1.3]) addBox(belfry, [0.65, 2.5, 2.15], [x, 20.1, 0], m.stone);
  addBox(belfry, [2.1, 0.18, 0.12], [0, 20.4, 0], m.iron);
  const bell = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.36, 0), new THREE.Vector2(0.4, 0.08), new THREE.Vector2(0.25, 0.3),
    new THREE.Vector2(0.2, 0.6), new THREE.Vector2(0.05, 0.7)
  ], 16), m.iron);
  bell.position.set(0, 19.5, 0.25); belfry.add(bell);
  for (const [width, y, depth] of [[3.85, 21.85, 2.65], [3.25, 22.35, 2.2], [2.6, 22.85, 1.8]]) {
    addBox(belfry, [width, 0.26, depth], [0, y, 0], m.trim);
    addBox(belfry, [width - 0.25, 0.35, depth - 0.2], [0, y + 0.3, 0], m.stone);
  }
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.55, 4), m.trim);
  cap.rotation.y = Math.PI / 4; cap.position.set(0, 23.9, 0); belfry.add(cap);
  church.add(belfry);
}

function addSteps(church, m) {
  const steps = new THREE.Group();
  steps.name = "entrance-steps";
  for (let i = 0; i < 6; i++) {
    addBox(steps, [19.8, 0.12 * (6 - i), 0.42], [-0.4, 0.06 * (6 - i), FRONT + 0.65 + i * 0.42], m.trim);
  }
  church.add(steps);
}

export function createModel() {
  const church = new THREE.Group();
  church.name = "0057-st-john-of-the-cross";
  const materials = createMaterials();
  addBody(church, materials);
  addFacade(church, materials);
  addBelfry(church, materials);
  addSteps(church, materials);
  return church;
}
