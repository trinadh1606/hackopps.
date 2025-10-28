import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  [key: string]: {
    user_id: string;
    online_at: string;
    typing?: boolean;
  }[];
}

export const usePresence = (conversationId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const presenceChannel = supabase.channel(`presence:${conversationId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState() as PresenceState;
          const online = Object.keys(state).filter(key => key !== user.id);
          setOnlineUsers(online);

          const typing = Object.entries(state)
            .filter(([key, value]) => key !== user.id && value[0]?.typing)
            .map(([key]) => key);
          setTypingUsers(typing);
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          if (key !== user.id) {
            setOnlineUsers(prev => [...new Set([...prev, key])]);
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          setOnlineUsers(prev => prev.filter(id => id !== key));
          setTypingUsers(prev => prev.filter(id => id !== key));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
              typing: false,
            });
          }
        });

      setChannel(presenceChannel);
    };

    setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId]);

  const setTyping = async (isTyping: boolean) => {
    if (channel) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          typing: isTyping,
        });
      }
    }
  };

  return { onlineUsers, typingUsers, setTyping };
};
