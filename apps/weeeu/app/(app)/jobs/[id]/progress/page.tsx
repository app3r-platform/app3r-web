"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ServiceProgressTimeline } from "@/components/service-progress/ServiceProgressTimeline";
import { initServiceProgressSeed } from "@/lib/utils/init-seed";

export default function JobProgressPage() {
  const { id } = useParams<{ id: string }>();

  // Seed localStorage on first visit
  useEffect(() => {
    initServiceProgressSeed();
  }, []);

  return <ServiceProgressTimeline jobId={id} />;
}
