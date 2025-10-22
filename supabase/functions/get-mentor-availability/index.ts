// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface AvailabilityRequest {
  mentorId: string
  date?: string
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

    const { mentorId, date }: AvailabilityRequest = await req.json()

    if (!mentorId) {
      return new Response(
        JSON.stringify({ error: 'Mentor ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get mentor availability
    const { data: mentor, error: mentorError } = await supabaseClient
      .from('mentors')
      .select('availability')
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

    let availableTimes: string[] = []

    if (date) {
      // Get booked times for the specific date
      const { data: bookings, error: bookingsError } = await supabaseClient
        .from('sessions')
        .select('date')
        .eq('mentor_id', mentorId)
        .eq('status', 'scheduled')
        .gte('date', `${date}T00:00:00.000Z`)
        .lt('date', `${date}T23:59:59.999Z`)

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch bookings' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get day of week
      const dayDate = new Date(date + 'T00:00:00.000Z')
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

      // Get available times for the day
      const dayAvailability = (mentor.availability as any)?.[dayName] || []

      // Filter out booked times
      const bookedTimes = bookings.map((booking: any) => {
        const bookingDate = new Date(booking.date)
        return bookingDate.toISOString().slice(11, 16) // HH:MM format
      })

      availableTimes = dayAvailability.filter((time: string) => !bookedTimes.includes(time))
    } else {
      // Return all availability slots
      availableTimes = Object.values(mentor.availability as any).flat() as string[]
    }

    return new Response(
      JSON.stringify({
        mentorId,
        date,
        availableTimes: [...new Set(availableTimes)].sort()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in get-mentor-availability:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
