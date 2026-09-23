import { NextResponse } from "next/server";

export async function GET() {
  const results = [];

  for (let id = 1; id <= 9000; id++) {
    try {
      const res = await fetch(
        `https://www.wienerlinien.at/ogd_realtime/monitor?stopId=${id}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      const monitors = json?.data?.monitors ?? [];

      if (!monitors.length) continue;

      const title =
        monitors[0]?.locationStop?.properties?.title ?? "";

      const lines = monitors.flatMap(
        (m) => m.lines?.map((l) => l.name) ?? []
      );

      if (
        title.toLowerCase().includes("rennweg")
   ) {
        results.push({
          stopId: id,
          station: title,
          lines,
        });
      }
    } catch {}
  }

  return NextResponse.json(results);
}