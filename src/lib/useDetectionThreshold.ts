import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MIN_CONFIDENCE } from "./detection";

/**
 * Reads the confidence threshold (0-1) from `system_settings` under the
 * key `confidence_threshold`. Falls back to MIN_CONFIDENCE if the row is
 * missing, unreadable (e.g. anon user without admin access), or invalid.
 */
export function useDetectionThreshold(): number {
  const [threshold, setThreshold] = useState<number>(MIN_CONFIDENCE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "confidence_threshold")
        .maybeSingle();
      if (cancelled || error || !data) return;

      const raw = data.value as unknown;
      let n: number | null = null;
      if (typeof raw === "number") n = raw;
      else if (raw && typeof raw === "object" && "value" in (raw as any)) {
        const v = (raw as any).value;
        if (typeof v === "number") n = v;
      }
      if (n != null && Number.isFinite(n) && n >= 0 && n <= 1) {
        setThreshold(n);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return threshold;
}

/**
 * Apply a confidence threshold to a detection result. If the original
 * status is NOT_ALLOWED but no weapon detection clears the threshold,
 * downgrade to UNSURE so the operator is asked to retry.
 */
export function applyThreshold<T extends { status: string; detections: { isWeapon: boolean; score: number }[] }>(
  result: T,
  threshold: number
): T {
  if (result.status !== "NOT_ALLOWED") return result;
  const hasConfidentWeapon = result.detections.some(
    (d) => d.isWeapon && d.score >= threshold
  );
  if (hasConfidentWeapon) return result;
  return { ...result, status: "UNSURE" };
}
