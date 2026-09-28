import { Marker } from "maplibre-gl";

function createMassTimes(schedule, showLanguages) {
  const list = document.createElement("dl");
  list.className = "mass-time-list";

  schedule.forEach(({ days, entries }) => {
    const day = document.createElement("dt");
    day.textContent = days;

    const time = document.createElement("dd");

    entries.forEach((entry) => {
      const mass = document.createElement("span");
      mass.className = "mass-time-entry";

      const label = document.createElement("span");
      label.textContent = showLanguages && entry.language
        ? `${entry.time} · ${entry.language}`
        : entry.time;
      mass.append(label);

      if (entry.note) {
        const note = document.createElement("small");
        note.textContent = entry.note;
        mass.append(note);
      }

      time.append(mass);
    });

    list.append(day, time);
  });

  return list;
}

function createChurchBubble(church) {
  const bubble = document.createElement("div");
  bubble.className = "church-mass-bubble";
  bubble.tabIndex = 0;
  bubble.setAttribute("role", "button");
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
  language.textContent = church.languages.join(" · ");

  bubble.append(
    eyebrow,
    name,
    createMassTimes(church.massTimes, church.languages.length > 1),
    language
  );

  return bubble;
}

export function addChurchMarker(map, church) {
  const bubble = createChurchBubble(church);
  const markerAnchor = document.createElement("div");
  markerAnchor.className = "church-marker-anchor";

  const cross = document.createElement("button");
  cross.className = "church-cross";
  cross.type = "button";
  cross.setAttribute("aria-label", `Show Mass times for ${church.name}`);

  const stopMapInteraction = (event) => event.stopPropagation();
  cross.addEventListener("pointerdown", stopMapInteraction);
  bubble.addEventListener("pointerdown", stopMapInteraction);
  cross.addEventListener("click", () => bubble.focus());

  const zoomToChurch = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    map.flyTo({
      center: church.coordinates,
      zoom: map.getMaxZoom(),
      duration: prefersReducedMotion ? 0 : 1600,
      essential: !prefersReducedMotion
    });
  };

  bubble.addEventListener("click", zoomToChurch);
  bubble.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      zoomToChurch();
    }
  });

  markerAnchor.append(cross, bubble);

  return new Marker({
    element: markerAnchor,
    anchor: "center"
  })
    .setLngLat(church.coordinates)
    .addTo(map);
}
