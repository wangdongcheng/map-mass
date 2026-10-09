# 0230 — Little Sisters of the Poor chapel, Hamrun

## References

- Primary photograph: `references/church-photos/0230/0230.jpg`.
- Aerial reference: `ScreenShot_2026-09-30_232548_902.png` in the same directory.
- Map context: `0230-osm-context.geojson`, extracted on 2026-10-09 from OpenFreeMap snapshot `20261004_113936_pt`, tile `14/8851/6440`. Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright. Tile/component IDs are not OSM way IDs.
- Existing source comments identify OSM way `453958520` as the historical chapel footprint reference.

## Placement and orientation

The existing anchor is `[14.49154685, 35.88663861]`, recorded as the footprint centroid. The model uses bearing 0, altitude 0, scale 1 and minimum zoom 14. Its traced footprint is stored directly as east/north metre offsets; north is converted to negative local Z. Consequently no extra geographic rotation is applied.

The footprint has 18 vertices and includes the irregular chapel perimeter. The complete unrotated model spans approximately 26.90 × 17.87 m, including roof and decorative projections, and reaches 8.7 m high.

## Architectural interpretation

The model contains the low polygonal body, salmon-coloured cornice bands, a shallow elliptical dome roof with a dark kerb, a lower polygonal cap at the eastern end, arched glazing, an eastern circular cross window and a western doorway with a small step. The footprint extrusion, rather than a generic rectangle, defines the main plan.

The footprint offsets and placement were preserved from the existing implementation. The new map context is a later source snapshot and does not establish exact equality with the historical way response. Heights, colour and small details are visual interpretations of the provided images; interiors and the neighbouring care-home buildings are omitted.

## Preview

`0230-model-preview.png` shows the implemented chapel from the southeast in its east/north coordinate frame, including the irregular outline and eastern roof end. It is a standalone rendering rather than a live-map screenshot.
