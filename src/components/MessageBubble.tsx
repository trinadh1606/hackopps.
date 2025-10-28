import { Message, Profile } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Volume2 } from 'lucide-react';
import { HapticPlayer } from './HapticPlayer';
import { MessagePlayer } from './MessagePlayer';
import { useEffect } from 'react';
import { playMultimodalCue, MULTIMODAL_CUES } from '@/lib/multimodalFeedback';
import { canHearAudio, shouldUseTTS, shouldUseHaptics } from '@/lib/modalityRouter';
import { getHapticForMessage } from '@/lib/hapticSentiment';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  isAI?: boolean;
  senderProfile?: Profile | null;
  currentUserProfile: Profile;
}

export const MessageBubble = ({
  message,
  isSent,
  isAI = false,
  senderProfile,
  currentUserProfile,
}: MessageBubbleProps) => {
  const abilityProfile = currentUserProfile.ability_profile.profile;

  const handlePlayTTS = () => {
    // Block TTS for DEAF users - they cannot hear
    if (!canHearAudio(abilityProfile)) {
      return;
    }
    
    if (message.text && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.text);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={cn(
      'flex gap-3 mb-4 items-start',
      isSent ? 'justify-end' : 'justify-start'
    )}>
      {!isSent && (
        <Avatar className="h-10 w-10">
          <AvatarFallback className={cn(isAI && 'bg-primary/20')}>
            {isAI ? '🤖' : (senderProfile?.display_name.charAt(0).toUpperCase() || '?')}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        'max-w-[70%] rounded-2xl px-4 py-3 space-y-2',
        isSent
          ? 'bg-primary text-primary-foreground'
          : isAI
            ? 'bg-accent border-2 border-primary/20'
            : 'bg-muted'
      )}>
        {isAI && (
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">AI Assistant</Badge>
          </div>
        )}
        {message.text && (
          <p className={cn(
            "text-base leading-relaxed whitespace-pre-wrap break-words",
            abilityProfile.includes('DEAF') && 'text-xl font-medium',
            isAI && "text-foreground"
          )}>
            {message.text}
          </p>
        )}

        {/* TTS Button - Only for users who can HEAR (BLIND, not DEAF) */}
        {!isSent && shouldUseTTS(abilityProfile) && message.text && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={handlePlayTTS}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Hear Message
          </Button>
        )}

        {/* Haptic Player for DEAF_BLIND users - with fallback pattern generation */}
        {!isSent && (abilityProfile === 'DEAF_BLIND' || abilityProfile === 'DEAF_BLIND_MUTE') && message.text && (
          <div className="mt-2">
            <HapticPlayer 
              pattern={
                message.haptics_pattern && Array.isArray(message.haptics_pattern)
                  ? { sequence: message.haptics_pattern }
                  : getHapticForMessage(message.text, message.priority || 'normal')
              }
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
          <span>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isSent && (
            <span className="text-xs">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
};
