import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSelect: (conversationId: string, messageId: string) => void;
}

export const MessageSearch = ({ open, onOpenChange, onMessageSelect }: MessageSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Search messages in user's conversations
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          conversations!inner(
            id,
            title,
            participants!inner(user_id)
          )
        `)
        .ilike('text', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter to only messages in user's conversations
      const filtered = data?.filter((msg: any) =>
        msg.conversations.participants.some((p: any) => p.user_id === user.id)
      ) || [];

      setResults(filtered);
    } catch (error: any) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for messages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => {
                  setSearchQuery('');
                  setResults([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="h-96">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            )}

            {!loading && searchQuery && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No messages found
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      onMessageSelect(message.conversation_id, message.id);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium">
                        {message.conversations.title || 'Untitled Conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {highlightMatch(message.text || '', searchQuery)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {results.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Found {results.length} message{results.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
