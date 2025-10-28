import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModeChip } from '@/components/ModeChip';
import { ArrowLeft, Search, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export const UserDirectory = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const filters = ['All', 'DEAF', 'BLIND', 'MUTE', 'DEAF_BLIND', 'DEAF_MUTE', 'BLIND_MUTE', 'DEAF_BLIND_MUTE'];

  useEffect(() => {
    loadUsers();
    subscribeToPresence();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedFilter]);

  const loadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPresence = async () => {
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = Object.keys(state);
        setOnlineUsers(online);
      })
      .subscribe();
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply profile filter
    if (selectedFilter !== 'All') {
      filtered = filtered.filter(user => {
        const profile = (user.ability_profile as any)?.profile;
        return profile === selectedFilter;
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const startConversation = async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if conversation already exists
      const { data: existingConvos } = await supabase
        .from('participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (existingConvos) {
        for (const convo of existingConvos) {
          const { data: otherParticipant } = await supabase
            .from('participants')
            .select('user_id')
            .eq('conversation_id', convo.conversation_id)
            .eq('user_id', otherUserId)
            .single();

          if (otherParticipant) {
            navigate(`/chat/${convo.conversation_id}`);
            return;
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: convoError } = await supabase
        .from('conversations')
        .insert({
          title: null,
          created_by: user.id,
          is_demo: false,
        })
        .select()
        .single();

      if (convoError) throw convoError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id, role: 'member' },
          { conversation_id: conversation.id, user_id: otherUserId, role: 'member' }
        ]);

      if (participantsError) throw participantsError;

      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="touch-target"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Find Users</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-14 text-lg"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map(filter => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedFilter(filter)}
              className="whitespace-nowrap touch-target"
            >
              {filter.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>

        {/* Users list */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">No users found</p>
              <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
            </Card>
          ) : (
            filteredUsers.map(user => {
              const isOnline = onlineUsers.includes(user.id);
              const profile = (user.ability_profile as any)?.profile || 'DEAF';
              
              return (
                <Card key={user.id} className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl">
                          {user.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold">{user.display_name}</h3>
                        {isOnline && (
                          <Badge variant="secondary" className="text-xs">Online</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <ModeChip profile={profile} />
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => startConversation(user.id)}
                      size="lg"
                      className="touch-target"
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Start Chat
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};
