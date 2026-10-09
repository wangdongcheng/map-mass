import { mkdir, writeFile } from "node:fs/promises";
import readExcelFile from "read-excel-file/node";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import { churchModelRegistry } from "../src/map/church-models/registry.js";
import { normaliseChurches, rowsToRecords } from "../src/data/normalise-churches.js";

const ids = process.argv.slice(2);
if (!ids.length) throw new Error("Pass church IDs to export, e.g. node scripts/export-model-context.mjs 0202");
const sheets = await readExcelFile("src/map/malta_all_church_mass_times.xlsx");
const churches = normaliseChurches(
  rowsToRecords(sheets.find((s) => s.sheet === "Churches").data, "No."),
  rowsToRecords(sheets.find((s) => s.sheet === "Mass Times").data, "Church No.")
);
const metadataResponse = await fetch("https://tiles.openfreemap.org/planet");
if (!metadataResponse.ok) throw new Error(`Tile metadata: ${metadataResponse.status}`);
const metadata = await metadataResponse.json();
const template = metadata.tiles[0];
const zoom = 14, radius = 160, tiles = new Map();
const tileX = (lng) => Math.floor((lng + 180) / 360 * 2 ** zoom);
const tileY = (lat) => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** zoom);
const layers = ["building", "transportation", "transportation_name", "poi", "landuse"];
function positions(coordinates) {
  return typeof coordinates[0] === "number" ? [coordinates] : coordinates.flatMap(positions);
}
for (const id of ids) {
  const church = churches.find((c) => c.id === id);
  if (!church) throw new Error(`Unknown church ${id}`);
  const [lng, lat] = churchModelRegistry.get(id)?.coordinates ?? church.coordinates;
  const dx = radius / (111320 * Math.cos(lat * Math.PI / 180)), dy = radius / 111320;
  const bbox = [lng - dx, lat - dy, lng + dx, lat + dy];
  const features = [], sources = [], seen = new Set();
  for (let x = tileX(bbox[0]); x <= tileX(bbox[2]); x++) {
    for (let y = tileY(bbox[3]); y <= tileY(bbox[1]); y++) {
      const source = template.replace("{z}", zoom).replace("{x}", x).replace("{y}", y);
      sources.push(source);
      if (!tiles.has(source)) {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`${source}: ${response.status}`);
        tiles.set(source, new VectorTile(new PbfReader(new Uint8Array(await response.arrayBuffer()))));
      }
      const tile = tiles.get(source);
      for (const layerName of layers) {
        const layer = tile.layers[layerName];
        if (!layer) continue;
        for (let i = 0; i < layer.length; i++) {
          const feature = layer.feature(i).toGeoJSON(x, y, zoom);
          const geometries = feature.geometry.type === "MultiPolygon"
            ? feature.geometry.coordinates.map((coordinates) => ({ type: "Polygon", coordinates }))
            : [feature.geometry];
          geometries.forEach((geometry, part) => {
            const points = positions(geometry.coordinates);
            const west = Math.min(...points.map((p) => p[0])), east = Math.max(...points.map((p) => p[0]));
            const south = Math.min(...points.map((p) => p[1])), north = Math.max(...points.map((p) => p[1]));
            if (east < bbox[0] || west > bbox[2] || north < bbox[1] || south > bbox[3]) return;
            const key = JSON.stringify([layerName, geometry, feature.properties]);
            if (seen.has(key)) return;
            seen.add(key);
            features.push({ type: "Feature", id: `${layerName}:${feature.id ?? `tile-${x}-${y}-${i}`}-${part}`, geometry,
              properties: { ...feature.properties, source_layer: layerName, source_tile: source } });
          });
        }
      }
    }
  }
  if (!features.some((f) => f.properties.source_layer === "building")) throw new Error(`No buildings for ${id}`);
  await mkdir(`references/map/${id}`, { recursive: true });
  await writeFile(`references/map/${id}/${id}-osm-context.geojson`, JSON.stringify({
    type: "FeatureCollection", source: sources[0], sources, fetched_at: new Date().toISOString(),
    attribution: "Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright",
    description: "OpenFreeMap vector-tile features intersecting a query box extending 160 m from the centre in each direction. Complete intersecting features are retained. Tile/component IDs are not OSM way IDs.",
    church_id: id, context_center: [lng, lat], context_bbox: bbox, features
  }, null, 2) + "\n");
  console.log(`${id}: ${features.length} context features (${sources.length} tiles)`);
}
