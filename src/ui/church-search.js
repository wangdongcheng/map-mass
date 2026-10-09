import {
  BOOKMARKS_CHANGED_EVENT,
  getBookmarkedChurchIds
} from "../data/church-bookmarks.js";
import { getUpcomingMasses } from "../data/current-mass.js";
import { hasActiveFilters } from "../data/church-filters.js";

const MAX_RESULTS = 8;
const UPCOMING_TIME_SLOT_COUNT = 5;

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

export function initialiseChurchSearch(churches, navigation, filterStore) {
  const container = document.querySelector("#church-search");
  const input = document.querySelector("#church-search-input");
  const results = document.querySelector("#church-search-results");
  let availableChurches = filterStore?.getSnapshot().churches ?? churches;
  let index = availableChurches.map(createSearchEntry);
  const churchesById = new Map(churches.map((church) => [church.id, church]));
  let matches = [];
  let activeIndex = -1;
  let expandedUpcomingKey;
  let previousFilters = JSON.stringify(filterStore?.getSnapshot().filters);

  const closeResults = () => {
    matches = [];
    activeIndex = -1;
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  };

  const closeChurchBubbles = () => {
    navigation.closeDetails();
  };

  const activateSearch = () => {
    closeChurchBubbles();
    renderResults();
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

    navigation.selectChurch(church.id);
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
    const availableIds = new Set(availableChurches.map(church => church.id));
    const bookmarkedChurches = getBookmarkedChurchIds().flatMap((churchId) => {
      const church = churchesById.get(churchId);
      return church && availableIds.has(church.id) ? [church] : [];
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
      availableChurches,
      new Date(),
      Number.MAX_SAFE_INTEGER
    );
    const groupsByKey = new Map();

    upcomingMasses.forEach((upcoming) => {
      const key = `${upcoming.dayOffset}:${upcoming.startMinute}`;
      let group = groupsByKey.get(key);

      if (!group) {
        if (groupsByKey.size >= UPCOMING_TIME_SLOT_COUNT) return;

        group = {
          key,
          dayOffset: upcoming.dayOffset,
          time: upcoming.mass.time,
          day: upcoming.mass.day,
          churches: new Map()
        };
        groupsByKey.set(key, group);
      }

      let churchEntry = group.churches.get(upcoming.church.id);

      if (!churchEntry) {
        churchEntry = { church: upcoming.church, languages: new Set() };
        group.churches.set(upcoming.church.id, churchEntry);
      }

      churchEntry.languages.add(
        upcoming.mass.language || "Language not listed"
      );
    });

    const groups = [...groupsByKey.values()];

    const heading = document.createElement("p");
    heading.className = "church-search__heading";
    heading.textContent = "Next Mass times";
    results.append(heading);

    if (!groups.length) {
      const empty = document.createElement("p");
      empty.className = "church-search__empty";
      empty.textContent = "No upcoming Masses found";
      results.append(empty);
      return;
    }

    if (
      expandedUpcomingKey === undefined ||
      (expandedUpcomingKey !== null && !groupsByKey.has(expandedUpcomingKey))
    ) {
      expandedUpcomingKey = groups[0].key;
    }

    groups.forEach((group, groupIndex) => {
      const section = document.createElement("section");
      section.className = "church-search__time-group";
      const isExpanded = expandedUpcomingKey === group.key;
      const panelId = `church-search-time-panel-${groupIndex}`;

      const toggle = document.createElement("button");
      toggle.className = "church-search__time-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", String(isExpanded));
      toggle.setAttribute("aria-controls", panelId);

      const day = document.createElement("span");
      day.className = "church-search__time-day";
      day.textContent =
        group.dayOffset === 0
          ? "Today"
          : group.dayOffset === 1
            ? "Tomorrow"
            : group.day;

      const time = document.createElement("time");
      time.className = "church-search__time-value";
      time.textContent = group.time;

      const count = document.createElement("span");
      count.className = "church-search__time-count";
      count.textContent = `${group.churches.size} ${
        group.churches.size === 1 ? "church" : "churches"
      }`;

      const chevron = document.createElement("span");
      chevron.className = "church-search__time-chevron";
      chevron.setAttribute("aria-hidden", "true");
      chevron.textContent = "›";

      toggle.append(day, time, count, chevron);
      toggle.addEventListener("click", () => {
        expandedUpcomingKey = isExpanded ? null : group.key;
        renderResults();
        results
          .querySelectorAll(".church-search__time-toggle")
          [groupIndex]?.focus();
      });

      const panel = document.createElement("div");
      panel.className = "church-search__time-panel";
      panel.id = panelId;
      panel.hidden = !isExpanded;

      if (isExpanded) {
        [...group.churches.values()].forEach(({ church, languages }) => {
          const resultIndex = matches.length;
          matches.push({ church });
          const option = createOption(resultIndex, church);
          option.classList.add("church-search__option--mass");

          const name = document.createElement("strong");
          name.textContent = church.localName || church.name;

          const details = document.createElement("span");
          details.className = "church-search__mass-details";

          const language = document.createElement("span");
          language.className = "church-search__mass-language";
          language.textContent = [...languages].join(" · ");

          const locality = document.createElement("span");
          locality.className = "church-search__address";
          locality.textContent = church.locality;

          details.append(language, locality);
          option.append(name, details);
          panel.append(option);
        });
      }

      section.append(toggle, panel);
      results.append(section);
    });
  };

  const renderChurchMatches = () => {
    const churchesFound = input.value.trim() ? getMatches(index, input.value) : availableChurches;
    matches = churchesFound.map((church) => ({ church }));

    if (filterStore && hasActiveFilters(filterStore.getSnapshot().filters)) {
      const heading = document.createElement("p");
      heading.className = "church-search__heading";
      heading.textContent = input.value.trim() ? "Matching churches" : `${churchesFound.length} matching churches`;
      results.append(heading);
    }

    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "church-search__empty";
      empty.textContent = "No churches found";
      results.append(empty);
      return;
    }

    churchesFound.forEach((church, resultIndex) => {
      const option = createOption(resultIndex, church);

      const cross = document.createElement("span");
      cross.className = "church-search__cross";
      cross.classList.toggle("has-no-mass-times", !church.hasMassTimes);
      cross.setAttribute("role", "img");
      const massStatus = church.hasMassTimes
        ? "Mass times available"
        : "No Mass times listed";
      cross.setAttribute("aria-label", massStatus);
      cross.title = massStatus;

      const name = document.createElement("strong");
      name.append(cross, document.createTextNode(church.localName || church.name));

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
      if (filterStore && hasActiveFilters(filterStore.getSnapshot().filters) && church.masses.length) {
        const times = document.createElement("span");
        times.className = "church-search__matching-times";
        const { dayMode } = filterStore.getSnapshot().filters;
        const summaries = [...new Set(church.masses.map(mass => `${dayMode === "any" ? `${mass.day.slice(0, 3)} ` : ""}${mass.time} ${mass.language || "Language not listed"}`))];
        times.textContent = summaries.slice(0, 3).join(" · ") + (summaries.length > 3 ? ` · +${summaries.length - 3} more` : "");
        option.append(times);
      }
      results.append(option);
    });
  };

  const renderResults = () => {
    matches = [];
    activeIndex = -1;
    input.removeAttribute("aria-activedescendant");
    results.replaceChildren();

    if (input.value.trim() || (filterStore && hasActiveFilters(filterStore.getSnapshot().filters))) {
      renderChurchMatches();
    } else {
      renderUpcomingMasses();
      renderBookmarks();
    }

    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  input.disabled = false;
  input.addEventListener("input", renderResults);
  input.addEventListener("focus", activateSearch);
  input.addEventListener("click", () => {
    closeChurchBubbles();
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
  const unsubscribeFilters = filterStore?.subscribe(snapshot => {
    availableChurches = snapshot.churches;
    index = availableChurches.map(createSearchEntry);
    const nextFilters = JSON.stringify(snapshot.filters);
    const changed = nextFilters !== previousFilters;
    previousFilters = nextFilters;
    if (!results.hidden || (changed && hasActiveFilters(snapshot.filters))) renderResults();
  });
  return () => {
    unsubscribeFilters?.();
    window.clearInterval(upcomingMassTimer);
    window.removeEventListener(BOOKMARKS_CHANGED_EVENT, refreshOpenBookmarks);
  };
}
