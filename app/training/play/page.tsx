import { Suspense } from "react";
import TrainingGame from "./TrainingGame";

export const dynamic = "force-dynamic";

export default function TrainingPlayPage() {
  return (
    <Suspense>
      <TrainingGame />
    </Suspense>
  );
}
