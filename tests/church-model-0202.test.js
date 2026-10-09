import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { churchModel0202 } from "../src/map/church-models/0202/config.js";
import { churchModelRegistry } from "../src/map/church-models/registry.js";
import { disposeModel } from "../src/map/church-models/shared/dispose-model.js";

test("0202 fits the complete F-shaped school and chapel footprint with a WNW church entrance", () => {
  assert.equal(churchModelRegistry.get("0202"), churchModel0202);
  const context = JSON.parse(readFileSync(new URL("../references/map/0202-osm-context.geojson", import.meta.url), "utf8"));
  const footprint = context.features.find(({ id }) => id === "building:26569630-1473");
  assert.ok(footprint, "the chapel must have a pinned source in the connected school footprint");
  const [lng, lat] = churchModel0202.coordinates;
  const metres = ([longitude, latitude]) => new THREE.Vector2(
    (longitude - lng) * 111320 * Math.cos(lat * Math.PI / 180),
    (latitude - lat) * 111320
  );
  const church = churchModel0202.createModel();
  try {
    church.rotation.y = THREE.MathUtils.degToRad(churchModel0202.bearing);
    church.updateMatrixWorld(true);
    const complex = church.getObjectByName("complex-footprint-body");
    const vertices = complex.geometry.attributes.position;
    const ground = [];
    for (let i = 0; i < vertices.count; i++) {
      const vertex = new THREE.Vector3().fromBufferAttribute(vertices, i);
      if (Math.abs(vertex.y) > 0.01) continue;
      const world = complex.localToWorld(vertex);
      ground.push(new THREE.Vector2(world.x, -world.z));
    }
    for (const corner of footprint.geometry.coordinates[0].slice(0, -1)) {
      assert.ok(ground.some((vertex) => vertex.distanceTo(metres(corner)) < 0.02),
        "the full building outline must follow every pinned source corner");
    }
    const ray = new THREE.Raycaster();
    const hitsBody = (x, z) => {
      const origin = complex.localToWorld(new THREE.Vector3(x, 30, z));
      ray.set(origin, new THREE.Vector3(0, -1, 0));
      return ray.intersectObject(complex).length > 0;
    };
    for (const [x, z] of [[-23, -35], [0, 0], [30, 36]]) {
      assert.ok(hitsBody(x, z), "school spine, chapel arm and southern school wing must all be present");
    }
    for (const [x, z] of [[0, 20], [30, 0], [20, -20]]) {
      assert.equal(hitsBody(x, z), false, "the open spaces between the F-shaped arms must stay unbuilt");
    }
    const body = church.getObjectByName("chapel-body");
    const { width, depth } = body.geometry.parameters;
    const corners = [];
    for (const x of [-width / 2, width / 2]) for (const z of [-depth / 2, depth / 2]) {
      const world = body.localToWorld(new THREE.Vector3(x, 0, z));
      corners.push(new THREE.Vector2(world.x, -world.z));
    }
    for (const corner of footprint.geometry.coordinates[0].slice(2, 5)) {
      assert.ok(corners.some((modelCorner) => modelCorner.distanceTo(metres(corner)) < 0.8),
        "the main body must fit the three mapped outer corners of the chapel spur");
    }
    const entrance = church.getObjectByName("main-entrance").getWorldPosition(new THREE.Vector3());
    const heading = (THREE.MathUtils.radToDeg(Math.atan2(entrance.x, -entrance.z)) + 360) % 360;
    assert.ok(heading > 292 && heading < 295, "entrance must face WNW onto Triq San Gwann Bosco");
    const frontage = church.getObjectByName("street-frontage");
    assert.ok(frontage.position.x < -width / 2, "street frontage must adjoin the entrance end of the chapel");
    const porch = church.getObjectByName("three-arch-portico");
    assert.equal(porch.children.filter((node) => node.name.startsWith("portico-arch-")).length, 3);
    const steps = church.getObjectByName("entrance-steps");
    assert.ok(steps.children.length >= 10, "the elevated street entrance needs its stepped approach");
    const bounds = new THREE.Box3().setFromObject(church);
    assert.ok(bounds.min.y >= -0.01 && bounds.max.y > 23 && bounds.max.y < 25);
    assert.ok(church.getObjectByName("school-flat-roof"));
    assert.ok(church.getObjectByName("corner-stairwell"));
    assert.ok(church.getObjectByName("school-chimney"));
    const arrays = church.getObjectByName("school-roof-equipment").children.filter((node) => node.name === "solar-array");
    assert.equal(arrays.length, 9, "both long school wings need their photographed rooftop solar arrays");
    let triangles = 0;
    church.traverse((node) => {
      if (!node.isMesh) return;
      assert.ok(Array.from(node.geometry.attributes.position.array).every(Number.isFinite));
      triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3;
    });
    assert.ok(triangles < 45000, "the entire school complex must remain lightweight for the map renderer");
  } finally {
    disposeModel(church);
  }
});
