export type AbilityProfile = 
  | 'DEAF' 
  | 'BLIND' 
  | 'MUTE' 
  | 'DEAF_BLIND' 
  | 'DEAF_MUTE' 
  | 'BLIND_MUTE' 
  | 'DEAF_BLIND_MUTE';

export interface AbilityPrefs {
  profile: AbilityProfile;
  prefs: {
    showCaptions?: boolean;
    enableHaptics?: boolean;
    signAvatarEnabled?: boolean;
    ttsEnabled?: boolean;
    brailleEnabled?: boolean;
  };
}

export interface DevicePrefs {
  brailleTable: string;
  hapticStrength: number;
  ttsVoice: string;
  offlineOnly: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  ability_profile: AbilityPrefs;
  device_prefs: DevicePrefs;
  created_at: string;
}

export const ABILITY_PROFILES: Record<AbilityProfile, { 
  label: string; 
  description: string;
  features: string[];
}> = {
  DEAF: {
    label: 'Deaf',
    description: 'Live captions and visual communication',
    features: ['Speech-to-text captions', 'Visual alerts', 'Optional sign language']
  },
  BLIND: {
    label: 'Blind',
    description: 'Audio-first with text-to-speech',
    features: ['Text-to-speech', 'Voice replies', 'Haptic notifications']
  },
  MUTE: {
    label: 'Mute',
    description: 'Text and sign to speech',
    features: ['Text-to-speech output', 'Sign language input', 'Quick replies']
  },
  DEAF_BLIND: {
    label: 'Deaf + Blind',
    description: 'Touch-based with Braille and haptics',
    features: ['Braille output', 'Haptic patterns', 'Touch input']
  },
  DEAF_MUTE: {
    label: 'Deaf + Mute',
    description: 'Visual communication only',
    features: ['Sign language', 'Text chat', 'Visual indicators']
  },
  BLIND_MUTE: {
    label: 'Blind + Mute',
    description: 'Audio output with touch input',
    features: ['Text-to-speech', 'Touch navigation', 'Haptic feedback']
  },
  DEAF_BLIND_MUTE: {
    label: 'Deaf + Blind + Mute',
    description: 'Touch-only communication',
    features: ['Braille chord input', 'Haptic output', 'Morse code support']
  }
};
