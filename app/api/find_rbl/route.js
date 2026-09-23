import { NextResponse } from "next/server";

export async function GET() {
  const results = [];

  for (let id = 1; id <= 3000; id++) {
    try {
      const res = await fetch(
        `https://www.wienerlinien.at/ogd_realtime/monitor?stopId=${id}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();
      const monitors = json?.data?.monitors ?? [];

      if (!monitors.length) continue;

      for (const monitor of monitors) {
        const station =
          monitor?.locationStop?.properties?.title ?? "";

        for (const line of monitor.lines ?? []) {
          if (line.name === "71") {
            results.push({
              stopId: id,
              station,
              line: line.name,
              direction: line.towards,
            });
          }
        }
      }
    } catch {}
  }

  return NextResponse.json(results);
}