import Stripe from "https://esm.sh/stripe@13.11.0?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature or secret missing', { status: 400 })
  }

  try {
    const body = await req.text()
    const cryptoProvider = Stripe.createSubtleCryptoProvider()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const invoiceId = session.metadata?.invoice_id

      if (invoiceId) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') as string,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
        )

        let paymentMethodName = 'Credit Card'
        let paymentIntentId = ''

        if (session.payment_intent) {
          paymentIntentId = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id

          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['payment_method']
          })

          const pm = paymentIntent.payment_method as Stripe.PaymentMethod
          if (pm && pm.card) {
            const wallet = pm.card.wallet?.type
            const brand = pm.card.brand

            if (wallet === 'apple_pay') {
              paymentMethodName = 'Apple Pay'
            } else if (wallet === 'google_pay') {
              paymentMethodName = 'Google Pay'
            } else if (brand) {
              paymentMethodName = `${brand.charAt(0).toUpperCase() + brand.slice(1)} Card`
            }
          } else if (pm && pm.type) {
            paymentMethodName = pm.type.replace('_', ' ').toUpperCase()
          }
        }

        // Update the invoice directly. 
        // Changing status to 'paid' will automatically trigger your sync_shipment_payment_status function.
        const { error: updateError } = await supabaseAdmin
          .from('invoices')
          .update({ 
            status: 'paid',
            payment_method: paymentMethodName,
            transaction_ref: paymentIntentId,
            paid_at: new Date().toISOString()
          })
          .eq('id', invoiceId)

        if (updateError) {
          console.error('Failed to update invoice payment details:', updateError)
          return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
        }

        console.log(`Successfully marked invoice ${invoiceId} as paid.`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})