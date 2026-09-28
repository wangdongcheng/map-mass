import { Marker } from "maplibre-gl";

function createMassTimes(schedule) {
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
      label.textContent = entry.time;
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

function createLanguageTabs(church) {
  const tabs = document.createElement("div");
  tabs.className = "church-language-tabs";

  const tabList = document.createElement("div");
  tabList.className = "church-language-tabs__list";
  tabList.setAttribute("role", "tablist");
  tabList.setAttribute("aria-label", "Mass language");

  const tabButtons = [];
  const panels = [];

  const activateTab = (activeIndex, moveFocus = false) => {
    tabButtons.forEach((tab, index) => {
      const isActive = index === activeIndex;
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panels[index].hidden = !isActive;
    });

    if (moveFocus) {
      tabButtons[activeIndex].focus();
    }
  };

  church.languages.forEach((language, index) => {
    const tabId = `${church.id}-language-tab-${index}`;
    const panelId = `${church.id}-language-panel-${index}`;
    const tab = document.createElement("button");
    tab.className = "church-language-tab";
    tab.type = "button";
    tab.id = tabId;
    tab.textContent = language;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panelId);

    const panel = document.createElement("div");
    panel.className = "church-language-panel";
    panel.id = panelId;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabId);
    panel.append(createMassTimes(church.massTimesByLanguage[language]));

    tab.addEventListener("pointerdown", (event) => event.stopPropagation());
    tab.addEventListener("click", (event) => {
      event.stopPropagation();
      activateTab(index);
    });
    tab.addEventListener("keydown", (event) => {
      let nextIndex;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabButtons.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabButtons.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      activateTab(nextIndex, true);
    });

    tabButtons.push(tab);
    panels.push(panel);
    tabList.append(tab);
    tabs.append(panel);
  });

  tabs.prepend(tabList);
  activateTab(0);

  return tabs;
}

function createChurchBubble(church) {
  const hasLanguageTabs = church.languages.length > 1;
  const bubble = document.createElement("div");
  bubble.className = "church-mass-bubble";
  bubble.tabIndex = 0;
  bubble.setAttribute("role", hasLanguageTabs ? "group" : "button");
  bubble.setAttribute(
    "aria-label",
    hasLanguageTabs
      ? `Mass times for ${church.name}, ${church.locality}. Click the card to zoom.`
      : `Zoom to ${church.name}, ${church.locality}`
  );

  const eyebrow = document.createElement("span");
  eyebrow.className = "church-mass-bubble__eyebrow";
  eyebrow.textContent = `${church.locality} · Mass times`;

  const name = document.createElement("strong");
  name.className = "church-mass-bubble__name";
  name.textContent = church.name;

  const type = document.createElement("span");
  type.className = "church-mass-bubble__type";
  type.textContent = church.type;

  const language = document.createElement("span");
  language.className = "church-mass-bubble__language";
  language.textContent = church.languages.join(" · ");

  bubble.append(eyebrow, name);

  if (church.type) {
    bubble.append(type);
  }

  if (hasLanguageTabs) {
    bubble.append(createLanguageTabs(church));
  } else {
    bubble.append(createMassTimes(church.massTimes), language);
  }

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
    if (event.target !== bubble) {
      return;
    }

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
