import { getUpcomingMasses } from "./current-mass.js";
import { getFilterDate } from "./church-filters.js";

const startMinute = time => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export function getChurchesInView(churches, project, { width, height }) {
  if (width <= 0 || height <= 0) return [];
  return churches.filter(church => {
    const { x, y } = project(church.coordinates);
    return Number.isFinite(x) && Number.isFinite(y)
      && x >= 0 && x <= width && y >= 0 && y <= height;
  });
}

export function getMapListEntries(churches, filters, now = new Date()) {
  const selectedDate = getFilterDate(filters, now);
  const timesByChurch = new Map(churches.map(church => [church.id, []]));
  if (selectedDate) {
    churches.forEach(church => {
      timesByChurch.set(church.id, church.masses.map(mass => ({ mass, date: selectedDate, dayOffset: 0 }))
        .sort((a, b) => startMinute(a.mass.time) - startMinute(b.mass.time) || a.mass.language.localeCompare(b.mass.language)));
    });
  } else {
    getUpcomingMasses(churches, now, Number.MAX_SAFE_INTEGER).forEach(entry => timesByChurch.get(entry.church.id).push(entry));
  }
  return churches.map(church => ({ church, times: timesByChurch.get(church.id) }))
    .sort((a, b) => {
      const firstA = a.times[0], firstB = b.times[0];
      if (!firstA || !firstB) return Number(Boolean(firstB)) - Number(Boolean(firstA)) || a.church.name.localeCompare(b.church.name);
      return firstA.dayOffset - firstB.dayOffset || startMinute(firstA.mass.time) - startMinute(firstB.mass.time) || a.church.name.localeCompare(b.church.name);
    });
}
