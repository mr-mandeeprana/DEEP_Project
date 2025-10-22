// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface BookingRequest {
  mentorId: string
  date: string
  duration: number
  topic: string
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

    const { mentorId, date, duration, topic }: BookingRequest = await req.json()

    if (!mentorId || !date || !duration || !topic) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify mentor exists and get mentor details
    const { data: mentor, error: mentorError } = await supabaseClient
      .from('mentors')
      .select('id, name, hourly_rate, availability')
      .eq('id', mentorId)
      .single()

    if (mentorError || !mentor) {
      return new Response(
        JSON.stringify({ error: 'Mentor not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if the time slot is available
    const sessionDate = new Date(date)
    const dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const timeString = sessionDate.toISOString().slice(11, 16) // HH:MM format

    const dayAvailability = (mentor.availability as any)?.[dayName] || []
    if (!dayAvailability.includes(timeString)) {
      return new Response(
        JSON.stringify({ error: 'Time slot not available' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check for conflicting bookings
    const { data: existingBookings, error: bookingCheckError } = await supabaseClient
      .from('sessions')
      .select('id')
      .eq('mentor_id', mentorId)
      .eq('status', 'scheduled')
      .eq('date', date)

    if (bookingCheckError) {
      console.error('Error checking existing bookings:', bookingCheckError)
      return new Response(
        JSON.stringify({ error: 'Failed to check availability' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (existingBookings && existingBookings.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Time slot already booked' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calculate price
    const price = mentor.hourly_rate * (duration / 60)

    // Get user name
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const learnerName = profile?.full_name || user.email || 'Unknown User'

    // Create booking
    const { data: booking, error: createError } = await supabaseClient
      .from('bookings')
      .insert({
        mentor_id: mentorId,
        learner_id: user.id,
        mentor_name: mentor.name,
        learner_name: learnerName,
        date: sessionDate.toISOString(),
        duration,
        topic,
        price,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating booking:', createError)
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        booking: booking,
        message: 'Booking created successfully'
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-booking:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
