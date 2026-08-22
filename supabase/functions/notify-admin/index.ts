import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      messageId, 
      subject, 
      message, 
      recipient, 
      clientName, 
      email, 
      phone, 
      from_state, 
      to_state, 
      service 
    } = await req.json();

    let emailPayload = {};

    if (type === "admin_reply") {
      // Styled HTML template for admin replies matching your professional layout
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb;">
          <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #111827; font-size: 18px; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #facc15; padding-bottom: 10px;">
              JB Logistics Customer Care Response
            </h2>
            <div style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
              ${message}
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an official response from JB Logistics. You can reply directly to this email if you have any further questions.
            </p>
          </div>
        </div>
      `;

      emailPayload = {
        from: "JB Logistics <customer_care@jblogisticsservices.com>",
        to: [recipient],
        subject: subject || "Update on your JB Logistics Inquiry",
        html: htmlContent,
      };
    } else {
      // Default contact submission notification payload
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb;">
          <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
            <h2 style="color: #d97706; font-size: 18px; margin-top: 0;">New Contact Submission</h2>
            <p><strong>Name:</strong> ${clientName || 'Unknown Client'}</p>
            <p><strong>Email:</strong> ${email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Route:</strong> ${from_state || 'N/A'} → ${to_state || 'N/A'}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f3f4f6; padding: 12px; border-radius: 8px;">${message || 'N/A'}</div>
          </div>
        </div>
      `;

      emailPayload = {
        from: "JB Logistics <customer_care@jblogisticsservices.com>",
        to: ["limbuspars@gmail.com"],
        subject: `New Contact Submission from ${clientName || 'Client'}`,
        html: htmlContent,
      };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email via Resend");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});