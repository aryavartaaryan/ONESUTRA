import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

export async function POST(request: NextRequest) {
    try {
        const { text, voice = 'Aoede' } = await request.json();

        if (!text?.trim()) {
            return NextResponse.json({ error: 'Text required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (!part?.inlineData?.data) {
            return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
        }

        return NextResponse.json({
            audio: part.inlineData.data,
            mimeType: part.inlineData.mimeType ?? 'audio/wav',
        });

    } catch (error) {
        console.error('[TTS] Gemini TTS error:', error);
        return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
    }
}
