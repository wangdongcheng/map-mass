const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export function rowsToRecords(rows, firstColumnName) {
  const headerIndex = rows.findIndex((row) => row[0] === firstColumnName);

  if (headerIndex === -1) {
    throw new Error(`Could not find the ${firstColumnName} table`);
  }

  const headers = rows[headerIndex];

  return rows.slice(headerIndex + 1).flatMap((row) => {
    if (row.every((value) => value === null)) {
      return [];
    }

    return [
      Object.fromEntries(
        headers.map((header, index) => [header, row[index] ?? null])
      )
    ];
  });
}

function createMassIndex(massRecords) {
  const massesByChurch = new Map();

  massRecords.forEach((record) => {
    const churchNumber = String(record["Church No."] ?? "");

    if (!churchNumber || !record.Day || !record.Time) {
      return;
    }

    let masses = massesByChurch.get(churchNumber);

    if (!masses) {
      masses = new Map();
      massesByChurch.set(churchNumber, masses);
    }

    const mass = {
      day: String(record.Day),
      time: String(record.Time),
      language: record.Language ? String(record.Language) : "",
      note: record.Note ? String(record.Note) : ""
    };
    const key = [mass.day, mass.time, mass.language, mass.note].join("\u0000");

    masses.set(key, mass);
  });

  return massesByChurch;
}

function createSchedule(masses) {
  const entriesByDay = new Map(DAYS.map((day) => [day, []]));

  masses.forEach((mass) => {
    const entries = entriesByDay.get(mass.day);

    if (entries) {
      entries.push({
        time: mass.time,
        language: mass.language,
        note: mass.note
      });
    }
  });

  entriesByDay.forEach((entries) => {
    entries.sort(
      (a, b) =>
        a.time.localeCompare(b.time) ||
        a.language.localeCompare(b.language) ||
        a.note.localeCompare(b.note)
    );
  });

  const schedule = [];

  DAYS.forEach((day, dayIndex) => {
    const entries = entriesByDay.get(day);

    if (!entries.length) {
      return;
    }

    const signature = JSON.stringify(entries);
    const previous = schedule.at(-1);

    if (
      previous &&
      previous.endDayIndex === dayIndex - 1 &&
      previous.signature === signature
    ) {
      previous.endDayIndex = dayIndex;
      previous.days = `${previous.startDay}\u2013${day}`;
      return;
    }

    schedule.push({
      days: day,
      startDay: day,
      endDayIndex: dayIndex,
      entries,
      signature
    });
  });

  return schedule.map(({ days, startDay, endDayIndex, entries }) => ({
    days,
    dayNames: DAYS.slice(DAYS.indexOf(startDay), endDayIndex + 1),
    entries
  }));
}

export function normaliseChurches(churchRecords, massRecords) {
  const massesByChurch = createMassIndex(massRecords);

  return churchRecords.flatMap((record) => {
    const churchNumber = String(record["No."] ?? "");
    const masses = massesByChurch.get(churchNumber);
    const latitude = Number(record.Latitude);
    const longitude = Number(record.Longitude);

    if (
      record["Schedule status"] !== "Listed" ||
      !masses?.size ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return [];
    }

    const languages = [
      ...new Set(
        [...masses.values()].map((mass) => mass.language).filter(Boolean)
      )
    ].sort();

    return [
      {
        id: `mt-church-${churchNumber}`,
        number: churchNumber,
        name: String(record.Church),
        localName: record["Local name"]
          ? String(record["Local name"])
          : "",
        locality: record.Locality ? String(record.Locality) : "",
        type: record.Type ? String(record.Type) : "",
        coordinates: [longitude, latitude],
        masses: [...masses.values()],
        massTimes: createSchedule(masses),
        massTimesByLanguage: Object.fromEntries(
          languages.map((language) => [
            language,
            createSchedule(
              [...masses.values()].filter(
                (mass) => mass.language === language
              )
            )
          ])
        ),
        languages,
        sourceUrl: record["Source URL"]
          ? String(record["Source URL"])
          : ""
      }
    ];
  });
}
