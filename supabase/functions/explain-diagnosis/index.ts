import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { disease, confidence, symptoms, question, language = "english" } = body;
    
    const langInstruction = language === "hindi" 
      ? "IMPORTANT: You MUST respond entirely in Hindi (हिंदी). Understand questions in Hindi, Marathi, or English but always respond in Hindi."
      : language === "marathi"
      ? "IMPORTANT: You MUST respond entirely in Marathi (मराठी). Understand questions in Hindi, Marathi, or English but always respond in Marathi."
      : "Respond in English. You can understand questions in Hindi, Marathi, or English.";

    if (!disease) {
      return new Response(JSON.stringify({ error: "Disease name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt based on whether it's initial explanation or Q&A
    let userPrompt: string;
    let systemPrompt: string;

    if (question) {
      // Q&A mode - answer user's follow-up question
      systemPrompt = `You are a helpful medical information assistant. The user has been diagnosed with "${disease}" by a skin disease ML model with ${confidence || "unknown"}% confidence.

${langInstruction}

Important rules:
- Only answer questions related to the diagnosed condition "${disease}"
- Provide educational information, not medical advice
- Always recommend consulting a dermatologist for proper diagnosis and treatment
- Be empathetic and clear in your explanations
- Do not diagnose or predict other conditions`;

      userPrompt = `The patient's symptoms: ${symptoms || "Not provided"}

Their question: ${question}`;
    } else {
      // Initial explanation mode
      systemPrompt = `You are a dermatology education assistant. An ML model (EfficientNet-B0) has predicted a skin condition. Your job is to:
1. Explain the condition in simple, patient-friendly language
2. Describe common symptoms and causes
3. Provide general care recommendations
4. Suggest when to see a dermatologist
5. Add relevant precautions

${langInstruction}

Important: This is educational information only. Always recommend professional medical consultation.`;

      userPrompt = `The ML model predicted: "${disease}" with ${confidence || "unknown"}% confidence.
Patient's symptoms: ${symptoms || "Not provided"}

Please provide:
1. A clear explanation of ${disease}
2. Common causes and risk factors
3. Self-care recommendations
4. When to seek medical attention
5. General precautions

Format as JSON:
{
  "explanation": "Brief description of the condition",
  "causes": ["cause1", "cause2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "whenToSeeDoctor": "When to consult a dermatologist",
  "precautions": ["precaution1", "precaution2"],
  "severity": "Low|Moderate|High",
  "suggestedDoctor": "Type of specialist to consult"
}`;
    }

    console.log("Calling Gemini for:", question ? "Q&A" : "explanation", "disease:", disease);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...(question ? {} : { response_format: { type: "json_object" } }),
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI explanation service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await aiResponse.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.error("Unexpected AI response:", JSON.stringify(payload));
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For Q&A, return plain text answer
    if (question) {
      return new Response(JSON.stringify({ answer: content }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For explanation, parse JSON
    try {
      const result = JSON.parse(content);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Failed to parse explanation JSON:", content);
      // Return as plain explanation if JSON parsing fails
      return new Response(JSON.stringify({ 
        explanation: content,
        recommendations: [],
        causes: [],
        precautions: [],
        severity: "Unknown",
        suggestedDoctor: "Dermatologist"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in explain-diagnosis function:", error);
    return new Response(JSON.stringify({ error: "Unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
