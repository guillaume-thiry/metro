"use client";

import dynamic from "next/dynamic";

const ResultsContent = dynamic(() => import("./ResultsContent"), { ssr: false });

export default function ResultsPage() {
  return <ResultsContent />;
}
