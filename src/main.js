import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";
import { loadChurches } from "./data/load-churches.js";
import { addBuildingLayer } from "./map/add-building-layer.js";
import { addChurchMarker } from "./map/add-church-marker.js";
import { createMaltaMap, MALTA_VIEW } from "./map/create-map.js";

const loading = document.querySelector("#loading");
const loadingCard = document.querySelector(".loading-card");
const resetView = document.querySelector("#reset-view");

const map = createMaltaMap("map");
const churchesPromise = loadChurches();

map.on("load", async () => {
  addBuildingLayer(map);

  try {
    const churches = await churchesPromise;
    churches.forEach((church) => addChurchMarker(map, church));
    loading.hidden = true;

    import("./map/add-marija-regina-layer.js")
      .then(({ addMarijaReginaLayer }) => addMarijaReginaLayer(map))
      .catch((error) => console.error("Church model could not be loaded", error));
  } catch (error) {
    loadingCard.textContent = "Church data could not be loaded";
    console.error(error);
  }
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
