import { Map, NavigationControl, setWorkerUrl } from "maplibre-gl";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { getHomeView, getHomePanBounds, HOME_ORIENTATION, PAN_BOUNDS } from "./home-view.js";

setWorkerUrl(mapLibreWorkerUrl);

export function createMaltaMap(container) {
  const map = new Map({
    container,
    style: "https://tiles.openfreemap.org/styles/bright",
    center: [14.38, 35.935],
    ...HOME_ORIENTATION,
    minZoom: 0,
    maxZoom: 20,
    maxBounds: PAN_BOUNDS,
    renderWorldCopies: false,
    dragRotate: false,
    pitchWithRotate: false,
    scrollZoom: {
      around: "center"
    },
    canvasContextAttributes: {
      antialias: true
    }
  });

  let homeView = getHomeView(map);
  map.setMaxBounds(getHomePanBounds(map, homeView));
  map.setMinZoom(homeView.zoom);
  map.jumpTo(homeView);
  let atHome = true;
  map.on("zoomstart", () => { atHome = false; });
  map.on("dragstart", () => { atHome = false; });
  map.on("moveend", () => {
    const center = map.getCenter();
    atHome = Math.abs(map.getZoom() - homeView.zoom) < 0.001 &&
      Math.abs(center.lng - homeView.center[0]) < 0.00001 &&
      Math.abs(center.lat - homeView.center[1]) < 0.00001;
  });
  map.on("resize", () => {
    // Remember the state before resize constraints can shift the camera.
    const restoreHome = atHome;
    homeView = getHomeView(map);
    map.setMaxBounds(getHomePanBounds(map, homeView));
    map.setMinZoom(homeView.zoom);
    if (restoreHome) map.jumpTo(homeView);
  });

  map.touchZoomRotate.disableRotation();

  map.addControl(
    new NavigationControl({
      showCompass: false,
      showZoom: true
    }),
    "top-right"
  );

  return map;
}
