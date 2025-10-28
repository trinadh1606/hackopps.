import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { usePresence } from '@/hooks/usePresence';
import { useAIResponse } from '@/hooks/useAIResponse';
import { Profile, Message } from '@/types/chat';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageComposer } from '@/components/MessageComposer';
import { ModeChip } from '@/components/ModeChip';
import { QuickReplies } from '@/components/QuickReplies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NetworkStatus } from '@/components/NetworkStatus';
import { MessageSearch } from '@/components/MessageSearch';
import { exporter } from '@/lib/export';
import { messageTranslator } from '@/lib/messageTranslation';

export const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "Hello", "Help", "Thank you", "Tell me more"
  ]);
  const [searchOpen, setSearchOpen] = useState(false);
  const readMessagesRef = useRef<Set<string>>(new Set());

  const { messages, sendMessage } = useRealtimeChat(conversationId || '');
  const { onlineUsers, typingUsers, setTyping } = usePresence(conversationId || '');
  const { generateResponse, isGenerating } = useAIResponse();

  const isOtherUserOnline = otherUser && onlineUsers.includes(otherUser.id);
  const isOtherUserTyping = otherUser && typingUsers.includes(otherUser.id);

  useEffect(() => {
    loadProfiles();
  }, [conversationId]);

  // Announce chat loaded for screen readers
  useEffect(() => {
    if (currentUser && !isLoading) {
      const abilityProfileData = currentUser.ability_profile as { profile?: string };
      const profile = abilityProfileData?.profile;
      
      // Announce for BLIND and DEAF_BLIND users
      if (profile?.includes('BLIND') && 'speechSynthesis' in window) {
        const announcement = isDemo 
          ? 'Chat with AI assistant loaded and ready.'
          : `Chat with ${otherUser?.display_name || 'user'} loaded and ready.`;
        
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(announcement);
          utterance.volume = 0.8;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }, 800);
      }
    }
  }, [currentUser, otherUser, isDemo, isLoading]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-translate and process incoming messages
  useEffect(() => {
    if (!currentUser || !messages.length) return;

    const processNewMessages = async () => {
      const newMessages = messages.filter(
        (msg) => msg.sender_id !== currentUser.id && !readMessagesRef.current.has(msg.id)
      );

      for (const msg of newMessages) {
        readMessagesRef.current.add(msg.id);
        
        await messageTranslator.processIncomingMessage({
          senderProfile: msg.sender_id === 'ai-assistant' ? null : otherUser,
          receiverProfile: currentUser,
          message: msg,
          receiverPrefs: (currentUser as any).device_prefs || {},
        });
      }
    };

    processNewMessages();
  }, [messages, currentUser, otherUser]);

  const loadProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if this is a demo conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('is_demo')
        .eq('id', conversationId!)
        .single();

      const isDemoConvo = conversation?.is_demo || false;
      setIsDemo(isDemoConvo);

      // Get current user profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (currentProfile) {
        setCurrentUser(currentProfile);
      }

      // For demo mode, no other profile needed
      if (!isDemoConvo) {
        // Get other participant
        const { data: participants } = await supabase
          .from('participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id);

        if (participants && participants.length > 0) {
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', participants[0].user_id)
            .single();

          if (otherProfile) {
            setOtherUser(otherProfile);
          }
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    try {
      await sendMessage(text, 'text');
      
      // In demo mode, generate AI response
      if (isDemo && currentUser) {
        try {
          const abilityProfileData = currentUser.ability_profile as { profile?: string } | null;
          const profile = abilityProfileData?.profile || 'DEAF';
          
          const response = await generateResponse(
            conversationId!,
            text,
            profile as any,
            messages.filter(m => m.modality !== 'ai') // Don't send AI messages back
          );
          
          // Update quick replies with AI suggestions
          if (response.suggestedReplies && response.suggestedReplies.length > 0) {
            setQuickReplies(response.suggestedReplies);
          }
        } catch (aiError) {
          console.error('Failed to generate AI response:', aiError);
          toast({ 
            title: 'AI Response Failed', 
            description: 'The AI assistant is temporarily unavailable',
            variant: 'destructive'
          });
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  const handleQuickReply = async (reply: string) => {
    await handleSendMessage(reply);
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/home')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {isDemo ? 'Demo Chat with AI' : (otherUser?.display_name || 'Chat')}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {!isDemo && isOtherUserOnline && (
              <Badge variant="secondary" className="text-xs">🟢 Online</Badge>
            )}
            {isDemo && (
              <Badge variant="secondary" className="text-xs">🤖 AI Assistant</Badge>
            )}
          </div>
        </div>

        <NetworkStatus />
        <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => exporter.exportConversation(conversationId!, 'txt')}>
          <Download className="h-5 w-5" />
        </Button>
        <ModeChip profile={(currentUser.ability_profile as any).profile} />
      </header>

      <MessageSearch open={searchOpen} onOpenChange={setSearchOpen} onMessageSelect={(convId) => {}} />

      {/* Demo info banner */}
      {isDemo && messages.length === 0 && (
        <div className="bg-accent/50 border-b p-4 text-center">
          <p className="text-sm text-muted-foreground">
            💬 This is a practice conversation with an AI assistant. Try out features and ask questions!
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isDemo && (
          <div className="text-center text-muted-foreground mt-8">
            <p className="text-lg">Start the conversation</p>
            <p className="text-sm mt-2">Send your first message below</p>
          </div>
        )}
        {messages.length > 0 && (
          <>
            {messages.map((message) => {
              const isAI = message.modality === 'ai' || message.sender_id === 'ai-assistant';
              const isSent = message.sender_id === currentUser.id && !isAI;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSent={isSent}
                  isAI={isAI}
                  senderProfile={isSent ? currentUser : (isAI ? null : otherUser)}
                  currentUserProfile={currentUser}
                />
              );
            })}
            {!isDemo && isOtherUserTyping && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
                <span className="text-sm">{otherUser?.display_name} is typing...</span>
              </div>
            )}
            {isDemo && isGenerating && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies for demo mode */}
      {isDemo && (
        <QuickReplies
          suggestions={quickReplies}
          onSelect={handleQuickReply}
          disabled={isGenerating}
        />
      )}

      {/* Composer */}
      <MessageComposer
        onSend={handleSendMessage}
        abilityProfile={(currentUser.ability_profile as any).profile}
        onTyping={setTyping}
      />
    </div>
  );
};
