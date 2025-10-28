import { playAudioCue, AUDIO_CUES } from './audio';
import { playHapticPattern, HAPTIC_PRESETS } from './haptics';

interface NotificationConfig {
  abilityProfile: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  preferences: {
    audioEnabled: boolean;
    hapticEnabled: boolean;
    visualEnabled: boolean;
  };
}

interface NotificationMessage {
  title: string;
  body: string;
  icon?: string;
}

export class AdaptiveNotificationSystem {
  private lastNotificationTime = 0;
  private readonly MIN_NOTIFICATION_INTERVAL = 1000; // 1 second between notifications

  async notify(config: NotificationConfig, message: NotificationMessage) {
    // Throttle notifications
    const now = Date.now();
    if (now - this.lastNotificationTime < this.MIN_NOTIFICATION_INTERVAL) {
      return;
    }
    this.lastNotificationTime = now;

    // DEAF users: Visual flash + banner notification
    if (config.abilityProfile.includes('DEAF')) {
      this.showVisualNotification(message, config.priority);
      if (config.preferences.hapticEnabled) {
        await this.triggerHaptic(config.priority);
      }
    }
    
    // BLIND users: Audio announcement + TTS
    if (config.abilityProfile.includes('BLIND')) {
      if (config.preferences.audioEnabled) {
        await this.playAudioAlert(config.priority);
        await this.speakNotification(message);
      }
    }
    
    // DEAF_BLIND users: Haptic patterns only
    if (config.abilityProfile === 'DEAF_BLIND') {
      if (config.preferences.hapticEnabled) {
        await this.triggerHaptic(config.priority);
      }
    }
    
    // Standard browser notification (if permission granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      this.showBrowserNotification(message, config);
    }
  }

  private showVisualNotification(message: NotificationMessage, priority: string) {
    // Flash screen border
    const flashClass = priority === 'urgent' ? 'notification-flash-urgent' : 'notification-flash';
    document.body.classList.add(flashClass);
    setTimeout(() => document.body.classList.remove(flashClass), 500);
  }

  private async playAudioAlert(priority: string) {
    const cues = {
      low: AUDIO_CUES.priority.normal,
      normal: AUDIO_CUES.message.incoming,
      high: AUDIO_CUES.priority.important,
      urgent: AUDIO_CUES.priority.urgent
    };
    
    const cue = cues[priority as keyof typeof cues] || AUDIO_CUES.message.incoming;
    await playAudioCue(cue);
  }

  private async speakNotification(message: NotificationMessage) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `${message.title}. ${message.body}`
      );
      utterance.volume = 0.8;
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  }

  private async triggerHaptic(priority: string) {
    const patternMap: Record<string, typeof HAPTIC_PRESETS[keyof typeof HAPTIC_PRESETS]> = {
      low: HAPTIC_PRESETS.notification,
      normal: HAPTIC_PRESETS.alert,
      high: HAPTIC_PRESETS.alert,
      urgent: HAPTIC_PRESETS.error
    };
    
    await playHapticPattern(patternMap[priority] || HAPTIC_PRESETS.notification);
  }

  private showBrowserNotification(message: NotificationMessage, config: NotificationConfig) {
    const notificationOptions: NotificationOptions = {
      body: message.body,
      icon: message.icon || '/favicon.ico',
      tag: 'unicom-message',
      requireInteraction: config.priority === 'urgent'
    };
    
    new Notification(message.title, notificationOptions);
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

export const notificationSystem = new AdaptiveNotificationSystem();
