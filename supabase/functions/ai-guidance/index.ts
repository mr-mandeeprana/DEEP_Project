import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('AI guidance request:', query);

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a compassionate spiritual counselor with deep knowledge of ancient wisdom traditions (Hindu scriptures, Buddhism, Christianity, Islam, Judaism, etc.) and modern psychology. 

Guidelines for your responses:
- Draw from both spiritual teachings and psychological insights
- Provide practical, actionable guidance
- Be empathetic and non-judgmental
- Reference specific texts when appropriate (Bhagavad Gita, Quran, Bible, etc.)
- Include both spiritual practices and therapeutic techniques
- Keep responses focused and helpful (500-800 words max)
- Always remind users to seek professional help for serious mental health concerns
- Use a warm, caring tone while maintaining wisdom and authority

Remember: You're bridging ancient wisdom with modern understanding to help people find peace, purpose, and healing.`;

    console.log('Making Lovable AI request...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      
      // Handle rate limit errors specifically
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Our AI service is currently experiencing high demand. Please try again in a few moments.',
            guidance: 'We apologize for the inconvenience. Our spiritual counselor is taking a brief meditation break. Please try your question again shortly.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle payment required errors
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI service requires payment',
            guidance: 'The AI guidance service requires additional credits. Please contact the administrator.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'AI service unavailable',
          guidance: 'Our AI counselor is temporarily unavailable. Please try searching our sacred texts for wisdom, or try again later.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Lovable AI response received');
    
    const guidance = data.choices?.[0]?.message?.content;
    
    if (!guidance) {
      console.error('No guidance in response:', data);
      return new Response(
        JSON.stringify({ error: 'No guidance received from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ guidance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in ai-guidance function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        guidance: 'An unexpected error occurred. Please try again or search our knowledge base for guidance.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
