import { useState, useRef, useCallback, useEffect } from 'react';
import { BrailleDots, dotsToBrailleKey, brailleKeyToChar } from '@/lib/braille';
import { playHapticPattern, HAPTIC_PRESETS, CONTEXT_HAPTICS } from '@/lib/haptics';
import { playBrailleDotTone, playBrailleChord } from '@/lib/audio';

interface BrailleChordPadProps {
  onCharacter: (char: string) => void;
  hapticStrength?: number;
}

export const BrailleChordPad = ({ onCharacter, hapticStrength = 0.8 }: BrailleChordPadProps) => {
  const [activeDots, setActiveDots] = useState<BrailleDots>([false, false, false, false, false, false]);
  const touchStartTime = useRef<number>(0);
  const activeTouch = useRef<Set<number>>(new Set());
  const hasAnnounced = useRef(false);

  // Auto-announce on mount for screen reader users
  useEffect(() => {
    if (!hasAnnounced.current) {
      hasAnnounced.current = true;
      
      // Play greeting haptic
      playHapticPattern(CONTEXT_HAPTICS.greeting, hapticStrength);
      
      // Announce via TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          'Braille input active. Touch dots 1 through 6 to type. Touch all 6 dots to backspace.'
        );
        utterance.volume = 0.8;
        utterance.rate = 1.0;
        setTimeout(() => window.speechSynthesis.speak(utterance), 300);
      }
    }
  }, [hapticStrength]);

  const handleTouchStart = useCallback(async (dotIndex: number) => {
    if (touchStartTime.current === 0) {
      touchStartTime.current = Date.now();
    }
    activeTouch.current.add(dotIndex);
    
    setActiveDots(prev => {
      const newDots = [...prev] as BrailleDots;
      newDots[dotIndex] = true;
      return newDots;
    });

    // Play dot-specific audio tone and haptic
    await Promise.all([
      playBrailleDotTone(dotIndex, 0.3),
      playHapticPattern(HAPTIC_PRESETS.notification, hapticStrength)
    ]);
  }, [hapticStrength]);

  const handleTouchEnd = useCallback(async () => {
    const elapsed = Date.now() - touchStartTime.current;
    
    // If within 120ms window, process the chord
    if (elapsed <= 120 && activeTouch.current.size > 0) {
      // Play chord completion sound
      await playBrailleChord(activeDots, 0.3);
      
      const key = dotsToBrailleKey(activeDots);
      const char = brailleKeyToChar(key);
      
      if (char) {
        onCharacter(char);
        await playHapticPattern(HAPTIC_PRESETS.success, hapticStrength);
        
        // Speak the character
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(char);
          utterance.volume = 0.5;
          utterance.rate = 1.2;
          window.speechSynthesis.speak(utterance);
        }
      }
    }

    // Reset
    touchStartTime.current = 0;
    activeTouch.current.clear();
    setActiveDots([false, false, false, false, false, false]);
  }, [activeDots, onCharacter, hapticStrength]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-lg">
      <p className="text-lg font-semibold text-center" role="heading" aria-level={2}>
        Braille Chord Input
      </p>
      <p className="text-sm text-muted-foreground text-center">
        Touch multiple dots within 120ms
      </p>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left column: dots 1,2,3 */}
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              onTouchStart={() => handleTouchStart(i)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(i)}
              onMouseUp={handleTouchEnd}
              className={`
                w-20 h-20 rounded-full border-4 touch-target
                transition-all duration-100
                ${activeDots[i] 
                  ? 'bg-primary border-primary scale-110' 
                  : 'bg-secondary border-muted'
                }
              `}
              aria-label={`Braille dot ${i + 1}`}
              aria-pressed={activeDots[i]}
            >
              <span className="text-2xl font-bold">{i + 1}</span>
            </button>
          ))}
        </div>
        
        {/* Right column: dots 4,5,6 */}
        <div className="flex flex-col gap-4">
          {[3, 4, 5].map(i => (
            <button
              key={i}
              onTouchStart={() => handleTouchStart(i)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(i)}
              onMouseUp={handleTouchEnd}
              className={`
                w-20 h-20 rounded-full border-4 touch-target
                transition-all duration-100
                ${activeDots[i] 
                  ? 'bg-primary border-primary scale-110' 
                  : 'bg-secondary border-muted'
                }
              `}
              aria-label={`Braille dot ${i + 1}`}
              aria-pressed={activeDots[i]}
            >
              <span className="text-2xl font-bold">{i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-muted-foreground text-center mt-2">
        Touch all 6 dots to backspace
      </div>
    </div>
  );
};
