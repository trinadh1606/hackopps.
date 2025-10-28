import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, SkipBack, Volume2, Vibrate } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { playHapticPattern } from '@/lib/haptics';
import { getHapticForMessage } from '@/lib/hapticSentiment';
import { playMultimodalCue, MULTIMODAL_CUES } from '@/lib/multimodalFeedback';

interface MessagePlayerProps {
  text: string;
  senderName?: string;
  timestamp?: string;
  priority?: string;
  autoPlay?: boolean;
  audioEnabled?: boolean;
  hapticEnabled?: boolean;
  ttsOptions?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    announceSender?: boolean;
    announceTimestamp?: boolean;
  };
}

export const MessagePlayer = ({
  text,
  senderName,
  timestamp,
  priority = 'normal',
  autoPlay = false,
  audioEnabled = true,
  hapticEnabled = true,
  ttsOptions = { rate: 1.0, pitch: 1.0, volume: 1.0, announceSender: true, announceTimestamp: false },
}: MessagePlayerProps) => {
  const { speak, pause, resume, stop, speaking } = useTTS();
  const [speed, setSpeed] = useState([ttsOptions.rate || 1.0]);
  const [hapticStrength, setHapticStrength] = useState([0.8]);

  useEffect(() => {
    if (autoPlay && text) {
      handlePlay();
    }
  }, [autoPlay, text]);

  const handlePlay = async () => {
    if (speaking) {
      pause();
    } else {
      // Play intro cue
      if (audioEnabled || hapticEnabled) {
        await playMultimodalCue(
          MULTIMODAL_CUES.messageReceived,
          audioEnabled,
          hapticEnabled,
          hapticStrength[0]
        );
      }

      // Speak the message
      speak(text, { ...ttsOptions, rate: speed[0] }, senderName, timestamp);

      // Play haptic pattern
      if (hapticEnabled) {
        const hapticPattern = getHapticForMessage(text, priority);
        setTimeout(() => {
          playHapticPattern(hapticPattern, hapticStrength[0]);
        }, 500);
      }
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleRepeat = async () => {
    stop();
    setTimeout(() => handlePlay(), 100);
  };

  const handleTestHaptic = async () => {
    const hapticPattern = getHapticForMessage(text, priority);
    await playHapticPattern(hapticPattern, hapticStrength[0]);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-border mt-2">
      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={handleRepeat}
          size="lg"
          variant="outline"
          className="touch-target h-16 w-16"
          aria-label="Repeat message"
        >
          <SkipBack className="h-6 w-6" />
        </Button>

        <Button
          onClick={speaking ? handleStop : handlePlay}
          size="lg"
          className="touch-target h-20 w-20"
          aria-label={speaking ? 'Stop playback' : 'Play message'}
        >
          {speaking ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8" />
          )}
        </Button>

        <Button
          onClick={handleStop}
          size="lg"
          variant="outline"
          className="touch-target h-16 w-16"
          aria-label="Stop playback"
        >
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>

      {/* Speed Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Speed: {speed[0].toFixed(1)}x
          </label>
        </div>
        <Slider
          value={speed}
          onValueChange={setSpeed}
          min={0.5}
          max={2.0}
          step={0.1}
          className="touch-target"
          aria-label="Playback speed"
        />
      </div>

      {/* Haptic Strength Control */}
      {hapticEnabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Vibrate className="h-4 w-4" />
              Haptic: {Math.round(hapticStrength[0] * 100)}%
            </label>
            <Button
              onClick={handleTestHaptic}
              size="sm"
              variant="outline"
              className="h-8"
            >
              Test
            </Button>
          </div>
          <Slider
            value={hapticStrength}
            onValueChange={setHapticStrength}
            min={0.1}
            max={1}
            step={0.1}
            className="touch-target"
            aria-label="Haptic intensity"
          />
        </div>
      )}

      {/* Message Text Preview */}
      <div className="text-sm text-muted-foreground line-clamp-2 italic">
        "{text}"
      </div>
    </div>
  );
};
