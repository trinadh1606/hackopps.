import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ModeChip } from '@/components/ModeChip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Volume2, Vibrate, Download } from 'lucide-react';
import { AbilityProfile, ABILITY_PROFILES } from '@/types/abilities';
import { playHapticPattern, HAPTIC_PRESETS } from '@/lib/haptics';
import { HapticTutorial } from '@/components/HapticTutorial';
import { generateUserManual } from '@/lib/pdfExport';

export const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Settings state
  const [abilityProfile, setAbilityProfile] = useState<AbilityProfile>('DEAF');
  const [hapticStrength, setHapticStrength] = useState(80);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(80);
  const [richAudioPatterns, setRichAudioPatterns] = useState(true);
  const [richHapticPatterns, setRichHapticPatterns] = useState(true);
  const [autoReadMessages, setAutoReadMessages] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(100);
  const [announceSenders, setAnnounceSenders] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      
      // Load settings from profile
      const abilityData = data.ability_profile as any;
      setAbilityProfile(abilityData?.profile || 'DEAF');
      setTtsEnabled(abilityData?.prefs?.ttsEnabled || false);
      setAutoReadMessages(abilityData?.prefs?.autoReadMessages || false);
      
      const devicePrefs = data.device_prefs as any;
      setHapticStrength(devicePrefs?.hapticStrength * 100 || 80);
      setAudioVolume(devicePrefs?.audioVolume * 100 || 80);
      setTtsSpeed(devicePrefs?.ttsSpeed * 100 || 100);
      setAudioEnabled(devicePrefs?.audioEnabled !== false);
      setRichAudioPatterns(devicePrefs?.richAudioPatterns !== false);
      setRichHapticPatterns(devicePrefs?.richHapticPatterns !== false);
      setAnnounceSenders(devicePrefs?.announceSenders !== false);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ability_profile: {
            profile: abilityProfile,
            prefs: {
              ttsEnabled,
              showCaptions: true,
              enableHaptics: hapticStrength > 0,
              autoReadMessages,
            }
          },
          device_prefs: {
            hapticStrength: hapticStrength / 100,
            audioVolume: audioVolume / 100,
            ttsSpeed: ttsSpeed / 100,
            audioEnabled,
            richAudioPatterns,
            richHapticPatterns,
            announceSenders,
            brailleTable: 'english',
            ttsVoice: 'default',
            offlineOnly: false,
          }
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Settings saved successfully');
      playHapticPattern(HAPTIC_PRESETS.notification, hapticStrength / 100);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestHaptics = () => {
    playHapticPattern(HAPTIC_PRESETS.success, hapticStrength / 100);
    toast.success('Haptic test complete');
  };

  const handleTestTTS = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('This is a text to speech test message.');
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  };

  const handleDownloadManual = async () => {
    try {
      toast.info('Generating manual...');
      const pdfBlob = await generateUserManual();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'UNI-COM-User-Manual.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Manual downloaded successfully!');
    } catch (error) {
      console.error('Error generating manual:', error);
      toast.error('Failed to generate manual');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">{profile?.display_name}</p>
          </div>
        </div>

        {/* Current Profile */}
        <Card className="p-6 space-y-4">
          <div>
            <Label className="text-lg font-semibold">Current Mode</Label>
            <div className="mt-2">
              <ModeChip profile={abilityProfile} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile">Ability Profile</Label>
            <Select value={abilityProfile} onValueChange={(value) => setAbilityProfile(value as AbilityProfile)}>
              <SelectTrigger id="profile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ABILITY_PROFILES).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {ABILITY_PROFILES[abilityProfile].description}
            </p>
          </div>
        </Card>

        {/* Audio Settings */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">Audio Preferences</h2>

          <div className="flex items-center justify-between">
            <Label htmlFor="audio-enabled">Enable Audio Cues</Label>
            <Switch
              id="audio-enabled"
              checked={audioEnabled}
              onCheckedChange={setAudioEnabled}
            />
          </div>

          {audioEnabled && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="audio-volume" className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Audio Volume
                  </Label>
                  <span className="text-sm text-muted-foreground">{audioVolume}%</span>
                </div>
                <Slider
                  id="audio-volume"
                  value={[audioVolume]}
                  onValueChange={(value) => setAudioVolume(value[0])}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="rich-audio">Rich Audio Vocabulary</Label>
                <Switch
                  id="rich-audio"
                  checked={richAudioPatterns}
                  onCheckedChange={setRichAudioPatterns}
                />
              </div>
            </>
          )}
        </Card>

        {/* Haptic Settings */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">Haptic Preferences</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="haptics" className="flex items-center gap-2">
                <Vibrate className="h-4 w-4" />
                Haptic Feedback Strength
              </Label>
              <span className="text-sm text-muted-foreground">{hapticStrength}%</span>
            </div>
            <Slider
              id="haptics"
              value={[hapticStrength]}
              onValueChange={(value) => setHapticStrength(value[0])}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestHaptics}
              className="w-full touch-target"
            >
              Test Haptic Feedback
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rich-haptics">Rich Haptic Patterns</Label>
            <Switch
              id="rich-haptics"
              checked={richHapticPatterns}
              onCheckedChange={setRichHapticPatterns}
            />
          </div>
        </Card>

        {/* Haptic Tutorial */}
        <HapticTutorial strength={hapticStrength / 100} />

        {/* Text-to-Speech Settings */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">Text-to-Speech</h2>

          <div className="flex items-center justify-between">
            <Label htmlFor="tts" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Enable TTS
            </Label>
            <Switch
              id="tts"
              checked={ttsEnabled}
              onCheckedChange={setTtsEnabled}
            />
          </div>

          {ttsEnabled && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tts-speed">TTS Speed</Label>
                  <span className="text-sm text-muted-foreground">{(ttsSpeed / 100).toFixed(1)}x</span>
                </div>
                <Slider
                  id="tts-speed"
                  value={[ttsSpeed]}
                  onValueChange={(value) => setTtsSpeed(value[0])}
                  min={50}
                  max={200}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-read">Auto-read Messages</Label>
                <Switch
                  id="auto-read"
                  checked={autoReadMessages}
                  onCheckedChange={setAutoReadMessages}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="announce-senders">Announce Senders</Label>
                <Switch
                  id="announce-senders"
                  checked={announceSenders}
                  onCheckedChange={setAnnounceSenders}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTestTTS}
                className="w-full touch-target"
              >
                Test Text-to-Speech
              </Button>
            </>
          )}
        </Card>

        {/* General Accessibility */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">General</h2>

          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="contrast">High Contrast Mode</Label>
            <Switch
              id="contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleDownloadManual}
            variant="outline"
            className="w-full touch-target"
          >
            <Download className="mr-2 h-5 w-5" />
            Download User Manual (PDF)
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full touch-target"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full touch-target"
          >
            Sign Out
          </Button>
        </div>

        {/* App Info */}
        <Card className="p-6">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p className="font-semibold">UNI-COM v1.0</p>
            <p>Universal Communication Platform</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
