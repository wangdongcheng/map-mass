import { getMaltaDate, hasActiveFilters } from "../data/church-filters.js";

export function initialiseChurchFilters(churches, store) {
  const panel = document.querySelector("#church-filters");
  const toggle = document.querySelector("#filter-toggle");
  const summary = document.querySelector("#filter-summary");
  const error = document.querySelector("#filter-error");
  const fields = Object.fromEntries(["language", "region", "dayMode", "date", "from", "to"].map(key => [key, panel.querySelector(`[name="${key}"]`)]));
  for (const field of [fields.from, fields.to]) {
    for (let hour = 0; hour < 24; hour++) {
      const option = document.createElement("option");
      option.value = String(hour).padStart(2, "0");
      option.textContent = option.value;
      field.append(option);
    }
  }
  [...new Set(churches.flatMap(church => church.languages))].sort().forEach(language => {
    const option = document.createElement("option");
    option.value = language; option.textContent = language;
    fields.language.append(option);
  });
  const render = ({ filters, churches: matches, error: message }) => {
    for (const [key, field] of Object.entries(fields)) field.value = filters[key];
    for (const option of fields.to.options) {
      option.disabled = Boolean(option.value && filters.from && Number(option.value) <= Number(filters.from));
    }
    fields.date.closest("label").hidden = filters.dayMode !== "date";
    error.textContent = message;
    error.hidden = !message;
    fields.to.setAttribute("aria-invalid", String(Boolean(message && filters.from && filters.to)));
    fields.date.setAttribute("aria-invalid", String(Boolean(message && filters.dayMode === "date" && !filters.date)));
    const active = hasActiveFilters(filters);
    toggle.classList.toggle("is-active", active);
    toggle.textContent = active ? "Filters •" : "Filters";
    const details = [filters.language, filters.region === "gozo" ? "Gozo & Comino" : filters.region === "malta" ? "Malta" : "",
      filters.dayMode === "date" ? filters.date : ({ today: "Today", tomorrow: "Tomorrow", "next-sunday": "Next Sunday" }[filters.dayMode] ?? ""),
      filters.from || filters.to ? `${filters.from || "00"}–${filters.to || "Any hour"}` : ""].filter(Boolean);
    summary.textContent = `${matches.length} ${matches.length === 1 ? "church" : "churches"}${details.length ? ` · ${details.join(" · ")}` : " on map"}`;
  };
  const onChange = event => {
    const key = event.target.name;
    if (!(key in fields)) return;
    const patch = { [key]: event.target.value };
    if (key === "dayMode" && patch.dayMode === "date" && !fields.date.value) patch.date = getMaltaDate();
    store.update(patch);
  };
  const onToggle = () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
  };
  const onClear = () => store.clear();
  const clear = panel.querySelector("#filter-clear");
  toggle.disabled = false;
  toggle.addEventListener("click", onToggle);
  panel.addEventListener("change", onChange);
  clear.addEventListener("click", onClear);
  const unsubscribe = store.subscribe(render);
  render(store.getSnapshot());
  return () => {
    unsubscribe();
    toggle.removeEventListener("click", onToggle);
    panel.removeEventListener("change", onChange);
    clear.removeEventListener("click", onClear);
  };
}
