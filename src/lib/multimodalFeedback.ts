import { AudioCue, AUDIO_CUES, playAudioCue } from './audio';
import { HapticPattern, HAPTIC_PRESETS, playHapticPattern } from './haptics';

export interface MultimodalCue {
  audio?: AudioCue;
  haptic?: HapticPattern;
  delay?: number; // ms delay between audio and haptic (0 = simultaneous)
}

export const MULTIMODAL_CUES = {
  messageReceived: {
    audio: AUDIO_CUES.message.incoming,
    haptic: HAPTIC_PRESETS.notification,
    delay: 0
  },
  messageSent: {
    audio: AUDIO_CUES.status.sent,
    haptic: HAPTIC_PRESETS.success,
    delay: 50
  },
  messageDelivered: {
    audio: AUDIO_CUES.status.delivered,
    haptic: { sequence: [50, 50, 50] },
    delay: 0
  },
  messageRead: {
    audio: AUDIO_CUES.status.read,
    haptic: { sequence: [100, 100, 150] },
    delay: 0
  },
  messageFailed: {
    audio: AUDIO_CUES.status.failed,
    haptic: HAPTIC_PRESETS.error,
    delay: 0
  },
  buttonPress: {
    audio: AUDIO_CUES.navigation.buttonPress,
    haptic: { sequence: [30] },
    delay: 0
  },
  buttonFocus: {
    audio: AUDIO_CUES.navigation.buttonFocus,
    haptic: { sequence: [20] },
    delay: 0
  },
  navigationBack: {
    audio: AUDIO_CUES.navigation.back,
    haptic: { sequence: [100, 50, 50] },
    delay: 0
  },
  error: {
    audio: AUDIO_CUES.navigation.error,
    haptic: HAPTIC_PRESETS.error,
    delay: 0
  },
  success: {
    audio: { frequencies: [523.25, 659.25], durations: [150], waveType: 'sine' as const, volume: 0.3 },
    haptic: HAPTIC_PRESETS.success,
    delay: 0
  },
};

export const playMultimodalCue = async (
  cue: MultimodalCue,
  audioEnabled: boolean = true,
  hapticEnabled: boolean = true,
  hapticStrength: number = 1.0,
  audioVolume: number = 1.0
): Promise<void> => {
  const promises: Promise<void>[] = [];
  
  if (audioEnabled && cue.audio) {
    const adjustedCue = { ...cue.audio, volume: cue.audio.volume * audioVolume };
    promises.push(playAudioCue(adjustedCue));
  }
  
  if (hapticEnabled && cue.haptic) {
    const hapticPromise = cue.delay 
      ? new Promise<void>(resolve => {
          setTimeout(() => {
            playHapticPattern(cue.haptic!, hapticStrength).then(resolve);
          }, cue.delay);
        })
      : playHapticPattern(cue.haptic, hapticStrength);
    
    promises.push(hapticPromise);
  }
  
  await Promise.all(promises);
};
