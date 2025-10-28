// Braille chord mapping - 6-dot input system

export type BrailleDots = [boolean, boolean, boolean, boolean, boolean, boolean];

// Unicode Braille patterns start at U+2800
const BRAILLE_BASE = 0x2800;

export const dotsToUnicode = (dots: BrailleDots): string => {
  let value = 0;
  if (dots[0]) value |= 0x01; // dot 1
  if (dots[1]) value |= 0x02; // dot 2
  if (dots[2]) value |= 0x04; // dot 3
  if (dots[3]) value |= 0x08; // dot 4
  if (dots[4]) value |= 0x10; // dot 5
  if (dots[5]) value |= 0x20; // dot 6
  return String.fromCharCode(BRAILLE_BASE + value);
};

// Basic Grade 1 Braille mapping (English)
export const BRAILLE_TO_CHAR: Record<string, string> = {
  '100000': 'a',
  '110000': 'b',
  '100100': 'c',
  '100110': 'd',
  '100010': 'e',
  '110100': 'f',
  '110110': 'g',
  '110010': 'h',
  '010100': 'i',
  '010110': 'j',
  '101000': 'k',
  '111000': 'l',
  '101100': 'm',
  '101110': 'n',
  '101010': 'o',
  '111100': 'p',
  '111110': 'q',
  '111010': 'r',
  '011100': 's',
  '011110': 't',
  '101001': 'u',
  '111001': 'v',
  '010111': 'w',
  '101101': 'x',
  '101111': 'y',
  '101011': 'z',
  '000000': ' ',
  '111111': 'backspace', // special: all dots = backspace
  '001000': ',',
  '010000': '.',
  '010010': '?',
  '010011': '!',
};

export const dotsToBrailleKey = (dots: BrailleDots): string => {
  return dots.map(d => d ? '1' : '0').join('');
};

export const brailleKeyToChar = (key: string): string => {
  return BRAILLE_TO_CHAR[key] || '';
};
