import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { condition, language = "english" } = await req.json();

    if (!condition) {
      return new Response(
        JSON.stringify({ error: "Condition is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageInstructions: Record<string, string> = {
      english: "Respond in English.",
      hindi: "Respond in Hindi (हिंदी).",
      marathi: "Respond in Marathi (मराठी).",
    };

    const systemPrompt = `You are a compassionate health storyteller who shares real, inspiring recovery stories from patients who have overcome skin conditions. Your stories should be:
- Hopeful and motivating without being unrealistic
- Include the patient's journey: initial struggle, treatment process, and successful recovery
- Mention how they felt emotionally and the support they received
- End with encouraging advice for others going through the same condition
- Keep each story between 150-200 words
- Use a warm, empathetic tone
- ${languageInstructions[language] || languageInstructions.english}

Important: Generate 2 unique recovery stories. Format them as a JSON array with objects containing "name" (fictional first name only), "age" (between 20-60), "story" (the recovery narrative), and "recoveryTime" (e.g., "3 months", "6 weeks").`;

    const userPrompt = `Generate 2 motivating recovery stories from patients who successfully recovered from ${condition}. These should be hopeful stories that inspire others currently dealing with this condition.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Failed to generate recovery stories");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let stories = [];
    try {
      // Extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        stories = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON array found, create a structured response from the text
        stories = [
          {
            name: "Patient",
            age: 35,
            story: content,
            recoveryTime: "Several weeks",
          },
        ];
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      stories = [
        {
          name: "Patient",
          age: 35,
          story: content,
          recoveryTime: "Several weeks",
        },
      ];
    }

    return new Response(
      JSON.stringify({ stories }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Recovery stories error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate stories" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
