import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { churchModel0057 } from "../src/map/church-models/0057/config.js";
import { churchModelRegistry } from "../src/map/church-models/registry.js";
import { disposeModel } from "../src/map/church-models/shared/dispose-model.js";

test("0057 follows the mapped church outline and faces Sir Temi Zammit Avenue", () => {
  assert.equal(churchModelRegistry.get("0057"), churchModel0057);
  const context = JSON.parse(readFileSync(new URL("../references/map/0057-osm-context.geojson", import.meta.url), "utf8"));
  const footprint = context.features.find(({ id }) => id === "building-71555740-856").geometry.coordinates[0].slice(0, -1);
  const [lng, lat] = churchModel0057.coordinates;
  const metres = ([longitude, latitude]) => new THREE.Vector2(
    (longitude - lng) * 111320 * Math.cos(lat * Math.PI / 180),
    (latitude - lat) * 111320
  );
  const church = churchModel0057.createModel();
  church.rotation.y = THREE.MathUtils.degToRad(churchModel0057.bearing);
  church.updateMatrixWorld(true);
  const body = church.getObjectByName("aisles-and-rear-body");
  const vertices = body.geometry.attributes.position;
  const bottom = [];
  for (let i = 0; i < vertices.count; i++) {
    const world = body.localToWorld(new THREE.Vector3().fromBufferAttribute(vertices, i));
    if (Math.abs(world.y) < 0.01) bottom.push(new THREE.Vector2(world.x, -world.z));
  }
  for (const corner of footprint) {
    assert.ok(bottom.some(vertex => vertex.distanceTo(metres(corner)) < 0.03), "ground outline must match every map corner");
  }
  const front = church.getObjectByName("main-entrance").getWorldPosition(new THREE.Vector3());
  const heading = new THREE.Vector2(front.x, -front.z).normalize();
  assert.ok(heading.dot(metres([14.4985199, 35.9000309]).normalize()) > 0.99, "entrance must face the NE road");
  const bounds = new THREE.Box3().setFromObject(church);
  assert.ok(bounds.max.y > 24 && bounds.max.y < 25);
  const nave = church.getObjectByName("raised-nave");
  assert.ok(nave.position.y + nave.geometry.parameters.height / 2 > 15);
  assert.equal(church.getObjectByName("roof-solar-panels").children.length, 45);
  church.traverse((node) => {
    if (!node.isMesh) return;
    assert.ok(Array.from(node.geometry.attributes.position.array).every(Number.isFinite));
  });
  disposeModel(church);
});
