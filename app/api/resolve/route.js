import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Automatsko pronalaženje stopId trenutno nije aktivno. Unesite stopId ručno u Postavkama."
    },
    { status: 410 }
  );
}