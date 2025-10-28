// Audio vocabulary library for multimodal communication

export interface AudioCue {
  frequencies: number[];
  durations: number[];
  waveType: 'sine' | 'square' | 'sawtooth' | 'triangle';
  volume: number;
  envelope?: { attack: number; decay: number; sustain: number; release: number };
}

export const AUDIO_CUES = {
  message: {
    incoming: { 
      frequencies: [261.63, 329.63, 392.00], 
      durations: [200], 
      waveType: 'sine' as const, 
      volume: 0.3 
    },
    outgoing: { 
      frequencies: [392.00, 329.63, 261.63], 
      durations: [200], 
      waveType: 'sine' as const, 
      volume: 0.3 
    },
    ai: { 
      frequencies: [261.63, 329.63, 392.00], 
      durations: [100, 100, 200], 
      waveType: 'sine' as const, 
      volume: 0.3 
    },
  },
  priority: {
    normal: { 
      frequencies: [440], 
      durations: [100], 
      waveType: 'sine' as const, 
      volume: 0.2 
    },
    important: { 
      frequencies: [440], 
      durations: [150], 
      waveType: 'square' as const, 
      volume: 0.3 
    },
    urgent: { 
      frequencies: [440], 
      durations: [200], 
      waveType: 'sawtooth' as const, 
      volume: 0.4 
    },
  },
  status: {
    sent: { 
      frequencies: [800, 400], 
      durations: [50, 50], 
      waveType: 'sine' as const, 
      volume: 0.2 
    },
    delivered: { 
      frequencies: [600, 600], 
      durations: [50, 50], 
      waveType: 'sine' as const, 
      volume: 0.2 
    },
    read: { 
      frequencies: [523.25, 659.25], 
      durations: [150], 
      waveType: 'sine' as const, 
      volume: 0.3 
    },
    failed: { 
      frequencies: [200], 
      durations: [300], 
      waveType: 'sawtooth' as const, 
      volume: 0.4 
    },
  },
  navigation: {
    buttonFocus: { 
      frequencies: [100], 
      durations: [30], 
      waveType: 'sine' as const, 
      volume: 0.15 
    },
    buttonPress: { 
      frequencies: [200], 
      durations: [50], 
      waveType: 'sine' as const, 
      volume: 0.25 
    },
    back: { 
      frequencies: [400, 300], 
      durations: [100, 100], 
      waveType: 'sine' as const, 
      volume: 0.2 
    },
    error: { 
      frequencies: [100, 100, 100], 
      durations: [50, 50, 50], 
      waveType: 'square' as const, 
      volume: 0.3 
    },
  },
  emotion: {
    happy: { 
      frequencies: [261.63, 329.63, 392.00], 
      durations: [100, 100, 100], 
      waveType: 'sine' as const, 
      volume: 0.3 
    },
    sad: { 
      frequencies: [220.00, 261.63, 329.63], 
      durations: [400], 
      waveType: 'sine' as const, 
      volume: 0.25 
    },
    excited: { 
      frequencies: [261.63, 293.66, 329.63, 349.23, 392.00], 
      durations: [50, 50, 50, 50, 50], 
      waveType: 'sine' as const, 
      volume: 0.35 
    },
    calm: { 
      frequencies: [261.63, 329.63, 392.00], 
      durations: [500], 
      waveType: 'sine' as const, 
      volume: 0.2 
    },
  },
};

export const playAudioCue = async (
  cue: AudioCue, 
  customContext?: AudioContext
): Promise<void> => {
  const audioContext = customContext || new (window.AudioContext || (window as any).webkitAudioContext)();
  let currentTime = audioContext.currentTime;

  for (let i = 0; i < cue.frequencies.length; i++) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = cue.frequencies[i];
    oscillator.type = cue.waveType;

    const duration = (cue.durations[i] || cue.durations[0]) / 1000;

    if (cue.envelope) {
      const { attack, decay, sustain, release } = cue.envelope;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(cue.volume, currentTime + attack);
      gainNode.gain.linearRampToValueAtTime(cue.volume * sustain, currentTime + attack + decay);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
    } else {
      gainNode.gain.setValueAtTime(cue.volume, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
    }

    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);

    currentTime += duration;
  }
};

// Braille dot-specific audio tones
export const BRAILLE_DOT_FREQUENCIES = {
  dot1: 261.63, // C4
  dot2: 293.66, // D4
  dot3: 329.63, // E4
  dot4: 349.23, // F4
  dot5: 392.00, // G4
  dot6: 440.00, // A4
};

export const playBrailleDotTone = async (dotNumber: number, volume: number = 0.3): Promise<void> => {
  const frequencies = [
    BRAILLE_DOT_FREQUENCIES.dot1,
    BRAILLE_DOT_FREQUENCIES.dot2,
    BRAILLE_DOT_FREQUENCIES.dot3,
    BRAILLE_DOT_FREQUENCIES.dot4,
    BRAILLE_DOT_FREQUENCIES.dot5,
    BRAILLE_DOT_FREQUENCIES.dot6,
  ];

  const cue: AudioCue = {
    frequencies: [frequencies[dotNumber]],
    durations: [100],
    waveType: 'sine',
    volume,
  };

  await playAudioCue(cue);
};

export const playBrailleChord = async (activeDots: boolean[], volume: number = 0.3): Promise<void> => {
  const frequencies = activeDots
    .map((active, index) => active ? Object.values(BRAILLE_DOT_FREQUENCIES)[index] : null)
    .filter(Boolean) as number[];

  if (frequencies.length === 0) return;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = volume;

  frequencies.forEach(freq => {
    const oscillator = audioContext.createOscillator();
    oscillator.connect(gainNode);
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  });
};
