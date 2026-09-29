const MAX_RESULTS = 8;
const SEARCH_ZOOM = 16.5;

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

export function initialiseChurchSearch(map, churches) {
  const container = document.querySelector("#church-search");
  const input = document.querySelector("#church-search-input");
  const results = document.querySelector("#church-search-results");
  const index = churches.map(createSearchEntry);
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

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    map.flyTo({
      center: church.coordinates,
      zoom: Math.max(map.getZoom(), SEARCH_ZOOM),
      duration: reducedMotion ? 0 : 1500,
      essential: !reducedMotion
    });
  };

  const renderResults = () => {
    matches = getMatches(index, input.value);
    activeIndex = -1;
    results.replaceChildren();

    if (!input.value.trim()) {
      closeResults();
      return;
    }

    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "church-search__empty";
      empty.textContent = "No churches found";
      results.append(empty);
    } else {
      matches.forEach((church, resultIndex) => {
        const option = document.createElement("button");
        option.className = "church-search__option";
        option.id = `church-search-option-${resultIndex}`;
        option.type = "button";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");

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
        option.addEventListener("click", () => selectChurch(church));
        option.addEventListener("pointermove", () => setActiveIndex(resultIndex));
        results.append(option);
      });
    }

    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  input.disabled = false;
  input.addEventListener("input", renderResults);
  input.addEventListener("focus", renderResults);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault();
      setActiveIndex(activeIndex + 1);
    } else if (event.key === "ArrowUp" && matches.length) {
      event.preventDefault();
      setActiveIndex(activeIndex - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectChurch(matches[activeIndex]);
    } else if (event.key === "Escape") {
      closeResults();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!container.contains(event.target)) closeResults();
  });
}
