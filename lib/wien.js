const MONITOR =
  "https://www.wienerlinien.at/ogd_realtime/monitor";

export async function liveByStopId(
  stopId,
  requestedLine
) {
  if (!stopId) {
    throw new Error("stopId nije unesen");
  }

  const stopIds = String(stopId)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (stopIds.length === 0) {
    throw new Error("Nije unesen važeći stopId");
  }

  const query = stopIds
    .map(
      (value) =>
        `stopId=${encodeURIComponent(value)}`
    )
    .join("&");

  const response = await fetch(
    `${MONITOR}?${query}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Wiener Linien API greška: ${response.status}`
    );
  }

  const json = await response.json();
  const monitors = json?.data?.monitors ?? [];

  const departures = monitors
    .flatMap((monitor) => {
      const stopTitle =
        monitor?.locationStop?.properties?.title ??
        "";

      const attributes =
        monitor?.locationStop?.properties
          ?.attributes ?? {};

      const returnedStopId = String(
        attributes.rbl ??
          attributes.rblNumber ??
          ""
      );

      return (monitor.lines ?? [])
        .filter((line) => {
          if (!requestedLine) {
            return true;
          }

          return (
            String(line.name).toUpperCase() ===
            String(requestedLine).toUpperCase()
          );
        })
        .flatMap((line) =>
          (
            line.departures?.departure ?? []
          ).map((departure) => ({
            stopId: returnedStopId,
            station: stopTitle,
            line: line.name,
            direction: line.towards ?? "–",
            countdown:
              departure.departureTime
                ?.countdown ?? null,
            planned:
              departure.departureTime
                ?.timePlanned ?? null,
            real:
              departure.departureTime
                ?.timeReal ?? null,
            platform:
              departure.vehicle?.platform ??
              null,
            barrierFree:
              line.barrierFree ?? null,
            trafficJam:
              line.trafficjam ?? null
          }))
        );
    })
    .sort(
      (a, b) =>
        (a.countdown ?? 999) -
        (b.countdown ?? 999)
    )
    .slice(0, 8);

  return {
    stopIds,
    line: requestedLine,
    departures
  };
}