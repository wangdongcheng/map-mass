import { MercatorCoordinate } from "maplibre-gl";
import * as THREE from "three";

const LAYER_ID = "marija-regina-3d-model";
const MODEL_ORIGIN = [14.48774, 35.88232];
const MODEL_BEARING = THREE.MathUtils.degToRad(14);

function createMaterials() {
  const standard = (color, roughness = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  return {
    limestone: standard(0xd8c9ae, 0.96),
    limestoneLight: standard(0xe8dcc6, 0.93),
    trim: standard(0xf1e7d4, 0.88),
    roof: standard(0xc9c9c2, 0.8),
    roofRib: standard(0x59616a, 0.72),
    glassBlue: new THREE.MeshStandardMaterial({
      color: 0x275982,
      roughness: 0.22,
      metalness: 0.12,
      side: THREE.DoubleSide
    }),
    glassRed: standard(0x9e3440, 0.3),
    wood: new THREE.MeshStandardMaterial({
      color: 0x766454,
      roughness: 0.86,
      side: THREE.DoubleSide
    }),
    cross: standard(0xb69758, 0.5)
  };
}

function addBox(parent, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material
  );
  mesh.position.set(position[0], position[1], position[2]);
  parent.add(mesh);
  return mesh;
}

function createArch(width, height, material) {
  const radius = width / 2;
  const springHeight = height - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(-radius, springHeight);
  shape.absarc(0, springHeight, radius, Math.PI, 0, false);
  shape.lineTo(radius, 0);
  shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), material);
}

function createBarrelRoofBay(length, width, baseHeight, rise, material) {
  const segments = 18;
  const halfLength = length / 2;
  const halfWidth = width / 2;
  const vertices = [];

  for (let index = 0; index < segments; index += 1) {
    const startRatio = index / segments;
    const endRatio = (index + 1) / segments;
    const startZ = -halfWidth + startRatio * width;
    const endZ = -halfWidth + endRatio * width;
    const startY = baseHeight + Math.sin(startRatio * Math.PI) * rise;
    const endY = baseHeight + Math.sin(endRatio * Math.PI) * rise;

    vertices.push(
      -halfLength, startY, startZ,
      halfLength, startY, startZ,
      halfLength, endY, endZ,
      -halfLength, startY, startZ,
      halfLength, endY, endZ,
      -halfLength, endY, endZ
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function addRoofRib(parent, x, width, baseHeight, rise, material) {
  const points = [];

  for (let index = 0; index <= 18; index += 1) {
    const ratio = index / 18;
    points.push(
      new THREE.Vector3(
        x,
        baseHeight + Math.sin(ratio * Math.PI) * rise + 0.14,
        -width / 2 + ratio * width
      )
    );
  }

  const curve = new THREE.CatmullRomCurve3(points);
  parent.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.24, 6, false),
      material
    )
  );
}

function addSegmentedRoof(church, materials) {
  const bayCount = 6;
  const bayLength = 7.1;
  const totalLength = bayCount * bayLength;
  const startX = -totalLength / 2;

  for (let index = 0; index < bayCount; index += 1) {
    const roof = createBarrelRoofBay(
      bayLength - 0.18,
      17.8,
      12.2,
      2.05,
      materials.roof
    );
    roof.position.x = startX + bayLength * (index + 0.5);
    church.add(roof);
  }

  for (let index = 0; index <= bayCount; index += 1) {
    addRoofRib(
      church,
      startX + bayLength * index,
      17.8,
      12.2,
      2.05,
      materials.roofRib
    );
  }
}

function placeOnFacade(mesh, y, z, x = -22.66) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function addRoseWindow(church, materials) {
  const centerY = 14.1;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.35, 2.15, 32),
    materials.trim
  );
  placeOnFacade(ring, centerY, 0, -22.7);
  church.add(ring);

  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(1.36, 32),
    materials.glassBlue
  );
  placeOnFacade(glass, centerY, 0, -22.72);
  church.add(glass);

  for (let index = 0; index < 8; index += 1) {
    const spoke = addBox(
      church,
      [0.18, 0.16, 2.65],
      [-22.76, centerY, 0],
      materials.trim
    );
    spoke.rotation.x = (index * Math.PI) / 4;
  }
}

function addFacadeWindows(church, materials) {
  [-6, 6].forEach((z) => {
    const window = createArch(2.55, 7, materials.glassBlue);
    placeOnFacade(window, 6.9, z);
    church.add(window);

    [8.1, 10.1, 12.1].forEach((y, index) => {
      addBox(
        church,
        [0.12, 0.72, 1.35],
        [-22.72, y, z],
        index % 2 === 0 ? materials.glassRed : materials.glassBlue
      );
    });
  });
}

