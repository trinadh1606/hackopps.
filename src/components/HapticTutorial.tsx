import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { playHapticPattern, EMOTION_HAPTICS, PRIORITY_HAPTICS, CONTEXT_HAPTICS, HAPTIC_PRESETS } from '@/lib/haptics';
import { Vibrate } from 'lucide-react';

interface HapticTutorialProps {
  strength?: number;
}

export const HapticTutorial = ({ strength = 0.8 }: HapticTutorialProps) => {
  const testPattern = async (pattern: any, name: string) => {
    await playHapticPattern(pattern, strength);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Vibrate className="h-6 w-6" />
        <div>
          <h2 className="text-xl font-semibold">Haptic Tutorial</h2>
          <p className="text-sm text-muted-foreground">
            Learn what different vibration patterns feel like
          </p>
        </div>
      </div>

      {/* Emotions */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Emotions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => testPattern(EMOTION_HAPTICS.joy, 'Joy')}
            className="justify-start"
          >
            😊 Joy
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(EMOTION_HAPTICS.sadness, 'Sadness')}
            className="justify-start"
          >
            😢 Sadness
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(EMOTION_HAPTICS.excitement, 'Excitement')}
            className="justify-start"
          >
            🎉 Excitement
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(EMOTION_HAPTICS.calm, 'Calm')}
            className="justify-start"
          >
            😌 Calm
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(EMOTION_HAPTICS.anxiety, 'Anxiety')}
            className="justify-start"
          >
            😰 Anxiety
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(EMOTION_HAPTICS.love, 'Love')}
            className="justify-start"
          >
            ❤️ Love
          </Button>
        </div>
      </div>

      {/* Priority Levels */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Message Priority</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => testPattern(PRIORITY_HAPTICS.low, 'Low')}
            className="justify-start"
          >
            🔵 Low
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(PRIORITY_HAPTICS.normal, 'Normal')}
            className="justify-start"
          >
            🟢 Normal
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(PRIORITY_HAPTICS.high, 'High')}
            className="justify-start"
          >
            🟡 High
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(PRIORITY_HAPTICS.urgent, 'Urgent')}
            className="justify-start"
          >
            🔴 Urgent
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(PRIORITY_HAPTICS.emergency, 'Emergency')}
            className="justify-start col-span-2"
          >
            🚨 Emergency
          </Button>
        </div>
      </div>

      {/* Context Patterns */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Message Types</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => testPattern(CONTEXT_HAPTICS.question, 'Question')}
            className="justify-start"
          >
            ❓ Question
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(CONTEXT_HAPTICS.answer, 'Answer')}
            className="justify-start"
          >
            💬 Answer
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(CONTEXT_HAPTICS.greeting, 'Greeting')}
            className="justify-start"
          >
            👋 Greeting
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(CONTEXT_HAPTICS.farewell, 'Farewell')}
            className="justify-start"
          >
            👋 Farewell
          </Button>
        </div>
      </div>

      {/* System Patterns */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">System Feedback</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => testPattern(HAPTIC_PRESETS.success, 'Success')}
            className="justify-start"
          >
            ✅ Success
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(HAPTIC_PRESETS.error, 'Error')}
            className="justify-start"
          >
            ❌ Error
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(HAPTIC_PRESETS.notification, 'Notification')}
            className="justify-start"
          >
            🔔 Notification
          </Button>
          <Button
            variant="outline"
            onClick={() => testPattern(HAPTIC_PRESETS.sos, 'SOS')}
            className="justify-start"
          >
            🆘 SOS
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4 border-t">
        Tip: Each pattern is unique to help you identify messages without looking or listening
      </p>
    </Card>
  );
};
