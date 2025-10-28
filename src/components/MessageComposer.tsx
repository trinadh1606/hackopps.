import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceInput } from './VoiceInput';
import { BrailleChordPad } from './BrailleChordPad';
import { VoiceFirstComposer } from './VoiceFirstComposer';
import { useAdaptiveUI } from '@/hooks/useAdaptiveUI';
import { AbilityProfile } from '@/types/abilities';

interface MessageComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  abilityProfile: string;
  onTyping?: (isTyping: boolean) => void;
}

export const MessageComposer = ({
  onSend,
  disabled,
  abilityProfile,
  onTyping,
}: MessageComposerProps) => {
  const [text, setText] = useState('');
  const [showBrailleInput, setShowBrailleInput] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const uiConfig = useAdaptiveUI(abilityProfile as AbilityProfile);

  useEffect(() => {
    // Clear typing timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);

    // Emit typing indicator
    if (onTyping) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
      if (onTyping) {
        onTyping(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setText(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const handleBrailleCharacter = (char: string) => {
    if (char === 'backspace') {
      setText(prev => prev.slice(0, -1));
    } else {
      setText(prev => prev + char);
    }
  };

  // Auto-open Braille for DEAF_BLIND users
  const shouldShowInlineBraille = abilityProfile === 'DEAF_BLIND' || abilityProfile === 'DEAF_BLIND_MUTE';
  const showVoiceInput = abilityProfile === 'BLIND' || abilityProfile === 'MUTE' || abilityProfile === 'BLIND_MUTE';

  // Voice-first layout for BLIND_MUTE
  if (uiConfig.voiceInputPrimary && abilityProfile === 'BLIND_MUTE') {
    return <VoiceFirstComposer onSend={onSend} disabled={disabled} autoStart={uiConfig.autoStartVoiceInput} />;
  }

  return (
    <>
      <div className="border-t bg-background p-4">
        {shouldShowInlineBraille ? (
          // Auto-show inline Braille for DEAF_BLIND - no button needed
          <div className="space-y-4">
            <BrailleChordPad 
              onCharacter={handleBrailleCharacter}
              hapticStrength={0.8}
            />
            <div className="bg-muted p-4 rounded-lg font-mono text-2xl min-h-[60px]">
              {text || <span className="text-muted-foreground">Touch dots to type...</span>}
            </div>
            <Button
              onClick={handleSend}
              disabled={disabled || !text.trim()}
              size="lg"
              className="w-full touch-target h-20"
            >
              <Send className="h-6 w-6 mr-3" />
              Send Message
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            {showVoiceInput && (
              <VoiceInput onTranscript={handleVoiceTranscript} disabled={disabled} />
            )}

            {uiConfig.showTextInput && (
              <Textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={disabled}
                className={cn(
                  'resize-none min-h-[60px] max-h-[200px]',
                  uiConfig.largeTextMode && 'text-xl'
                )}
                rows={2}
              />
            )}
            
            <Button
              onClick={handleSend}
              disabled={disabled || !text.trim()}
              size="lg"
              className="h-[60px] px-6"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
