import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("Received checkout request:", body)

    const invoiceId = body.invoice_id || body.invoiceId
    const amount = body.amount || body.total
    const invoiceNumber = body.invoice_number || body.invoiceNumber
    const customerEmail = body.customer_email

    // Automatically grab origin from request headers or fallback to localhost
    const origin = req.headers.get('origin') || body.origin || 'http://localhost:5173'

    if (!invoiceId || !amount) {
      throw new Error(`Missing required fields. invoice_id: ${invoiceId}, amount: ${amount}`)
    }

    // Create Stripe Checkout Session with USD forced and Adaptive Pricing disabled
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Force USD strictly for all payments
            product_data: {
              name: `Shipment Invoice #${invoiceNumber || String(invoiceId).slice(0, 8)}`,
            },
            unit_amount: Math.round(Number(amount) * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard/invoices`,
      cancel_url: `${origin}/dashboard/invoices`,
      adaptive_pricing: {
        enabled: false, // Disables Stripe automatic currency conversion (removes NPR/local options)
      },
      metadata: {
        invoice_id: String(invoiceId),
      },
      ...(customerEmail ? { customer_email: customerEmail } : {}),
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Stripe Checkout Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})