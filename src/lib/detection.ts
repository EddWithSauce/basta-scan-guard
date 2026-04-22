// Decision logic for the AI weapon-detection results returned by the
// `detect-weapon` edge function. The shape lets the rest of the UI
// (StatusBanner, BoundingBoxOverlay, logs) keep working unchanged.

export const WEAPON_LABELS = new Set<string>([
  "knife", "blade", "dagger", "machete", "sword", "katana",
  "axe", "hatchet", "cleaver", "switchblade",
  "gun", "handgun", "pistol", "revolver", "rifle", "shotgun",
  "firearm", "submachine gun", "assault rifle",
  "bow", "crossbow", "grenade", "taser", "stun gun", "brass knuckles",
]);

export const FRIENDLY_LABELS: Record<string, string> = {
  knife: "Knife",
  blade: "Blade",
  dagger: "Dagger",
  machete: "Machete",
  sword: "Sword",
  katana: "Katana",
  axe: "Axe",
  hatchet: "Hatchet",
  cleaver: "Cleaver",
  switchblade: "Switchblade",
  gun: "Gun",
  handgun: "Handgun",
  pistol: "Pistol",
  revolver: "Revolver",
  rifle: "Rifle",
  shotgun: "Shotgun",
  firearm: "Firearm",
  grenade: "Grenade",
  taser: "Taser",
};

export const MIN_CONFIDENCE = 0.55;
export const MIN_ANY_DETECTION_CONFIDENCE = 0.35;

export type FinalStatus = "ALLOWED" | "NOT_ALLOWED" | "UNSURE";

export interface DetectionBox {
  label: string;
  score: number;
  // bbox in PIXEL coordinates of the source image. May be omitted if the
  // model didn't return a box.
  bbox: [number, number, number, number];
  isWeapon: boolean;
}

export interface DetectionResult {
  status: FinalStatus;
  detections: DetectionBox[];
  topLabel: string | null;
  topScore: number | null;
  reason?: string | null;
}

// ---------------- AI verdict -> DetectionResult ----------------

export interface AIVerdict {
  status: FinalStatus;
  reason?: string;
  weapons: { label: string; confidence: number; bbox?: number[] }[];
  objects: { label: string; confidence: number }[];
}

/**
 * Convert the edge-function verdict into the DetectionResult shape used by
 * the UI. `sourceWidth` / `sourceHeight` are the pixel dimensions of the
 * original image so we can convert normalized 0-1 bboxes back to pixels.
 */
export function verdictToResult(
  verdict: AIVerdict,
  sourceWidth: number,
  sourceHeight: number
): DetectionResult {
  const weaponBoxes: DetectionBox[] = (verdict.weapons || [])
    .filter((w) => w.confidence >= MIN_ANY_DETECTION_CONFIDENCE)
    .map((w) => ({
      label: (w.label || "weapon").toLowerCase(),
      score: w.confidence,
      bbox: normalizeBbox(w.bbox, sourceWidth, sourceHeight),
      isWeapon: true,
    }));

  const objectBoxes: DetectionBox[] = (verdict.objects || [])
    .filter((o) => o.confidence >= MIN_ANY_DETECTION_CONFIDENCE)
    .map((o) => ({
      label: (o.label || "object").toLowerCase(),
      score: o.confidence,
      bbox: [0, 0, 0, 0] as [number, number, number, number],
      isWeapon: WEAPON_LABELS.has((o.label || "").toLowerCase()),
    }));

  const detections = [...weaponBoxes, ...objectBoxes].sort((a, b) => b.score - a.score);
  const topWeapon = weaponBoxes.sort((a, b) => b.score - a.score)[0];
  const topAny = detections[0];
  const top = topWeapon ?? topAny ?? null;

  return {
    status: verdict.status,
    detections,
    topLabel: top?.label ?? null,
    topScore: top?.score ?? null,
    reason: verdict.reason ?? null,
  };
}

/**
 * Convert a bbox returned by the AI into pixel [x, y, width, height]
 * coordinates of the source image. Handles three common formats:
 *   1. [x, y, w, h] in 0-1 normalized coords         (preferred)
 *   2. [x, y, w, h] in pixel coords                  (already pixels)
 *   3. [ymin, xmin, ymax, xmax] in 0-1000 ints       (Gemini default)
 *   4. [ymin, xmin, ymax, xmax] in 0-1 normalized
 */
function normalizeBbox(
  bbox: number[] | undefined,
  w: number,
  h: number
): [number, number, number, number] {
  if (!bbox || bbox.length < 4) return [0, 0, 0, 0];
  let [a, b, c, d] = bbox.map((n) => Number(n));
  if ([a, b, c, d].some((n) => !Number.isFinite(n))) return [0, 0, 0, 0];

  const maxVal = Math.max(a, b, c, d);

  // Format 3: Gemini ymin,xmin,ymax,xmax in 0-1000 range
  if (maxVal > 1.5 && maxVal <= 1000 && c > a && d > b && a < 1000 && b < 1000) {
    const ymin = (a / 1000) * h;
    const xmin = (b / 1000) * w;
    const ymax = (c / 1000) * h;
    const xmax = (d / 1000) * w;
    return [xmin, ymin, Math.max(0, xmax - xmin), Math.max(0, ymax - ymin)];
  }

  // Normalized 0-1
  if (maxVal <= 1.5) {
    // Detect [ymin,xmin,ymax,xmax] vs [x,y,w,h]
    // If c > a AND d > b AND (c+d > 1) it's likely y2/x2 corners.
    const looksLikeCorners = c > a && d > b && (c > 1 || d > 1 || a + c <= 1.05 ? false : true);
    if (looksLikeCorners) {
      const ymin = a * h, xmin = b * w, ymax = c * h, xmax = d * w;
      return [xmin, ymin, Math.max(0, xmax - xmin), Math.max(0, ymax - ymin)];
    }
    return [a * w, b * h, c * w, d * h];
  }

  // Format 2: already pixel [x,y,w,h]
  return [a, b, c, d];
}

export function statusLabel(status: FinalStatus) {
  switch (status) {
    case "ALLOWED":
      return "ALLOWED";
    case "NOT_ALLOWED":
      return "NOT ALLOWED";
    case "UNSURE":
      return "UNSURE – PLEASE RETRY";
  }
}

export function friendlyLabel(label: string | null) {
  if (!label) return "Unknown";
  return (
    FRIENDLY_LABELS[label.toLowerCase()] ??
    label.replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
