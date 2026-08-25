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
      subject, 
      message, 
      recipient, 
      clientName, 
      email, 
      phone, 
      from_state, 
      to_state 
    } = await req.json();

    if (type === "admin_reply") {
      // 1. Admin Reply to Customer (Clean White & Black)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #ffffff; color: #000000; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #cccccc; padding: 30px; }
              h2 { color: #000000; font-size: 18px; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
              .content { color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
              .footer { color: #555555; font-size: 12px; margin-top: 24px; border-top: 1px solid #cccccc; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>JB Logistics Customer Care</h2>
              <div class="content">
                ${message}
              </div>
              <div class="footer">
                This is an official response from JB Logistics. You can reply directly to this email if you have any further questions.
              </div>
            </div>
          </body>
        </html>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "JB Logistics <customer_care@jblogisticsservices.com>",
          to: [recipient],
          subject: subject || "Update on your JB Logistics Inquiry",
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send email via Resend");

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      // 2. New Contact Submission -> Sends Admin Notification AND Client Confirmation
      
      // A. Admin Notification Email
      const adminHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #ffffff; color: #000000; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #cccccc; padding: 30px; }
              h2 { color: #000000; font-size: 18px; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
              .field { margin-bottom: 10px; font-size: 14px; line-height: 1.5; color: #333333; }
              .label { font-weight: bold; color: #000000; width: 80px; display: inline-block; }
              .message-box { background-color: #f9f9f9; border: 1px solid #dddddd; padding: 12px; margin-top: 15px; font-size: 14px; line-height: 1.5; color: #333333; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>New Contact Submission</h2>
              <div class="field"><span class="label">Name:</span> ${clientName || 'Unknown Client'}</div>
              <div class="field"><span class="label">Email:</span> ${email || 'N/A'}</div>
              <div class="field"><span class="label">Phone:</span> ${phone || 'N/A'}</div>
              <div class="field"><span class="label">Route:</span> ${from_state || 'N/A'} → ${to_state || 'N/A'}</div>
              <div class="message-box">
                <strong>Message:</strong><br/>
                ${message || 'N/A'}
              </div>
            </div>
          </body>
        </html>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "JB Logistics <customer_care@jblogisticsservices.com>",
          to: [""],
          subject: `New Contact Submission from ${clientName || 'Client'}`,
          html: adminHtml,
        }),
      });

      // B. Client Confirmation Receipt (Clean White & Black Design)
      const clientHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #ffffff; color: #000000; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #cccccc; padding: 30px; }
              h2 { color: #000000; font-size: 18px; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
              p { font-size: 14px; line-height: 1.6; color: #333333; }
              .footer { margin-top: 24px; font-size: 12px; color: #555555; border-top: 1px solid #cccccc; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Request Received</h2>
              <p>Hello ${clientName || 'Valued Client'},</p>
              <p>Thank you for reaching out to <strong>JB Logistics</strong>. We have successfully received your quote request for shipping from <strong>${from_state || 'N/A'}</strong> to <strong>${to_state || 'N/A'}</strong>, and a member of our team will get in touch with you shortly.</p>
              <div class="footer">
                This is an automated message. Please do not reply directly to this email.
              </div>
            </div>
          </body>
        </html>
      `;

      if (email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "JB Logistics <customer_care@jblogisticsservices.com>",
            to: [email],
            subject: "We've received your request - JB Logistics",
            html: clientHtml,
          }),
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Notifications dispatched cleanly" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});