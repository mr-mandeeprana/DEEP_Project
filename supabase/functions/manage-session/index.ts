// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface SessionAction {
  action: 'start' | 'complete' | 'cancel' | 'update'
  sessionId: string
  feedback?: string
  rating?: number
  notes?: string
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { action, sessionId, feedback, rating, notes }: SessionAction = await req.json()

    if (!action || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .or(`mentor_id.eq.${user.id},learner_id.eq.${user.id}`)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const updateData: any = {}
    let message = ''

    switch (action) {
      case 'start':
        if (session.status !== 'scheduled') {
          return new Response(
            JSON.stringify({ error: 'Can only start scheduled sessions' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        updateData.status = 'in_progress'
        message = 'Session started successfully'
        break

      case 'complete':
        if (session.status !== 'in_progress') {
          return new Response(
            JSON.stringify({ error: 'Can only complete in-progress sessions' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        updateData.status = 'completed'
        message = 'Session completed successfully'
        break

      case 'cancel':
        if (!['scheduled', 'in_progress'].includes(session.status)) {
          return new Response(
            JSON.stringify({ error: 'Cannot cancel completed sessions' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        updateData.status = 'cancelled'
        message = 'Session cancelled successfully'
        break

      case 'update':
        if (session.status !== 'completed') {
          return new Response(
            JSON.stringify({ error: 'Can only update completed sessions' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Only learners can leave feedback and rating
        if (session.learner_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Only learners can leave feedback' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        if (feedback !== undefined) updateData.feedback = feedback
        if (rating !== undefined) updateData.rating = rating
        if (notes !== undefined) updateData.notes = notes
        message = 'Session updated successfully'
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    // Update the session
    const { data: updatedSession, error: updateError } = await supabaseClient
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating session:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update session' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        session: updatedSession,
        message
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in manage-session:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
