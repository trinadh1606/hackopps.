import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { playHapticPattern, HapticPattern } from '@/lib/haptics';
import { Play, Square } from 'lucide-react';

interface HapticPlayerProps {
  pattern: HapticPattern;
  label?: string;
}

export const HapticPlayer = ({ pattern, label = 'Feel Message' }: HapticPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [intensity, setIntensity] = useState([0.8]);

  const handlePlay = async () => {
    setIsPlaying(true);
    await playHapticPattern(pattern, intensity[0]);
    setIsPlaying(false);
  };

  const handleStop = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-4">
        <Button
          onClick={isPlaying ? handleStop : handlePlay}
          size="lg"
          className="touch-target flex-1"
          aria-label={isPlaying ? 'Stop haptic playback' : 'Play haptic message'}
        >
          {isPlaying ? (
            <>
              <Square className="mr-2 h-5 w-5" />
              Stop
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              {label}
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Intensity: {Math.round(intensity[0] * 100)}%
        </label>
        <Slider
          value={intensity}
          onValueChange={setIntensity}
          min={0.1}
          max={1}
          step={0.1}
          className="touch-target"
          aria-label="Haptic intensity"
        />
      </div>
    </div>
  );
};
