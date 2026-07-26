import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record // Contains the new message row from your form

    // Extract details matching your Get Started form payload
    const clientName = record.name || "Unknown Client"
    const email = record.email || "N/A"
    const phone = record.phone || "N/A"
    const message = record.message || "No message provided"
    const source = record.source || "Website Form"

    // Pull environment variable for Resend API key only
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    
    // HARDCODED TARGET EMAIL (Replace with the new destination email)
    const targetEmail = "romihate@gmail.com"

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY secret.")
    }

    // Send email via Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Website Form <onboarding@resend.dev>",
        to: [targetEmail],
        subject: `📬 New Contact Submission from ${clientName}`,
        html: `
          <h2>New Form Submission</h2>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Name:</strong> ${clientName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email via Resend")
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Email Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
})