import { AbilityProfile } from '@/types/abilities';

interface AdaptiveUIConfig {
  // Input methods
  showTextInput: boolean;
  showVoiceInput: boolean;
  showBrailleInput: boolean;
  autoStartVoiceInput: boolean;
  voiceInputPrimary: boolean;
  
  // Output methods
  autoPlayIncoming: boolean;
  autoHapticFeedback: boolean;
  showVisualIndicators: boolean;
  showAudioControls: boolean;
  showCaptions: boolean;
  
  // UI adjustments
  largeTextMode: boolean;
  highContrastMode: boolean;
  simplifiedLayout: boolean;
  
  // Layout priorities
  layoutMode: 'visual-first' | 'audio-first' | 'haptic-first' | 'balanced';
}

export const useAdaptiveUI = (abilityProfile: AbilityProfile): AdaptiveUIConfig => {
  const config: AdaptiveUIConfig = {
    // Defaults
    showTextInput: true,
    showVoiceInput: false,
    showBrailleInput: false,
    autoStartVoiceInput: false,
    voiceInputPrimary: false,
    autoPlayIncoming: false,
    autoHapticFeedback: false,
    showVisualIndicators: true,
    showAudioControls: true,
    showCaptions: false,
    largeTextMode: false,
    highContrastMode: false,
    simplifiedLayout: false,
    layoutMode: 'balanced',
  };

  switch (abilityProfile) {
    case 'DEAF':
      return {
        ...config,
        showCaptions: true,
        largeTextMode: true,
        showAudioControls: false,
        layoutMode: 'visual-first',
      };

    case 'BLIND':
      return {
        ...config,
        showTextInput: false, // Can type but hard
        showVoiceInput: true,
        voiceInputPrimary: true,
        autoStartVoiceInput: true,
        autoPlayIncoming: true,
        showVisualIndicators: false,
        simplifiedLayout: true,
        layoutMode: 'audio-first',
      };

    case 'MUTE':
      return {
        ...config,
        showTextInput: true,
        showVoiceInput: false,
        layoutMode: 'visual-first',
      };

    case 'DEAF_BLIND':
      return {
        ...config,
        showTextInput: false,
        showVoiceInput: false,
        showBrailleInput: true,
        autoHapticFeedback: true,
        showVisualIndicators: false,
        showAudioControls: false,
        simplifiedLayout: true,
        highContrastMode: true,
        layoutMode: 'haptic-first',
      };

    case 'DEAF_MUTE':
      return {
        ...config,
        showTextInput: true,
        showVoiceInput: false,
        showAudioControls: false,
        showCaptions: true,
        largeTextMode: true,
        layoutMode: 'visual-first',
      };

    case 'BLIND_MUTE':
      return {
        ...config,
        showTextInput: false,
        showVoiceInput: true,
        voiceInputPrimary: true,
        autoStartVoiceInput: true,
        autoPlayIncoming: true,
        showVisualIndicators: false,
        simplifiedLayout: true,
        layoutMode: 'audio-first',
      };

    case 'DEAF_BLIND_MUTE':
      return {
        ...config,
        showTextInput: false,
        showVoiceInput: false,
        showBrailleInput: true,
        autoHapticFeedback: true,
        showVisualIndicators: false,
        showAudioControls: false,
        simplifiedLayout: true,
        highContrastMode: true,
        layoutMode: 'haptic-first',
      };

    default:
      return config;
  }
};
