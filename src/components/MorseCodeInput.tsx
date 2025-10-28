import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { playHapticPattern, HAPTIC_PRESETS } from '@/lib/haptics';
import { playAudioCue, AUDIO_CUES } from '@/lib/audio';

interface MorseCodeInputProps {
  onCharacter: (char: string) => void;
  disabled?: boolean;
}

const MORSE_CODE: Record<string, string> = {
  '•—': 'A', '—•••': 'B', '—•—•': 'C', '—••': 'D', '•': 'E',
  '••—•': 'F', '——•': 'G', '••••': 'H', '••': 'I', '•———': 'J',
  '—•—': 'K', '•—••': 'L', '——': 'M', '—•': 'N', '———': 'O',
  '•——•': 'P', '——•—': 'Q', '•—•': 'R', '•••': 'S', '—': 'T',
  '••—': 'U', '•••—': 'V', '•——': 'W', '—••—': 'X', '—•——': 'Y',
  '——••': 'Z', '•————': '1', '••———': '2', '•••——': '3', '••••—': '4',
  '•••••': '5', '—••••': '6', '——•••': '7', '———••': '8', '————•': '9',
  '—————': '0', '••——••': '?', '—•—•——': '!', '•—••—•': '.', ' ': ' '
};

const COMMON_PHRASES: Record<string, string> = {
  '••• ——— •••': 'SOS',
  '•—•—': 'OK',
  '——•—•—': 'HELP',
  '—•——': 'YES',
  '—• ———': 'NO'
};

export const MorseCodeInput = ({ onCharacter, disabled }: MorseCodeInputProps) => {
  const [sequence, setSequence] = useState('');
  const [currentChar, setCurrentChar] = useState('');
  const [pressStart, setPressStart] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePress = async () => {
    if (disabled) return;
    setPressStart(Date.now());
    
    // Haptic and audio feedback on press start
    await Promise.all([
      playHapticPattern({ sequence: [30] }),
      playAudioCue(AUDIO_CUES.navigation.buttonPress)
    ]);
  };

  const handleRelease = async () => {
    if (disabled || !pressStart) return;
    
    const duration = Date.now() - pressStart;
    setPressStart(null);
    
    // Determine if dot or dash (< 200ms = dot, >= 200ms = dash)
    const isDot = duration < 200;
    const symbol = isDot ? '•' : '—';
    const newSequence = sequence + symbol;
    
    setSequence(newSequence);
    
    // Different feedback for dot vs dash
    if (isDot) {
      await Promise.all([
        playHapticPattern({ sequence: [50] }),
        playAudioCue({ ...AUDIO_CUES.message.incoming, frequencies: [800] })
      ]);
    } else {
      await Promise.all([
        playHapticPattern({ sequence: [150] }),
        playAudioCue({ ...AUDIO_CUES.message.incoming, frequencies: [400] })
      ]);
    }

    // Clear timeout and set new one
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      completeCharacter(newSequence);
    }, 1000);
  };

  const completeCharacter = async (seq: string) => {
    if (!seq) return;

    const char = MORSE_CODE[seq];
    if (char) {
      setCurrentChar(char);
      onCharacter(char);
      
      // Success feedback
      await Promise.all([
        playHapticPattern(HAPTIC_PRESETS.success),
        playAudioCue(AUDIO_CUES.status.sent)
      ]);

      // Announce character via TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(char);
        utterance.volume = 0.7;
        utterance.rate = 1.2;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      // Error feedback for unknown sequence
      await Promise.all([
        playHapticPattern(HAPTIC_PRESETS.error),
        playAudioCue(AUDIO_CUES.status.failed)
      ]);
    }
    
    setSequence('');
    setTimeout(() => setCurrentChar(''), 500);
  };

  const insertPhrase = async (phrase: string, morse: string) => {
    for (const char of phrase) {
      onCharacter(char);
    }
    await playHapticPattern(HAPTIC_PRESETS.success);
  };

  return (
    <div className="space-y-4">
      {/* Current sequence display */}
      <Card className="p-6 bg-muted">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground font-medium">Current Sequence</div>
          <div className="text-4xl font-mono tracking-wider min-h-[50px] flex items-center justify-center">
            {sequence || '—'}
          </div>
          {currentChar && (
            <Badge variant="default" className="text-2xl py-2 px-4">
              {currentChar}
            </Badge>
          )}
        </div>
      </Card>

      {/* Main morse button */}
      <Button
        className="w-full h-48 touch-target text-xl font-semibold"
        size="lg"
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        disabled={disabled}
        aria-label="Morse code input button - press short for dot, long for dash"
      >
        <div className="text-center">
          <div className="text-2xl mb-2">
            {pressStart ? '●' : 'TAP'}
          </div>
          <div className="text-sm opacity-70">
            Short tap = • (dot) | Long press = — (dash)
          </div>
        </div>
      </Button>

      {/* Quick phrase buttons */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Common Phrases:</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(COMMON_PHRASES).map(([morse, phrase]) => (
            <Button
              key={morse}
              variant="outline"
              size="lg"
              onClick={() => insertPhrase(phrase, morse)}
              disabled={disabled}
              className="touch-target"
            >
              <div className="text-center">
                <div className="font-semibold">{phrase}</div>
                <div className="text-xs opacity-70">{morse}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Backspace and space */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onCharacter(' ')}
          disabled={disabled}
          className="touch-target"
        >
          Space
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => onCharacter('backspace')}
          disabled={disabled}
          className="touch-target"
        >
          Backspace
        </Button>
      </div>
    </div>
  );
};
