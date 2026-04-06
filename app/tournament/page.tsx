"use client";

import dynamic from "next/dynamic";

const TournamentScreen = dynamic(() => import("./TournamentScreen"), { ssr: false });

export default function TournamentPage() {
  return <TournamentScreen />;
}
