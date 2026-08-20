import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests instantly
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY")

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY secret.")
    }

    const supabase = (supabaseUrl && supabaseServiceKey) 
      ? createClient(supabaseUrl, supabaseServiceKey) 
      : null

    // ==========================================
    // 1. HANDLE ADMIN REPLY TO CLIENT FROM DASHBOARD
    // ==========================================
    if (body.type === 'admin_reply') {
      const { subject, message, recipient, messageId } = body

      if (!recipient) {
        throw new Error("Recipient email is required")
      }

      const senderEmail = Deno.env.get("RESEND_FROM_EMAIL") || "JB Logistics Support <customer_care@jblogisticsservices.com>"

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [recipient],
          subject: subject,
          text: message,
          html: `
            <div style="font-family: Inter, Arial, sans-serif; font-size: 14px; color: #111827; line-height: 1.6; padding: 16px;">
              <p style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="font-size: 12px; color: #6b7280;">JB Logistics Support Team</p>
            </div>
          `,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Failed to send reply via Resend")
      }

      // Automatically update message status to 'replied' in Supabase
      if (messageId && supabase) {
        await supabase
          .from('messages')
          .update({ status: 'replied' })
          .eq('id', messageId)
      }

      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // ==========================================
    // 2. HANDLE NEW FORM SUBMISSION NOTIFICATION TO ADMIN
    // ==========================================
    const record = body.record || body
    const clientName = record.name || record.client_name || "Unknown Client"
    const email = record.email || "N/A"
    const phone = record.phone || "N/A"
    const messageText = record.message || record.content || "No message provided"
    const source = record.source || "Website Form"
    
    const targetEmail = "customer_care@jblogisticsservices.com"
    const adminSenderEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Website Form <customer_care@jblogisticsservices.com>"

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: adminSenderEmail,
        to: [targetEmail],
        subject: `📬 New Contact Submission from ${clientName}`,
        html: `
          <h2>New Form Submission</h2>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Name:</strong> ${clientName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong> ${messageText}</p>
        `,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Failed to send email via Resend")
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Email Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})