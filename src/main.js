import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";
import { addBuildingLayer } from "./map/add-building-layer.js";
import { createMaltaMap, MALTA_VIEW } from "./map/create-map.js";

const loading = document.querySelector("#loading");
const loadingCard = document.querySelector(".loading-card");
const resetView = document.querySelector("#reset-view");

const map = createMaltaMap("map");

map.on("load", () => {
  addBuildingLayer(map);
  loading.hidden = true;
});

map.on("error", (event) => {
  if (!map.loaded()) {
    loadingCard.textContent = "Map data could not be loaded";
  }

  console.error(event.error);
});

resetView.addEventListener("click", () => {
  map.easeTo({
    ...MALTA_VIEW,
    duration: 900
  });
});
