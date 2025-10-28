import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceFirstComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  autoStart?: boolean;
}

export const VoiceFirstComposer = ({
  onSend,
  disabled,
  autoStart = false,
}: VoiceFirstComposerProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const hasAutoStarted = useRef(false);

  // Auto-start voice recording on mount if enabled
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current && !disabled) {
      hasAutoStarted.current = true;
      setTimeout(() => {
        startListening();
        
        // Announce that recording started
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            "Recording started. Speak your message. Say 'send' when done, or 'cancel' to clear."
          );
          utterance.volume = 0.8;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }, 500);
    }
  }, [autoStart, disabled]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true; // Enable continuous listening for voice commands
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      
      // Check for voice commands
      if (text === 'send' || text.includes('send message')) {
        handleSend();
        recognition.stop();
      } else if (text === 'cancel' || text === 'clear') {
        setTranscript('');
        recognition.stop();
        toast.success('Message cleared');
      } else if (text === 'repeat' || text.includes('read back')) {
        // Read back the current transcript
        if (transcript && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`You said: ${transcript}`);
          window.speechSynthesis.speak(utterance);
        }
      } else {
        // Regular transcript
        setTranscript(text);
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      // Provide specific error messages based on error type
      switch (event.error) {
        case 'not-allowed':
          toast.error('Microphone permission denied. Please allow microphone access in your browser settings.');
          break;
        case 'no-speech':
          toast.error('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          toast.error('No microphone found. Please connect a microphone.');
          break;
        case 'network':
          toast.error('Network error. Please check your connection.');
          break;
        case 'aborted':
          // User stopped, don't show error
          break;
        default:
          toast.error(`Speech recognition error: ${event.error}. Please try again.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onSend(transcript.trim());
      setTranscript('');
    }
  };

  return (
    <div className="border-t bg-background p-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Voice Status */}
        <div className="text-center space-y-2" role="status" aria-live="polite">
          <p className="text-2xl font-semibold">
            {isListening ? '🎤 Listening...' : 'Tap microphone to speak'}
          </p>
          <p className="text-sm text-muted-foreground">
            Say "send" to send, "cancel" to clear, or "repeat" to hear your message
          </p>
          {transcript && (
            <div className="bg-muted rounded-lg p-4" role="alert">
              <p className="text-xl">{transcript}</p>
            </div>
          )}
        </div>

        {/* Microphone Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            variant={isListening ? 'destructive' : 'default'}
            onClick={startListening}
            disabled={disabled || isListening}
            className={cn(
              'h-32 w-32 rounded-full transition-all',
              isListening && 'animate-pulse'
            )}
            aria-label={isListening ? 'Recording' : 'Start recording'}
          >
            <Mic className="h-16 w-16" />
          </Button>
        </div>

        {/* Send Button */}
        {transcript && (
          <Button
            onClick={handleSend}
            disabled={disabled || !transcript.trim()}
            size="lg"
            className="w-full h-20 text-xl"
          >
            <Send className="h-6 w-6 mr-3" />
            Send Message
          </Button>
        )}
      </div>
    </div>
  );
};
