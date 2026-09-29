import { MercatorCoordinate } from "maplibre-gl";
import * as THREE from "three";
import { churchModelRegistry } from "./church-models/index.js";
import { disposeModel } from "./church-models/shared/dispose-model.js";

const LAYER_ID = "church-3d-models";

function findFirstLabelLayer(map) {
  return map
    .getStyle()
    .layers
    .find(
      (layer) =>
        layer.type === "symbol" &&
        Boolean(layer.layout?.["text-field"])
    );
}

function createScene(model) {
  const scene = new THREE.Scene();
  scene.add(model);
  scene.add(new THREE.HemisphereLight(0xfff8e8, 0x69717a, 2.3));

  const sun = new THREE.DirectionalLight(0xfff2d4, 3.1);
  sun.position.set(-40, -50, 85).normalize();
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xd7eaff, 1.15);
  fill.position.set(30, 35, 35).normalize();
  scene.add(fill);

  return scene;
}

function createTransform(coordinates, altitude, scale) {
  const origin = MercatorCoordinate.fromLngLat(coordinates, altitude);
  const mercatorScale = origin.meterInMercatorCoordinateUnits() * scale;

  return new THREE.Matrix4()
    .makeTranslation(origin.x, origin.y, origin.z)
    .scale(new THREE.Vector3(mercatorScale, -mercatorScale, mercatorScale))
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
}

function createModelEntry(church, config) {
  const model = config.createModel();
  model.rotation.y = THREE.MathUtils.degToRad(config.bearing ?? 0);

  return {
    churchId: church.id,
    minimumZoom: config.minimumZoom ?? 14,
    model,
    scene: createScene(model),
    transform: createTransform(
      config.coordinates ?? church.coordinates,
      config.altitude ?? 0,
      config.scale ?? 1
    )
  };
}

function createChurchModelsLayer(churches) {
  const entries = churches.flatMap((church) => {
    const config = churchModelRegistry.get(church.id);
    return config ? [createModelEntry(church, config)] : [];
  });

  return {
    id: LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      this.map = map;
      this.camera = new THREE.Camera();
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.autoClear = false;
    },

    render(gl, args) {
      const zoom = this.map.getZoom();
      const projection = new THREE.Matrix4().fromArray(
        args.defaultProjectionData.mainMatrix
      );

      this.renderer.resetState();

      entries.forEach((entry) => {
        if (zoom < entry.minimumZoom) {
          return;
        }

        this.camera.projectionMatrix = projection.clone().multiply(entry.transform);
        this.renderer.render(entry.scene, this.camera);
      });

      if (entries.some((entry) => zoom >= entry.minimumZoom)) {
        this.map.triggerRepaint();
      }
    },

    onRemove() {
      entries.forEach((entry) => disposeModel(entry.model));
    }
  };
}

export function addChurchModelsLayer(map, churches) {
  if (map.getLayer(LAYER_ID)) {
    return;
  }

  const hasRegisteredModel = churches.some((church) =>
    churchModelRegistry.has(church.id)
  );

  if (!hasRegisteredModel) {
    return;
  }

  map.addLayer(
    createChurchModelsLayer(churches),
    findFirstLabelLayer(map)?.id
  );
}
