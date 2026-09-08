import { NextResponse } from "next/server";
import { getSongOfTheDay } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const song = await getSongOfTheDay();
    return NextResponse.json({ title: song.name, artist: song.artist, hasArtwork: !!song.imageUrl });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 502 });
  }
}
