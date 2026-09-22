import { NextResponse } from "next/server";
import { liveByStopId } from "../../../lib/wien.js";

export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;

    const stopId = params.get("stopId") ?? "";
    const line = params.get("line") ?? "";

    if (!stopId.trim()) {
      return NextResponse.json(
        {
          error: "stopId nije unesen",
          departures: []
        },
        { status: 400 }
      );
    }

    const result = await liveByStopId(stopId, line);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control":
          "public, s-maxage=30, stale-while-revalidate=60"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nepoznata greška",
        departures: []
      },
      { status: 500 }
    );
  }
}