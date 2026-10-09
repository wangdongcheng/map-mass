# 0202 — St Patrick / Sacred Heart of Jesus, Sliema

## References

- Street entrance photograph: `references/church-photos/0202/0202.jpg`.
- Opposing aerial views: `ScreenShot_2026-10-09_110630_339.png` and `ScreenShot_2026-10-09_110700_882.png` in the same directory.
- Interior interpretation reference: `unnamed.jpg` in the same directory.
- Map context: `0202-osm-context.geojson`, extracted on 2026-10-09 from OpenFreeMap snapshot `20261004_113936_pt`, tiles `14/8851/6438` and `14/8852/6438`. Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright. Feature/component IDs are not asserted to be OSM way IDs.

## Footprint, placement and orientation

OpenFreeMap merges the chapel and connected school frontage into building component `building:26569630-1473`. It is not a detached rectangular church polygon. The aerial references distinguish the chapel as the east-southeast spur extending into the school courtyard, with a raised flat nave roof. The broader school wings, sports court, parked cars and rooftop solar panels belong to the surroundings and are not recreated in the church model.

The chapel spur has these three pinned outer corners:

| Corner | Longitude | Latitude |
| --- | --- | --- |
| Front north | 14.5011162758 | 35.9155606042 |
| Rear north | 14.5014488697 | 35.9154433013 |
| Rear south | 14.5014005899 | 35.9153303428 |

The long northern edge measures 32.705 m; the eastern edge measures 13.307 m. A rectangular main body approximates this slightly skewed spur; its nearest corners are within 0.8 m of those three outer map vertices. The fourth corner and chapel boundary inside the connected school cannot be recovered as a separate building edge from this tile.

The model anchor is `[14.5012584329, 35.9154454735]`, the fitted chapel-body centre. The workbook marker `[14.50124, 35.91545]` is retained for the church marker. With the entrance at local -X, `bearing: 336.4676652125` places it at heading 293.53° (WNW), toward Triq San Gwann Bosco. The rear extends ESE into the courtyard toward Don Mikiel Rua; the connected school continues across the front and along Triq Guze Howard.

The model includes a 13.2 m deep entrance section within the street-facing school frontage. This section, porch projection and staircase are interpretations of the photographs, not separately surveyed or independently identified OSM polygons. They should not be treated as extra mapped chapel footprint corners.

## Architectural interpretation

The model includes warm limestone walls, three storeys of side windows and pilasters, horizontal cornices, a narrower raised flat roof with dark clerestory openings, a street facade with green-framed windows and louvred shutters, three green entrance doors, a three-arch projecting portico on pale square piers, a stone balustrade and broad stepped approach.

Main walls are estimated at 17.8 m, the entrance frontage at 18.4 m and the top parapet at approximately 21 m. These heights, floor spacing, colours and decorative profiles are estimates from the exterior photographs and aerial views. The interior image supports interpretation of the taller nave; no interior geometry or furnishings are included. The model uses altitude 0, scale 1 and minimum zoom 14, following the existing map integration.

## Preview and validation

`0202-model-preview.png` shows the actual isolated model from the local -X entrance side before geographic rotation. It is a 1200 × 900 Three.js render rather than a live-map screenshot.

The model test checks the three pinned outer footprint corners, WNW entrance direction, connected street-frontage placement, three portico arches, staircase, height, finite vertices and a map-appropriate triangle budget.
