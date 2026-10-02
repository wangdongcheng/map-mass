import { getNightAmount } from "./daylight.js";

const atmospheres = new WeakMap();

export function getMapNightAmount(map) {
  return atmospheres.get(map) ?? 0;
}

export function initialiseMapAtmosphere(map) {
  const container = map.getContainer();
  const ownerDocument = container.ownerDocument;
  const sideLight = ownerDocument.createElement("div");
  sideLight.className = "map-side-light";
  sideLight.setAttribute("aria-hidden", "true");
  container.append(sideLight);
  const dayLight = map.getLight();
  const dayPosition = dayLight.position ?? [1.15, 210, 30];
  const dayIntensity = dayLight.intensity ?? 0.5;
  let previousAmount;

  const refresh = () => {
    const amount = getNightAmount();
    if (amount === previousAmount) return;
    previousAmount = amount;
    atmospheres.set(map, amount);
    container.style.setProperty("--map-night", String(amount));
    map.setLight(amount === 0 ? dayLight : {
      anchor: "viewport",
      color: `rgb(${Math.round(255 - 40 * amount)}, ${Math.round(255 - 23 * amount)}, 255)`,
      position: [dayPosition[0], dayPosition[1] + (285 - dayPosition[1]) * amount,
        dayPosition[2] + (72 - dayPosition[2]) * amount],
      intensity: dayIntensity + (0.78 - dayIntensity) * amount
    });
    map.triggerRepaint();
  };

  refresh();
  const timer = window.setInterval(refresh, 60_000);
  const onVisibilityChange = () => {
    if (!ownerDocument.hidden) refresh();
  };
  ownerDocument.addEventListener("visibilitychange", onVisibilityChange);
  map.once("remove", () => {
    window.clearInterval(timer);
    ownerDocument.removeEventListener("visibilitychange", onVisibilityChange);
    sideLight.remove();
    container.style.removeProperty("--map-night");
    atmospheres.delete(map);
  });
}
