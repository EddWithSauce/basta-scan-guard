import { supabase } from "@/integrations/supabase/client";
import type { DetectionResult, DetectionSource } from "./detection";
import { getSessionId } from "./detection";

export class RateLimitError extends Error {
  constructor(msg = "Rate limited") { super(msg); this.name = "RateLimitError"; }
}
export class PaymentRequiredError extends Error {
  constructor(msg = "AI credits exhausted") { super(msg); this.name = "PaymentRequiredError"; }
}

export async function analyzeImage(dataUrl: string): Promise<DetectionResult> {
  const { data, error } = await supabase.functions.invoke<DetectionResult>("detect-weapon", {
    body: { imageBase64: dataUrl },
  });
  // supabase-js puts the JSON body on `data` even when status is non-2xx in newer versions,
  // but on errors `data` may be null. Try to read either.
  const errMsg: string | undefined = (data as any)?.error || error?.message;
  if (errMsg) {
    if (/rate limit|429|rate_limited/i.test(errMsg)) throw new RateLimitError(errMsg);
    if (/credits|402|payment/i.test(errMsg)) throw new PaymentRequiredError(errMsg);
    throw new Error(errMsg);
  }
  if (!data || !(data as any).status) throw new Error("No response from detection service");
  return data;
}

export async function logDetection(params: {
  source: DetectionSource;
  result: DetectionResult;
  dataUrl?: string;
  saveImage?: boolean;
}) {
  let image_path: string | null = null;
  if (params.saveImage && params.dataUrl) {
    try {
      const blob = await (await fetch(params.dataUrl)).blob();
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("snapshots")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (!upErr) image_path = path;
    } catch (e) {
      console.warn("snapshot upload failed", e);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("detection_logs").insert({
    source: params.source,
    status: params.result.status,
    detected_objects: params.result.objects as any,
    max_confidence: params.result.max_confidence,
    image_path,
    session_id: getSessionId(),
    user_id: user?.id ?? null,
  });
  if (error) console.warn("log insert failed", error.message);
}
