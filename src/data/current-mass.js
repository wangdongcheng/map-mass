const MASS_DURATION_MINUTES = 60;
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

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

export function getMassesInProgress(masses, date = new Date()) {
  const now = getMaltaDayAndMinute(date);
  const activeMasses = masses.filter((mass) => {
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
  const remainingMinutes = activeMasses.length
    ? Math.min(
        ...activeMasses.map(
          (mass) => parseTime(mass.time) + MASS_DURATION_MINUTES - now.minute
        )
      )
    : 0;

  return {
    day: now.day,
    masses: activeMasses,
    remainingMinutes,
    remainingFraction: remainingMinutes / MASS_DURATION_MINUTES
  };
}

export function isMassInProgress(masses, date = new Date()) {
  return getMassesInProgress(masses, date).masses.length > 0;
}

export function getUpcomingMasses(churches, date = new Date(), limit = 8) {
  const now = getMaltaDayAndMinute(date);
  const todayIndex = DAYS.indexOf(now.day);

  if (todayIndex === -1 || limit <= 0) {
    return [];
  }

  return churches
    .flatMap((church) =>
      church.masses.flatMap((mass) => {
        const massDayIndex = DAYS.indexOf(mass.day);
        const startMinute = parseTime(mass.time);

        if (massDayIndex === -1 || startMinute === null) {
          return [];
        }

        let dayOffset = (massDayIndex - todayIndex + DAYS.length) % DAYS.length;

        if (dayOffset === 0 && startMinute < now.minute) {
          dayOffset = DAYS.length;
        }

        return [{ church, mass, dayOffset, startMinute }];
      })
    )
    .sort(
      (a, b) =>
        a.dayOffset - b.dayOffset ||
        a.startMinute - b.startMinute ||
        a.church.name.localeCompare(b.church.name) ||
        a.mass.language.localeCompare(b.mass.language)
    )
    .slice(0, limit);
}
