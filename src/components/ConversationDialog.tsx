import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DemoIntroDialog } from './DemoIntroDialog';
import { GroupCreationDialog } from './GroupCreationDialog';
import { Bot, Users, User } from 'lucide-react';
import { toast } from 'sonner';

interface ConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConversationDialog = ({ open, onOpenChange }: ConversationDialogProps) => {
  const navigate = useNavigate();
  const [showDemoIntro, setShowDemoIntro] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [abilityProfile, setAbilityProfile] = useState('DEAF');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('ability_profile')
      .eq('id', user.id)
      .single();

    if (data) {
      const profile = (data.ability_profile as any)?.profile || 'DEAF';
      setAbilityProfile(profile);
    }
  };

  const handleDemoClick = () => {
    onOpenChange(false);
    setShowDemoIntro(true);
  };

  const handleRealChatClick = () => {
    onOpenChange(false);
    navigate('/users');
  };

  const startDemoConversation = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in first');
        setIsLoading(false);
        return;
      }

      const welcomeMessages: Record<string, string> = {
        DEAF: "Hi! I'm your AI assistant. I can help you practice communication and answer questions. What would you like to talk about?",
        BLIND: "Hello! I'm here to help. Ask me anything or try out the communication features. What's on your mind?",
        MUTE: "Welcome! I'm your AI assistant. Feel free to use voice input or text. How can I help you today?",
        DEAF_BLIND: "Welcome! I can help you communicate. What would you like to explore?",
        DEAF_MUTE: "Hi! I'm your AI assistant. What would you like to discuss?",
        BLIND_MUTE: "Hello! I'm here to assist you. What would you like to know?",
        DEAF_BLIND_MUTE: "Welcome! How can I help you today?"
      };

      // Create demo conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          title: 'Demo Chat',
          created_by: user.id,
          is_demo: true,
        })
        .select()
        .single();

      if (convError) {
        console.error('Conversation creation error:', convError);
        toast.error(`Failed to create conversation: ${convError.message}`);
        setIsLoading(false);
        return;
      }

      // Add user as participant
      const { error: participantsError } = await supabase
        .from('participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id, role: 'member' },
        ]);

      if (participantsError) {
        console.error('Participants error:', participantsError);
        await supabase.from('conversations').delete().eq('id', conversation.id);
        toast.error(`Failed to add participant: ${participantsError.message}`);
        setIsLoading(false);
        return;
      }

      // Add welcome message - use user's ID but mark as AI in modality
      const welcomeText = welcomeMessages[abilityProfile] || welcomeMessages.DEAF;
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          text: welcomeText,
          modality: 'ai',
          state: 'read',
          priority: 'normal',
        });

      if (messageError) {
        console.error('Message error:', messageError);
        // Don't fail - conversation is created
      }

      toast.success('Demo chat started!');
      navigate(`/chat/${conversation.id}`);
      setShowDemoIntro(false);
    } catch (error: any) {
      console.error('Unexpected error creating demo:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">New Conversation</DialogTitle>
            <DialogDescription>
              Choose how you'd like to start chatting
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <Card
              className="p-6 cursor-pointer hover:border-primary transition-all"
              onClick={handleDemoClick}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Demo with AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice communication and test features with our AI assistant
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:border-primary transition-all"
              onClick={handleRealChatClick}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Chat with Another User</h3>
                  <p className="text-sm text-muted-foreground">
                    Find and connect with other users on the platform
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <DemoIntroDialog
        open={showDemoIntro}
        onOpenChange={setShowDemoIntro}
        onStartDemo={startDemoConversation}
        abilityProfile={abilityProfile}
      />
    </>
  );
};
