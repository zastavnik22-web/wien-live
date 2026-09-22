import {NextResponse} from "next/server";import {resolve} from "../../../lib/wien.js";
export async function GET(req){try{const p=new URL(req.url).searchParams;return NextResponse.json(await resolve(p.get("station")||"",p.get("line")||""));}catch(e){return NextResponse.json({error:e.message},{status:500});}}
