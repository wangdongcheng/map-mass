# 0106 — Lunzjata / Annunciation of Our Lady, Victoria, Gozo

## References

- Front entrance: `references/church-photos/0106/0106.jpg`.
- Oblique aerial: `references/church-photos/0106/ScreenShot_2026-10-09_171743_077.png`.
- Interior: `references/church-photos/0106/unnamed (2).jpg`.
- Pinned map context: `0106-osm-context.geojson`, OpenFreeMap snapshot `20261004_113936_pt`, tile `14/8839/6431`, downloaded on 2026-10-09. Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright. Tile/component identifiers are not asserted to be OSM way IDs.

## Footprint, placement and orientation

The ground body traces all four vertices of building component `building:56576890-1272` in local metre coordinates. Its slightly tapered outline measures approximately 8.17 m along the centre axis and 4.83 m across its southern end. The source has `render_height: 4`; this is a map extrusion value, not a surveyed height or a description of the stepped roof.

The anchor `[14.233052283525467, 36.04065397437709]` is the average of the four footprint corners. The workbook marker remains `[14.23305, 36.04066]`. Local -X is the entrance; `bearing: 124.159694540021` points it at heading 145.84° (SE). The rear extends NW. The aerial photograph supports the low entrance end and taller rear volume; its screenshot has no compass, so matching the entrance to the southern footprint edge is an interpretation rather than an independently surveyed direction.

The complete ground extrusion follows the pinned polygon. The raised rear volume, front facade, projecting trim and small walled forecourt are photo-based approximations. The forecourt is not identified as a separate OSM building polygon. The adjoining rock face and valley terrain remain outside this standalone model, since their geometry and elevation are not supplied by the building context.

## Architectural interpretation

The model includes pale weathered plaster, a shallow asymmetric facade crest, corner strips, a brown round-headed entrance, a dark circular upper window with stone rim, a small iron cross on a stone pedestal, plaques and a framed notice board. The nave has a low flat roof with side cornices and simplified small upper openings. A taller flat-roofed rear service volume has parapets, upper windows and a rear doorway. A low front enclosure leaves the central pedestrian approach open.

Nave walls are estimated at 4.65 m, the shallow front crest at 5.05 m, the cross at about 6.1 m, and the rear parapets at 6.8 m. Heights, facade proportions, rear division, openings, colours and forecourt dimensions are estimates from the supplied images. No invented dome or bell tower is added. The interior photograph supports the compact chapel interpretation; furnishings, altar and interior decoration are not modelled. Altitude 0, scale 1 and minimum zoom 14 follow the existing map integration.

## Preview and validation

`0106-model-preview.png` is a 1200 × 900 rendering of the actual standalone Three.js model, viewed from local -X/+Z above the entrance and side elevation, without geographic rotation. It shows the small facade, open forecourt and raised rear roof.

The model test checks every ground footprint corner against the pinned context within 0.02 m in the repository's local metre projection, SE entrance placement, roof height, finite vertices and a triangle budget below 10,000. This checks correspondence to the downloaded tile, not real-world survey accuracy; tile quantization and photograph-based estimates remain limiting factors.
