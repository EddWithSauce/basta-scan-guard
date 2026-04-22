// Deadly weapon detection via Lovable AI Gateway (Gemini Vision).
// Accepts a base64-encoded image and returns a strict JSON verdict.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReqBody {
  imageBase64?: string; // data URL OR raw base64
  mimeType?: string;
}

const SYSTEM_PROMPT = `You are a security screening vision model for an entry checkpoint.
Your ONLY job is to decide whether the image contains a DEADLY WEAPON.

Deadly weapons (NOT_ALLOWED) include any of:
- Firearms: gun, handgun, pistol, revolver, rifle, shotgun, submachine gun, assault rifle
- Bladed weapons: knife, dagger, blade, machete, sword, katana, axe, hatchet, cleaver, switchblade
- Other: bow with arrows, crossbow, brass knuckles, taser, stun gun, grenade

ALWAYS ALLOWED (this is a SCHOOL checkpoint — common school materials are permitted):
- Scissors (any kind, including craft, art, or office scissors)
- Pencils, pens, markers, highlighters, crayons
- Rulers, protractors, compasses (geometry set), staplers, paper clips, push pins
- Calculators, notebooks, books, folders, binders, backpacks, lunch boxes
- Art supplies, glue, tape, erasers, sharpeners
- Laptops, tablets, phones, chargers, headphones
- Sports gear (balls, rackets, jump ropes), musical instruments

Decision rules:
- If you clearly see a deadly weapon -> status="NOT_ALLOWED"
- If the only sharp/pointy items are school materials from the ALLOWED list above -> status="ALLOWED"
- If image is clearly safe (no weapon, just a person/object/empty scene) -> status="ALLOWED"
- If image is too blurry, too dark, ambiguous, or you are not confident -> status="UNSURE"

Toy guns, water guns, plastic obvious-toy weapons should be ALLOWED but mention them in objects.
Scissors and school supplies must NEVER be reported in the "weapons" array — put them in "objects".

For EVERY weapon you detect you MUST also return a bounding box.
The bbox MUST be an array of 4 numbers in NORMALIZED 0.0-1.0 coordinates,
in the order [x, y, width, height], where (x, y) is the TOP-LEFT corner of
the box relative to the full image, and width/height are the box size.
Do NOT use [ymin, xmin, ymax, xmax]. Do NOT use 0-1000 pixel coords.
If you truly cannot localize a weapon, omit the bbox entirely.

Respond with ONLY a single JSON object via the tool call. No prose.`;

async function callLovableAI(imageDataUrl: string, apiKey: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image. Use the report_detection tool." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_detection",
            description: "Report the weapon detection verdict for the image.",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                status: {
                  type: "string",
                  enum: ["ALLOWED", "NOT_ALLOWED", "UNSURE"],
                  description: "Final decision.",
                },
                reason: {
                  type: "string",
                  description: "Short human-readable explanation (max 120 chars).",
                },
                weapons: {
                  type: "array",
                  description: "Deadly weapons detected. Empty if none.",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      label: {
                        type: "string",
                        description:
                          "Weapon name in lowercase, e.g. gun, knife, machete, sword, axe.",
                      },
                      confidence: {
                        type: "number",
                        description: "0.0 - 1.0",
                      },
                      bbox: {
                        type: "array",
                        description:
                          "Optional bounding box in normalized 0-1 coords [x, y, width, height].",
                        items: { type: "number" },
                        minItems: 4,
                        maxItems: 4,
                      },
                    },
                    required: ["label", "confidence"],
                  },
                },
                objects: {
                  type: "array",
                  description: "Other notable non-weapon objects visible.",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      label: { type: "string" },
                      confidence: { type: "number" },
                    },
                    required: ["label", "confidence"],
                  },
                },
              },
              required: ["status", "weapons", "objects", "reason"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_detection" } },
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`AI gateway ${response.status}: ${txt.slice(0, 400)}`);
  }
  const json = await response.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) {
    throw new Error("AI returned no tool call");
  }
  return JSON.parse(call.function.arguments);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const body = (await req.json()) as ReqBody;
    if (!body?.imageBase64 || typeof body.imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageDataUrl = body.imageBase64.startsWith("data:")
      ? body.imageBase64
      : `data:${body.mimeType || "image/jpeg"};base64,${body.imageBase64}`;

    const verdict = await callLovableAI(imageDataUrl, apiKey);

    return new Response(JSON.stringify(verdict), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const isRate = message.includes("429");
    const isPay = message.includes("402");
    console.error("detect-weapon error:", message);
    return new Response(
      JSON.stringify({
        error: message,
        code: isRate ? "rate_limited" : isPay ? "payment_required" : "internal",
      }),
      {
        status: isRate ? 429 : isPay ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
