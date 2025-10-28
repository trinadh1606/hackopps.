import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const BRAILLE_ALPHABET = [
  { char: 'a', dots: '1', unicode: '⠁' },
  { char: 'b', dots: '1,2', unicode: '⠃' },
  { char: 'c', dots: '1,4', unicode: '⠉' },
  { char: 'd', dots: '1,4,5', unicode: '⠙' },
  { char: 'e', dots: '1,5', unicode: '⠑' },
  { char: 'f', dots: '1,2,4', unicode: '⠋' },
  { char: 'g', dots: '1,2,4,5', unicode: '⠛' },
  { char: 'h', dots: '1,2,5', unicode: '⠓' },
  { char: 'i', dots: '2,4', unicode: '⠊' },
  { char: 'j', dots: '2,4,5', unicode: '⠚' },
  { char: 'k', dots: '1,3', unicode: '⠅' },
  { char: 'l', dots: '1,2,3', unicode: '⠇' },
  { char: 'm', dots: '1,3,4', unicode: '⠍' },
  { char: 'n', dots: '1,3,4,5', unicode: '⠝' },
  { char: 'o', dots: '1,3,5', unicode: '⠕' },
  { char: 'p', dots: '1,2,3,4', unicode: '⠏' },
  { char: 'q', dots: '1,2,3,4,5', unicode: '⠟' },
  { char: 'r', dots: '1,2,3,5', unicode: '⠗' },
  { char: 's', dots: '2,3,4', unicode: '⠎' },
  { char: 't', dots: '2,3,4,5', unicode: '⠞' },
  { char: 'u', dots: '1,3,6', unicode: '⠥' },
  { char: 'v', dots: '1,2,3,6', unicode: '⠧' },
  { char: 'w', dots: '2,4,5,6', unicode: '⠺' },
  { char: 'x', dots: '1,3,4,6', unicode: '⠭' },
  { char: 'y', dots: '1,3,4,5,6', unicode: '⠽' },
  { char: 'z', dots: '1,3,5,6', unicode: '⠵' },
];

export const BrailleReference = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-sm">
      <Card className="overflow-hidden shadow-lg">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="secondary"
          className="w-full justify-between text-lg h-14"
        >
          <span>Braille Reference</span>
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </Button>
        
        {isOpen && (
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {BRAILLE_ALPHABET.map((item) => (
                <div
                  key={item.char}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                >
                  <span className="text-3xl">{item.unicode}</span>
                  <div className="text-left">
                    <div className="font-bold text-lg">{item.char}</div>
                    <div className="text-xs text-muted-foreground">dots {item.dots}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Press the numbered dots simultaneously to form each letter.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
