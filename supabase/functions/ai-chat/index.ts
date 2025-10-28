import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userProfile, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt based on user's ability profile
    const systemPrompts: Record<string, string> = {
      DEAF: "You are a helpful communication assistant for deaf users. Use clear, simple language. Avoid audio-only references. Be visual and descriptive.",
      BLIND: "You are a helpful communication assistant for blind users. Be descriptive of visual elements. Use clear audio-friendly language. Avoid visual-only references.",
      MUTE: "You are a helpful communication assistant for mute users. Help them express themselves. Suggest ways to communicate their needs clearly.",
      DEAF_BLIND: "You are a helpful communication assistant for deaf-blind users. Be ultra-concise. Use simple, direct language. Focus on tactile and sequential information.",
      DEAF_MUTE: "You are a helpful communication assistant for deaf and mute users. Use visual communication strategies. Be encouraging about alternative expression methods.",
      BLIND_MUTE: "You are a helpful communication assistant for blind and mute users. Focus on audio output and touch input. Be patient and supportive.",
      DEAF_BLIND_MUTE: "You are a helpful communication assistant for deaf-blind-mute users. Be extremely concise and clear. Use simple, direct language. Focus on essential information only."
    };

    const systemPrompt = systemPrompts[userProfile] || 
      "You are a helpful communication assistant. Be supportive, clear, and adaptive to the user's needs.";

    // Build messages array with conversation history (last 20 for better memory)
    const recentHistory = conversationHistory.slice(-20);
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map((msg: any) => ({
        role: msg.sender_id === 'ai-assistant' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    // Emergency detection
    const emergencyKeywords = ['emergency', 'help', 'urgent', 'sos', 'danger', 'hurt', 'injured'];
    const isEmergency = emergencyKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (isEmergency) {
      return new Response(
        JSON.stringify({ 
          text: "I detected an emergency situation. I can help you:\n\n1. Call emergency services (911)\n2. Contact your emergency contact\n3. Share your location\n4. Just talk to me if it's not critical\n\nWhat would you like to do?",
          suggestedReplies: ["Call 911", "Contact emergency contact", "Share location", "Just talk"],
          priority: 'emergency'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Lovable AI with profile:', userProfile);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service requires payment. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Generate contextual quick replies based on the conversation
    const suggestedReplies = generateQuickReplies(message, aiResponse, userProfile);

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ 
        text: aiResponse,
        suggestedReplies 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        text: "I'm having trouble responding right now. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateQuickReplies(userMessage: string, aiResponse: string, profile: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Check if AI is asking a yes/no question
  const yesNoIndicators = ['would you', 'do you', 'can you', 'should i', 'is it', 'are you'];
  if (yesNoIndicators.some(indicator => lowerResponse.includes(indicator)) && lowerResponse.includes('?')) {
    return ["Yes, please", "No, thanks", "Maybe", "I'm not sure"];
  }
  
  // Check if AI is asking for choice/preference
  if ((lowerResponse.includes('which') || lowerResponse.includes('what')) && lowerResponse.includes('?')) {
    return ["Option 1", "Option 2", "Tell me more", "Something else"];
  }
  
  // Check if AI is explaining something (multiple sentences)
  if (aiResponse.split(/[.!?]/).filter(s => s.trim().length > 0).length > 3) {
    return ["Thanks, that helps", "Can you explain more?", "What else?", "I understand"];
  }
  
  // Check if AI is asking "how" questions
  if (lowerResponse.includes('how') && lowerResponse.includes('?')) {
    return ["Show me", "Explain step by step", "I understand", "Skip this"];
  }
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return ["How are you?", "Tell me more", "What can you help with?", "Thanks"];
  }
  
  // Action-oriented responses
  if (lowerResponse.includes('would you like')) {
    return ["Yes, please", "No, thanks", "Tell me more", "Maybe later"];
  }
  
  // Default contextual replies
  return ["Continue", "Thanks", "Tell me more", "What else?"];
}