import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, X } from 'lucide-react';

interface GuestVoiceInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const GuestVoiceInput = ({ onSendMessage, disabled }: GuestVoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

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
    };
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      setTranscript('');
      recognition.start();
    }
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
