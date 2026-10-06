import * as THREE from "three";
import { addBox } from "../shared/geometry.js";
import { createChurchMaterials } from "../shared/materials.js";

const FRONT = -9.88;
const HALF_WIDTH = 5.93;
const WALL_HEIGHT = 11.8;

function createOpening(width, height, material) {
  const radius = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(-radius, height - radius);
  shape.absarc(0, height - radius, radius, Math.PI, 0, true);
  shape.lineTo(radius, 0);
  shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), material);
}

function createMaterials() {
  return {
    ...createChurchMaterials(),
    stone: new THREE.MeshStandardMaterial({ color: 0xcab99c, roughness: 0.98 }),
    moulding: new THREE.MeshStandardMaterial({ color: 0xe1d2b7, roughness: 0.94 }),
    inset: new THREE.MeshStandardMaterial({ color: 0xb4a387, roughness: 1 }),
    dome: new THREE.MeshStandardMaterial({ color: 0xa94b60, roughness: 0.88 }),
    opening: new THREE.MeshStandardMaterial({ color: 0x34312c, side: THREE.DoubleSide }),
    door: new THREE.MeshStandardMaterial({ color: 0x9d9585, roughness: 0.95 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x34302a, roughness: 0.75, metalness: 0.3 })
  };
}

function onFront(mesh, y, z, x = FRONT - 0.17) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function addBody(chapel, m) {
  const body = addBox(chapel, [19.76, WALL_HEIGHT, 11.86], [0, WALL_HEIGHT / 2, 0], m.stone);
  body.name = "chapel-body";
  addBox(chapel, [19.6, 0.22, 11.7], [0, 11.92, 0], m.roof);

  // A low parapet surrounds the flat roof and the exposed drum.
  for (const z of [-5.76, 5.76]) {
    addBox(chapel, [19.76, 0.72, 0.35], [0, 12.3, z], m.stone);
    addBox(chapel, [20.04, 0.22, 0.62], [0, 12.71, z], m.moulding);
  }
  for (const x of [-9.71, 9.71]) {
    addBox(chapel, [0.35, 0.72, 11.86], [x, 12.3, 0], m.stone);
    addBox(chapel, [0.62, 0.22, 12.18], [x, 12.71, 0], m.moulding);
  }

  // Rectangular upper windows and restrained pilasters visible in both aerial references.
  for (const z of [-HALF_WIDTH, HALF_WIDTH]) {
    const sign = Math.sign(z);
    for (const x of [-5.8, 1.7, 7.4]) {
      addBox(chapel, [1.3, 1.9, 0.14], [x, 9.1, z + sign * 0.07], m.moulding);
      addBox(chapel, [0.88, 1.46, 0.12], [x, 9.1, z + sign * 0.16], m.opening);
      addBox(chapel, [0.09, 1.46, 0.12], [x, 9.1, z + sign * 0.24], m.moulding);
    }
    for (const x of [-9.5, -2.4, 4.3, 9.5]) {
      addBox(chapel, [0.52, 11.65, 0.22], [x, 5.9, z + sign * 0.1], m.moulding);
    }
    addBox(chapel, [20.08, 0.32, 0.4], [0, 10.65, z], m.moulding);
    addBox(chapel, [20, 0.25, 0.32], [0, 1, z], m.inset);
  }

  const sideDoor = createOpening(1.3, 2.7, m.opening);
  sideDoor.position.set(5.6, 0.2, HALF_WIDTH + 0.17);
  chapel.add(sideDoor);

  // Horizontal stone rainwater spouts project from the roof line.
  for (const z of [-HALF_WIDTH, HALF_WIDTH]) {
    for (const x of [-6.6, 0, 6.6]) {
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.85, 8), m.stone);
      spout.rotation.x = Math.PI / 2;
      spout.position.set(x, 10.6, z + Math.sign(z) * 0.36);
      chapel.add(spout);
    }
  }
}

function addFrontFrame(chapel, width, height, y, z, m) {
  addBox(chapel, [0.32, height, 0.22], [FRONT - 0.25, y, z - width / 2], m);
  addBox(chapel, [0.32, height, 0.22], [FRONT - 0.25, y, z + width / 2], m);
  for (const edge of [-1, 1]) {
    addBox(chapel, [0.34, 0.22, width + 0.2], [FRONT - 0.25, y + edge * height / 2, z], m);
  }
}

