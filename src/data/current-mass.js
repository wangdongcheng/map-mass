const MASS_DURATION_MINUTES = 60;

const MALTA_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Malta",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

function getMaltaDayAndMinute(date) {
  const parts = Object.fromEntries(
    MALTA_TIME_FORMATTER.formatToParts(date).map(({ type, value }) => [
      type,
      value
    ])
  );

  return {
    day: parts.weekday,
    minute: Number(parts.hour) * 60 + Number(parts.minute)
  };
}

function parseTime(time) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

export function isMassInProgress(masses, date = new Date()) {
  const now = getMaltaDayAndMinute(date);

  return masses.some((mass) => {
    if (mass.day !== now.day) {
      return false;
    }

    const start = parseTime(mass.time);

    return (
      start !== null &&
      now.minute >= start &&
      now.minute < start + MASS_DURATION_MINUTES
    );
  });
}
