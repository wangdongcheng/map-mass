import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";
import { loadChurches } from "./data/load-churches.js";
import { addBuildingLayer } from "./map/add-building-layer.js";
import { addChurchMarker } from "./map/add-church-marker.js";
import { createMaltaMap, MALTA_VIEW } from "./map/create-map.js";
import { initialiseChurchSearch } from "./ui/church-search.js";

const loading = document.querySelector("#loading");
const loadingCard = document.querySelector(".loading-card");
const resetView = document.querySelector("#reset-view");

const map = createMaltaMap("map");
const churchesPromise = loadChurches();

map.on("load", async () => {
  addBuildingLayer(map);

  try {
    const churches = await churchesPromise;
    const churchMarkers = churches.map((church) => addChurchMarker(map, church));
    const churchMarkersById = new Map(
      churchMarkers.map((controller) => [controller.churchId, controller])
    );
    initialiseChurchSearch(map, churches, churchMarkersById);
    const refreshCurrentMasses = () => {
      const now = new Date();
      churchMarkers.forEach(({ updateCurrentMassStatus }) =>
        updateCurrentMassStatus(now)
      );
    };
    const currentMassTimer = window.setInterval(refreshCurrentMasses, 30_000);
    map.once("remove", () => window.clearInterval(currentMassTimer));
    loading.hidden = true;

    import("./map/add-church-models-layer.js")
      .then(({ addChurchModelsLayer }) => addChurchModelsLayer(map, churches))
      .catch((error) => console.error("Church models could not be loaded", error));
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
