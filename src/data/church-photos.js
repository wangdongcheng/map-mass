const photoModules = import.meta.glob(
  [
    "../../references/church-photos/*/*.{jpg,jpeg,png,webp,avif,gif,bmp,JPG,JPEG,PNG,WEBP,AVIF,GIF,BMP}",
    "!../../references/church-photos/*/[sS][cC][rR][eE][eE][nN][sS][hH][oO][tT]_*"
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

const galleriesByChurchId = new Map();
Object.entries(photoModules)
  .sort(([left], [right]) => left.localeCompare(right, "en", { numeric: true }))
  .forEach(([path, url]) => {
    const match = path.match(/\/([0-9]{4})\/([^/]+)$/);
    if (!match || /^ScreenShot_/i.test(match[2])) return;

    const gallery = galleriesByChurchId.get(match[1]) ?? [];
    gallery.push(url);
    galleriesByChurchId.set(match[1], gallery);
  });

export function getChurchPhotoUrl(churchId) {
  return photosByChurchId.get(churchId) ?? null;
}

export function getChurchPhotoUrls(churchId) {
  const cover = getChurchPhotoUrl(churchId);
  const gallery = galleriesByChurchId.get(churchId) ?? [];
  return cover ? [cover, ...gallery.filter((url) => url !== cover)] : [...gallery];
}
