"use client";

import { Suspense } from "react";
import GameScreen from "./GameScreen";

export default function PlayPage() {
  return (
    <Suspense>
      <GameScreen />
    </Suspense>
  );
}
