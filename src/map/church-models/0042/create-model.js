import * as THREE from "three";
import {
  addBox,
  addRoofRib,
  createArch,
  createBarrelRoofBay
} from "../shared/geometry.js";
import { createChurchMaterials } from "../shared/materials.js";

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
      1.25,
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
      1.25,
      materials.roofRib
    );
  }
}

function createFacadeShape(points, material, x = -22.7) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([z, y]) => shape.lineTo(z, y));
  shape.closePath();

  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  mesh.position.x = x;
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

function addFacadeTrimBetween(church, start, end, material) {
  const deltaZ = end[0] - start[0];
  const deltaY = end[1] - start[1];
  const trim = addBox(
    church,
    [0.72, 0.5, Math.hypot(deltaZ, deltaY)],
    [-22.72, (start[1] + end[1]) / 2, (start[0] + end[0]) / 2],
    material
  );
  trim.rotation.x = -Math.atan2(deltaY, deltaZ);
}

function addFacadeCrown(church, materials) {
  const leftSlope = [[-9.2, 15.7], [-3.9, 18.15]];
  const rightSlope = [[3.9, 18.15], [9.2, 15.7]];

  church.add(
    createFacadeShape(
      [[-9.2, 15.55], [-3.9, 15.55], [-3.9, 18.15]],
      materials.limestone
    )
  );
  church.add(
    createFacadeShape(
      [[3.9, 15.55], [9.2, 15.55], [3.9, 18.15]],
      materials.limestone
    )
  );

  addFacadeTrimBetween(church, ...leftSlope, materials.trim);
  addFacadeTrimBetween(church, ...rightSlope, materials.trim);
  addFacadeTrimBetween(church, [-3.9, 20.75], [3.9, 20.75], materials.trim);

  [leftSlope, rightSlope].forEach(([start, end]) => {
    for (let index = 0; index <= 7; index += 1) {
      const ratio = index / 7;
      const z = start[0] + (end[0] - start[0]) * ratio;
      const y = start[1] + (end[1] - start[1]) * ratio - 0.55;
      addBox(church, [0.78, 0.65, 0.34], [-22.76, y, z], materials.trim);
    }
  });

  for (let z = -3.45; z <= 3.45; z += 0.77) {
    addBox(church, [0.82, 0.68, 0.35], [-22.77, 20.15, z], materials.trim);
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
    materials.roseStone
  );
  placeOnFacade(glass, centerY, 0, -22.72);
  church.add(glass);

  const hub = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 20),
    materials.trim
  );
  placeOnFacade(hub, centerY, 0, -22.78);
  church.add(hub);

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
    const surround = createArch(3.05, 8.75, materials.trim);
    placeOnFacade(surround, 4.65, z, -22.7);
    church.add(surround);

    const window = createArch(2.25, 7.95, materials.glassBlue);
    placeOnFacade(window, 5.05, z, -22.76);
    church.add(window);

    [6.25, 8.1, 9.95, 11.8].forEach((y, index) => {
      addBox(
        church,
        [0.12, 0.62, 1.55],
        [-22.8, y, z],
        index % 2 === 0 ? materials.glassRed : materials.glassBlue
      );
    });
  });
}

function addMainPortal(church, materials) {
  church.add(
    createFacadeShape(
      [[-3, 0.2], [-3, 4.85], [0, 7.55], [3, 4.85], [3, 0.2]],
      materials.trim,
      -22.72
    )
  );

  const mainDoor = createArch(3.9, 5.35, materials.doorPaint);
  placeOnFacade(mainDoor, 0.35, 0, -22.81);
  church.add(mainDoor);

  [-2.38, 2.38].forEach((z) => {
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.3, 4.9, 12),
      materials.trim
    );
    column.position.set(-22.94, 2.75, z);
    church.add(column);
    addBox(church, [0.72, 0.38, 0.72], [-22.94, 5.25, z], materials.trim);
    addBox(church, [0.76, 0.34, 0.76], [-22.94, 0.25, z], materials.trim);
  });
}

function addFacadeDoors(church, materials) {
  addMainPortal(church, materials);

  [-6.3, 6.3].forEach((z) => {
    const surround = createArch(3, 4.75, materials.trim);
    placeOnFacade(surround, 0.25, z, -22.72);
    church.add(surround);

    const sideDoor = createArch(2.35, 4.25, materials.doorPaint);
    placeOnFacade(sideDoor, 0.38, z, -22.8);
    church.add(sideDoor);
  });
}

function addFacadeArchitecture(church, materials) {
  addBox(church, [1.25, 16, 18.5], [-22, 8, 0], materials.limestone);
  addBox(church, [1.45, 21, 7.6], [-22.1, 10.5, 0], materials.limestoneLight);

  [-9.1, 9.1].forEach((z) => {
    addBox(church, [0.8, 16.1, 0.78], [-22.73, 8.05, z], materials.trim);
  });
  [-3.9, 3.9].forEach((z) => {
    addBox(church, [0.82, 20.7, 0.8], [-22.74, 10.35, z], materials.trim);
  });

  addFacadeCrown(church, materials);

  addRoseWindow(church, materials);
  addFacadeWindows(church, materials);
  addFacadeDoors(church, materials);

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

function addSideButtresses(church, materials) {
  [-21.2, -10, -1.5, 7.5, 15.5, 21.2].forEach((x) => {
    [-9.35, 9.35].forEach((z) => {
      addBox(
        church,
        [0.9, 12.6, 1.05],
        [x, 6.3, z],
        materials.limestoneShadow
      );
      addBox(church, [1.15, 0.5, 1.3], [x, 12.35, z], materials.trim);
    });
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

export function createModel() {
  const materials = createChurchMaterials();
  const church = new THREE.Group();

  addBox(church, [43.5, 12.2, 18], [0, 6.1, 0], materials.limestone);
  addSegmentedRoof(church, materials);

  addBox(church, [19, 6.2, 6.8], [-2, 3.1, 12.2], materials.limestoneLight);
  addBox(church, [19.8, 0.55, 7.5], [-2, 6.35, 12.2], materials.trim);

  addFacadeArchitecture(church, materials);
  addSideWindows(church, materials);
  addSideButtresses(church, materials);
  addSteps(church, materials);

  return church;
}
