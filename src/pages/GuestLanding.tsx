import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { MessageSquare } from 'lucide-react';

export const GuestLanding = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [guestId, setGuestId] = useState('');
  const [sessionCreated, setSessionCreated] = useState(false);

  useEffect(() => {
    const announcement = new SpeechSynthesisUtterance(
      'Welcome to UNI-COM Guest Chat. You can start a conversation without creating an account. Enter your name to begin.'
    );
    window.speechSynthesis.speak(announcement);
  }, []);

  const generateGuestId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'guest_';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const createGuestSession = () => {
    if (!displayName.trim()) {
      alert('Please enter your name');
      return;
    }

    const newGuestId = generateGuestId();
    setGuestId(newGuestId);
    setSessionCreated(true);
    
    const announcement = new SpeechSynthesisUtterance(
      `Guest session created for ${displayName}. Show the QR code to the person you want to chat with.`
    );
    window.speechSynthesis.speak(announcement);
  };

  if (sessionCreated && guestId) {
    const guestUrl = `${window.location.origin}/guest-join?guest=${guestId}&name=${encodeURIComponent(displayName)}`;
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <MessageSquare className="h-16 w-16 mx-auto text-primary" />
            <h1 className="text-4xl font-bold">Guest Session Created</h1>
            <p className="text-xl text-muted-foreground">
              Welcome, {displayName}!
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg mb-4">
                Show this QR code to the person you want to chat with:
              </p>
              <QRCodeGenerator url={guestUrl} />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>The other person scans this QR code with their phone</li>
                <li>They'll be able to start a chat with you</li>
                <li>Messages automatically adapt based on their needs</li>
                <li>This session expires in 24 hours</li>
              </ol>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Guest ID: <code className="bg-muted px-2 py-1 rounded">{guestId}</code>
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <MessageSquare className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-4xl font-bold">UNI-COM</h1>
          <p className="text-xl text-muted-foreground">
            Guest Chat
          </p>
          <p className="text-muted-foreground">
            Start a conversation without creating an account
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestName" className="text-lg">
              Your Name
            </Label>
            <Input
              id="guestName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="text-lg min-h-[56px]"
              required
              autoFocus
            />
          </div>

          <Button
            onClick={createGuestSession}
            className="w-full touch-target text-lg h-14"
            size="lg"
          >
            Start Guest Chat
          </Button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="text-primary hover:underline"
          >
            Have an account? Sign in
          </button>
        </div>
      </Card>
    </div>
  );
};
