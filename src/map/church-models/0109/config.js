import { createModel } from "./create-model.js";

export const churchModel0109 = {
  churchId: "0109",
  // Centre of the OSM rectangle, not the workbook's point near its NW corner.
  coordinates: [14.4377061725, 35.8970332845],
  altitude: 0,
  // Local -X is the entrance. The map transform makes its compass bearing
  // 270 - rotation: 281.3 degrees, toward the bend west of the chapel.
  // The separate residential block is south; the belfry is at the NE rear.
  bearing: 348.7,
  scale: 1,
  minimumZoom: 14,
  createModel
};
