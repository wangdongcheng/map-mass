import * as maplibregl from "maplibre-gl";

export const MALTA_VIEW = {
  center: [14.385, 35.94],
  zoom: 10.45,
  pitch: 50,
  bearing: -18
};

const MALTA_BOUNDS = [
  [13.95, 35.6],
  [14.82, 36.34]
];

export function createMaltaMap(container) {
  const map = new maplibregl.Map({
    container,
    style: "https://tiles.openfreemap.org/styles/bright",
    ...MALTA_VIEW,
    minZoom: 9.3,
    maxZoom: 18,
    maxBounds: MALTA_BOUNDS,
    renderWorldCopies: false,
    dragRotate: false,
    pitchWithRotate: false,
    canvasContextAttributes: {
      antialias: true
    }
  });

  map.touchZoomRotate.disableRotation();

  map.addControl(
    new maplibregl.NavigationControl({
      showCompass: false,
      showZoom: true
    }),
    "top-right"
  );

  return map;
}
