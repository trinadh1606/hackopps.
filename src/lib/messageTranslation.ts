import { Message, Profile } from '@/types/chat';
import { translator } from './translation';
import { playMultimodalCue, MULTIMODAL_CUES } from './multimodalFeedback';
import { getHapticForMessage } from './hapticSentiment';
import { playHapticPattern } from './haptics';

interface TranslationConfig {
  senderProfile: Profile | null;
  receiverProfile: Profile;
  message: Message;
  receiverPrefs: any;
}

export class MessageTranslator {
  private ttsQueue: Message[] = [];
  private isProcessing = false;

  // Determine what output modalities receiver needs
  getRequiredModalities(receiverProfile: string): string[] {
    const map: Record<string, string[]> = {
      'DEAF': ['text', 'visual'],
      'BLIND': ['audio', 'haptic'],
      'MUTE': ['text', 'visual', 'audio'],
      'DEAF_BLIND': ['haptic', 'braille'],
      'DEAF_MUTE': ['text', 'visual'],
      'BLIND_MUTE': ['audio', 'haptic'],
      'DEAF_BLIND_MUTE': ['haptic', 'braille']
    };
    return map[receiverProfile] || ['text'];
  }

  // Auto-process message when received
  async processIncomingMessage(config: TranslationConfig): Promise<void> {
    const abilityProfile = config.receiverProfile.ability_profile as any;
    const profile = abilityProfile?.profile || 'DEAF';
    const prefs = abilityProfile?.prefs || {};
    const devicePrefs = (config.receiverProfile as any).device_prefs || {};
    
    const required = this.getRequiredModalities(profile);

    // For BLIND users: Auto-play TTS
    if (required.includes('audio') && prefs.autoReadMessages && devicePrefs?.audioEnabled !== false) {
      await this.queueTTS(config.message, config.senderProfile, devicePrefs);
    }

    // For DEAF_BLIND: Trigger haptic pattern
    if (required.includes('haptic') && prefs.enableHaptics && devicePrefs?.hapticStrength > 0) {
      await this.triggerHaptic(config.message, devicePrefs.hapticStrength);
    }

    // Play notification sound for profiles that can hear
    if (required.includes('audio') && devicePrefs?.audioEnabled !== false) {
      await playMultimodalCue(
        MULTIMODAL_CUES.messageReceived, 
        true,
        false,
        devicePrefs?.audioVolume || 0.8,
        0
      );
    }
  }

  private async queueTTS(message: Message, sender: Profile | null, prefs: any): Promise<void> {
    if (!message.text || !('speechSynthesis' in window)) return;

    this.ttsQueue.push(message);

    if (!this.isProcessing) {
      await this.processTTSQueue(sender, prefs);
    }
  }

  private async processTTSQueue(sender: Profile | null, prefs: any): Promise<void> {
    this.isProcessing = true;

    while (this.ttsQueue.length > 0) {
      const message = this.ttsQueue.shift();
      if (!message?.text) continue;

      await new Promise<void>((resolve) => {
        const senderName = sender?.display_name || 'Someone';
        const announcePrefix = prefs?.announceSenders ? `${senderName} says: ` : '';
        const textToSpeak = announcePrefix + message.text;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = prefs?.ttsSpeed || 1.0;
        utterance.volume = prefs?.audioVolume || 1.0;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      });

      // Small pause between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessing = false;
  }

  private async triggerHaptic(message: Message, strength: number): Promise<void> {
    if (!message.text) return;

    const hapticPattern = getHapticForMessage(message.text, message.priority);
    await playHapticPattern(hapticPattern, strength);
  }
}

export const messageTranslator = new MessageTranslator();
