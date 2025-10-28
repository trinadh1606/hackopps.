import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ModeChip } from '@/components/ModeChip';
import { ConversationDialog } from '@/components/ConversationDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Plus, MessageSquare, LogOut, Settings, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/types/abilities';

export const Home = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadProfile();
    loadConversations();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data as any);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants!inner(user_id),
          messages(id, text, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleNewChat = () => {
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">UNI-COM</h1>
            {profile && <ModeChip profile={profile.ability_profile.profile} />}
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="touch-target"
              aria-label="Settings"
            >
              <Settings className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="touch-target"
              aria-label="Sign out"
            >
              <LogOut className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Conversations</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/guest')}
                size="lg"
                variant="outline"
                className="touch-target"
              >
                <QrCode className="mr-2 h-5 w-5" />
                Invite Guest
              </Button>
              <Button
                onClick={handleNewChat}
                size="lg"
                className="touch-target"
              >
                <Plus className="mr-2 h-5 w-5" />
                New Chat
              </Button>
            </div>
          </div>

          {conversations.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-xl text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-muted-foreground">
                Start a new chat to begin communicating
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations.map(conv => (
                <Card
                  key={conv.id}
                  className="p-6 cursor-pointer hover:border-primary transition-all"
                  onClick={() => navigate(`/chat/${conv.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {conv.title || 'Untitled Conversation'}
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        {conv.messages?.[0]?.text || 'No messages yet'}
                      </p>
                    </div>
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <ConversationDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
};
