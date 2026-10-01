export function createChurchNavigation(map, churches, markerControllers, homeView) {
  const churchesById = new Map(churches.map((church) => [church.id, church]));

  const closeDetails = () => {
    markerControllers.forEach(({ close }) => close());
  };

  const selectChurch = (churchId, { updateUrl = true } = {}) => {
    const church = churchesById.get(churchId);
    if (!church) return false;

    markerControllers.get(churchId)?.showDetails();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    map.flyTo({
      center: church.coordinates,
      zoom: map.getMaxZoom(),
      duration: reducedMotion ? 0 : 1600,
      essential: !reducedMotion
    });

    const churchPath = `/${churchId}`;
    if (updateUrl && window.location.pathname !== churchPath) {
      window.history.pushState({ churchId }, "", churchPath);
    }
    return true;
  };

  const showHome = ({ updateUrl = true } = {}) => {
    closeDetails();
    map.easeTo({ ...homeView, duration: 900 });
    if (updateUrl && window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  };

  const applyPath = () => {
    const churchId = /^\/(\d{4})\/?$/.exec(window.location.pathname)?.[1];
    if (churchId && selectChurch(churchId, { updateUrl: false })) return;

    showHome({ updateUrl: false });
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  };

  window.addEventListener("popstate", applyPath);
  map.once("remove", () => window.removeEventListener("popstate", applyPath));

  return { selectChurch, closeDetails, showHome, applyPath };
}
