import { useState, useCallback, useEffect } from 'react';

export interface TTSOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number; // 0.5 - 2.0
  pitch?: number; // 0.5 - 2.0
  volume?: number; // 0 - 1
  announceSender?: boolean;
  announceTimestamp?: boolean;
}

export const useTTS = () => {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((
    text: string, 
    options?: TTSOptions,
    senderName?: string,
    timestamp?: string
  ) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    let fullText = '';

    // Add sender info if requested
    if (options?.announceSender && senderName) {
      fullText += `Message from ${senderName}. `;
    }

    // Add timestamp if requested
    if (options?.announceTimestamp && timestamp) {
      const time = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      fullText += `Sent at ${time}. `;
    }

    // Add main text
    fullText += text;

    const utterance = new SpeechSynthesisUtterance(fullText);

    if (options?.voice) {
      utterance.voice = options.voice;
    }

    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      setCurrentUtterance(null);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setCurrentUtterance(null);
    };

    setCurrentUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  }, []);

  const pause = useCallback(() => {
    if ('speechSynthesis' in window && speaking) {
      window.speechSynthesis.pause();
      setSpeaking(false);
    }
  }, [speaking]);

  const resume = useCallback(() => {
    if ('speechSynthesis' in window && !speaking) {
      window.speechSynthesis.resume();
      setSpeaking(true);
    }
  }, [speaking]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setCurrentUtterance(null);
    }
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    speaking,
    voices,
    currentUtterance,
  };
};
