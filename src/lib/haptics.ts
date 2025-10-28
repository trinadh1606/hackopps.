// Haptics utilities for vibration and audio fallback

export interface HapticPattern {
  sequence: number[]; // alternating [duration, pause, duration, pause...]
}

export const playHapticPattern = async (pattern: HapticPattern, strength: number = 1.0): Promise<void> => {
  const adjustedSequence = pattern.sequence.map(val => Math.round(val * strength));
  
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(adjustedSequence);
      return;
    } catch (error) {
      console.warn('Vibration not supported, falling back to audio', error);
    }
  }

  // Fallback to audio ticks for iOS and unsupported devices
  await playAudioTicks(adjustedSequence);
};

const playAudioTicks = async (sequence: number[]): Promise<void> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  let currentTime = audioContext.currentTime;

  for (let i = 0; i < sequence.length; i += 2) {
    const duration = sequence[i] / 1000; // convert ms to seconds
    const pause = (sequence[i + 1] || 0) / 1000;

    // Create a short beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440; // A4 note
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);

    currentTime += duration + pause;
  }
};

export const textToHapticPattern = (text: string): HapticPattern => {
  // Simple mapping: each word gets a pattern
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const sequence: number[] = [];

  for (const word of words) {
    if (word.length <= 3) {
      sequence.push(100, 100); // short word: brief pulse
    } else if (word.length <= 6) {
      sequence.push(200, 100); // medium word: medium pulse
    } else {
      sequence.push(300, 100); // long word: long pulse
    }
  }

  // Cap at 6 seconds total
  const totalDuration = sequence.reduce((sum, val) => sum + val, 0);
  if (totalDuration > 6000) {
    const scale = 6000 / totalDuration;
    return { sequence: sequence.map(v => Math.round(v * scale)) };
  }

  return { sequence };
};

export const HAPTIC_PRESETS = {
  notification: { sequence: [200, 100, 200] },
  success: { sequence: [100, 50, 100, 50, 100] },
  error: { sequence: [500, 200, 500] },
  alert: { sequence: [300, 200, 300, 200, 300] },
  sos: { sequence: [100, 100, 100, 300, 300, 300, 300, 100, 100, 100] }, // SOS Morse
};

// Emotion-based haptic patterns - IMPROVED DISTINCTIVENESS
export const EMOTION_HAPTICS = {
  joy: { sequence: [40, 40, 60, 40, 80, 40, 100, 40, 120] }, // Rising pattern (happy)
  sadness: { sequence: [400, 300, 350, 300, 400, 400] }, // Long, slow, heavy
  excitement: { sequence: [25, 25, 25, 25, 25, 25, 50, 50, 100, 25, 25, 25, 25] }, // Rapid bursts
  calm: { sequence: [250, 150, 250, 150, 250, 150] }, // Slow, steady rhythm
  anxiety: { sequence: [80, 30, 120, 40, 90, 35, 110, 45, 95] }, // Irregular, jittery
  anger: { sequence: [200, 50, 200, 50, 250, 50, 250] }, // Strong, aggressive
  love: { sequence: [100, 80, 100, 300, 100, 80, 100] }, // Heartbeat pattern
  surprise: { sequence: [400, 600, 80, 80, 80] }, // Long pause then burst
};

// Priority-based haptic patterns - MUCH MORE DISTINCT
export const PRIORITY_HAPTICS = {
  low: { sequence: [80, 250, 80] }, // Two gentle taps
  normal: { sequence: [100, 100, 100, 100, 150] }, // Standard rhythm
  high: { sequence: [150, 80, 150, 80, 200, 80, 250] }, // Increasing intensity
  urgent: { sequence: [250, 80, 250, 80, 300, 80, 300, 80, 350] }, // Strong, fast, escalating
  emergency: { sequence: [150, 100, 150, 100, 400, 400, 400, 150, 100, 150, 100] }, // SOS-like pattern
};

// Context-based haptic patterns
export const CONTEXT_HAPTICS = {
  question: { sequence: [50, 50, 75, 50, 100, 50, 125, 50, 150] },
  answer: { sequence: [150, 50, 125, 50, 100, 50, 75, 50, 50] },
  greeting: { sequence: [100, 80, 120, 80, 140, 80, 120, 80, 100] },
  farewell: { sequence: [140, 80, 120, 100, 100, 120, 80, 150, 60] },
  agreement: { sequence: [100, 50, 100, 100, 200] },
  disagreement: { sequence: [150, 100, 150, 200, 200] },
};

// Enhanced text to haptic with keyword detection
export const enhancedTextToHapticPattern = (text: string): HapticPattern => {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const sequence: number[] = [];
  
  // Common important words get distinctive patterns
  const importantWords: Record<string, number[]> = {
    'help': PRIORITY_HAPTICS.urgent.sequence,
    'emergency': PRIORITY_HAPTICS.emergency.sequence,
    'urgent': PRIORITY_HAPTICS.urgent.sequence,
    'important': PRIORITY_HAPTICS.high.sequence,
    'please': [80, 80, 120, 80, 80],
    'thank': [100, 80, 100, 80, 150],
    'sorry': EMOTION_HAPTICS.sadness.sequence.slice(0, 5),
    'love': EMOTION_HAPTICS.love.sequence.slice(0, 7),
    'yes': CONTEXT_HAPTICS.agreement.sequence,
    'no': CONTEXT_HAPTICS.disagreement.sequence,
  };
  
  // Question detection
  const isQuestion = text.trim().endsWith('?');
  if (isQuestion) {
    sequence.push(...CONTEXT_HAPTICS.question.sequence);
    sequence.push(300); // Long pause before question content
  }
  
  for (const word of words) {
    if (importantWords[word]) {
      sequence.push(...importantWords[word]);
    } else if (word.length <= 3) {
      sequence.push(80, 100);
    } else if (word.length <= 6) {
      sequence.push(150, 100);
    } else {
      sequence.push(250, 100);
    }
  }
  
  // Limit total duration to 8 seconds
  const totalDuration = sequence.reduce((sum, val) => sum + val, 0);
  if (totalDuration > 8000) {
    const scale = 8000 / totalDuration;
    return { sequence: sequence.map(v => Math.round(v * scale)) };
  }
  
  return { sequence };
};
