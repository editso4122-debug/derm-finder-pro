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
    const { email, issue }: CustomerEmailRequest = await req.json();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log(`Sending customer care email to: ${email}`);
    console.log(`Issue reported: ${issue}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MediBot Customer Care <onboarding@resend.dev>",
        to: [email],
        subject: "Apology for the Inconvenience Caused",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">MediBot Customer Care</h2>
            
            <p>Dear Customer,</p>
            
            <p>Thank you for reaching out to MediBot Customer Care. We sincerely apologize for the inconvenience you have experienced and appreciate you bringing this matter to our attention through our website.</p>
            
            <p>Please be assured that our team is currently reviewing your issue, and we will look into it thoroughly. We are committed to resolving this as soon as possible and will keep you informed of any updates through emails.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #374151;"><strong>Your reported issue:</strong></p>
              <p style="margin: 10px 0 0 0; color: #6b7280;">${issue}</p>
            </div>
            
            <p>Thank you for your patience and understanding. If you have any additional details to share, please feel free to reply to this email.</p>
            
            <p>Warm regards,</p>
            <p><strong>MediBot Customer Care Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #9ca3af;">This is an automated message from MediBot. Please do not reply directly to this email.</p>
          </div>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-customer-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
