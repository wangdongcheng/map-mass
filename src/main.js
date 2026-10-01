import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";
import { loadChurches } from "./data/load-churches.js";
import { addBuildingLayer } from "./map/add-building-layer.js";
import { addChurchMarker } from "./map/add-church-marker.js";
import { createMaltaMap, MALTA_VIEW } from "./map/create-map.js";
import { initialiseChurchSearch } from "./ui/church-search.js";
import { createChurchNavigation } from "./ui/church-navigation.js";

const loading = document.querySelector("#loading");
const loadingCard = document.querySelector(".loading-card");
const resetView = document.querySelector("#reset-view");
const noMassToggle = document.querySelector("#no-mass-toggle");

const map = createMaltaMap("map");
const churchesPromise = loadChurches();
let churchMarkers = [];
let navigation;
let showNoMassChurches = false;

function updateNoMassChurchVisibility() {
  churchMarkers.forEach(({ hasMassTimes, setVisible }) => {
    if (!hasMassTimes) setVisible(showNoMassChurches);
  });

  noMassToggle.classList.toggle("is-active", showNoMassChurches);
  noMassToggle.setAttribute("aria-checked", String(showNoMassChurches));
  noMassToggle.title = showNoMassChurches
    ? "Hide churches without Mass times"
    : "Show churches without Mass times";
}

map.on("load", async () => {
  addBuildingLayer(map);

  try {
    const churches = await churchesPromise;
    churchMarkers = churches.map((church) =>
      addChurchMarker(map, church, () => navigation.selectChurch(church.id))
    );
    const churchMarkersById = new Map(
      churchMarkers.map((controller) => [controller.churchId, controller])
    );
    navigation = createChurchNavigation(
      map,
      churches,
      churchMarkersById,
      MALTA_VIEW
    );
    updateNoMassChurchVisibility();
    const disposeSearch = initialiseChurchSearch(churches, navigation);
    map.once("remove", disposeSearch);
    navigation.applyPath();
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
  showNoMassChurches = false;
  updateNoMassChurchVisibility();
  if (navigation) {
    navigation.showHome();
  } else {
    map.easeTo({ ...MALTA_VIEW, duration: 900 });
  }
});

noMassToggle.addEventListener("click", () => {
  showNoMassChurches = !showNoMassChurches;
  updateNoMassChurchVisibility();
});
