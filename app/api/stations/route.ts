import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stations")
    .select("name, success, failure")
    .order("success", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stations: data });
}

export async function POST(req: NextRequest) {
  const { successes, failures } = await req.json();
  if (!Array.isArray(successes) || !Array.isArray(failures)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  if (successes.length === 0 && failures.length === 0) {
    return NextResponse.json({ success: true });
  }
  const supabase = getSupabase();
  const { error } = await supabase.rpc("update_station_stats", {
    success_names: successes,
    failure_names: failures,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
