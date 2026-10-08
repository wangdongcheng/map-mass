# 0177 — St Francis of Assisi, Valletta

## References and placement

- Facade: `references/church-photos/0177/0177.jpg`.
- Oblique aerial: `references/church-photos/0177/ScreenShot_2026-10-08_202214_891.png`.
- Interior reference: `Malta_-_Valletta_-_Triq_ir-Repubblika-Triq_Melita_-_Church_of_St._Francis_of_Assisi_in_01_ies.jpg` in the same folder.
- Nearby map footprints: `0177-osm-context.geojson`, read from the public OpenFreeMap tile `https://tiles.openfreemap.org/planet/20261004_113936_pt/14/8852/6439.pbf` on 2026-10-08. Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright. IDs identify vector-tile features and polygon components, not asserted OSM way IDs.

The long church rectangle is polygon `35098320-281`. Its centre is `[14.5107226074, 35.8973950518]`, approximately 39.67 m long and 9.97 m wide. The footprint is slightly skewed; the rectangular model matches its corners within 0.8 m. The workbook marker `[14.51081, 35.8973]` remains near the entrance.

The facade faces SE toward Republic Street at approximately 142.37°. The nave runs NW toward the rear dome; Melita Street borders the northeast flank. The supplied aerial distinguishes the dome end from the facade end. Local -X is the front, so `bearing: 127.63` uses the existing map transform's `270 - bearing` heading convention. The bell tower adjoins the southwest side of the facade, on the left when viewed from the street. Its 4.5 × 3.9 m footprint is estimated from the aerial and extends beyond the mapped nave rectangle.

## Architectural interpretation

The model includes a limestone nave with a shallow pitched roof, rear octagonal windowed drum, rose-coloured dome with pale ribs and lantern, and a single front-left open belfry. The facade includes four pilasters with simplified capitals, layered cornices, a triangular pediment and oval oculus, two grilled upper windows, a rectangular entrance with curved canopy, crowned relief plaque and rooftop cross. Neighbouring buildings remain in the map layers.

Plan dimensions come from the map polygon. Heights (13.2 m main wall, about 22.6 m tower and 25.3 m dome cross), dome profile, tower dimensions and relief details are visual estimates from the supplied photographs, not surveyed measurements. The interior is a reference for the rear dome location; no interior model is included.

`0177-model-preview.png` shows the isolated model from the front-left, without its geographic rotation.
