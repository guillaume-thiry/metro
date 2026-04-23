import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("players")
    .select("show_scores, best_score")
    .eq("id", Number(playerId))
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ show_scores: data.show_scores, best_score: data.best_score ?? null });
}

export async function PATCH(req: NextRequest) {
  const { player_id, show_scores, name } = await req.json();
  if (!player_id) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const supabase = getSupabase();

  const update: Record<string, unknown> = {};
  if (typeof show_scores === "boolean") update.show_scores = show_scores;
  if (typeof name === "string") update.name = name.trim();

  const { error } = await supabase.from("players").update(update).eq("id", player_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
