import * as THREE from "three";

export function createChurchMaterials() {
  const standard = (color, roughness = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  return {
    limestone: standard(0xd8c9ae, 0.96),
    limestoneLight: standard(0xe8dcc6, 0.93),
    limestoneShadow: standard(0xb9aa91, 0.98),
    trim: standard(0xf1e7d4, 0.88),
    roof: standard(0xc9c9c2, 0.8),
    roofRib: standard(0x858b89, 0.82),
    glassBlue: new THREE.MeshStandardMaterial({
      color: 0x275982,
      roughness: 0.22,
      metalness: 0.12,
      side: THREE.DoubleSide
    }),
    glassRed: standard(0x9e3440, 0.3),
    roseStone: standard(0xd2c7b3, 0.94),
    doorPaint: standard(0xb8afa0, 0.88),
    wood: new THREE.MeshStandardMaterial({
      color: 0x766454,
      roughness: 0.86,
      side: THREE.DoubleSide
    }),
    cross: standard(0xb69758, 0.5)
  };
}
