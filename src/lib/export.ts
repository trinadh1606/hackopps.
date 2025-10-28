import { supabase } from '@/integrations/supabase/client';

export class ConversationExporter {
  async exportConversation(conversationId: string, format: 'txt' | 'json' = 'txt'): Promise<void> {
    try {
      // Fetch conversation and messages
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id(display_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!messages) throw new Error('No messages found');

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'txt') {
        content = this.exportToText(conversation, messages);
        filename = `conversation-${conversationId}-${Date.now()}.txt`;
        mimeType = 'text/plain';
      } else {
        content = this.exportToJSON(conversation, messages);
        filename = `conversation-${conversationId}-${Date.now()}.json`;
        mimeType = 'application/json';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  private exportToText(conversation: any, messages: any[]): string {
    let text = `UNI-COM Conversation Export\n`;
    text += `================================\n\n`;
    text += `Conversation: ${conversation?.title || 'Untitled'}\n`;
    text += `Created: ${new Date(conversation?.created_at).toLocaleString()}\n`;
    text += `Total Messages: ${messages.length}\n\n`;
    text += `================================\n\n`;

    messages.forEach(msg => {
      const timestamp = new Date(msg.created_at).toLocaleString();
      const sender = (msg.profiles as any)?.display_name || 'Unknown';
      
      text += `[${timestamp}] ${sender}:\n`;
      text += `${msg.text || '[Media message]'}\n`;
      
      if (msg.media_url) {
        text += `[${msg.media_type}: ${msg.media_url}]\n`;
      }
      
      text += `\n`;
    });

    return text;
  }

  private exportToJSON(conversation: any, messages: any[]): string {
    const exportData = {
      conversation: {
        id: conversation?.id,
        title: conversation?.title,
        created_at: conversation?.created_at,
        is_demo: conversation?.is_demo,
        is_group: conversation?.is_group
      },
      messages: messages.map(msg => ({
        id: msg.id,
        sender: (msg.profiles as any)?.display_name,
        text: msg.text,
        created_at: msg.created_at,
        modality: msg.modality,
        priority: msg.priority,
        media_url: msg.media_url,
        media_type: msg.media_type,
        media_alt_text: msg.media_alt_text
      })),
      exported_at: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }
}

export const exporter = new ConversationExporter();
