"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires one analytics event when the page mounts (e.g. view_tour). */
export default function TrackView({ event, params }: { event: string; params?: Record<string, string | number> }) {
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}
