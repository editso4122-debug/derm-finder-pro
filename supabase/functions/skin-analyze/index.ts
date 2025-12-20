import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const baseCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function withCors(req: Request, extraHeaders: Record<string, string> = {}) {
  const origin = req.headers.get("origin") ?? "*";
  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": origin,
    ...extraHeaders,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const getSystemPrompt = (language: string) => {
  const langInstruction = language === "hindi" 
    ? "IMPORTANT: You MUST respond entirely in Hindi (हिंदी). All text including condition name, description, recommendations must be in Hindi."
    : language === "marathi"
    ? "IMPORTANT: You MUST respond entirely in Marathi (मराठी). All text including condition name, description, recommendations must be in Marathi."
    : "Respond in English.";

  return `You are a careful dermatology triage assistant.
${langInstruction}
You can understand symptoms written in Hindi, Marathi, or English.

Given ONE skin image and the user's symptom description, return ONLY valid JSON with this schema:
{
  "condition": string,
  "confidence": number, // 0-100
  "description": string,
  "severity": "Low"|"Moderate"|"High",
  "suggestedDoctor": string,
  "symptomAnalysis": string,
  "recommendations": string[],
  "predictions": {"disease": string, "confidence": number}[] // confidence 0-1
}
Rules:
- Be medically cautious; include 'seek urgent care' in recommendations if severe/red-flag.
- Do not mention being an AI.
- Do not include markdown or extra keys.`;
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCors(req) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: withCors(req, { "Content-Type": "application/json" }),
    });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI configuration error" }), {
        status: 500,
        headers: withCors(req, { "Content-Type": "application/json" }),
      });
    }

    const form = await req.formData();
    const file = form.get("file");
    const symptoms = String(form.get("symptoms") ?? "").trim();
    const language = String(form.get("language") ?? "english").toLowerCase();

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Image file is required" }), {
        status: 400,
        headers: withCors(req, { "Content-Type": "application/json" }),
      });
    }

    if (!symptoms) {
      return new Response(JSON.stringify({ error: "Symptoms are required" }), {
        status: 400,
        headers: withCors(req, { "Content-Type": "application/json" }),
      });
    }

    const mime = file.type || "image/jpeg";
    const buf = await file.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    const dataUrl = `data:${mime};base64,${b64}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Default model per Lovable AI guidance; upgrade to gemini-2.5-pro if needed.
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: getSystemPrompt(language) },
          {
            role: "user",
            content: [
              { type: "text", text: `Symptoms:\n${symptoms}` },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Analysis service error" }), {
        status: 502,
        headers: withCors(req, { "Content-Type": "application/json" }),
      });
    }

    const payload = await aiResponse.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.error("Unexpected AI response:", JSON.stringify(payload));
      return new Response(JSON.stringify({ error: "Invalid analysis response" }), {
        status: 502,
        headers: withCors(req, { "Content-Type": "application/json" }),
      });
    }

    let result: any;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI JSON:", content);
      return new Response(JSON.stringify({ error: "Invalid analysis JSON" }), {
        status: 502,
        headers: withCors(req, { "Content-Type": "application/json" }),
      });
    }

    // Light normalization (no fabricated data)
    if (typeof result.confidence === "string") {
      const n = Number(result.confidence);
      if (!Number.isNaN(n)) result.confidence = n;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: withCors(req, { "Content-Type": "application/json" }),
    });
  } catch (error) {
    console.error("Error in skin-analyze function:", error);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
      headers: withCors(req, { "Content-Type": "application/json" }),
    });
  }
});
