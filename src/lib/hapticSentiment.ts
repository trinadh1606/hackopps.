import { EMOTION_HAPTICS, PRIORITY_HAPTICS, CONTEXT_HAPTICS, HapticPattern, enhancedTextToHapticPattern } from './haptics';

export type EmotionType = 'joy' | 'sadness' | 'excitement' | 'calm' | 'anxiety' | 'anger' | 'love' | 'surprise';

export const detectMessageSentiment = (text: string): EmotionType => {
  const lowerText = text.toLowerCase();
  
  // Positive indicators
  const joyWords = ['happy', 'excited', 'wonderful', 'great', 'awesome', 'love', 'yay', '😊', '😄', '🎉'];
  const joyCount = joyWords.filter(word => lowerText.includes(word)).length;
  
  // Negative indicators
  const sadWords = ['sad', 'sorry', 'upset', 'disappointed', 'miss', '😢', '😔'];
  const sadCount = sadWords.filter(word => lowerText.includes(word)).length;
  
  // Love indicators
  const loveWords = ['love', 'adore', 'cherish', '❤️', '💕'];
  const loveCount = loveWords.filter(word => lowerText.includes(word)).length;
  
  // Excitement indicators
  const excitementIndicators = lowerText.includes('!!!') || lowerText.includes('!!') || 
                                lowerText.includes('amazing') || lowerText.includes('incredible');
  
  // Calm indicators
  const calmWords = ['okay', 'alright', 'fine', 'peaceful', 'relaxed'];
  const calmCount = calmWords.filter(word => lowerText.includes(word)).length;
  
  // Urgency/Anxiety
  const urgentWords = ['urgent', 'hurry', 'quick', 'emergency', 'help'];
  const urgentCount = urgentWords.filter(word => lowerText.includes(word)).length;
  
  // Anger indicators
  const angerWords = ['angry', 'mad', 'furious', 'annoyed', 'frustrated'];
  const angerCount = angerWords.filter(word => lowerText.includes(word)).length;
  
  // Surprise indicators
  const surpriseWords = ['wow', 'omg', 'what', 'surprise', 'shocked', '😲', '😮'];
  const surpriseCount = surpriseWords.filter(word => lowerText.includes(word)).length;
  
  // Determine dominant emotion
  if (urgentCount > 0) return 'anxiety';
  if (angerCount > 0) return 'anger';
  if (surpriseCount > 0) return 'surprise';
  if (loveCount > 0) return 'love';
  if (excitementIndicators || joyCount > 2) return 'excitement';
  if (joyCount > sadCount && joyCount > 0) return 'joy';
  if (sadCount > joyCount && sadCount > 0) return 'sadness';
  if (calmCount > 0) return 'calm';
  
  // Default to calm for neutral messages
  return 'calm';
};

export const getHapticForMessage = (
  message: string, 
  priority: string = 'normal'
): HapticPattern => {
  const sentiment = detectMessageSentiment(message);
  const emotionPattern = EMOTION_HAPTICS[sentiment];
  const priorityPattern = PRIORITY_HAPTICS[priority.toLowerCase() as keyof typeof PRIORITY_HAPTICS] || PRIORITY_HAPTICS.normal;
  
  // Combine priority prefix + emotion pattern + text pattern
  return {
    sequence: [
      ...priorityPattern.sequence,
      200, // Pause between priority and content
      ...emotionPattern.sequence,
      200, // Pause between emotion and text
      ...enhancedTextToHapticPattern(message).sequence
    ]
  };
};

export const getContextHaptic = (text: string): HapticPattern | null => {
  const lowerText = text.toLowerCase();
  
  if (text.trim().endsWith('?')) return CONTEXT_HAPTICS.question;
  if (lowerText.includes('yes') || lowerText.includes('agree')) return CONTEXT_HAPTICS.agreement;
  if (lowerText.includes('no') || lowerText.includes('disagree')) return CONTEXT_HAPTICS.disagreement;
  if (lowerText.includes('hello') || lowerText.includes('hi')) return CONTEXT_HAPTICS.greeting;
  if (lowerText.includes('bye') || lowerText.includes('goodbye')) return CONTEXT_HAPTICS.farewell;
  
  return null;
};
