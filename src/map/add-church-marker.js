import { Marker } from "maplibre-gl";
import { getMassesInProgress } from "../data/current-mass.js";

const SHORT_DAY_NAMES = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun"
};

const BUBBLE_HOVER_DELAY = 1000;
const BUBBLE_VISIBLE_DURATION = 5000;
const BUBBLE_POINTER_SIZE = 18;
const BUBBLE_POINTER_GAP = 2;

let activeBubbleController = null;

function formatDays(dayNames) {
  if (dayNames.length === 1) {
    return SHORT_DAY_NAMES[dayNames[0]];
  }

  return `${SHORT_DAY_NAMES[dayNames[0]]}–${SHORT_DAY_NAMES[dayNames.at(-1)]}`;
}

function createMassTimes(schedule) {
  const wrapper = document.createElement("div");
  wrapper.className = "mass-time-table-wrap";

  const table = document.createElement("table");
  table.className = "mass-time-table";

  const header = document.createElement("thead");
  const headerRow = document.createElement("tr");
  schedule.forEach(({ dayNames }) => {
    const day = document.createElement("th");
    day.scope = "col";
    day.textContent = formatDays(dayNames);
    headerRow.append(day);
  });
  header.append(headerRow);

  const body = document.createElement("tbody");
  const rowCount = Math.max(...schedule.map(({ entries }) => entries.length));

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("tr");

    schedule.forEach(({ dayNames, entries }) => {
      const cell = document.createElement("td");
      const entry = entries[rowIndex];

      if (entry) {
        const mass = document.createElement("span");
        mass.className = "mass-time-entry";
        mass.dataset.days = dayNames.join(",");
        mass.dataset.time = entry.time;
        mass.textContent = entry.time;

        if (entry.note) {
          const note = document.createElement("small");
          note.textContent = entry.note;
          mass.append(note);
        }

        cell.append(mass);
      }

      row.append(cell);
    });

    body.append(row);
  }

  table.append(header, body);
  wrapper.append(table);

  return wrapper;
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

  const currentMass = document.createElement("span");
  currentMass.className = "current-mass-indicator";
  currentMass.setAttribute("role", "status");
  currentMass.setAttribute("aria-label", "Mass in progress");
  currentMass.title = "Mass in progress";
  currentMass.textContent = "🔔";

  const stopMapInteraction = (event) => event.stopPropagation();
  let hoverTimer;
  let autoDismissTimer;
  let isPinned = false;

  const closeBubble = () => {
    window.clearTimeout(hoverTimer);
    window.clearTimeout(autoDismissTimer);
    markerAnchor.classList.remove("is-bubble-open");
    bubble.style.removeProperty("--bubble-pointer-x");
    bubble.style.removeProperty("--bubble-bottom");
    isPinned = false;

    if (markerAnchor.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    if (activeBubbleController === bubbleController) {
      activeBubbleController = null;
    }
  };

  const bubbleController = { close: closeBubble };

  const openBubble = () => {
    if (activeBubbleController !== bubbleController) {
      activeBubbleController?.close();
      activeBubbleController = bubbleController;
    }

    markerAnchor.classList.add("is-bubble-open");
    window.clearTimeout(autoDismissTimer);

    if (!isPinned) {
      autoDismissTimer = window.setTimeout(
        closeBubble,
        BUBBLE_VISIBLE_DURATION
      );
    }
  };

  const pinBubble = () => {
    isPinned = true;
    openBubble();
    window.clearTimeout(autoDismissTimer);
  };

  cross.addEventListener("pointerdown", stopMapInteraction);
  bubble.addEventListener("pointerdown", pinBubble, { capture: true });
  bubble.addEventListener("pointerdown", stopMapInteraction);
  cross.addEventListener("focus", openBubble);
  cross.addEventListener("click", () => bubble.focus());

  markerAnchor.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    if (markerAnchor.classList.contains("is-bubble-open")) {
      return;
    }

    window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      openBubble();
    }, BUBBLE_HOVER_DELAY);
  });

  markerAnchor.addEventListener("pointermove", (event) => {
    if (
      markerAnchor.classList.contains("is-bubble-open") ||
      bubble.contains(event.target)
    ) {
      return;
    }

    const anchorBounds = markerAnchor.getBoundingClientRect();
    const edgeInset = 20;
    const bubbleLeft =
      anchorBounds.left + anchorBounds.width / 2 - bubble.offsetWidth / 2;
    const pointerBottom =
      anchorBounds.bottom -
      event.clientY +
      BUBBLE_POINTER_GAP +
      BUBBLE_POINTER_SIZE / Math.sqrt(2);
    const pointerX = Math.min(
      bubble.offsetWidth - edgeInset,
      Math.max(edgeInset, event.clientX - bubbleLeft)
    );

    bubble.style.setProperty("--bubble-pointer-x", `${pointerX}px`);
    bubble.style.setProperty("--bubble-bottom", `${pointerBottom}px`);
  });

  markerAnchor.addEventListener("pointerleave", () => {
    window.clearTimeout(hoverTimer);

    if (!markerAnchor.classList.contains("is-bubble-open")) {
      closeBubble();
    }
  });

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

  bubble.addEventListener("click", () => {
    pinBubble();
    zoomToChurch();
  });
  bubble.addEventListener("keydown", (event) => {
    if (event.target !== bubble) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pinBubble();
      zoomToChurch();
    }
  });

  const updateCurrentMassStatus = (date = new Date()) => {
    const current = getMassesInProgress(church.masses, date);
    const activeTimes = new Set(current.masses.map(({ time }) => time));
    currentMass.hidden = activeTimes.size === 0;

    bubble.querySelectorAll(".mass-time-entry").forEach((entry) => {
      const isCurrent =
        entry.dataset.days.split(",").includes(current.day) &&
        activeTimes.has(entry.dataset.time);
      entry.classList.toggle("is-current-mass", isCurrent);

      if (isCurrent) {
        entry.setAttribute("aria-current", "time");
      } else {
        entry.removeAttribute("aria-current");
      }
    });
  };

  updateCurrentMassStatus();
  markerAnchor.append(cross, currentMass, bubble);

  const marker = new Marker({
    element: markerAnchor,
    anchor: "center"
  })
    .setLngLat(church.coordinates)
    .addTo(map);

  return { marker, updateCurrentMassStatus };
}
