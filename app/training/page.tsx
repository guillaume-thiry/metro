import { Suspense } from "react";
import TrainingSetup from "./TrainingSetup";

export default function TrainingPage() {
  return (
    <Suspense>
      <TrainingSetup />
    </Suspense>
  );
}
