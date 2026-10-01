import { LngLat, Point } from "maplibre-gl";
import { ISLAND_OUTLINE } from "./island-outline.js";

export const HOME_ORIENTATION = { pitch: 50, bearing: -18 };
export const PAN_BOUNDS = [[13.7, 35.4], [15.07, 36.54]];

export function getHomePanBounds(map, view) {
  const transform = map._camera.transform.clone();
  transform.setMaxBounds(undefined);
  transform.setMinZoom(0);
  transform.setPadding(view.padding);
  transform.setPitch(view.pitch);
  transform.setBearing(view.bearing);
  transform.setCenter(LngLat.convert(view.center));
  transform.setZoom(view.zoom);
  const corners = [
    [0, 0], [transform.width, 0],
    [0, transform.height], [transform.width, transform.height]
  ].map(([x, y]) => transform.screenPointToLocation(new Point(x, y)));
  // A tall phone viewport can extend beyond the original pan envelope. Allow
  // that full viewport, otherwise MapLibre shifts the fitted camera and clips it.
  return [
    [Math.min(PAN_BOUNDS[0][0], ...corners.map(({ lng }) => lng - 0.01)),
      Math.min(PAN_BOUNDS[0][1], ...corners.map(({ lat }) => lat - 0.01))],
    [Math.max(PAN_BOUNDS[1][0], ...corners.map(({ lng }) => lng + 0.01)),
      Math.max(PAN_BOUNDS[1][1], ...corners.map(({ lat }) => lat + 0.01))]
  ];
}

export function getHomeView(map) {
  // Measure on a clone so calculating a reset never moves the live camera.
  // cameraForBounds alone fits a flat map and does not account for perspective.
  const transform = map._camera.transform.clone();
  const { width, height } = transform;
  const padding = {
    top: Math.min(80, height * 0.2),
    bottom: Math.min(40, height * 0.1),
    left: Math.min(24, width * 0.08),
    right: Math.min(56, width * 0.18)
  };
  const coastline = ISLAND_OUTLINE.map((point) => LngLat.convert(point));
  transform.setMinZoom(0);
  // Pan limits must not move the fitting center during the zoom search.
  transform.setMaxBounds(undefined);
  transform.setPadding(padding);
  transform.setPitch(HOME_ORIENTATION.pitch);
  transform.setBearing(HOME_ORIENTATION.bearing);
  const target = new Point(
    (padding.left + width - padding.right) / 2,
    (padding.top + height - padding.bottom) / 2
  );

  const fitAtZoom = (zoom) => {
    transform.setZoom(zoom);
    transform.setCenter(new LngLat(14.38, 35.935));
    let box;
    // Perspective makes the geographic midpoint different from the visible
    // midpoint. Recenter the projected coastline before judging its size.
    for (let iteration = 0; iteration < 30; iteration += 1) {
      const points = coastline.map((point) => transform.locationToScreenPoint(point));
      box = {
        left: Math.min(...points.map(({ x }) => x)),
        right: Math.max(...points.map(({ x }) => x)),
        top: Math.min(...points.map(({ y }) => y)),
        bottom: Math.max(...points.map(({ y }) => y))
      };
      const dx = (box.left + box.right) / 2 - target.x;
      const dy = (box.top + box.bottom) / 2 - target.y;
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) break;
      if (iteration < 29) {
        transform.setCenter(transform.screenPointToLocation(
          new Point(target.x + dx * 0.7, target.y + dy * 0.7)
        ));
      }
    }
    return box.left >= padding.left && box.right <= width - padding.right &&
      box.top >= padding.top && box.bottom <= height - padding.bottom;
  };

  let lower = 0;
  let upper = 1;
  // Find the first overflowing zoom before binary search; avoid projecting
  // distant islands behind the camera at extreme close-up zoom levels.
  while (upper < map.getMaxZoom() && fitAtZoom(upper)) {
    lower = upper;
    upper = Math.min(upper + 1, map.getMaxZoom());
  }
  for (let iteration = 0; iteration < 32; iteration += 1) {
    const zoom = (lower + upper) / 2;
    if (fitAtZoom(zoom)) lower = zoom;
    else upper = zoom;
  }
  fitAtZoom(lower);
  return {
    center: transform.center.toArray(),
    zoom: transform.zoom,
    ...HOME_ORIENTATION,
    padding
  };
}
