import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, language = 'en' } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const languageInstructions: Record<string, string> = {
      en: 'Respond entirely in English.',
      hi: 'Respond entirely in Hindi (हिंदी में जवाब दें).',
      mr: 'Respond entirely in Marathi (मराठीत उत्तर द्या).',
    };

    const systemPrompt = `You are a pharmaceutical expert assistant. Analyze the medicine image provided and give detailed information about it.

${languageInstructions[language] || languageInstructions.en}

Provide your response in the following structured format:

**Medicine Name:** [Name of the medicine if visible]

**Purpose & Uses:**
- List what conditions/symptoms this medicine is used to treat
- Explain how it works briefly

**Active Ingredients:**
- List all active ingredients with their quantities if visible
- Explain what each ingredient does

**Inactive Ingredients:**
- List common inactive/excipient ingredients if visible

**Dosage Information:**
- Standard dosage recommendations if visible on packaging

**Contraindications (Who Should NOT Use):**
- List medical conditions where this medicine should be avoided
- List potential drug interactions
- Mention if it's unsafe for pregnant/breastfeeding women
- Mention age restrictions if any

**Side Effects:**
- Common side effects
- Serious side effects to watch for

**Important Warnings:**
- Any critical warnings or precautions

**Storage Instructions:**
- How to properly store the medicine

If you cannot identify the medicine clearly from the image, ask the user to provide a clearer image or the medicine name.

IMPORTANT: Always recommend consulting a healthcare professional before using any medication.`;

    console.log('Sending request to Gemini for medicine analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this medicine image and provide detailed information about it.',
              },
              {
                type: 'image_url',
                image_url: { url: image },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    console.log('Medicine analysis completed successfully');

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in scan-medicine function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze medicine';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
