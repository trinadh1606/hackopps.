import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptionDisplayProps {
  text: string;
  speaker?: string;
  timestamp?: string;
  position?: 'top' | 'bottom' | 'floating';
  onClose?: () => void;
}

export const CaptionDisplay = ({ 
  text, 
  speaker, 
  timestamp,
  position = 'bottom',
  onClose 
}: CaptionDisplayProps) => {
  const [captionHistory, setCaptionHistory] = useState<Array<{ text: string; speaker?: string; timestamp: string }>>([]);

  useEffect(() => {
    if (text) {
      setCaptionHistory(prev => [...prev, { 
        text, 
        speaker, 
        timestamp: timestamp || new Date().toISOString() 
      }]);
    }
  }, [text, speaker, timestamp]);

  const downloadTranscript = () => {
    const transcript = captionHistory
      .map(item => {
        const time = new Date(item.timestamp).toLocaleTimeString();
        const speaker = item.speaker ? `[${item.speaker}] ` : '';
        return `${time} ${speaker}${item.text}`;
      })
      .join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!text && captionHistory.length === 0) return null;

  return (
    <Card className={cn(
      'fixed left-4 right-4 z-50 shadow-lg border-2',
      position === 'top' && 'top-4',
      position === 'bottom' && 'bottom-24',
      position === 'floating' && 'top-1/2 -translate-y-1/2'
    )}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {speaker && (
              <div className="text-sm font-semibold text-primary mb-1">
                {speaker}
                {timestamp && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )}
            <p className="text-2xl font-medium leading-relaxed bg-accent/50 p-3 rounded">
              {text}
            </p>
          </div>
          <div className="flex gap-1">
            {captionHistory.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={downloadTranscript}
                aria-label="Download transcript"
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close captions"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {captionHistory.length > 1 && (
          <div className="max-h-32 overflow-y-auto space-y-2 border-t pt-2">
            <div className="text-xs font-medium text-muted-foreground">Previous captions:</div>
            {captionHistory.slice(-5, -1).reverse().map((item, idx) => (
              <div key={idx} className="text-sm text-muted-foreground">
                <span className="font-medium">{item.speaker || 'Speaker'}:</span> {item.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
