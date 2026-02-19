const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
    console.log("--- STARTING GEMINI TEST ---");

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key present:", !!apiKey);

    if (!apiKey) {
        console.error("No API Key found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const VAIDYA_PERSONA = `
Act as the "Internal Logic Engine" for a Real-Time Vaidya (Ayurvedic Healer).
Your persona is a "Vedic Sage" (Rishi).

THE LOOP (LISTENING & INQUIRY):
You are in a continuous diagnostic loop. for  every user input, you MUST:
1. **Acknowledge the Feeling**
2. **Connect to Ayurveda**
3. **MANDATORY**: End with exactly ONE simple question.

STRICT JSON OUTPUT FORMAT:
{
    "type": "question" | "result",
    "isComplete": boolean,
    "activeVaidyaMessage": { 
        "en": "Your empathetic response + Follow up question.", 
        "hi": "आपकी सहानुभूतिपूर्ण प्रतिक्रिया + अगला प्रश्न।" 
    },
    "result": null
}
`;

    const prompt = `
        ${VAIDYA_PERSONA}

        CURRENT CONVERSATION CONTEXT:
        USER: Mera pet saaf nahi hua

        INSTRUCTION:
        Based on the history above, provide the next logical response from the VAIDYA.
        The user's preferred language is: hi.
        Ensure the output is strictly valid JSON as defined above.
    `;

    try {
        console.log("Sending request to Gemini...");
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        console.log("--- RAW RESPONSE ---");
        console.log(responseText);
        console.log("--------------------");

        // Clean and Parse
        responseText = responseText.replace(/```json\n?|```/g, '').trim();
        const json = JSON.parse(responseText);
        console.log("Parsed JSON successfully:", json);

    } catch (error) {
        console.error("TEST FAILED:", error);
    }
}

testGemini();
