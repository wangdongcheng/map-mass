import * as THREE from "three";
import { churchModelRegistry } from "../src/map/church-models/registry.js";

try {
  const id = new URLSearchParams(location.search).get("id");
  const config = churchModelRegistry.get(id);
  if (!config) throw new Error(`Unknown model: ${id}`);
  const model = config.createModel();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9edf0);
  scene.add(model);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z);
  scene.add(new THREE.HemisphereLight(0xfff8ed, 0x6b7886, 2.4));
  const key = new THREE.DirectionalLight(0xfff2dd, 3.2);
  key.position.set(-span, span * 1.8, span);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdceaff, 1.1);
  fill.position.set(span, span, -span);
  scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(span * 5, span * 5),
    new THREE.MeshStandardMaterial({ color: 0xe1e5e8, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(center.x, bounds.min.y - 0.025, center.z);
  scene.add(ground);
  // Most facades face local -X; these models use a different entrance axis.
  const direction = id === "0202" ? new THREE.Vector3(1.2, 1.65, -1)
    : id === "0046" ? new THREE.Vector3(-0.8, 0.8, -1.3)
    : id === "0057" ? new THREE.Vector3(-0.9, 0.75, 1.3)
    : id === "0230" ? new THREE.Vector3(1.2, 0.8, 1)
    : new THREE.Vector3(-1.3, 0.8, 1);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, span * 20);
  camera.position.copy(center).addScaledVector(direction.normalize(), span * 4);
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const projected = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y])
    for (const z of [bounds.min.z, bounds.max.z]) projected.push(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
  const width = Math.max(...projected.map((p) => p.x)) - Math.min(...projected.map((p) => p.x));
  const height = Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y));
  const halfHeight = Math.max(height / 2, width / 2 / (1200 / 900)) * 1.18;
  camera.left = -halfHeight * 1200 / 900; camera.right = -camera.left;
  camera.top = halfHeight; camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1200, 900);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  document.body.style.margin = "0";
  document.body.append(renderer.domElement);
  renderer.render(scene, camera);
  window.modelPreview = { png: renderer.domElement.toDataURL("image/png"), id, width: 1200, height: 900 };
} catch (error) {
  window.modelPreview = { error: error.stack ?? String(error) };
}
