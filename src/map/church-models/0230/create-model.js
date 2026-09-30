import * as THREE from "three";
import { addBox, createArch } from "../shared/geometry.js";

// East/north offsets in metres from the centroid of OSM way 453958520.
const FOOTPRINT = [
  [6.634, 8.226],
  [10.945, 5.198],
  [12.406, -0.301],
  [10.025, -4.788],
  [7.364, -3.596],
  [4.433, -6.624],
  [-0.978, -9.096],
  [-5.921, -9.185],
  [-5.921, -7.259],
  [-8.401, -7.448],
  [-10.439, -4.465],
  [-11.206, -0.969],
  [-10.782, 2.637],
  [-8.401, 4.196],
  [-9.772, 5.298],
  [-3.729, 8.226],
  [2.963, 7.858],
  [5.353, 6.3]
];

function createMaterials() {
  const standard = (color, roughness = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  return {
    render: standard(0xe2d7c5, 0.96),
    renderShadow: standard(0xc9bda9, 0.98),
    salmon: standard(0xc98f7f, 0.92),
    roof: standard(0xd6d4cb, 0.82),
    roofEdge: standard(0x777772, 0.78),
    glass: new THREE.MeshStandardMaterial({
      color: 0x34434a,
      roughness: 0.36,
      metalness: 0.08,
      side: THREE.DoubleSide
    }),
    crossGlass: new THREE.MeshStandardMaterial({
      color: 0xd9eced,
      roughness: 0.3,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    }),
    cross: standard(0x80695a, 0.72)
  };
}

function createFootprintGeometry(height) {
  const shape = new THREE.Shape();
  shape.moveTo(FOOTPRINT[0][0], FOOTPRINT[0][1]);
  FOOTPRINT.slice(1).forEach(([east, north]) => shape.lineTo(east, north));
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false
  });

  // Extrusion depth becomes height; north becomes negative local Z.
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addFootprintLayer(chapel, height, y, material, planScale = 1) {
  const layer = new THREE.Mesh(createFootprintGeometry(height), material);
  layer.position.y = y;
  layer.scale.set(planScale, 1, planScale);
  chapel.add(layer);
  return layer;
}

function addShell(chapel, materials) {
  addFootprintLayer(chapel, 6.8, 0, materials.render);
  addFootprintLayer(chapel, 0.7, 0, materials.salmon, 1.015);
  addFootprintLayer(chapel, 0.5, 6.35, materials.salmon, 1.02);

  const roofKerb = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.34, 64),
    materials.roofEdge
  );
  roofKerb.position.set(-0.45, 6.88, 0.15);
  roofKerb.scale.set(11.15, 1, 8.65);
  chapel.add(roofKerb);

  const roof = new THREE.Mesh(
    new THREE.SphereGeometry(
      1,
      64,
      18,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    ),
    materials.roof
  );
  roof.position.set(-0.55, 7.05, 0.15);
  roof.scale.set(10.9, 1.65, 8.4);
  chapel.add(roof);

  // The screenshot shows a lower polygonal cap at the eastern end.
  const endRoof = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 1.25, 6),
    materials.roof
  );
  endRoof.position.set(8.5, 7.15, 0.05);
  endRoof.rotation.y = Math.PI / 6;
  endRoof.scale.z = 0.95;
  chapel.add(endRoof);
}

function placeWindow(mesh, angle, radiusX, radiusZ, y, offset = 0) {
  const centerX = -0.55;
  const centerZ = 0.15;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const normal = new THREE.Vector2(cosine / radiusX, sine / radiusZ).normalize();

  mesh.position.set(
    centerX + radiusX * cosine + normal.x * offset,
    y,
    centerZ + radiusZ * sine + normal.y * offset
  );
  mesh.rotation.y = Math.atan2(normal.x, normal.y);
  return mesh;
}

function addWindow(chapel, angle, materials) {
  const frame = createArch(1.75, 3.15, materials.salmon);
  placeWindow(frame, angle, 10.85, 8.45, 2.15, 0.04);
  chapel.add(frame);

  const inset = createArch(1.25, 2.65, materials.glass);
  placeWindow(inset, angle, 10.85, 8.45, 2.35, 0.09);
  chapel.add(inset);
}

function addSideWindows(chapel, materials) {
  [
    Math.PI * 0.3,
    Math.PI * 0.5,
    Math.PI * 0.7,
    Math.PI * 1.3,
    Math.PI * 1.5,
    Math.PI * 1.7
  ].forEach((angle) => addWindow(chapel, angle, materials));
}

function addCrossWindow(chapel, materials) {
  const center = [12.47, 3.9, 0.3];

  const surround = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.55, 32),
    materials.salmon
  );
  surround.position.set(...center);
  surround.rotation.y = Math.PI / 2;
  chapel.add(surround);

  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(1.16, 32),
    materials.crossGlass
  );
  glass.position.set(center[0] + 0.04, center[1], center[2]);
  glass.rotation.y = Math.PI / 2;
  chapel.add(glass);

  addBox(
    chapel,
    [0.13, 2.15, 0.22],
    [center[0] + 0.09, center[1], center[2]],
    materials.cross
  );
  addBox(
    chapel,
    [0.13, 0.22, 1.8],
    [center[0] + 0.09, center[1] + 0.35, center[2]],
    materials.cross
  );
}

function addEntrance(chapel, materials) {
  const surround = createArch(2.4, 4.1, materials.salmon);
  surround.position.set(-11.27, 0.55, 0.55);
  surround.rotation.y = -Math.PI / 2;
  chapel.add(surround);

  const door = createArch(1.85, 3.6, materials.glass);
  door.position.set(-11.33, 0.7, 0.55);
  door.rotation.y = -Math.PI / 2;
  chapel.add(door);

  addBox(chapel, [2.2, 0.22, 5.4], [-12.15, 0.11, 0.55], materials.renderShadow);
}

export function createModel() {
  const chapel = new THREE.Group();
  const materials = createMaterials();

  addShell(chapel, materials);
  addSideWindows(chapel, materials);
  addCrossWindow(chapel, materials);
  addEntrance(chapel, materials);

  return chapel;
}
