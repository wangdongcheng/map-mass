import { Marker } from "maplibre-gl";

function createMassTimes(schedule) {
  const list = document.createElement("dl");
  list.className = "mass-time-list";

  schedule.forEach(({ days, times }) => {
    const day = document.createElement("dt");
    day.textContent = days;

    const time = document.createElement("dd");
    time.textContent = times.join(" · ");

    list.append(day, time);
  });

  return list;
}

function createChurchBubble(church) {
  const bubble = document.createElement("button");
  bubble.className = "church-mass-bubble";
  bubble.type = "button";
  bubble.setAttribute(
    "aria-label",
    `Zoom to ${church.name}, ${church.locality}`
  );

  const eyebrow = document.createElement("span");
  eyebrow.className = "church-mass-bubble__eyebrow";
  eyebrow.textContent = `${church.locality} · Mass times`;

  const name = document.createElement("strong");
  name.className = "church-mass-bubble__name";
  name.textContent = church.name;

  const language = document.createElement("span");
  language.className = "church-mass-bubble__language";
  language.textContent = church.language;

  bubble.append(eyebrow, name, createMassTimes(church.massTimes), language);

  return bubble;
}

export function addChurchMarker(map, church) {
  const bubble = createChurchBubble(church);
  const markerAnchor = document.createElement("div");
  markerAnchor.className = "church-marker-anchor";
  markerAnchor.append(bubble);

  bubble.addEventListener("click", () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    map.flyTo({
      center: church.coordinates,
      zoom: map.getMaxZoom(),
      duration: prefersReducedMotion ? 0 : 1600,
      essential: !prefersReducedMotion
    });
  });

  return new Marker({
    element: markerAnchor,
    anchor: "bottom",
    offset: [0, -64]
  })
    .setLngLat(church.coordinates)
    .addTo(map);
}
