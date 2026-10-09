import { getChurchesInView, getMapListEntries } from "../data/map-church-list.js";

export function initialiseMapChurchList(map, navigation, filterStore) {
  const sheet = document.querySelector("#map-church-list");
  const handle = sheet.querySelector("#map-list-handle");
  const mapButton = sheet.querySelector("#map-list-map");
  const listButton = sheet.querySelector("#map-list-list");
  const desktopSwitch = document.querySelector("#desktop-map-list-switch");
  const desktopMapButton = desktopSwitch.querySelector("#map-list-desktop-map");
  const desktopListButton = desktopSwitch.querySelector("#map-list-desktop-list");
  const content = sheet.querySelector("#map-list-content");
  const count = sheet.querySelector("#map-list-count");
  const media = window.matchMedia("(max-width: 640px)");
  const events = new AbortController();
  let level = 0;
  let snapshot = filterStore.getSnapshot();
  let drag;
  let suppressClick = false;
  let suppressTimer;
  let renderKey = "";

  const sizes = () => {
    const maximum = Math.max(90, window.innerHeight - 178);
    return [90, Math.min(maximum, Math.max(150, window.innerHeight * 0.46)), maximum];
  };
  const applyHeight = () => sheet.style.setProperty("--sheet-height", `${sizes()[level]}px`);
  const setLevel = next => {
    const wasCollapsed = level === 0;
    level = next;
    sheet.dataset.level = String(level);
    content.hidden = level === 0;
    handle.setAttribute("aria-expanded", String(level > 0));
    handle.setAttribute("aria-label", level === 0 ? "Open church list. Drag up to expand." : "Resize church list. Drag down to show map.");
    for (const button of [mapButton, desktopMapButton]) button.setAttribute("aria-pressed", String(level === 0));
    for (const button of [listButton, desktopListButton]) button.setAttribute("aria-pressed", String(level > 0));
    applyHeight();
    if (level === 0 && content.contains(document.activeElement)) (media.matches ? listButton : desktopListButton).focus({ preventScroll: true });
    if (wasCollapsed && level > 0) {
      navigation.closeDetails();
      document.dispatchEvent(new CustomEvent("church-list-open"));
    }
  };

  const render = () => {
    const container = map.getContainer();
    const churches = getChurchesInView(snapshot.churches, coordinates => map.project(coordinates), {
      width: container.clientWidth, height: container.clientHeight
    });
    count.textContent = `${churches.length} ${churches.length === 1 ? "church" : "churches"} in map view`;
    const entries = getMapListEntries(churches, snapshot.filters);
    const key = JSON.stringify([snapshot.error, entries.map(({ church, times }) => [church.id, church.hasMassTimes, times.map(t => [t.date, t.dayOffset, t.mass.day, t.mass.time, t.mass.language])])]);
    if (key === renderKey) return;
    renderKey = key;
    const scrollTop = content.scrollTop;
    const focusedId = content.contains(document.activeElement) ? document.activeElement.closest("[data-church-id]")?.dataset.churchId : null;
    content.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "map-church-list__empty";
      empty.textContent = snapshot.error || "No matching churches in this view. Move the map, zoom out or adjust filters.";
      content.append(empty);
    }
    entries.forEach(({ church, times }) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "map-church-list__item";
      item.dataset.churchId = church.id;
      const massStatus = church.hasMassTimes ? "Mass times available" : "No Mass times listed";
      item.setAttribute("aria-label", `Show details for ${church.localName || church.name}. ${massStatus}`);
      const cross = document.createElement("span");
      cross.className = "map-church-list__cross";
      cross.classList.toggle("has-no-mass-times", !church.hasMassTimes);
      cross.setAttribute("aria-hidden", "true");
      cross.title = massStatus;
      const name = document.createElement("strong");
      name.append(cross, document.createTextNode(church.localName || church.name));
      const locality = document.createElement("span");
      locality.className = "map-church-list__locality";
      locality.textContent = church.locality;
      item.append(name, locality);
      if (!times.length) {
        const empty = document.createElement("span");
        empty.className = "map-church-list__time";
        empty.textContent = "No Mass times listed";
        item.append(empty);
      }
      times.slice(0, 3).forEach(({ mass, date, dayOffset }) => {
        const time = document.createElement("span");
        time.className = "map-church-list__time";
        const day = date || (dayOffset === 0 ? "Today" : dayOffset === 1 ? "Tomorrow" : mass.day);
        time.textContent = `${day} · ${mass.time} · ${mass.language || "Language not listed"}`;
        if (mass.note) time.textContent += ` · ${mass.note}`;
        item.append(time);
      });
      if (times.length > 3) {
        const more = document.createElement("span");
        more.className = "map-church-list__more";
        more.textContent = "View all Mass times ›";
        item.append(more);
      }
      content.append(item);
    });
    content.scrollTop = scrollTop;
    if (focusedId) [...content.querySelectorAll("[data-church-id]")].find(item => item.dataset.churchId === focusedId)?.focus({ preventScroll: true });
  };

  const listen = (element, event, listener) => element.addEventListener(event, listener, { signal: events.signal });
  listen(mapButton, "click", () => setLevel(0));
  listen(listButton, "click", () => setLevel(1));
  listen(desktopMapButton, "click", () => setLevel(0));
  listen(desktopListButton, "click", () => setLevel(1));
  listen(content, "click", event => {
    const item = event.target.closest("[data-church-id]");
    if (!item) return;
    setLevel(0);
    navigation.selectChurch(item.dataset.churchId);
  });
  listen(handle, "click", () => { if (!suppressClick) setLevel(level === 0 ? 1 : level === 1 ? 2 : 1); });
  listen(handle, "keydown", event => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setLevel(Math.max(0, Math.min(2, level + (event.key === "ArrowUp" ? 1 : -1))));
    }
  });
  listen(sheet, "keydown", event => {
    if (event.key === "Escape") { setLevel(0); (media.matches ? listButton : desktopListButton).focus(); }
  });
  listen(handle, "pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, startY: event.clientY, startHeight: sizes()[level], height: sizes()[level], moved: false };
    handle.setPointerCapture(event.pointerId);
  });
  listen(handle, "pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = drag.startY - event.clientY;
    if (!drag.moved && Math.abs(delta) < 6) return;
    drag.moved = true;
    sheet.classList.add("is-dragging");
    drag.height = Math.max(sizes()[0], Math.min(sizes()[2], drag.startHeight + delta));
    content.hidden = false;
    sheet.style.setProperty("--sheet-height", `${drag.height}px`);
  });
  const endDrag = event => {
    if (!drag || drag.id !== event.pointerId) return;
    const current = drag;
    drag = null;
    sheet.classList.remove("is-dragging");
    if (current.moved) {
      const heights = sizes();
      setLevel(event.type === "pointercancel" ? level : heights.reduce((best, height, index) => Math.abs(height - current.height) < Math.abs(heights[best] - current.height) ? index : best, 0));
      suppressClick = true;
      window.clearTimeout(suppressTimer);
      suppressTimer = window.setTimeout(() => { suppressClick = false; }, 0);
    }
  };
  listen(handle, "pointerup", endDrag);
  listen(handle, "pointercancel", endDrag);
  listen(handle, "lostpointercapture", endDrag);
  listen(document.querySelector("#church-search"), "pointerdown", () => { if (level > 0) setLevel(0); });
  listen(document.querySelector("#church-search"), "focusin", () => { if (level > 0) setLevel(0); });
  const resize = () => { applyHeight(); render(); };
  listen(window, "resize", resize);
  listen(media, "change", () => { setLevel(0); render(); });
  map.on("moveend", render);
  map.on("resize", resize);
  const unsubscribe = filterStore.subscribe(next => { snapshot = next; render(); });
  sheet.hidden = false;
  desktopSwitch.hidden = false;
  setLevel(0);
  render();
  return () => {
    events.abort();
    unsubscribe();
    window.clearTimeout(suppressTimer);
    map.off("moveend", render);
    map.off("resize", resize);
    sheet.hidden = true;
    desktopSwitch.hidden = true;
  };
}
