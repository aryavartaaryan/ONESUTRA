import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * POST /api/transcribe-audio
 * Accepts a base64-encoded audio file and returns:
 *   { transcript: string, words: { word, startSec, endSec }[] }
 * Uses Gemini 2.5 Flash audio understanding.
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export async function POST(req: NextRequest) {
    try {
        const { audioBase64, mimeType = 'audio/webm' } = await req.json();
        if (!audioBase64) return NextResponse.json({ error: 'Missing audio' }, { status: 400 });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType,
                    data: audioBase64,
                }
            },
            `Transcribe this audio message exactly as spoken. 
Output a JSON object in this exact format (no markdown, just JSON):
{
  "transcript": "full text here",
  "words": [
    { "word": "hello", "startSec": 0.0, "endSec": 0.4 },
    ...
  ]
}
Be precise with word timings. If you cannot determine timings, estimate them evenly.`,
        ]);

        const raw = result.response.text().trim();

        // Extract JSON from response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            // Fallback — return plain transcript
            return NextResponse.json({ transcript: raw, words: [] });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
            transcript: parsed.transcript ?? raw,
            words: parsed.words ?? [],
        });
    } catch (err) {
        console.error('[transcribe-audio]', err);
        return NextResponse.json({ transcript: 'Transcription unavailable.', words: [] });
    }
}
