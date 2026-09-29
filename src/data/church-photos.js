const photoModules = import.meta.glob(
  [
    "../../references/church-photos/*/[0-9][0-9][0-9][0-9].jpg",
    "../../references/church-photos/*/[0-9][0-9][0-9][0-9].jpeg",
    "../../references/church-photos/*/[0-9][0-9][0-9][0-9].png",
    "../../references/church-photos/*/[0-9][0-9][0-9][0-9].webp",
    "../../references/church-photos/*/[0-9][0-9][0-9][0-9].avif"
  ],
  {
    eager: true,
    query: "?url",
    import: "default"
  }
);

const photosByChurchId = new Map(
  Object.entries(photoModules).flatMap(([path, url]) => {
    const match = path.match(
      /\/([0-9]{4})\/([0-9]{4})\.(?:jpe?g|png|webp|avif)$/i
    );

    if (!match || match[1] !== match[2]) {
      return [];
    }

    return [[match[1], url]];
  })
);

export function getChurchPhotoUrl(churchId) {
  return photosByChurchId.get(churchId) ?? null;
}
