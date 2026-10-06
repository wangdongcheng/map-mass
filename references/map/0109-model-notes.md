# 0109 — Tal-Mirakli chapel, Lija

## References

- Front photograph: `references/church-photos/0109/0109.jpg`.
- Two oblique aerial views: `ScreenShot_2026-10-06_230612_002.png` and `ScreenShot_2026-10-06_230633_320.png` in the same directory.
- OSM-derived map geometry: `0109-osm-context.geojson`, extracted from the project's OpenFreeMap tile `https://tiles.openfreemap.org/planet/20260927_080001_pt/14/8849/6439.pbf` on 2026-10-06. Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright. Vector-tile feature IDs may represent merged buildings and are not asserted to be OSM way IDs.

## Placement and orientation

The chapel footprint is the rectangle with corners:

| Corner | Longitude | Latitude |
| --- | --- | --- |
| NW | 14.4376122952 | 35.8971028135 |
| NE | 14.4378268719 | 35.8970680490 |
| SE | 14.4378000498 | 35.8969637554 |
| SW | 14.4375854731 | 35.8969985200 |

Its centre is `[14.4377061725, 35.8970332845]`, its length is approximately 19.73 m and its width 11.86 m. The workbook point `[14.43761, 35.89708]` is near the NW corner, so it is retained for the church marker while the model uses the footprint centre.

Triq il-Kappella tal-Mirakli approaches from the SW and bends at `[14.4375908375, 35.8971723424]`, NW of the chapel. Triq Annibale Preca continues east along its north side, while Triq il-Mitħna branches NE. The aerial references show the entrance and enclosed forecourt at the west end near this bend. The independent residential building immediately south has an approximately 3 m gap from the chapel; it is not part of the church model. The playground is farther south, and the park north/east of the junction. These relationships resolve the 180-degree ambiguity of the rectangular footprint.

The entrance faces approximately 281.3° (WNW); the nave runs toward 101.3° (ESE). In the existing Three.js/map transform, local X is east and local Z is south before rotation. With the entrance at local -X, compass heading is `270 - bearing`, so the configuration uses `bearing: 348.7`.

## Architectural interpretation

The model follows the rectangular limestone body, flat roof and parapet, pink/red dome and lantern over the front two-thirds of the roof, and a single belfry at the NE rear. The front has paired pilasters, horizontal cornices, a rectangular double door with triangular pediment, inscription panel, Madonna and Child niche, rooftop cross, and a small balustraded forecourt. The side elevations have upper rectangular windows and projecting rainwater spouts.

Plan dimensions and placement come from the vector footprint. Heights (11.8 m wall, approximately 19.3 m dome finial) and small facade details are visual estimates from the photographs, not surveyed measurements. The original OSM extrusion is 5 m tall and is enclosed by the custom body. Neighbouring buildings and roads stay in the existing map layers.
