const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Malta", year: "numeric", month: "2-digit", day: "2-digit"
});

export function getMaltaDate(now = new Date()) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(now).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getDateDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return DAYS[date.getUTCDay()];
}

export function getFilterDate(filters, now = new Date()) {
  if (filters.dayMode === "any") return null;
  if (filters.dayMode === "date") return filters.date;
  const today = getMaltaDate(now);
  if (filters.dayMode === "today") return today;
  const date = new Date(`${today}T12:00:00Z`);
  const offset = filters.dayMode === "tomorrow" ? 1 : (7 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function minutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function hourMinutes(value) {
  return /^(?:[01]\d|2[0-3])$/.test(value ?? "") ? Number(value) * 60 : null;
}

export function hasScheduleFilters(filters) {
  return Boolean(filters.language || filters.dayMode !== "any" || filters.from || filters.to);
}

export function hasActiveFilters(filters) {
  return Boolean(filters.region || hasScheduleFilters(filters));
}

export function getFilterError(filters) {
  if (filters.dayMode === "date" && !getDateDay(filters.date)) return "Choose a valid date.";
  if ((filters.from && hourMinutes(filters.from) === null) || (filters.to && hourMinutes(filters.to) === null)) return "Choose hours from 00 to 23.";
  if (filters.from && filters.to && hourMinutes(filters.to) <= hourMinutes(filters.from)) return "Until must be greater than From.";
  return "";
}

export function filterChurches(churches, filters, now = new Date()) {
  if (getFilterError(filters)) return [];
  const date = getFilterDate(filters, now);
  const day = date ? getDateDay(date) : null;
  const from = hourMinutes(filters.from), to = hourMinutes(filters.to);
  const scheduleActive = hasScheduleFilters(filters);
  return churches.flatMap(church => {
    // The channel between Malta and Gozo/Comino separates the workbook points at 36°N.
    const region = church.coordinates[1] > 36 ? "gozo" : "malta";
    if (filters.region && filters.region !== region) return [];
    if (!church.hasMassTimes && (!filters.showNoMass || scheduleActive)) return [];
    const masses = church.masses.filter(mass => {
      const time = minutes(mass.time);
      return (!filters.language || mass.language === filters.language)
        && (!day || mass.day === day)
        && time !== null
        && (from === null || time >= from)
        && (to === null || time <= to);
    });
    if (scheduleActive && !masses.length) return [];
    return [{ ...church, masses }];
  });
}

export function createChurchFilterStore(churches) {
  let filters = { language: "", region: "", dayMode: "any", date: "", from: "", to: "", showNoMass: false };
  const listeners = new Set();
  const getSnapshot = () => ({ filters: { ...filters }, churches: filterChurches(churches, filters), error: getFilterError(filters) });
  const notify = () => {
    const snapshot = getSnapshot();
    listeners.forEach(listener => listener(snapshot));
  };
  return {
    getSnapshot,
    update(patch) { filters = { ...filters, ...patch }; notify(); },
    clear() { filters = { ...filters, language: "", region: "", dayMode: "any", date: "", from: "", to: "" }; notify(); },
    refresh: notify,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
}
