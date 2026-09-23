import { NextResponse } from "next/server";

export async function GET() {
  const results = [];

  for (let id = 250; id <= 330; id++) {
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
        console.log(id, title);

      const lines = monitors.flatMap(
        (m) => m.lines?.map((l) => l.name) ?? []
      );

      results.push({
        stopId: id,
        station: title,
        lines,
      });
    } catch {}
  }

  return NextResponse.json(results);
}
         