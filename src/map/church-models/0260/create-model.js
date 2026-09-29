import * as THREE from "three";
import { addBox } from "../shared/geometry.js";
import { createChurchMaterials } from "../shared/materials.js";

function createMaterials() {
  const materials = createChurchMaterials();

  return {
    ...materials,
    facadeStone: new THREE.MeshStandardMaterial({
      color: 0xd2c5a9,
      roughness: 0.97
    }),
    render: new THREE.MeshStandardMaterial({
      color: 0xe0ded4,
      roughness: 0.94
    }),
    whitePaint: new THREE.MeshStandardMaterial({
      color: 0xe5e7e4,
      roughness: 0.78
    }),
    darkFrame: new THREE.MeshStandardMaterial({
      color: 0x565c5c,
      roughness: 0.7
    }),
    balconyGlass: new THREE.MeshStandardMaterial({
      color: 0x71858b,
      roughness: 0.28,
      metalness: 0.08,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide
    }),
    sign: new THREE.MeshStandardMaterial({
      color: 0x394047,
      roughness: 0.76
    }),
    paving: new THREE.MeshStandardMaterial({
      color: 0x9f8f82,
      roughness: 0.96
    })
  };
}

function addDoorWindow(chapel, z, y, size, materials) {
  addBox(
    chapel,
    [0.16, size[1] + 0.28, size[0] + 0.28],
    [-0.2, y, z],
    materials.whitePaint
  );
  addBox(
    chapel,
    [0.12, size[1], size[0]],
    [-0.3, y, z],
    materials.balconyGlass
  );

  for (
    let index = 0, offset = -size[1] / 2 + 0.35;
    offset < size[1] / 2;
    index += 1, offset += 0.7
  ) {
    const grille = addBox(
      chapel,
      [0.1, 0.08, size[0] * 0.95],
      [-0.38, y + offset, z],
      materials.whitePaint
    );
    grille.rotation.x = index % 2 === 0 ? 0.35 : -0.35;
  }
}

function addChapelEntrance(chapel, materials) {
  addBox(chapel, [0.55, 4.15, 11.6], [0, 2.08, 0], materials.facadeStone);
  addBox(chapel, [0.28, 3.25, 7.2], [-0.34, 1.73, 0], materials.whitePaint);

  [-3.55, -1.78, 0, 1.78, 3.55].forEach((z) => {
    addBox(chapel, [0.15, 3.12, 0.12], [-0.51, 1.72, z], materials.darkFrame);
  });

  addDoorWindow(chapel, -1.05, 1.65, [0.72, 1.75], materials);
  addDoorWindow(chapel, 1.05, 1.65, [0.72, 1.75], materials);
  addDoorWindow(chapel, -2.65, 2.58, [0.9, 0.72], materials);
  addDoorWindow(chapel, 2.65, 2.58, [0.9, 0.72], materials);

  addBox(chapel, [0.25, 0.5, 5.8], [-0.42, 3.72, 0], materials.facadeStone);
  for (let z = -2.35; z <= 2.35; z += 0.48) {
    addBox(chapel, [0.12, 0.22, 0.22], [-0.57, 3.75, z], materials.sign);
  }

  [-5.25, 5.25].forEach((z) => {
    addBox(chapel, [1.3, 1.15, 1.25], [-0.42, 0.58, z], materials.facadeStone);
    addBox(chapel, [1.42, 0.24, 1.38], [-0.48, 1.25, z], materials.trim);
  });

  addBox(chapel, [1.2, 0.22, 9.8], [-0.95, 0.11, 0], materials.paving);
}

function addGlazedBalcony(chapel, floorY, materials) {
  addBox(chapel, [1.25, 0.38, 12.4], [0.05, floorY - 1.55, 0], materials.whitePaint);
  addBox(chapel, [0.42, 2.75, 12], [-0.38, floorY, 0], materials.balconyGlass);
  addBox(chapel, [0.55, 0.28, 12.3], [-0.4, floorY + 1.44, 0], materials.whitePaint);

  [-6, -3, 0, 3, 6].forEach((z) => {
    addBox(chapel, [0.58, 3.05, 0.26], [-0.46, floorY, z], materials.whitePaint);
  });

  [floorY - 0.45, floorY + 0.48].forEach((y) => {
    addBox(chapel, [0.5, 0.18, 12], [-0.47, y, 0], materials.whitePaint);
  });
}

function addApartmentStructure(chapel, materials) {
  addBox(chapel, [18, 4.2, 12], [9, 2.1, 0], materials.facadeStone);
  addBox(chapel, [17.2, 13.2, 12], [9.4, 10.8, 0], materials.render);

  [6.2, 10.25, 14.3].forEach((floorY) => {
    addGlazedBalcony(chapel, floorY, materials);
  });

  addBox(chapel, [18, 0.55, 12.5], [9, 17.65, 0], materials.whitePaint);
  addBox(chapel, [7.2, 2.8, 7.2], [11.8, 19.3, -1.1], materials.render);
  addBox(chapel, [7.6, 0.4, 7.6], [11.8, 20.85, -1.1], materials.whitePaint);

  [-5.7, 5.7].forEach((z) => {
    addBox(chapel, [18.2, 17.4, 0.42], [9.1, 8.7, z], materials.whitePaint);
  });
}

export function createModel() {
  const chapel = new THREE.Group();
  const materials = createMaterials();

  addApartmentStructure(chapel, materials);
  addChapelEntrance(chapel, materials);

  return chapel;
}
