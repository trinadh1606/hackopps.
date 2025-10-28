import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { playAudioCue, AUDIO_CUES } from '@/lib/audio';
import { playMultimodalCue, MULTIMODAL_CUES } from '@/lib/multimodalFeedback';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput = ({ onTranscript, disabled }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = async () => {
      setIsRecording(true);
      // Play "listening" audio cue
      await playAudioCue(AUDIO_CUES.message.incoming);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Listening');
        utterance.volume = 0.5;
        utterance.rate = 1.2;
        window.speechSynthesis.speak(utterance);
      }
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      // Provide confidence feedback
      if (confidence > 0.9) {
        await playMultimodalCue(MULTIMODAL_CUES.success);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Got it');
          utterance.volume = 0.5;
          utterance.rate = 1.5;
          window.speechSynthesis.speak(utterance);
        }
      } else if (confidence > 0.7) {
        await playAudioCue(AUDIO_CUES.navigation.buttonPress);
      } else {
        await playAudioCue(AUDIO_CUES.navigation.error);
        toast({
          title: 'Low Confidence',
          description: 'Try speaking more clearly',
        });
      }
      
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: 'Error',
        description: 'Speech recognition failed. Please try again.',
        variant: 'destructive',
      });
      setIsRecording(false);
    };

    recognition.onend = async () => {
      setIsRecording(false);
      // Play "processing" or "stopped" audio cue
      await playAudioCue(AUDIO_CUES.status.delivered);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'outline'}
      size="icon"
      className="h-[60px] w-[60px]"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
    >
      {isRecording ? (
        <MicOff className="h-6 w-6" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
      <span className="sr-only">{isRecording ? 'Stop recording' : 'Start voice input'}</span>
    </Button>
  );
};
