import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { AbilityProfile } from '@/types/abilities';
import { getHapticForMessage } from '@/lib/hapticSentiment';
import { playHapticPattern } from '@/lib/haptics';

export const useAIResponse = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateResponse = async (
    conversationId: string,
    userMessage: string,
    userProfile: AbilityProfile,
    conversationHistory: Message[]
  ) => {
    setIsGenerating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call AI chat edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          userProfile,
          conversationHistory: conversationHistory.slice(-10) // Last 10 messages for context
        }
      });

      if (error) throw error;

      // Insert AI response as a message from the user (for demo mode, all messages are from user)
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          text: data.text,
          modality: 'ai',
          state: 'read',
          priority: 'normal',
        });

      if (insertError) throw insertError;

      // Auto-deliver AI response based on user abilities
      if (userProfile === 'DEAF_BLIND' || userProfile === 'DEAF_BLIND_MUTE') {
        // For deaf-blind users: use haptic feedback and vibrations
        const hapticPattern = getHapticForMessage(data.text, 'normal');
        await playHapticPattern(hapticPattern, 1.0);
      } else if (userProfile.includes('BLIND')) {
        // For blind users: use voice
        const utterance = new SpeechSynthesisUtterance(data.text);
        utterance.rate = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }

      return {
        text: data.text,
        suggestedReplies: data.suggestedReplies || []
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateResponse, isGenerating };
};