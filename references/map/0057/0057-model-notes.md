# 0057 - St John of the Cross, Ta' Xbiex

## References

- Front photograph: `references/church-photos/0057/0057.png`.
- Two oblique aerial views: `ScreenShot_2026-10-07_092717_238.png` and `ScreenShot_2026-10-07_092740_443.png` in the same directory.
- `0057-osm-context.geojson`: nearby building polygons and roads extracted on 2026-10-07 from the project's OpenFreeMap tile, https://tiles.openfreemap.org/planet/20261004_113936_pt/14/8851/6439.pbf.
- Map data: OpenStreetMap contributors, ODbL, https://www.openstreetmap.org/copyright. The retained polygon IDs identify components of merged vector-tile features, not individual OSM ways.

## Placement

The church is polygon `building-71555740-856`. Its lower walls follow all 16 polygon corners, including the projecting side chapels and wider rear block. The model origin is `[14.4983254373, 35.8998535057]`, the average of the front and rear outer corners. The church marker retains the workbook coordinates `[14.49833, 35.89993]`.

The entrance is on the NE end facing Sir Temi Zammit Avenue. The facade's local +Z direction, with the existing map transform and `bearing: 140`, faces compass heading 40 degrees. The nave extends SW. The main body is approximately 35 m long, the front 19.6 m wide and the rear 27.5 m wide. The map footprint is enclosed at its original 5 m extrusion height by the custom limestone body.

## Architecture and limits

The model includes low flat-roofed aisles and rear rooms, a raised central nave with six clerestory bays per side, stepped roof parapets, nine rows of solar panels, the curved central facade, three upper arched windows, tall side windows, a triangular entrance pediment and circular window, a panelled double door, broad entrance steps and a single open central belfry with a bell and tiered pyramidal cap. There is no dome or pair of side towers in the supplied views.

Plan geometry and orientation come from the map polygon and adjacent road. Wall heights (10.4 m aisles, 15.4 m nave, approximately 24.7 m belfry cap), window dimensions, solar module divisions and decorative details are visual estimates, not surveyed measurements. Landscaping, street lamps and the wider sloping forecourt remain outside the model.

`0057-model-preview.png` shows the standalone model from the entrance side; it is a visual check, not a screenshot of the live map. Automated tests verify all ground-outline corners against the pinned polygon, entrance direction, height, solar modules and finite mesh positions.
