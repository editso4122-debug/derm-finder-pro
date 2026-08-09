import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  email: string;
  medicineName: string;
  note: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let parsed: unknown;
    try {
      parsed = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const raw = (parsed ?? {}) as Record<string, unknown>;
    const email = typeof raw.email === "string" ? raw.email.trim() : "";
    const medicineName = typeof raw.medicineName === "string" ? raw.medicineName.trim() : "";
    const note = typeof raw.note === "string" ? raw.note.trim() : "";

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
    if (!emailValid || !medicineName || medicineName.length > 200 || note.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid email, medicine name or note" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const safeMedicineName = escapeHtml(medicineName);
    const safeNote = escapeHtml(note);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service is temporarily unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending reminder to: ${email} for medicine: ${medicineName}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MediBot <onboarding@resend.dev>",
        to: [email],
        subject: `💊 Medicine Reminder: ${medicineName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px;">
            <div style="background: white; border-radius: 8px; padding: 30px;">
              <h1 style="color: #10B981; margin: 0 0 20px 0; font-size: 24px;">
                💊 Time to Take Your Medicine!
              </h1>
              
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                <h2 style="margin: 0 0 10px 0; color: #166534; font-size: 20px;">
                  ${safeMedicineName}
                </h2>
                ${safeNote ? `<p style="margin: 0; color: #15803d; font-size: 16px;">${safeNote}</p>` : ''}
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                This is a friendly reminder from MediBot to help you stay on track with your medication.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                MediBot - Your Health Companion
              </p>
            </div>
          </div>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      return new Response(JSON.stringify({ error: "Failed to send reminder email" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Reminder email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-medicine-reminder function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send reminder email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
