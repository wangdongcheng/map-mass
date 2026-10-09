import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";
import { loadChurches } from "./data/load-churches.js";
import { addBuildingLayer } from "./map/add-building-layer.js";
import { addChurchMarker } from "./map/add-church-marker.js";
import { createMaltaMap } from "./map/create-map.js";
import { initialiseMapAtmosphere } from "./map/map-atmosphere.js";
import { getHomeView } from "./map/home-view.js";
import { initialiseChurchSearch } from "./ui/church-search.js";
import { createChurchNavigation } from "./ui/church-navigation.js";
import { createChurchFilterStore, getFilterDate, getMaltaDate, hasScheduleFilters } from "./data/church-filters.js";
import { initialiseChurchFilters } from "./ui/church-filters.js";

const loading = document.querySelector("#loading");
const loadingCard = document.querySelector(".loading-card");
const resetView = document.querySelector("#reset-view");
const noMassToggle = document.querySelector("#no-mass-toggle");

const map = createMaltaMap("map");
const churchesPromise = loadChurches();
let churchMarkers = [];
let navigation;
let showNoMassChurches = false;
let filterStore;

function updateNoMassChurchVisibility() {
  if (filterStore) filterStore.update({ showNoMass: showNoMassChurches });
  churchMarkers.forEach(({ hasMassTimes, setVisible }) => {
    if (!filterStore && !hasMassTimes) setVisible(showNoMassChurches);
  });

  noMassToggle.classList.toggle("is-active", showNoMassChurches);
  noMassToggle.setAttribute("aria-checked", String(showNoMassChurches));
  noMassToggle.title = noMassToggle.disabled
    ? "Clear Mass filters to show churches without times"
    : showNoMassChurches
    ? "Hide churches without Mass times"
    : "Show churches without Mass times";
}

map.on("load", async () => {
  addBuildingLayer(map);
  initialiseMapAtmosphere(map);

  try {
    const churches = await churchesPromise;
    filterStore = createChurchFilterStore(churches);
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
      () => getHomeView(map)
    );
    const disposeFilters = initialiseChurchFilters(churches, filterStore);
    map.once("remove", disposeFilters);
    const applyFilters = ({ churches: matches, filters }) => {
      const matchesById = new Map(matches.map(church => [church.id, church]));
      const selectedDate = getFilterDate(filters);
      const liveStatus = selectedDate === null || selectedDate === getMaltaDate();
      churchMarkers.forEach(controller => {
        const match = matchesById.get(controller.churchId);
        controller.setVisible(Boolean(match));
        controller.setMassFilter(match?.masses ?? [], liveStatus);
      });
      noMassToggle.disabled = hasScheduleFilters(filters);
      noMassToggle.title = noMassToggle.disabled ? "Clear Mass filters to show churches without times" : showNoMassChurches ? "Hide churches without Mass times" : "Show churches without Mass times";
    };
    map.once("remove", filterStore.subscribe(applyFilters));
    updateNoMassChurchVisibility();
    const disposeSearch = initialiseChurchSearch(churches, navigation, filterStore);
    map.once("remove", disposeSearch);
    navigation.applyPath();
    const refreshCurrentMasses = () => {
      filterStore.refresh();
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
  filterStore?.clear();
  updateNoMassChurchVisibility();
  if (navigation) {
    navigation.showHome();
  } else {
    map.easeTo({ ...getHomeView(map), duration: 900 });
  }
});

noMassToggle.addEventListener("click", () => {
  showNoMassChurches = !showNoMassChurches;
  updateNoMassChurchVisibility();
});
