"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const GameScreen = dynamic(() => import("./GameScreen"), { ssr: false });

export default function PlayPage() {
  return (
    <Suspense>
      <GameScreen />
    </Suspense>
  );
}
