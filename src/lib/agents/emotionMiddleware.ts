import type { EmotionalToneResult } from '@/lib/agents/types';

export function analyzeInputEmotion(input: string): EmotionalToneResult {
    const text = (input ?? '').toLowerCase();
    const stressLexicon = [
        'panic',
        'overwhelmed',
        'anxious',
        'stressed',
        'burnout',
        'deadline',
        'pressure',
        'tired',
        'ghabra',
        'pareshan',
    ];

    const stressHits = stressLexicon.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
    const stressScore = Math.min(1, stressHits * 0.2 + (text.length > 260 ? 0.15 : 0));

    if (stressScore > 0.8) {
        return {
            stressScore,
            dominantEmotion: 'stressed',
            suggestedTone: 'calming',
            promptDirective:
                'Calming & Meditative mode enabled. Speak softly, reduce cognitive load, and suggest a guided 5-minute breathing exercise (inhale 4, hold 4, exhale 6).',
        };
    }

    if (stressScore > 0.45) {
        return {
            stressScore,
            dominantEmotion: 'focused',
            suggestedTone: 'focused',
            promptDirective: 'Maintain concise and grounded coaching with short actionable steps.',
        };
    }

    return {
        stressScore,
        dominantEmotion: 'calm',
        suggestedTone: 'neutral',
        promptDirective: 'Use a warm practical tone.',
    };
}

export function buildAdaptiveSystemInstruction(baseInstruction: string | undefined, userInput: string) {
    const emotion = analyzeInputEmotion(userInput);
    const mergedInstruction = baseInstruction
        ? `${baseInstruction}\n\nAdaptive emotional directive: ${emotion.promptDirective}`
        : `Adaptive emotional directive: ${emotion.promptDirective}`;

    return {
        emotion,
        systemInstruction: mergedInstruction,
        shouldSuggestBreathing: emotion.stressScore > 0.8,
    };
}
