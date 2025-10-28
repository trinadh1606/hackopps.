import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Volume2, Vibrate, Mic, MessageSquare } from 'lucide-react';

interface DemoIntroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartDemo: () => void;
  abilityProfile: string;
}

const profileFeatures: Record<string, { icon: typeof Bot; features: string[] }> = {
  DEAF: { icon: MessageSquare, features: ['Visual messages', 'Text-based communication', 'Quick replies'] },
  BLIND: { icon: Volume2, features: ['Text-to-Speech', 'Audio cues', 'Voice input'] },
  MUTE: { icon: Mic, features: ['Voice transcription', 'Text input', 'Visual feedback'] },
  DEAF_BLIND: { icon: Vibrate, features: ['Haptic feedback', 'Braille input', 'Tactile patterns'] },
  DEAF_MUTE: { icon: MessageSquare, features: ['Visual communication', 'Text input', 'Sign language support'] },
  BLIND_MUTE: { icon: Volume2, features: ['Text-to-Speech', 'Haptic feedback', 'Audio cues', 'Voice input'] },
  DEAF_BLIND_MUTE: { icon: Vibrate, features: ['Haptic patterns', 'Braille input', 'Morse code', 'Tactile feedback'] },
};

export const DemoIntroDialog = ({ open, onOpenChange, onStartDemo, abilityProfile }: DemoIntroDialogProps) => {
  const profileInfo = profileFeatures[abilityProfile] || profileFeatures.DEAF;
  const Icon = profileInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Welcome to UNI-COM Demo!</DialogTitle>
              <Badge variant="secondary" className="mt-1">AI Assistant</Badge>
            </div>
          </div>
          <DialogDescription className="text-base">
            Try our AI assistant designed specifically for your communication needs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Your Profile: {abilityProfile.replace(/_/g, ' ')}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Features enabled:</p>
              <ul className="space-y-1">
                {profileInfo.features.map((feature, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">What you can do:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Practice communication with AI</li>
              <li>• Test all accessibility features</li>
              <li>• Get help and ask questions</li>
              <li>• Try different input methods</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onStartDemo} className="flex-1 touch-target">
            Start Demo Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
