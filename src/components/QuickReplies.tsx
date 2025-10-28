import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { playHapticPattern, HAPTIC_PRESETS } from '@/lib/haptics';
import { playMultimodalCue, MULTIMODAL_CUES } from '@/lib/multimodalFeedback';

interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export const QuickReplies = ({ suggestions, onSelect, disabled }: QuickRepliesProps) => {
  const handleSelect = async (reply: string) => {
    // Play multimodal feedback on selection
    await playMultimodalCue(MULTIMODAL_CUES.buttonPress, true, true, 0.5);
    onSelect(reply);
  };

  const handleFocus = async (reply: string) => {
    // Speak the reply on focus for BLIND_MUTE users
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.volume = 0.6;
      utterance.rate = 1.3;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="w-full border-t border-border bg-background/50 backdrop-blur-sm">
      <ScrollArea className="w-full">
        <div className="flex gap-2 p-3">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="lg"
              onClick={() => handleSelect(suggestion)}
              onFocus={() => handleFocus(suggestion)}
              disabled={disabled}
              className="whitespace-nowrap min-w-[120px] h-12 text-base font-medium hover:scale-105 transition-transform touch-target"
              aria-label={`Quick reply: ${suggestion}`}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};