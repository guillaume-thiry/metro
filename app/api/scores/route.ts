import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const playerId = req.nextUrl.searchParams.get("playerId")
    ? Number(req.nextUrl.searchParams.get("playerId"))
    : null;

  const { data: players, error } = await supabase
    .from("players")
    .select("id, name, best_score")
    .eq("show_scores", true)
    .order("best_score", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!players || players.length === 0) return NextResponse.json({ top5: [], playerEntry: null, entryAbove: null, entryBelow: null });

  const ranked = players.map((p, i) => ({
    rank: i + 1,
    player_id: p.id,
    player: p.name ?? "?",
    score: p.best_score,
  }));

  const top5 = ranked.slice(0, 5);
  const playerInTop5 = playerId ? top5.some((s) => s.player_id === playerId) : false;
  const playerEntry = playerId && !playerInTop5 ? (ranked.find((s) => s.player_id === playerId) ?? null) : null;
  const entryAbove = playerEntry && playerEntry.rank > 6 ? (ranked.find((s) => s.rank === playerEntry.rank - 1) ?? null) : null;
  const entryBelow = playerEntry ? (ranked.find((s) => s.rank === playerEntry.rank + 1) ?? null) : null;

  return NextResponse.json({ top5, playerEntry, entryAbove, entryBelow });
}

export async function POST(req: NextRequest) {
  const { player_id, name, score } = await req.json();
  if (typeof score !== "number") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const supabase = getSupabase();
  let playerId = player_id ?? null;

  if (playerId) {
    await supabase
      .from("players")
      .update({ best_score: score })
      .eq("id", playerId)
      .or(`best_score.is.null,best_score.lt.${score}`);
  } else {
    const { data, error } = await supabase
      .from("players")
      .insert({ name: name?.trim() ?? "", show_scores: false, best_score: score })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    playerId = data.id;
  }

  const { error } = await supabase.from("top-scores").insert({ player_id: playerId, score });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ player_id: playerId });
}
