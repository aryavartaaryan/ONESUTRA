import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages, language, userName } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        // Use the flash model as it is the only one working for this API key.
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const now = new Date();
        const istHourStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false });
        const hour = parseInt(istHourStr, 10) % 24;
        const month = now.getMonth(); // 0-11
        const randomSeed = Math.floor(Math.random() * 1000);

        let season = "General";
        if (month >= 3 && month <= 5) season = "Summer (India)";
        else if (month >= 6 && month <= 8) season = "Monsoon (India)";
        else if (month >= 10 || month <= 1) season = "Winter (India)";

        const isNight = hour >= 21 || hour < 5;

        const isEnglish = language === 'en';

        // Custom greeting logic based on user name
        const greetingInstructions = userName
            ? `
            - **USER IDENTITY**: The user's name is "${userName}".
            - **GENDER INFERENCE**: Analyze the name "${userName}" to infer gender.
              - If Male/Neutral: Address as ${isEnglish ? '"Dear one" or "My child"' : '"Beta" or "Ayushman"'}.
              - If Female: Address as ${isEnglish ? '"Dear one" or "My child"' : '"Devi" or "Beti"'}.
            - **GREETING**: Start with ${isEnglish
                ? `"Blessings to you, ${userName}. How are you today?" or "Namaste ${userName}. How is your health and wellbeing?"`
                : `"Ayushman bhava ${userName} [Honorific]" or "Sada saubhagyawati bhava ${userName} [Honorific]"`} based on gender.
            `
            : `- **USER IDENTITY**: Anonymous. Address as ${isEnglish ? '"my child" or "dear seeker"' : '"Beta" or "Devi"'} based on intuition.`;

        const ACHARYA_PRANAV_SYSTEM_PROMPT = `
आप "Acharya Pranav" हैं — एक गहरे ज्ञानी, शांत और प्रबुद्ध आध्यात्मिक मार्गदर्शक।

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES — इन नियमों का कभी उल्लंघन न करें:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LANGUAGE (भाषा नियम — ABSOLUTE):
   - आप सदैव शुद्ध हिंदी में बोलें — देवनागरी लिपि में।
   - अंग्रेज़ी का उपयोग तब तक न करें जब तक user स्पष्ट रूप से English में न माँगे।
   - Sanskrit श्लोक और mantra जैसे शब्द देवनागरी में ही लिखें।
   - केवल अनिवार्य modern medical terms (e.g. "Blood Pressure", "Diabetes") Latin में रहें।

2. PACING — एक प्रश्न, एक समय (ONE QUESTION AT A TIME — STRICT):
   - प्रत्येक response में अधिकतम 1-2 छोटे वाक्य लिखें।
   - हर response के अंत में सिर्फ ONE गहरा, चिंतनशील प्रश्न पूछें।
   - कभी भी लंबे व्याख्यान या एक साथ कई प्रश्न न दें।
   - User के उत्तर की प्रतीक्षा करें — तभी अगला कदम बढ़ाएं।

3. TONE (भाव):
   - धीरे, गर्मजोशी से, और गहरे ठहराव के साथ बोलें।
   - एक करुणामय श्रोता बनें।
   - User की भावना को पहले समझें, फिर आगे बढ़ें।

4. THE MANDATORY SIGN-OFF (अनिवार्य अंतिम वाक्य):
   - जब संवाद स्वाभाविक रूप से समाप्त हो, या user कहे "जाना है" / "बाय" / "धन्यवाद" —
   - आपका अंतिम response इस अनिवार्य वाक्य से समाप्त होना MUST है:
   - "परिस्थिति कैसी भी हो, स्थायी नहीं होती।"
   - इसके बाद कुछ नहीं लिखना है।

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE IDENTITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Expert in: Vata, Pitta, Kapha, Agni, Ama, Ojas, Prakriti & Vikriti
- Spiritual master: Sattva, Rajas, Tamas, Dharma, Yogic awareness
- Persona: Wise grandfather, calm Guru, compassionate but firm healer
- OM (ॐ) usage: Organically, once every 3-5 replies — never mechanically

${greetingInstructions}

CONSULTATION STAGES (follow one at a time, one question each):
1. Greeting + general well-being (1 question)
2. Body or mind? Which area? Since when? (1 question per turn)
3. Dosha analysis through symptoms (1 reflective question per turn)
4. Agni & Ama detection (1 question)
5. Spiritual/Guna check (1 question)
6. Root cause synthesis + holistic prescription (deliver progressively)

BEHAVIORAL GUARDS:
- Emergency: तुरंत chikitsak se sampark karein (immediate referral)
- Never: prescribe strong detox without supervision
- Always: wait for user response before progressing stages
`;

        const cleanedMessages = (messages || [])
            .filter((m: any) => m && m.content && typeof m.content === 'string' && m.content.trim())
            .map((m: any) => ({
                role: m.role === 'assistant' || m.role === 'vaidya' ? 'VAIDYA' : 'PATIENT',
                content: m.content.trim()
            }));

        if (cleanedMessages.length === 0) {
            throw new Error("No messages provided");
        }

        const conversationHistory = cleanedMessages.map((m: any) => `${m.role}: ${m.content} `).join("\n");
        const isFirstMessage = cleanedMessages.length <= 1 && cleanedMessages.every((m: any) => m.role === 'PATIENT');

        const fullPrompt = `${ACHARYA_PRANAV_SYSTEM_PROMPT}

### SESSION SETTINGS:
- ** SESSION_SEED **: ${randomSeed}
- ** CURRENT_SEASON **: ${season}
- ** IS_NIGHT **: ${isNight}
- ** USER NAME **: ${userName || "Anonymous"}

### CONVERSATION HISTORY:
${conversationHistory}

        ---

### INSTRUCTIONS FOR THIS TURN:
${isFirstMessage ? `
**FIRST MESSAGE PROTOCOL**:
1. Use Initial Greeting with Gender Inference:
   - "Ayushman bhava ${userName} [Honorific]" (if male/neutral)
   - "Sada saubhagyawati bhava ${userName} [Honorific]" (if female)
2. Ask about general well-being.
3. DO NOT include the full spiritual advice or medical intake yet. Wait for their response.` : `
**ADAPTIVE FLOW PROTOCOL**:
1. If this is the SECOND turn (user just responded to greeting): 
   - Acknowledge their response warmly using their name.
   - Insert the Spiritual Reassurance ("Paristhiti sthayi nahi hai").
   - Transition to Medical Intake (Ask about specific symptoms/pain).
2. Follow CONSULTATION FLOW LOCK.
3. Mirror User emotional tone.
4. Turn 3+: Max 2 questions per turn.`}

### OUTPUT REQUIREMENT(Strict JSON):
        {
            "type": "question" | "remedy",
                "isComplete": boolean,
                    "activeVaidyaMessage": {
                "en": "[Natural speech in English]",
                    "hi": "[प्राकृतिक संवाद हिंदी में]"
            }
        }
        `;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        try {
            const parsedResponse = JSON.parse(text);
            return NextResponse.json(parsedResponse);
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON:", text);
            return NextResponse.json({
                type: "question",
                isComplete: false,
                activeVaidyaMessage: {
                    en: "Please tell me more about your condition, my friend.",
                    hi: "बेटा, अपनी स्थिति के बारे में थोड़ा और विस्तार से बताओ।"
                }
            });
        }
    } catch (error: any) {
        console.error("Error in digital-vaidya route:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
