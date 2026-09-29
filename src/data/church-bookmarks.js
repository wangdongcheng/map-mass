const STORAGE_KEY = "map-mass:church-bookmarks";
export const BOOKMARKS_CHANGED_EVENT = "church-bookmarks-change";

function readBookmarkIds() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored.filter(
      (churchId, index) =>
        /^\d{4}$/.test(churchId) && stored.indexOf(churchId) === index
    );
  } catch {
    return [];
  }
}

function writeBookmarkIds(churchIds) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(churchIds));
    window.dispatchEvent(new Event(BOOKMARKS_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function getBookmarkedChurchIds() {
  return readBookmarkIds();
}

export function isChurchBookmarked(churchId) {
  return readBookmarkIds().includes(churchId);
}

export function toggleChurchBookmark(churchId) {
  const churchIds = readBookmarkIds();
  const existingIndex = churchIds.indexOf(churchId);

  if (existingIndex === -1) {
    churchIds.push(churchId);
  } else {
    churchIds.splice(existingIndex, 1);
  }

  return writeBookmarkIds(churchIds) && existingIndex === -1;
}
