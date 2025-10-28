// Morse code input via tap/touch timing

export type MorseSymbol = 'dot' | 'dash' | 'gap';

export interface TapEvent {
  duration: number;
  timestamp: number;
}

export const classifyTap = (duration: number): MorseSymbol | null => {
  if (duration <= 180) return 'dot';
  if (duration <= 500) return 'dash';
  return null; // too long
};

export const MORSE_TO_CHAR: Record<string, string> = {
  '.-': 'a',
  '-...': 'b',
  '-.-.': 'c',
  '-..': 'd',
  '.': 'e',
  '..-.': 'f',
  '--.': 'g',
  '....': 'h',
  '..': 'i',
  '.---': 'j',
  '-.-': 'k',
  '.-..': 'l',
  '--': 'm',
  '-.': 'n',
  '---': 'o',
  '.--.': 'p',
  '--.-': 'q',
  '.-.': 'r',
  '...': 's',
  '-': 't',
  '..-': 'u',
  '...-': 'v',
  '.--': 'w',
  '-..-': 'x',
  '-.--': 'y',
  '--..': 'z',
  '.----': '1',
  '..---': '2',
  '...--': '3',
  '....-': '4',
  '.....': '5',
  '-....': '6',
  '--...': '7',
  '---..': '8',
  '----.': '9',
  '-----': '0',
  ' ': ' ',
};

export const morseToChar = (morse: string): string => {
  return MORSE_TO_CHAR[morse] || '';
};
