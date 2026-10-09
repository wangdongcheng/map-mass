# 0047 — St Augustine, Valletta

## References and placement

- Street facade and southeast corner: `references/church-photos/0047/0047.jpg`.
- Two oblique aerial views: `ScreenShot_2026-10-08_203525_349.png` and `ScreenShot_2026-10-08_204423_014.png` in the same directory.
- Interior references: `unnamed.jpg` and `unnamed (1).jpg` in the same directory.
- Map footprints: `0047-osm-context.geojson`, extracted from public OpenFreeMap tile `https://tiles.openfreemap.org/planet/20261004_113936_pt/14/8852/6439.pbf` on 2026-10-08. Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright. Feature/component IDs are not asserted to be OSM way IDs.

The church occupies polygon `35098320-79`, approximately 40.73 m long and 25.84 m wide, centred at `[14.5108298957, 35.8987008773]`. Its slightly skewed footprint is approximated by a rectangle whose corners are within 0.8 m of the map polygon. The workbook marker `[14.51088, 35.89858]` is retained near the front.

The entrance faces approximately 142.79° (SE) onto Old Bakery Street / Triq l-Ifran. St John Street / Triq San Gwann runs along the northeast side, on the right when looking at the facade. The nave extends NW toward Old Mint Street. With local -X at the entrance, the project's map transform gives heading `270 - bearing`, so the configuration uses `bearing: 127.21`.

Both aerial views place the two bell towers on the front corners, with the octagonal drum directly behind the facade and a long flat nave roof beyond it. The dome is therefore placed in the front half of the footprint, rather than at the far rear. The separate monastery and adjoining blocks are left to the existing map layers.

## Architectural interpretation

The model includes a pale limestone body, two-storey facade, paired pilasters and simplified capitals, continuous cornices, three door surrounds with relief cartouches, upper arched niches with balustrades, a low central crest and cross, twin open belfries with green bronze bells and small roof finials, and an octagonal windowed drum with a shallow rose-coloured cap, pale ribs and tall lantern. A simplified bishop statue marks the northeast street corner. The side elevations continue the cornices and pilasters with upper windows; the rear roof is flat.

Plan dimensions come from the map footprint. Heights (17.8 m side walls, 20.3 m main facade, approximately 32.4 m tower crosses and 33.6 m lantern cross), dome position/profile, window proportions and decorative reliefs are estimates from the supplied images, not surveyed measurements. Interior photographs guide interpretation only; no interior geometry is included.

`0047-model-preview.png` shows the isolated model from the front-right before geographic rotation.
