# 0023 — Holy Trinity, Marsa

## References

- Facade photograph: `references/church-photos/0023/0023.jpg`.
- Aerial reference: `ScreenShot_2026-09-30_221256_050.png` in the same directory.
- Map context: `0023-osm-context.geojson`, extracted on 2026-10-09 from OpenFreeMap snapshot `20261004_113936_pt`, tile `14/8851/6440`. Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright. Tile/component IDs are not OSM way IDs.
- Existing configuration and geometry comments identify OSM way `139523273` as the historical footprint reference; that way ID is distinct from the exported tile feature IDs.

## Placement and orientation

The model uses `[14.49411, 35.88275]`, `bearing: 204`, altitude 0, scale 1 and minimum zoom 14. Its local -X entrance faces heading 66° (ENE), consistent with the axis recorded in the existing configuration.

The existing model applies plan scaling `[0.68, 1, 1.24]` and translation `[0.91, 0, -0.64]` to its architectural geometry. Heights are not scaled. Including the towers and facade, the unrotated result spans approximately 41.58 × 29.64 m and reaches 34.45 m high. The map configuration's unit scale is additional to this internal scaling.

## Architectural interpretation

The model includes a long limestone nave, layered facade and cornices, main portal, side windows and a symmetrical pair of front bell towers with domes, lanterns and crosses. Fine sculpture and interior geometry are omitted.

The proportions and ornament are interpretations of the supplied images. The new OSM context records current surrounding buildings and roads; it does not independently validate all of the older model's corners or reconstruct the exact historical data response. The model, its internal scaling and placement were retained while the missing reference files were added.

## Preview

`0023-model-preview.png` renders the actual Three.js model, including its internal scaling and offset, before geographic rotation. The entrance and one side are visible. The image is a visual check, not a screenshot of the live map.
