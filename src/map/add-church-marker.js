import { Marker } from "maplibre-gl";
import { createChurchDetails } from "../ui/church-details.js";
import {
  getMassesInProgress,
  getNextMassStartingSoon
} from "../data/current-mass.js";

const BUBBLE_HOVER_DELAY = 1000;
const BUBBLE_VISIBLE_DURATION = 5000;
const BUBBLE_POINTER_SIZE = 18;
const BUBBLE_POINTER_GAP = 2;

const bubbleGroups = new WeakMap();

function getBubbleGroup(map) {
  if (bubbleGroups.has(map)) {
    return bubbleGroups.get(map);
  }

  const group = { active: null };
  const dismissBubble = (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest(
        ".church-mass-bubble, .church-cross, .current-mass-indicator"
      )
    ) {
      return;
    }

    group.active?.close();
  };

  bubbleGroups.set(map, group);
  document.addEventListener("click", dismissBubble, { capture: true });
  map.once("remove", () => {
    document.removeEventListener("click", dismissBubble, { capture: true });
    group.active?.close();
    bubbleGroups.delete(map);
  });
  return group;
}

export function addChurchMarker(map, church, onSelect) {
  const bubbleGroup = getBubbleGroup(map);

  let bubble;
  let details;
  const markerAnchor = document.createElement("div");
  markerAnchor.className = "church-marker-anchor";
  markerAnchor.classList.toggle("has-no-mass-times", !church.hasMassTimes);

  const cross = document.createElement("button");
  cross.className = "church-cross";
  cross.type = "button";
  cross.setAttribute(
    "aria-label",
    church.hasMassTimes
      ? `Show Mass times for ${church.name}`
      : `Show church details for ${church.name}`
  );

  const currentMass = document.createElement("button");
  currentMass.className = "current-mass-indicator";
  currentMass.type = "button";
  currentMass.setAttribute(
    "aria-label",
    `Mass in progress at ${church.name}. Show church details.`
  );
  currentMass.title = "Mass in progress — show church details";

  const currentMassIcon = document.createElement("span");
  currentMassIcon.className = "current-mass-indicator__pie";
  currentMassIcon.setAttribute("aria-hidden", "true");
  const startingSoonIcon = document.createElement("img");
  startingSoonIcon.className = "current-mass-indicator__hourglass";
  startingSoonIcon.src = "/mass-hourglass.svg";
  startingSoonIcon.alt = "";
  startingSoonIcon.setAttribute("aria-hidden", "true");
  currentMass.append(currentMassIcon, startingSoonIcon);

  // Use a separate map marker so every indicator sits above every cross.
  const currentMassAnchor = document.createElement("div");
  currentMassAnchor.className = "current-mass-marker-anchor";
  currentMassAnchor.append(currentMass);
  let currentMassMarker;
  let isVisible = true;

  const stopMapInteraction = (event) => event.stopPropagation();
  let hoverTimer;
  let autoDismissTimer;
  let isPinned = false;
  let hoverPointer;

  const ensureBubble = () => {
    if (bubble) return;

    details = createChurchDetails(church);
    bubble = details.element;
    bubble.addEventListener("pointerdown", pinBubble, { capture: true });
    bubble.addEventListener("pointerdown", stopMapInteraction);
    bubble.addEventListener("click", () => onSelect());
    bubble.addEventListener("keydown", (event) => {
      if (event.target !== bubble) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect();
      }
    });
    markerAnchor.append(bubble);
  };

  const updateBubblePointer = () => {
    if (!bubble || !hoverPointer) return;

    const anchorBounds = markerAnchor.getBoundingClientRect();
    const edgeInset = 20;
    const bubbleLeft =
      anchorBounds.left + anchorBounds.width / 2 - bubble.offsetWidth / 2;
    const pointerBottom =
      anchorBounds.bottom -
      hoverPointer.clientY +
      BUBBLE_POINTER_GAP +
      BUBBLE_POINTER_SIZE / Math.sqrt(2);
    const pointerX = Math.min(
      bubble.offsetWidth - edgeInset,
      Math.max(edgeInset, hoverPointer.clientX - bubbleLeft)
    );

    bubble.style.setProperty("--bubble-pointer-x", `${pointerX}px`);
    bubble.style.setProperty("--bubble-bottom", `${pointerBottom}px`);
  };

  const focusBubbleAtSide = () => {
    markerAnchor.classList.add("is-bubble-focused");
    currentMassAnchor.classList.add("is-bubble-focused");
    bubble.classList.add("is-bubble-focused");
    map.getContainer().append(bubble);
  };

  const closeBubble = () => {
    window.clearTimeout(hoverTimer);
    window.clearTimeout(autoDismissTimer);
    if (bubble) {
      bubble.classList.remove("is-bubble-focused");
      markerAnchor.append(bubble);
      bubble.style.removeProperty("--bubble-pointer-x");
      bubble.style.removeProperty("--bubble-bottom");
    }
    markerAnchor.classList.remove("is-bubble-open");
    markerAnchor.classList.remove("is-bubble-focused");
    currentMassAnchor.classList.remove("is-bubble-open");
    currentMassAnchor.classList.remove("is-bubble-focused");
    isPinned = false;

    if (
      markerAnchor.contains(document.activeElement) ||
      currentMassAnchor.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }

    if (bubbleGroup.active === bubbleController) {
      bubbleGroup.active = null;
    }
  };

  const bubbleController = { close: closeBubble };

  const openBubble = () => {
    window.clearTimeout(hoverTimer);
    ensureBubble();
    updateCurrentMassStatus();
    updateBubblePointer();

    if (bubbleGroup.active !== bubbleController) {
      bubbleGroup.active?.close();
      bubbleGroup.active = bubbleController;
    }

    markerAnchor.classList.add("is-bubble-open");
    currentMassAnchor.classList.add("is-bubble-open");
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
  currentMass.addEventListener("pointerdown", stopMapInteraction);
  for (const trigger of [cross, currentMass]) {
    trigger.addEventListener("focus", openBubble);
    trigger.addEventListener("click", openBubble);
  }

  const handlePointerEnter = (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    if (markerAnchor.classList.contains("is-bubble-open")) {
      return;
    }

    hoverPointer = { clientX: event.clientX, clientY: event.clientY };
    window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      openBubble();
    }, BUBBLE_HOVER_DELAY);
  };

  const handlePointerMove = (event) => {
    if (
      markerAnchor.classList.contains("is-bubble-open") ||
      bubble?.contains(event.target)
    ) {
      return;
    }

    hoverPointer = { clientX: event.clientX, clientY: event.clientY };
    updateBubblePointer();
  };

  const handlePointerLeave = () => {
    hoverPointer = null;
    window.clearTimeout(hoverTimer);

    if (!markerAnchor.classList.contains("is-bubble-open")) {
      closeBubble();
    }
  };

  for (const anchor of [markerAnchor, currentMassAnchor]) {
    anchor.addEventListener("pointerenter", handlePointerEnter);
    anchor.addEventListener("pointermove", handlePointerMove);
    anchor.addEventListener("pointerleave", handlePointerLeave);
  }

  const showDetails = () => {
    pinBubble();
    focusBubbleAtSide();
  };

  const updateCurrentMassStatus = (date = new Date()) => {
    const current = getMassesInProgress(church.masses, date);
    const activeTimes = new Set(current.masses.map(({ time }) => time));
    const hasCurrentMass = activeTimes.size > 0;
    const startingSoon = hasCurrentMass
      ? null
      : getNextMassStartingSoon(church.masses, date);
    const hasIndicator = hasCurrentMass || startingSoon !== null;
    currentMass.hidden = !hasIndicator;
    currentMassAnchor.hidden = !hasIndicator || !isVisible;
    currentMassIcon.hidden = !hasCurrentMass;
    startingSoonIcon.hidden = startingSoon === null;

    if (hasIndicator && !currentMassMarker) {
      currentMassMarker = new Marker({
        element: currentMassAnchor,
        anchor: "center"
      })
        .setLngLat(church.coordinates)
        .addTo(map);
    } else if (!hasIndicator && currentMassMarker) {
      currentMassMarker.remove();
      currentMassMarker = null;
    }
    currentMassIcon.style.setProperty(
      "--mass-remaining",
      `${current.remainingFraction * 100}%`
    );
    const statusLabel = hasCurrentMass
      ? `Mass in progress at ${church.name}. About ${current.remainingMinutes} ${
          current.remainingMinutes === 1 ? "minute" : "minutes"
        } remaining (estimated 60-minute Mass). Show church details.`
      : startingSoon
        ? `Mass starts in ${startingSoon.minutesUntilStart} ${
            startingSoon.minutesUntilStart === 1 ? "minute" : "minutes"
          } at ${church.name} (${startingSoon.mass.time}). Show church details.`
        : `Show Mass times for ${church.name}.`;
    currentMass.setAttribute("aria-label", statusLabel);
    currentMass.title = statusLabel;

    details?.updateCurrentMass(current, date);
  };

  updateCurrentMassStatus();
  markerAnchor.append(cross);

  const marker = new Marker({
    element: markerAnchor,
    anchor: "center"
  })
    .setLngLat(church.coordinates)
    .addTo(map);

  return {
    churchId: church.id,
    hasMassTimes: church.hasMassTimes,
    marker,
    showDetails,
    close: closeBubble,
    setVisible(visible) {
      if (!visible) closeBubble();
      isVisible = visible;
      markerAnchor.hidden = !visible;
      currentMassAnchor.hidden = !visible || currentMass.hidden;
    },
    updateCurrentMassStatus
  };
}
