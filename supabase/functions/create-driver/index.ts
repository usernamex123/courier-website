import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { 
      email, 
      password, 
      name, 
      phone, 
      license_number, 
      license_type, 
      vehicle_assigned, 
      vehicle_model, 
      status, 
      current_trip 
    } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'driver' }
    })

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const userId = authData.user.id

    // 3. Insert into the drivers table
    const { error: dbError } = await supabaseAdmin
      .from('driver_profiles')
      .insert([{
        id: userId,
        email,
        name,
        phone,
        license_number,
        license_type: license_type || 'CDL Class A',
        vehicle_assigned: vehicle_assigned || '',
        vehicle_model: vehicle_model || '',
        status: status || 'Active',
        current_trip: current_trip || 'Available'
      }])

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: dbError.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ success: true, data: authData }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})