"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DocumentIngestionAutoRefresh({
  active,
  intervalMs = 4000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [active, intervalMs, router]);

  return null;
}
