const BUILDING_SOURCE_ID = "malta-buildings-source";
const BUILDING_LAYER_ID = "malta-3d-buildings";

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

function createBuildingLayer() {
  return {
    id: BUILDING_LAYER_ID,
    source: BUILDING_SOURCE_ID,
    "source-layer": "building",
    type: "fill-extrusion",
    minzoom: 13.5,
    filter: ["!=", ["get", "hide_3d"], true],
    paint: {
      "fill-extrusion-color": [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "render_height"], 6],
        0,
        "#e0d1b9",
        15,
        "#d4bc98",
        40,
        "#c9aa7e",
        100,
        "#b88d5d"
      ],
      "fill-extrusion-height": [
        "interpolate",
        ["linear"],
        ["zoom"],
        13.5,
        0,
        14.35,
        ["coalesce", ["get", "render_height"], 6]
      ],
      "fill-extrusion-base": [
        "coalesce",
        ["get", "render_min_height"],
        0
      ],
      "fill-extrusion-opacity": 0.96,
      "fill-extrusion-vertical-gradient": true
    }
  };
}

export function addBuildingLayer(map) {
  if (!map.getSource(BUILDING_SOURCE_ID)) {
    map.addSource(BUILDING_SOURCE_ID, {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet"
    });
  }

  if (map.getLayer(BUILDING_LAYER_ID)) {
    return;
  }

  const buildingLayer = createBuildingLayer();
  const firstLabelLayer = findFirstLabelLayer(map);

  if (firstLabelLayer) {
    map.addLayer(buildingLayer, firstLabelLayer.id);
    return;
  }

  map.addLayer(buildingLayer);
}
