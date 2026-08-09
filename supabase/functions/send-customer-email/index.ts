import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CustomerEmailRequest {
  email: string;
  issue: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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
    const issue = typeof raw.issue === "string" ? raw.issue.trim() : "";

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
    if (!emailValid || !issue || issue.length > 2000) {
      return new Response(
        JSON.stringify({ error: "A valid email and an issue description (max 2000 chars) are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    const safeEmail = escapeHtml(email);
    const safeIssue = escapeHtml(issue);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service is temporarily unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Issue report received");

    // Send notification to MediBot team (owner email)
    const teamEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MediBot <onboarding@resend.dev>",
        to: ["mr.unknown2174@gmail.com"],
        subject: `New Issue Report from ${email}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">New Customer Issue Report</h2>
            <p><strong>Customer Email:</strong> ${safeEmail}</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #374151;"><strong>Issue Reported:</strong></p>
              <p style="margin: 10px 0 0 0; color: #6b7280;">${safeIssue}</p>
            </div>
            <p>Please follow up with the customer at their provided email address.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #9ca3af;">MediBot Customer Care Notification</p>
          </div>
        `,
      }),
    });

    const teamData = await teamEmailResponse.json();
    if (!teamEmailResponse.ok) {
      console.error("Resend API error (team):", teamData);
      return new Response(JSON.stringify({ error: "Failed to submit your report. Please try again." }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    console.log("Team notification sent");

    // Send confirmation email to the user
    const userEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MediBot <onboarding@resend.dev>",
        to: [email],
        subject: "We've received your issue report - MediBot",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px;">
            <div style="background: white; border-radius: 8px; padding: 30px;">
              <h1 style="color: #10B981; margin: 0 0 20px 0; font-size: 24px;">
                We've Received Your Report
              </h1>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for reaching out to us. We're sorry for the inconvenience you're experiencing.
              </p>
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Your reported issue:</strong></p>
                <p style="margin: 10px 0 0 0; color: #15803d; font-size: 14px;">${safeIssue}</p>
              </div>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Our team is looking into this and will resolve it as soon as possible. We sincerely apologize for any inconvenience caused.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                If you have any further questions, feel free to reach out again through our Customer Care chat.
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

    const userData = await userEmailResponse.json();
    if (!userEmailResponse.ok) {
      console.error("Resend API error (user):", userData);
      // Don't throw - team was already notified, just log the error
      console.warn("Failed to send confirmation to user, but team was notified");
    } else {
      console.log("User confirmation sent");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-customer-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to submit your report. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