function addMadonna(chapel, m) {
  const statue = new THREE.Group();
  statue.name = "madonna-and-child";
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.1, 12), m.moulding);
  robe.position.y = 0.58;
  statue.add(robe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), m.moulding);
  head.position.y = 1.25;
  statue.add(head);
  const child = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), m.moulding);
  child.position.set(-0.14, 0.92, 0.28);
  statue.add(child);
  addBox(statue, [0.28, 0.46, 0.25], [-0.14, 0.64, 0.28], m.moulding);
  statue.position.set(FRONT - 0.3, 8.2, 0);
  chapel.add(statue);
}

function addFacade(chapel, m) {
  for (const z of [-5.45, -1.7, 1.7, 5.45]) {
    addBox(chapel, [0.28, 11.8, 0.62], [FRONT - 0.12, 5.9, z], m.moulding);
    addBox(chapel, [0.5, 0.35, 0.88], [FRONT - 0.23, 10.65, z], m.moulding);
  }
  for (const [y, height, width] of [[10.7, 0.32, 12.1], [11.9, 0.3, 12.35], [12.35, 0.25, 12.45]]) {
    addBox(chapel, [0.68, height, width], [FRONT - 0.2, y, 0], m.moulding);
  }

  const door = addBox(chapel, [0.18, 3.6, 2.1], [FRONT - 0.21, 2, 0], m.door);
  door.name = "main-entrance";
  addFrontFrame(chapel, 2.5, 3.95, 2.12, 0, m.moulding);
  addBox(chapel, [0.18, 3.5, 0.06], [FRONT - 0.34, 2, 0], m.inset);
  for (const z of [-0.52, 0.52]) {
    for (const y of [1.25, 2.95]) addFrontFrame(chapel, 0.7, 1.05, y, z, m.inset);
    addBox(chapel, [0.13, 0.42, 0.38], [FRONT - 0.4, 0.72, z], m.opening);
    addBox(chapel, [0.1, 0.65, 0.07], [FRONT - 0.41, 1.6, z], m.moulding);
    addBox(chapel, [0.1, 0.07, 0.4], [FRONT - 0.41, 1.7, z], m.moulding);
  }

  const pediment = new THREE.Shape();
  pediment.moveTo(-1.8, 4.55);
  pediment.lineTo(0, 5.55);
  pediment.lineTo(1.8, 4.55);
  pediment.closePath();
  chapel.add(onFront(new THREE.Mesh(new THREE.ShapeGeometry(pediment), m.moulding), 0, 0, FRONT - 0.43));
  addBox(chapel, [0.66, 0.22, 3.85], [FRONT - 0.28, 4.55, 0], m.moulding);
  for (const sign of [-1, 1]) {
    const slope = addBox(chapel, [0.35, 0.16, 2.12], [FRONT - 0.49, 5.05, sign * 0.9], m.inset);
    slope.rotation.x = sign * Math.atan2(1, 1.8);
  }

  addBox(chapel, [0.12, 1.1, 1.9], [FRONT - 0.08, 6.75, 0], m.inset);
  addFrontFrame(chapel, 2.15, 1.35, 6.75, 0, m.moulding);
  addBox(chapel, [0.12, 1.85, 1.5], [FRONT - 0.1, 8.9, 0], m.opening);
  addFrontFrame(chapel, 1.85, 2.16, 8.9, 0, m.moulding);
  addMadonna(chapel, m);

  addBox(chapel, [0.4, 0.32, 1.7], [FRONT - 0.1, 12.92, 0], m.moulding);
  addBox(chapel, [0.18, 1.15, 0.18], [FRONT - 0.12, 13.61, 0], m.moulding);
  addBox(chapel, [0.18, 0.18, 0.88], [FRONT - 0.12, 13.8, 0], m.moulding);
}

