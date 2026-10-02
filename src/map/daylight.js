const RADIANS = Math.PI / 180;
const MALTA_LATITUDE = 35.935 * RADIANS;
const MALTA_LONGITUDE = 14.38;

// NOAA's approximate solar position equations, evaluated in UTC at Malta.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
// Using the instant and coordinates also handles Malta's DST automatically.
export function getSolarAltitude(now = new Date()) {
  const year = now.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const daysInYear = (Date.UTC(year + 1, 0, 1) - start) / 86_400_000;
  const day = Math.floor((now.getTime() - start) / 86_400_000) + 1;
  const hours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const angle = 2 * Math.PI / daysInYear * (day - 1 + (hours - 12) / 24);
  const equationOfTime = 229.18 * (
    0.000075 + 0.001868 * Math.cos(angle) - 0.032077 * Math.sin(angle)
    - 0.014615 * Math.cos(2 * angle) - 0.040849 * Math.sin(2 * angle)
  );
  const declination = 0.006918 - 0.399912 * Math.cos(angle)
    + 0.070257 * Math.sin(angle) - 0.006758 * Math.cos(2 * angle)
    + 0.000907 * Math.sin(2 * angle) - 0.002697 * Math.cos(3 * angle)
    + 0.00148 * Math.sin(3 * angle);
  const hourAngle = (hours * 60 + equationOfTime + 4 * MALTA_LONGITUDE) / 4 - 180;
  const sineAltitude = Math.sin(MALTA_LATITUDE) * Math.sin(declination)
    + Math.cos(MALTA_LATITUDE) * Math.cos(declination) * Math.cos(hourAngle * RADIANS);
  return Math.asin(Math.max(-1, Math.min(1, sineAltitude))) / RADIANS;
}

export function getNightAmount(now = new Date()) {
  // Blend through sunrise/sunset: full daylight at +6°, full night at -6°.
  const progress = Math.max(0, Math.min(1, (6 - getSolarAltitude(now)) / 12));
  return progress * progress * (3 - 2 * progress);
}
