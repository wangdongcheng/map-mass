# 0202 — St Patrick / Sacred Heart of Jesus, Sliema

## References

- Street entrance photograph: `references/church-photos/0202/0202.jpg`.
- Opposing aerial views: `ScreenShot_2026-10-09_110630_339.png` and `ScreenShot_2026-10-09_110700_882.png` in the same directory.
- Interior interpretation reference: `unnamed.jpg` in the same directory.
- Map context: `0202-osm-context.geojson`, extracted on 2026-10-09 from OpenFreeMap snapshot `20261004_113936_pt`, tiles `14/8851/6438` and `14/8852/6438`. Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright. Feature/component IDs are not asserted to be OSM way IDs.

## Footprint, placement and orientation

The custom model includes the entire connected F-shaped St Patrick's church and Salesian school building, following building component `building:26569630-1473`. The long street-facing school spine runs along Triq San Gwann Bosco, the chapel forms the middle projecting arm, and the longer southern school wing follows Triq Guze Howard. The two gaps between the arms remain open. The model covers the connected building, with its school facades, roofs and rooftop equipment; the sports court and parked cars remain part of the surrounding map.

All 20 corners of the complete pinned building outline are traced into the model's local metre coordinates in `src/map/church-models/0202/footprint.js`. The main ground-level extrusion preserves the full concave perimeter, including the setbacks at the wing junctions. Its outline spans approximately 82.2 × 100.2 m in the unrotated model frame. School roof geometry follows the same outline with the projecting chapel removed so its raised nave roof remains distinct.

The chapel spur has these three pinned outer corners:

| Corner | Longitude | Latitude |
| --- | --- | --- |
| Front north | 14.5011162758 | 35.9155606042 |
| Rear north | 14.5014488697 | 35.9154433013 |
| Rear south | 14.5014005899 | 35.9153303428 |

The long northern edge measures 32.705 m; the eastern edge measures 13.307 m. A rectangular main body approximates this slightly skewed spur; its nearest corners are within 0.8 m of those three outer map vertices. The fourth corner and chapel boundary inside the connected school cannot be recovered as a separate building edge from this tile.

The model anchor is `[14.5012584329, 35.9154454735]`, the fitted chapel-body centre. The workbook marker `[14.50124, 35.91545]` is retained for the church marker. With the entrance at local -X, `bearing: 336.4676652125` places it at heading 293.53° (WNW), toward Triq San Gwann Bosco. The rear extends ESE into the courtyard toward Don Mikiel Rua; the connected school continues across the front and along Triq Guze Howard.

The church doorway is positioned on the traced street edge of the continuous school spine, at approximately local X=-27.895 m. Its portico and staircase project toward the street. These decorative projections are interpretations of the photographs and are not independently identified OSM polygons.

## Architectural interpretation

The chapel retains warm limestone walls, side windows and pilasters, horizontal cornices, a narrower raised flat roof with dark clerestory openings, a street facade with green-framed windows and louvred shutters, three green entrance doors, a three-arch projecting portico on pale square piers, a stone balustrade and broad stepped approach.

The school wings add repeated four-storey window bays, arched upper windows, stone piers and cornices on both street and courtyard elevations, continuous flat roofs and parapets, nine groups of dark solar modules with metal frames, a pale corner stairwell, the chimney beside the chapel junction and simplified rooftop water tanks. The solar arrays follow the two long school roof directions; they do not cover the chapel's raised nave roof.

Chapel walls are estimated at 17.8 m, school walls at 18.4 m, school parapets at 19.3 m and the raised chapel roof parapet at approximately 21 m. The corner stairwell reaches 22.1 m and the chimney cap approximately 24 m. These heights, floor spacing, colours, roof equipment positions and decorative profiles are estimates from the exterior photographs and aerial views. The interior image supports interpretation of the taller nave; no interior geometry or furnishings are included. The model uses altitude 0, scale 1 and minimum zoom 14, following the existing map integration.

## Preview and validation

`0202-model-preview.png` shows the actual isolated complex from above the courtyard side, before geographic rotation, so the full F-shaped outline and school solar roofs are visible. It is a 1200 × 900 Three.js render rather than a live-map screenshot.

The model test checks all 20 full-building footprint corners against the pinned GeoJSON within 0.02 m, confirms that the spine and both projecting arms exist while the spaces between them stay open, and retains checks for the chapel spur, WNW entrance, three portico arches, staircase, roof equipment, height, finite vertices and a map-appropriate triangle budget. The source tile's own quantization and modelling estimates still limit real-world precision.
