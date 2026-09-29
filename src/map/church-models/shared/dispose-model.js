export function disposeModel(root) {
  const geometries = new Set();
  const materials = new Set();

  root.traverse((object) => {
    if (object.geometry) {
      geometries.add(object.geometry);
    }

    if (Array.isArray(object.material)) {
      object.material.forEach((material) => materials.add(material));
    } else if (object.material) {
      materials.add(object.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    Object.values(material).forEach((value) => {
      if (value?.isTexture) {
        value.dispose();
      }
    });
    material.dispose();
  });
}
