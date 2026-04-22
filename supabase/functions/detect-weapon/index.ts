// AI weapon detection via Lovable AI Gateway (Gemini vision + tool-call structured output)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WEAPON_KEYWORDS = [
  "knife", "blade", "axe", "hatchet", "sword", "gun", "handgun", "pistol",
  "rifle", "firearm", "machete", "dagger", "katana", "revolver", "shotgun",
  "switchblade", "bayonet", "cleaver",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const systemPrompt = `You are a strict weapon-detection vision system for a security checkpoint.
Analyze the image and identify visible objects. Determine if any DEADLY WEAPON is present.
Deadly weapons include: knife, blade, axe, hatchet, sword, gun, handgun, pistol, rifle, firearm, machete, dagger, katana, revolver, shotgun, switchblade, bayonet, cleaver.
Do NOT flag harmless items (phones, pens, keys, tools like screwdrivers, kitchen utensils that aren't knives, toys clearly identifiable as toys).
If the image is too blurry, dark, empty, or you cannot identify objects with reasonable confidence, return image_quality="unclear".
For each detected object provide a normalized bounding box [x, y, w, h] where 0..1 of image dimensions.
Confidence is 0..1. Only include objects you actually see.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image for deadly weapons." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "report_detection",
          description: "Report detected objects and weapon assessment.",
          parameters: {
            type: "object",
            properties: {
              image_quality: { type: "string", enum: ["clear", "unclear"] },
              objects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    is_weapon: { type: "boolean" },
                    confidence: { type: "number" },
                    bbox: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 },
                  },
                  required: ["name", "is_weapon", "confidence", "bbox"],
                  additionalProperties: false,
                },
              },
            },
            required: ["image_quality", "objects"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "report_detection" } },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please retry shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({
        status: "UNSURE", objects: [], image_quality: "unclear", max_confidence: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let parsed: { image_quality: string; objects: Array<{ name: string; is_weapon: boolean; confidence: number; bbox: number[] }> };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      parsed = { image_quality: "unclear", objects: [] };
    }

    // Decision logic
    const objects = parsed.objects || [];
    // Reinforce keyword matching (model may not always set is_weapon correctly)
    const enriched = objects.map((o) => ({
      ...o,
      is_weapon: o.is_weapon || WEAPON_KEYWORDS.some((k) => o.name.toLowerCase().includes(k)),
    }));

    const weapons = enriched.filter((o) => o.is_weapon && o.confidence >= 0.5);
    const maxConf = enriched.reduce((m, o) => Math.max(m, o.confidence || 0), 0);

    let status: "ALLOWED" | "NOT_ALLOWED" | "UNSURE";
    if (parsed.image_quality === "unclear" || (enriched.length === 0 && maxConf < 0.3)) {
      status = "UNSURE";
    } else if (weapons.length > 0) {
      status = "NOT_ALLOWED";
    } else {
      status = "ALLOWED";
    }

    return new Response(JSON.stringify({
      status,
      objects: enriched,
      image_quality: parsed.image_quality,
      max_confidence: maxConf,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("detect-weapon error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
