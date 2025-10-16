import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AdminSeedRequest {
  email: string
  password: string
  displayName: string
}

// Admin email that gets automatic superadmin privileges
const DESIGNATED_ADMIN_EMAIL = 'this.application.deep@gmail.com'

serve(async (req) => {
  try {
    // Enable CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const body: AdminSeedRequest = await req.json()
    const { email, password, displayName } = body

    // Validate input
    if (!email || !password || !displayName) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: email, password, displayName'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create user account
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return new Response(JSON.stringify({
        error: 'Failed to create user account',
        details: authError.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!authData.user) {
      return new Response(JSON.stringify({
        error: 'User creation failed - no user data returned'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert([{
        user_id: authData.user.id,
        display_name: displayName,
        credits: 1000, // Give admin accounts bonus credits
        role: email === DESIGNATED_ADMIN_EMAIL ? 'admin' : 'learner',
      }])

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return new Response(JSON.stringify({
        error: 'Failed to create user profile',
        details: profileError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create admin role if it's the designated admin email or requested
    if (email === DESIGNATED_ADMIN_EMAIL) {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert([{
          user_id: authData.user.id,
          role: 'superadmin'
        }])

      if (roleError) {
        console.error('Role creation error:', roleError)
        // Don't fail the request if role creation fails
      }
    }

    // Log admin account creation
    try {
      await supabaseClient
        .from('audit_logs')
        .insert([{
          user_id: 'system',
          action: 'ADMIN_ACCOUNT_CREATED',
          table_name: 'profiles',
          record_id: authData.user.id,
          new_data: {
            email,
            display_name: displayName,
            role: email === DESIGNATED_ADMIN_EMAIL ? 'superadmin' : 'user'
          }
        }])
    } catch (logError) {
      console.error('Audit log error:', logError)
      // Don't fail the request if logging fails
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Admin account created successfully for ${email}`,
      userId: authData.user.id,
      role: email === DESIGNATED_ADMIN_EMAIL ? 'superadmin' : 'user',
      note: 'Please check your email to confirm the account before logging in.'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})