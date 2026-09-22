import {NextResponse} from "next/server";import {live} from "../../../lib/wien.js";
export async function GET(req){try{const p=new URL(req.url).searchParams;return NextResponse.json(await live(p.get("station")||"",p.get("line")||""),{headers:{"Cache-Control":"public, s-maxage=30"}});}catch(e){return NextResponse.json({error:e.message},{status:500});}}
