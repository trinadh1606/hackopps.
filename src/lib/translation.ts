import { HapticPattern, textToHapticPattern } from './haptics';

interface TranslationOptions {
  ttsVoice?: string;
  ttsSpeed?: number;
  hapticStrength?: number;
}

export class ModalityTranslator {
  // Text → Speech (TTS)
  async textToSpeech(text: string, options: TranslationOptions = {}): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Text-to-speech not supported');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.ttsSpeed || 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      
      window.speechSynthesis.speak(utterance);
    });
  }

  // Speech → Text (STT)
  async speechToText(): Promise<string> {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      
      recognition.onerror = (error: any) => reject(error);
      
      recognition.start();
    });
  }

  // Text → Haptic
  async textToHaptic(text: string): Promise<HapticPattern> {
    return textToHapticPattern(text);
  }

  // Text → Morse Code
  async textToMorse(text: string): Promise<string> {
    const morseCode: Record<string, string> = {
      'A': '•—', 'B': '—•••', 'C': '—•—•', 'D': '—••', 'E': '•',
      'F': '••—•', 'G': '——•', 'H': '••••', 'I': '••', 'J': '•———',
      'K': '—•—', 'L': '•—••', 'M': '——', 'N': '—•', 'O': '———',
      'P': '•——•', 'Q': '——•—', 'R': '•—•', 'S': '•••', 'T': '—',
      'U': '••—', 'V': '•••—', 'W': '•——', 'X': '—••—', 'Y': '—•——',
      'Z': '——••',
      '0': '—————', '1': '•————', '2': '••———', '3': '•••——', '4': '••••—',
      '5': '•••••', '6': '—••••', '7': '——•••', '8': '———••', '9': '————•',
      ' ': '/'
    };
    
    return text.toUpperCase()
      .split('')
      .map(char => morseCode[char] || '')
      .filter(code => code !== '')
      .join(' ');
  }

  // Text → Braille
  async textToBrailleDisplay(text: string): Promise<string> {
    // Simple text to braille conversion
    // For now, return text as-is, can enhance with proper braille mapping later
    return text;
  }

  // Image → Text (Alt text extraction / OCR placeholder)
  async imageToText(imageUrl: string, altText?: string): Promise<string> {
    // For now, return stored alt text
    // Future: Use OCR API (Tesseract.js or cloud service)
    if (altText) {
      return altText;
    }
    return "Image description not available";
  }

  // Audio → Text (Transcription placeholder)
  async audioToText(audioUrl: string, transcript?: string): Promise<string> {
    // For now, return stored transcript
    // Future: Use speech-to-text API
    if (transcript) {
      return transcript;
    }
    return "Audio transcription not available";
  }
}

export const translator = new ModalityTranslator();
