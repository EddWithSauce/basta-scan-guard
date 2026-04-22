// Shared types and utilities for detection
export type DetectedObject = {
  name: string;
  is_weapon: boolean;
  confidence: number;
  bbox: [number, number, number, number]; // x, y, w, h normalized 0..1
};

export type DetectionResult = {
  status: "ALLOWED" | "NOT_ALLOWED" | "UNSURE";
  objects: DetectedObject[];
  image_quality: "clear" | "unclear";
  max_confidence: number;
};

export type DetectionSource = "live" | "capture" | "upload";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("bbb_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bbb_session_id", id);
  }
  return id;
}
