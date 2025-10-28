import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, X } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface GuestVoiceInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const GuestVoiceInput = ({ onSendMessage, disabled }: GuestVoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const retryRef = useRef(0);
  const retryTimer = useRef<number | null>(null);
  const { isOnline } = useNetworkStatus();
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        const announcement = new SpeechSynthesisUtterance('Listening. Speak your message.');
        window.speechSynthesis.speak(announcement);
      };

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        setTranscript((prev) => {
          const updated = prev + finalTranscript;
          return updated || interimTranscript;
        });
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Retry on transient network errors if we're online
        if (event.error === 'network' && isOnline && retryRef.current < 2) {
          retryRef.current += 1;
          const announcement = new SpeechSynthesisUtterance('Network issue detected. Retrying.');
          window.speechSynthesis.speak(announcement);
          try { recognitionInstance.stop(); } catch {}
          retryTimer.current = window.setTimeout(() => {
            try { recognitionInstance.start(); } catch (e) { console.error('Retry start failed', e); }
          }, 800);
          return;
        }
        
        // Announce error to user
        if ('speechSynthesis' in window) {
          let errorMessage = 'Error occurred';
          switch (event.error) {
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please allow access.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone found.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check connection.';
              break;
            default:
              errorMessage = `Error: ${event.error}`;
          }
          const announcement = new SpeechSynthesisUtterance(errorMessage);
          window.speechSynthesis.speak(announcement);
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, []);

  const startListening = () => {
    if (!recognition || isListening) return;
    if (!isOnline) {
      const announcement = new SpeechSynthesisUtterance('You are offline. Please connect to the internet.');
      window.speechSynthesis.speak(announcement);
      return;
    }
    retryRef.current = 0;
    setTranscript('');
    recognition.start();
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onSendMessage(transcript.trim());
      setTranscript('');
      stopListening();
      
      const announcement = new SpeechSynthesisUtterance('Message sent');
      window.speechSynthesis.speak(announcement);
    }
  };

  const handleCancel = () => {
    setTranscript('');
    stopListening();
    
    const announcement = new SpeechSynthesisUtterance('Message cancelled');
    window.speechSynthesis.speak(announcement);
  };

  return (
    <div className="space-y-4">
      {transcript && (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-lg">{transcript}</p>
        </div>
      )}

      <div className="flex gap-2">
        {!isListening ? (
          <Button
            onClick={startListening}
            disabled={disabled}
            size="lg"
            className="flex-1 h-20 text-xl"
            variant="default"
          >
            <Mic className="mr-2 h-8 w-8" />
            Tap to Speak
          </Button>
        ) : (
          <Button
            onClick={stopListening}
            size="lg"
            className="flex-1 h-20 text-xl"
            variant="destructive"
          >
            <Mic className="mr-2 h-8 w-8" />
            Stop Recording
          </Button>
        )}
      </div>

      {transcript && (
        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            size="lg"
            className="flex-1 h-14 text-lg"
            variant="default"
          >
            <Send className="mr-2 h-6 w-6" />
            Send Message
          </Button>
          <Button
            onClick={handleCancel}
            size="lg"
            variant="outline"
            className="h-14 px-6"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
};
