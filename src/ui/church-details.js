import {
  isChurchBookmarked,
  toggleChurchBookmark
} from "../data/church-bookmarks.js";
import { getChurchPhotoUrl, getChurchPhotoUrls } from "../data/church-photos.js";
import { getUpcomingMasses } from "../data/current-mass.js";

const SHORT_DAY_NAMES = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun"
};

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

function createNextMass(language = "") {
  const label = document.createElement("p");
  label.className = "church-mass-bubble__next-mass";
  label.dataset.language = language;
  return label;
}

function showChurchPhoto(photoUrls, description) {
  const dialog = document.createElement("dialog");
  dialog.className = "church-photo-viewer";
  dialog.setAttribute("aria-label", `Photo of ${description}`);

  const photo = document.createElement("img");
  photo.className = "church-photo-viewer__image";
  photo.src = photoUrls[0];
  photo.alt = description;
  photo.draggable = false;

  if (photoUrls.length > 1) {
    let photoIndex = 0;
    const counter = document.createElement("span");
    counter.className = "church-photo-viewer__counter";
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");
    const updatePhoto = (offset) => {
      photoIndex = (photoIndex + offset + photoUrls.length) % photoUrls.length;
      photo.src = photoUrls[photoIndex];
      counter.textContent = `${photoIndex + 1} / ${photoUrls.length}`;
    };

    for (const [direction, offset, label, symbol] of [
      ["previous", -1, "Previous photo", "\u2039"],
      ["next", 1, "Next photo", "\u203a"]
    ]) {
      const button = document.createElement("button");
      button.className = `church-photo-viewer__${direction}`;
      button.type = "button";
      button.textContent = symbol;
      button.setAttribute("aria-label", label);
      button.addEventListener("click", () => updatePhoto(offset));
      dialog.append(button);
    }

    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      updatePhoto(event.key === "ArrowLeft" ? -1 : 1);
    });
    updatePhoto(0);
    dialog.append(counter);
  }

  const closeButton = document.createElement("button");
  closeButton.className = "church-photo-viewer__close";
  closeButton.type = "button";
  closeButton.textContent = "\u00d7";
  closeButton.setAttribute("aria-label", "Close photo");
  closeButton.autofocus = true;
  closeButton.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.append(photo, closeButton);
  document.body.append(dialog);
  dialog.showModal();
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
    panel.append(
      createMassTimes(church.massTimesByLanguage[language]),
      createNextMass(language)
    );

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