function addDome(chapel, m) {
  const dome = new THREE.Group();
  dome.name = "red-dome";
  // The dome occupies the front two-thirds of the roof, clear of the rear belfry.
  dome.position.x = -1.4;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 2.3, 32), m.stone);
  drum.position.y = 13.05;
  dome.add(drum);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.68, 4.68, 0.25, 32), m.moulding);
  rim.position.y = 14.22;
  dome.add(rim);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(4.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), m.dome
  );
  cap.scale.y = 0.55;
  cap.position.y = 14.33;
  dome.add(cap);

  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.92, 1.65, 12), m.moulding);
  lantern.position.y = 17.35;
  dome.add(lantern);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const slit = createOpening(0.3, 0.85, m.opening);
    slit.position.set(Math.sin(angle) * 0.82, 16.85, Math.cos(angle) * 0.82);
    slit.rotation.y = angle;
    dome.add(slit);
  }
  const lanternCap = new THREE.Mesh(new THREE.SphereGeometry(0.84, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.dome);
  lanternCap.position.y = 18.15;
  dome.add(lanternCap);
  addBox(dome, [0.1, 0.5, 0.1], [0, 19.03, 0], m.cross);
  addBox(dome, [0.38, 0.1, 0.1], [0, 19.1, 0], m.cross);
  chapel.add(dome);
}

function addBelfry(chapel, m) {
  const belfry = new THREE.Group();
  belfry.name = "rear-belfry";
  belfry.position.set(8.2, 0, -4.65);
  addBox(belfry, [2.1, 0.4, 2.3], [0, 12.93, 0], m.moulding);
  for (const x of [-0.73, 0.73]) {
    addBox(belfry, [0.48, 2.6, 1.35], [x, 14.35, 0], m.stone);
    addBox(belfry, [0.65, 0.24, 1.65], [x, 15.55, 0], m.moulding);
  }
  // A real arch opening lets the sky show through rather than a painted recess.
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.24, 8, 20, Math.PI), m.stone);
  arch.position.set(0, 15.35, 0);
  belfry.add(arch);
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.55, 12), m.iron);
  bell.position.set(0, 14.8, 0);
  belfry.add(bell);
  addBox(belfry, [1.8, 0.22, 1.9], [0, 16.27, 0], m.moulding);
  addBox(belfry, [0.12, 0.7, 0.12], [0, 16.74, 0], m.moulding);
  addBox(belfry, [0.12, 0.12, 0.5], [0, 16.87, 0], m.moulding);
  chapel.add(belfry);
}

function addForecourt(chapel, m) {
  const court = new THREE.Group();
  court.name = "entrance-forecourt";
  addBox(court, [3.1, 0.22, 12.5], [-11.45, 0.11, 0], m.limestoneShadow);
  for (const sign of [-1, 1]) {
    const z = sign * 3.66;
    addBox(court, [0.3, 0.22, 5.1], [-12.9, 0.4, z], m.stone);
    addBox(court, [0.42, 0.2, 5.2], [-12.9, 1.35, z], m.moulding);
    for (let i = 0; i < 9; i++) {
      const baluster = new THREE.Mesh(new THREE.LatheGeometry([
        new THREE.Vector2(0.14, 0), new THREE.Vector2(0.1, 0.12),
        new THREE.Vector2(0.18, 0.28), new THREE.Vector2(0.13, 0.4),
        new THREE.Vector2(0.08, 0.6), new THREE.Vector2(0.14, 0.78)
      ], 8), m.moulding);
      baluster.position.set(-12.9, 0.5, sign * (1.55 + i * 0.53));
      court.add(baluster);
    }
    for (const postZ of [sign * 1.22, sign * 6.05]) {
      addBox(court, [0.6, 1.35, 0.6], [-12.9, 0.68, postZ], m.stone);
      addBox(court, [0.72, 0.18, 0.72], [-12.9, 1.43, postZ], m.inset);
    }
    addBox(court, [3.1, 0.9, 0.35], [-11.45, 0.55, sign * 6.05], m.stone);
    addBox(court, [3.15, 0.18, 0.48], [-11.45, 1.1, sign * 6.05], m.moulding);
  }
  for (const z of [-0.86, 0.86]) {
    for (let i = 0; i < 4; i++) addBox(court, [0.06, 1.2, 0.055], [-12.95, 0.85, z + (i - 1.5) * 0.14], m.iron);
  }
  addBox(court, [1.15, 0.14, 2.1], [-13.28, 0.07, 0], m.stone);
  chapel.add(court);
}

export function createModel() {
  const chapel = new THREE.Group();
  chapel.name = "0109-tal-mirakli";
  const materials = createMaterials();
  addBody(chapel, materials);
  addFacade(chapel, materials);
  addDome(chapel, materials);
  addBelfry(chapel, materials);
  addForecourt(chapel, materials);
  return chapel;
}
