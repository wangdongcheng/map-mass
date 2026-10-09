import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { churchModel0106 } from "../src/map/church-models/0106/config.js";
import { churchModelRegistry } from "../src/map/church-models/registry.js";
import { disposeModel } from "../src/map/church-models/shared/dispose-model.js";

test("0106 traces the pinned chapel footprint and faces its southern approach", () => {
  assert.equal(churchModelRegistry.get("0106"), churchModel0106);
  const context = JSON.parse(readFileSync(new URL("../references/map/0106/0106-osm-context.geojson", import.meta.url), "utf8"));
  const corners = context.features.find(f => f.id === "building:56576890-1272").geometry.coordinates[0].slice(0, 4);
  const [lng, lat] = churchModel0106.coordinates;
  const expected = corners.map(([x, y]) => new THREE.Vector2((x - lng) * 111320 * Math.cos(lat * Math.PI / 180), (y - lat) * 111320));
  const model = churchModel0106.createModel();
  model.rotation.y = THREE.MathUtils.degToRad(churchModel0106.bearing);
  model.updateMatrixWorld(true);
  const body = model.getObjectByName("chapel-body");
  const positions = body.geometry.attributes.position;
  const ground = [];
  for (let i = 0; i < positions.count; i++) {
    const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
    if (Math.abs(vertex.y) > 0.001) continue;
    body.localToWorld(vertex);
    ground.push(new THREE.Vector2(vertex.x, -vertex.z));
  }
  for (const point of expected) assert.ok(ground.some(v => v.distanceTo(point) < 0.02), "each source corner is preserved");
  const entrance = model.getObjectByName("main-entrance").getWorldPosition(new THREE.Vector3());
  assert.ok(entrance.x > 0 && entrance.z > 0, "entrance faces SE rather than the rear NW end");
  assert.ok(model.getObjectByName("raised-rear-annex"));
  assert.ok(model.getObjectByName("facade-oculus"));
  assert.ok(model.getObjectByName("facade-cross"));
  const bounds = new THREE.Box3().setFromObject(model);
  assert.ok(bounds.max.y > 6 && bounds.max.y < 7);
  let triangles = 0;
  model.traverse(node => {
    if (!node.isMesh) return;
    assert.ok(Array.from(node.geometry.attributes.position.array).every(Number.isFinite));
    triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3;
  });
  assert.ok(triangles < 10000, "geometry stays suitable for the live map");
  disposeModel(model);
});