function addFacadeDoors(church, materials) {
  const mainDoor = createArch(4.3, 6.6, materials.wood);
  placeOnFacade(mainDoor, 0.45, 0);
  church.add(mainDoor);

  [-6.3, 6.3].forEach((z) => {
    const sideDoor = createArch(2.7, 4.8, materials.wood);
    placeOnFacade(sideDoor, 0.35, z);
    church.add(sideDoor);
  });

  const hood = createArch(5.25, 7.65, materials.trim);
  placeOnFacade(hood, 0.2, 0, -22.58);
  church.add(hood);
  placeOnFacade(mainDoor, 0.45, 0, -22.7);
}

function addFacadeArchitecture(church, materials) {
  addBox(church, [1.25, 16, 18.5], [-22, 8, 0], materials.limestone);
  addBox(church, [1.45, 21, 7.6], [-22.1, 10.5, 0], materials.limestoneLight);

  [-9.1, -3.8, 3.8, 9.1].forEach((z) => {
    addBox(church, [0.75, 15.8, 0.72], [-22.72, 7.9, z], materials.trim);
  });

  addBox(church, [1.7, 0.65, 19.3], [-22.3, 15.7, 0], materials.trim);
  addBox(church, [1.9, 0.75, 8.4], [-22.4, 20.55, 0], materials.trim);

  for (let z = -8.5; z <= 8.5; z += 1.35) {
    const height = Math.abs(z) < 4 ? 21.15 : 16.25;
    addBox(church, [1.6, 0.48, 0.55], [-22.48, height, z], materials.trim);
  }

  addRoseWindow(church, materials);
  addFacadeWindows(church, materials);
  addFacadeDoors(church, materials);

  addBox(church, [0.58, 4.7, 0.58], [-22.35, 23.5, 0], materials.cross);
  addBox(church, [0.62, 0.55, 3.2], [-22.35, 24.05, 0], materials.cross);
}

function addSideWindows(church, materials) {
  [-14, -6, 3, 12, 19].forEach((x) => {
    const north = createArch(2.2, 5.4, materials.glassBlue);
    north.position.set(x, 4.5, -9.08);
    church.add(north);

    if (x < 10) {
      const south = createArch(2.2, 5.4, materials.glassBlue);
      south.position.set(x, 4.5, 9.08);
      south.rotation.y = Math.PI;
      church.add(south);
    }
  });
}

function addSteps(church, materials) {
  [
    { x: -23.6, y: 0.24, height: 0.48, width: 19.5 },
    { x: -24.5, y: 0.18, height: 0.36, width: 20.5 },
    { x: -25.35, y: 0.12, height: 0.24, width: 21.5 }
  ].forEach((step) => {
    addBox(
      church,
      [1.8, step.height, step.width],
      [step.x, step.y, 0],
      materials.trim
    );
  });
}

function createChurchModel() {
  const materials = createMaterials();
  const church = new THREE.Group();
  church.rotation.y = MODEL_BEARING;

  addBox(church, [43.5, 12.2, 18], [0, 6.1, 0], materials.limestone);
  addSegmentedRoof(church, materials);

  addBox(church, [19, 6.2, 6.8], [-2, 3.1, 12.2], materials.limestoneLight);
  addBox(church, [19.8, 0.55, 7.5], [-2, 6.35, 12.2], materials.trim);

  addFacadeArchitecture(church, materials);
  addSideWindows(church, materials);
  addSteps(church, materials);

  return church;
}

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

function createChurchLayer() {
  const origin = MercatorCoordinate.fromLngLat(MODEL_ORIGIN, 0);
  const transform = {
    translateX: origin.x,
    translateY: origin.y,
    translateZ: origin.z,
    scale: origin.meterInMercatorCoordinateUnits()
  };

  return {
    id: LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      this.map = map;
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();
      this.scene.add(createChurchModel());

      this.scene.add(new THREE.HemisphereLight(0xfff8e8, 0x69717a, 2.3));

      const sun = new THREE.DirectionalLight(0xfff2d4, 3.1);
      sun.position.set(-40, -50, 85).normalize();
      this.scene.add(sun);

      const fill = new THREE.DirectionalLight(0xd7eaff, 1.15);
      fill.position.set(30, 35, 35).normalize();
      this.scene.add(fill);

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.autoClear = false;
    },

    render(gl, args) {
      if (this.map.getZoom() < 14) {
        return;
      }

      const projection = new THREE.Matrix4().fromArray(
        args.defaultProjectionData.mainMatrix
      );
      const model = new THREE.Matrix4()
        .makeTranslation(
          transform.translateX,
          transform.translateY,
          transform.translateZ
        )
        .scale(
          new THREE.Vector3(
            transform.scale,
            -transform.scale,
            transform.scale
          )
        )
        .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

      this.camera.projectionMatrix = projection.multiply(model);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    },

    onRemove() {
      this.scene.traverse((object) => {
        object.geometry?.dispose();

        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose();
        }
      });
    }
  };
}

export function addMarijaReginaLayer(map) {
  if (!map.getLayer(LAYER_ID)) {
    map.addLayer(createChurchLayer(), findFirstLabelLayer(map)?.id);
  }
}
