import {
  BOOKMARKS_CHANGED_EVENT,
  getBookmarkedChurchIds
} from "../data/church-bookmarks.js";
import { getUpcomingMasses } from "../data/current-mass.js";

const MAX_RESULTS = 8;

function normaliseSearchText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/ħ/g, "h")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function createSearchEntry(church) {
  const fields = [church.name, church.localName, church.locality, church.address];

  return {
    church,
    fields: fields.map(normaliseSearchText).filter(Boolean),
    text: normaliseSearchText(fields.filter(Boolean).join(" "))
  };
}

function scoreEntry(entry, query, terms) {
  if (!terms.every((term) => entry.text.includes(term))) {
    return -1;
  }

  let score = 0;

  entry.fields.forEach((field, index) => {
    if (field === query) score += index < 2 ? 120 : 70;
    if (field.startsWith(query)) score += index < 2 ? 80 : 45;
    if (field.includes(query)) score += index < 2 ? 45 : 25;
    score += terms.filter((term) => field.startsWith(term)).length * (20 - index * 3);
  });

  return score;
}

function getMatches(index, value) {
  const query = normaliseSearchText(value);

  if (!query) {
    return [];
  }

  const terms = query.split(" ");

  return index
    .map((entry, order) => ({
      entry,
      order,
      score: scoreEntry(entry, query, terms)
    }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, MAX_RESULTS)
    .map(({ entry }) => entry.church);
}

export function initialiseChurchSearch(map, churches, markerControllers) {
  const container = document.querySelector("#church-search");
  const input = document.querySelector("#church-search-input");
  const results = document.querySelector("#church-search-results");
  const index = churches.map(createSearchEntry);
  const churchesById = new Map(churches.map((church) => [church.id, church]));
  let matches = [];
  let activeIndex = -1;

  const closeResults = () => {
    matches = [];
    activeIndex = -1;
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  };

  const setActiveIndex = (nextIndex) => {
    if (!matches.length) return;

    activeIndex = (nextIndex + matches.length) % matches.length;
    const options = [...results.querySelectorAll('[role="option"]')];

    options.forEach((option, indexValue) => {
      const isActive = indexValue === activeIndex;
      option.setAttribute("aria-selected", String(isActive));
      option.classList.toggle("is-active", isActive);
    });

    const activeOption = options[activeIndex];
    input.setAttribute("aria-activedescendant", activeOption.id);
    activeOption.scrollIntoView({ block: "nearest" });
  };

  const selectChurch = (church) => {
    input.value = church.localName || church.name;
    closeResults();

    const markerController = markerControllers.get(church.id);

    if (markerController) {
      markerController.focus();
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    map.flyTo({
      center: church.coordinates,
      zoom: map.getMaxZoom(),
      duration: reducedMotion ? 0 : 1500,
      essential: !reducedMotion
    });
  };

  const createOption = (resultIndex, church) => {
    const option = document.createElement("button");
    option.className = "church-search__option";
    option.id = `church-search-option-${resultIndex}`;
    option.type = "button";
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.addEventListener("click", () => selectChurch(church));
    option.addEventListener("pointermove", () => setActiveIndex(resultIndex));
    return option;
  };

  const renderBookmarks = () => {
    const bookmarkedChurches = getBookmarkedChurchIds().flatMap((churchId) => {
      const church = churchesById.get(churchId);
      return church ? [church] : [];
    });

    if (!bookmarkedChurches.length) {
      return;
    }

    const heading = document.createElement("p");
    heading.className = "church-search__heading";
    heading.textContent = "Bookmarks";
    results.append(heading);

    bookmarkedChurches.forEach((church) => {
      const resultIndex = matches.length;
      matches.push({ church });

      const option = createOption(resultIndex, church);
      option.classList.add("church-search__option--bookmark");

      const name = document.createElement("strong");
      name.textContent = church.localName || church.name;

      const locality = document.createElement("span");
      locality.className = "church-search__address";
      locality.textContent = church.locality;

      option.append(name, locality);
      results.append(option);
    });
  };

  const renderUpcomingMasses = () => {
    const upcomingMasses = getUpcomingMasses(
      churches,
      new Date(),
      MAX_RESULTS
    );

    const heading = document.createElement("p");
    heading.className = "church-search__heading";
    heading.textContent = "Upcoming Masses";
    results.append(heading);

    if (!upcomingMasses.length) {
      const empty = document.createElement("p");
      empty.className = "church-search__empty";
      empty.textContent = "No upcoming Masses found";
      results.append(empty);
      return;
    }

    upcomingMasses.forEach((upcoming) => {
      const church = upcoming.church;
      const resultIndex = matches.length;
      matches.push({ church, upcoming });
      const option = createOption(resultIndex, church);
      option.classList.add("church-search__option--mass");

      const details = document.createElement("span");
      details.className = "church-search__mass-details";

      const language = document.createElement("span");
      language.className = "church-search__mass-language";
      language.textContent = upcoming.mass.language || "Language not listed";

      const time = document.createElement("time");
      time.className = "church-search__mass-time";
      const dayLabel =
        upcoming.dayOffset === 0
          ? "Today"
          : upcoming.dayOffset === 1
            ? "Tomorrow"
            : upcoming.mass.day;
      time.textContent = `${dayLabel} · ${upcoming.mass.time}`;

      const name = document.createElement("strong");
      name.textContent = church.localName || church.name;

      const locality = document.createElement("span");
      locality.className = "church-search__address";
      locality.textContent = church.locality;

      details.append(language, time);
      option.append(details, name, locality);
      results.append(option);
    });
  };

  const renderChurchMatches = () => {
    const churchesFound = getMatches(index, input.value);
    matches = churchesFound.map((church) => ({ church }));

    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "church-search__empty";
      empty.textContent = "No churches found";
      results.append(empty);
      return;
    }

    churchesFound.forEach((church, resultIndex) => {
      const option = createOption(resultIndex, church);

      const name = document.createElement("strong");
      name.textContent = church.localName || church.name;

      const alternateName = document.createElement("span");
      alternateName.className = "church-search__alternate";
      alternateName.textContent =
        church.localName && church.localName !== church.name
          ? church.name
          : church.type;

      const address = document.createElement("span");
      address.className = "church-search__address";
      address.textContent = church.address || church.locality;

      option.append(name);
      if (alternateName.textContent) option.append(alternateName);
      option.append(address);
      results.append(option);
    });
  };

  const renderResults = () => {
    matches = [];
    activeIndex = -1;
    input.removeAttribute("aria-activedescendant");
    results.replaceChildren();

    if (input.value.trim()) {
      renderChurchMatches();
    } else {
      renderBookmarks();
      renderUpcomingMasses();
    }

    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  input.disabled = false;
  input.addEventListener("input", renderResults);
  input.addEventListener("focus", renderResults);
  input.addEventListener("click", () => {
    if (results.hidden) renderResults();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault();
      setActiveIndex(activeIndex + 1);
    } else if (event.key === "ArrowUp" && matches.length) {
      event.preventDefault();
      setActiveIndex(activeIndex - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectChurch(matches[activeIndex].church);
    } else if (event.key === "Escape") {
      closeResults();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!container.contains(event.target)) closeResults();
  });

  const upcomingMassTimer = window.setInterval(() => {
    if (!results.hidden && !input.value.trim()) renderResults();
  }, 30_000);

  const refreshOpenBookmarks = () => {
    if (!results.hidden && !input.value.trim()) renderResults();
  };
  window.addEventListener(BOOKMARKS_CHANGED_EVENT, refreshOpenBookmarks);
  map.once("remove", () => {
    window.clearInterval(upcomingMassTimer);
    window.removeEventListener(BOOKMARKS_CHANGED_EVENT, refreshOpenBookmarks);
  });
}