export function createChurchDetails(church) {
  const hasMassTimes = church.hasMassTimes;
  const hasLanguageTabs = hasMassTimes && church.languages.length > 1;
  const photoUrl = getChurchPhotoUrl(church.id);
  const [longitude, latitude] = church.coordinates;
  const bubble = document.createElement("div");
  bubble.className = "church-mass-bubble";
  bubble.tabIndex = 0;
  bubble.setAttribute("role", "group");
  bubble.setAttribute(
    "aria-label",
    hasMassTimes
      ? `Mass times for ${church.name}, ${church.locality}. Click the card to zoom.`
      : `Church details for ${church.name}, ${church.locality}. Click the card to zoom.`
  );

  const eyebrow = document.createElement("span");
  eyebrow.className = "church-mass-bubble__eyebrow";
  eyebrow.textContent = `${church.locality} · ${
    hasMassTimes ? "Mass times" : "Church details"
  }`;

  const name = document.createElement("strong");
  name.className = "church-mass-bubble__name";
  name.textContent =
    church.localName && church.localName !== church.name
      ? `${church.name} (${church.localName})`
      : church.name;

  const type = document.createElement("span");
  type.className = "church-mass-bubble__type";
  type.textContent = church.type;

  const language = document.createElement("span");
  language.className = "church-mass-bubble__language";
  language.textContent = church.languages.join(" · ");

  const googleMapsLink = document.createElement("a");
  googleMapsLink.className = "church-mass-bubble__map-link";
  googleMapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${latitude},${longitude}`
  )}`;
  googleMapsLink.target = "_blank";
  googleMapsLink.rel = "noopener noreferrer";
  googleMapsLink.textContent = "View in Google Maps";
  googleMapsLink.setAttribute(
    "aria-label",
    `View ${church.name} in Google Maps (opens in a new tab)`
  );
  googleMapsLink.addEventListener("click", (event) => event.stopPropagation());

  const bookmarkButton = document.createElement("button");
  bookmarkButton.className = "church-mass-bubble__bookmark";
  bookmarkButton.type = "button";

  const updateBookmarkButton = () => {
    const isBookmarked = isChurchBookmarked(church.id);
    bookmarkButton.classList.toggle("is-bookmarked", isBookmarked);
    bookmarkButton.setAttribute("aria-pressed", String(isBookmarked));
    bookmarkButton.textContent = isBookmarked
      ? "Bookmarked"
      : "Add to bookmarks";
  };

  updateBookmarkButton();
  bookmarkButton.addEventListener("pointerdown", (event) =>
    event.stopPropagation()
  );
  bookmarkButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleChurchBookmark(church.id);
    updateBookmarkButton();
  });

  const actions = document.createElement("div");
  actions.className = "church-mass-bubble__actions";
  actions.append(googleMapsLink, bookmarkButton);

  if (photoUrl) {
    const photoButton = document.createElement("button");
    photoButton.className = "church-mass-bubble__photo-button";
    photoButton.type = "button";
    photoButton.setAttribute("aria-label", `View full photo of ${church.name}`);
    photoButton.setAttribute("aria-haspopup", "dialog");
    photoButton.title = "View full photo";
    photoButton.addEventListener("pointerdown", (event) => event.stopPropagation());
    photoButton.addEventListener("click", (event) => {
      event.stopPropagation();
      showChurchPhoto(getChurchPhotoUrls(church.id), `${church.name}, ${church.locality}`);
    });

    const photo = document.createElement("img");
    photo.className = "church-mass-bubble__photo";
    photo.src = photoUrl;
    photo.alt = `${church.name}, ${church.locality}`;
    photo.loading = "lazy";
    photo.decoding = "async";
    photo.draggable = false;
    photoButton.append(photo);
    bubble.append(photoButton);
  }

  bubble.append(eyebrow, name);

  if (church.type) {
    bubble.append(type);
  }

  if (hasMassTimes) {
    if (hasLanguageTabs) {
      bubble.append(createLanguageTabs(church));
    } else {
      bubble.append(createMassTimes(church.massTimes), language, createNextMass());
    }
  }

  bubble.append(actions);

  const massEntries = [...bubble.querySelectorAll(".mass-time-entry")];
  const nextMassLabels = [...bubble.querySelectorAll(".church-mass-bubble__next-mass")];

  return {
    element: bubble,
    updateCurrentMass(current, date = new Date()) {
      if (nextMassLabels.length) {
        const upcomingMasses = getUpcomingMasses([church], date, church.masses.length);
        nextMassLabels.forEach((label) => {
          const upcoming = upcomingMasses.find(
            ({ mass }) => !label.dataset.language || mass.language === label.dataset.language
          );

          if (!upcoming) {
            label.textContent = "Next Mass: unavailable";
            return;
          }

          const { mass, dayOffset, startMinute } = upcoming;
          const day = dayOffset === 0 ? "today" : dayOffset === 1 ? "Tomorrow" : mass.day;
          const hour = Math.floor(startMinute / 60);
          const minute = startMinute % 60;
          const minutes = minute ? `:${String(minute).padStart(2, "0")}` : "";
          const time = `${hour % 12 || 12}${minutes}${hour < 12 ? "am" : "pm"}`;
          label.textContent = `Next Mass: ${day} ${time}`;
        });
      }

      const activeTimes = new Set(current.masses.map(({ time }) => time));
      massEntries.forEach((entry) => {
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
    }
  };
}

