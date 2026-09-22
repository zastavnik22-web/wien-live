import { NextResponse } from "next/server";

const OEBB_API =
  "https://v6.oebb.transport.rest";

const STATION_NAME = "Wien St. Marx";

async function findStation() {
  const url =
    `${OEBB_API}/locations?query=` +
    `${encodeURIComponent(STATION_NAME)}` +
    `&results=10`;

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `ÖBB pretraga stanice nije uspjela: ${response.status}`
    );
  }

  const locations = await response.json();

  if (!Array.isArray(locations)) {
    throw new Error(
      "ÖBB API nije vratio očekivanu listu stanica."
    );
  }

  const exactMatch = locations.find(
    (location) =>
      String(location.name ?? "")
        .toLocaleLowerCase("de-AT")
        .includes("wien st. marx")
  );

  const station = exactMatch ?? locations[0];

  if (!station?.id) {
    throw new Error(
      "Stanica Wien St. Marx nije pronađena."
    );
  }

  return station;
}

async function loadDepartures(stationId) {
  const url =
    `${OEBB_API}/stops/` +
    `${encodeURIComponent(stationId)}` +
    `/departures?duration=120&results=40`;

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `ÖBB polasci nisu dostupni: ${response.status}`
    );
  }

  const json = await response.json();

  if (Array.isArray(json)) {
    return json;
  }

  if (Array.isArray(json?.departures)) {
    return json.departures;
  }

  return [];
}

function isS7(departure) {
  const lineName = String(
    departure?.line?.name ??
    departure?.line?.fahrtNr ??
    departure?.line ??
    ""
  )
    .replace(/\s+/g, "")
    .toUpperCase();

  return (
    lineName === "S7" ||
    lineName.includes("S7")
  );
}

function getDirection(departure) {
  return (
    departure?.direction ??
    departure?.destination?.name ??
    departure?.stop?.name ??
    "Nepoznat smjer"
  );
}

function getPlatform(departure) {
  return (
    departure?.platform ??
    departure?.plannedPlatform ??
    null
  );
}

function getDepartureTime(departure) {
  return (
    departure?.when ??
    departure?.departure ??
    departure?.plannedWhen ??
    departure?.plannedDeparture ??
    null
  );
}

function getPlannedTime(departure) {
  return (
    departure?.plannedWhen ??
    departure?.plannedDeparture ??
    getDepartureTime(departure)
  );
}

function calculateCountdown(time) {
  if (!time) {
    return null;
  }

  const date = new Date(time);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.max(
    0,
    Math.round(
      (date.getTime() - Date.now()) / 60000
    )
  );
}

export async function GET() {
  try {
    const station = await findStation();

    const allDepartures =
      await loadDepartures(station.id);

    const departures = allDepartures
      .filter(isS7)
      .map((departure) => {
        const realTime =
          getDepartureTime(departure);

        const plannedTime =
          getPlannedTime(departure);

        return {
          station:
            station.name ?? STATION_NAME,

          stationId: station.id,

          line:
            departure?.line?.name ??
            departure?.line ??
            "S7",

          direction:
            getDirection(departure),

          countdown:
            calculateCountdown(realTime),

          real:
            realTime,

          planned:
            plannedTime,

          platform:
            getPlatform(departure),

          delay:
            departure?.delay ?? null,

          cancelled:
            departure?.cancelled ?? false
        };
      })
      .filter(
        (departure) =>
          departure.cancelled !== true
      )
      .sort(
        (a, b) =>
          (a.countdown ?? 999) -
          (b.countdown ?? 999)
      )
      .slice(0, 8);

    return NextResponse.json(
      {
        provider: "ÖBB HAFAS",
        station:
          station.name ?? STATION_NAME,
        stationId: station.id,
        line: "S7",
        departures
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=30, stale-while-revalidate=60"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        provider: "ÖBB HAFAS",
        station: STATION_NAME,
        line: "S7",
        departures: [],
        error:
          error instanceof Error
            ? error.message
            : "Nepoznata ÖBB API greška."
      },
      {
        status: 500
      }
    );
  }
}