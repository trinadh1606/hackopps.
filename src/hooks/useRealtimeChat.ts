import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { RealtimeChannel } from '@supabase/supabase-js';
import { offlineQueue } from '@/lib/offline';
import { useNetworkStatus } from './useNetworkStatus';

export const useRealtimeChat = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeChat = async () => {
      // Load existing messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);

      // Subscribe to new messages
      channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          }
        )
        .subscribe();
    };

    setupRealtimeChat();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId]);

  const sendMessage = async (text: string, modality: Message['modality'] = 'text', mediaUrl?: string, mediaType?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      text,
      modality,
      state: 'new',
      priority: 'normal',
      media_url: mediaUrl,
      media_type: mediaType,
    };

    if (!isOnline) {
      await offlineQueue.addToQueue(messageData);
      return;
    }

    const { error } = await supabase.from('messages').insert(messageData);

    if (error) {
      console.error('Error sending message:', error);
      await offlineQueue.addToQueue(messageData);
      throw error;
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ state: 'read' })
      .eq('id', messageId);
  };

  return { messages, isLoading, sendMessage, markAsRead };
};
