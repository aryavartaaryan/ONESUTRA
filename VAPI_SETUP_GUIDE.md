# Sevak Voice Call Setup Guide

## Prerequisites

Before using the voice call feature, you need to set up a Vapi.ai account  and configure your assistant.

## Step 1: Create Vapi.ai Account

1. Go to [https://vapi.ai](https://vapi.ai)
2. Sign up for an account
3. Verify your email

## Step 2: Create Your Sevak Assistant

1. Log in to your Vapi dashboard
2. Click "Create Assistant"
3. Configure the assistant with these settings:

### Basic Settings
- **Name**: Sevak - Digital Disciple
- **First Message**: "Namaste, I am the Acharya's Sevak. How may I assist your spiritual journey today?"

### System Prompt
```
You are "Sevak", the humble digital disciple of the Great Acharya.
Your purpose is to guide seekers through Ayurveda, Diet, and Yoga.

IDENTITY & TONE:
- Always begin with respectful greetings: "Namaste" or "Pranaam"
- Address users as "Seeker" or "Aatman"
- Your tone is selfless, calm, devoted, and peaceful
- Use phrases like: "As the Acharya teaches...", "According to the ancient Shastras..."
- Say "It is my humble duty to assist you"

LANGUAGE LOGIC:
- If user speaks Hindi, reply in Shuddh Hindi or Hinglish
- If user speaks English, reply in clear, peaceful English with Sanskrit terms
- If they mix both, you mix both naturally

VEDIC VOCABULARY (use these terms):
- "Bhojan" instead of "food"
- "Sadhana" instead of "practice"
- "Urja" instead of "energy"
- "Sharira" instead of "body"
- "Manas" instead of "mind"
- "Atman" instead of "soul"
- "Santulan" instead of "balance"
- "Swasthya" instead of "health"
- "Dhyana" instead of "meditation"
- "Prana" instead of "breath"
- "Shakti" instead of "strength"
- "Shanti" instead of "peace"
- "Gyan" instead of "wisdom"

DOMAIN KNOWLEDGE:
1. DIET: Provide Dosha-based recommendations (Vata, Pitta, Kapha)
   - Suggest sattvic foods
   - Explain food combinations
   - Recommend recipes from the Vedic Rasoi

2. YOGA/MEDITATION: Suggest specific Asanas or Dhyana techniques
   - Guide breathing exercises (Pranayama)
   - Explain meditation practices
   - Recommend daily routines

3. AYURVEDA: Holistic wellness and Dosha balance
   - Explain Prakriti (nature)
   - Identify Dosha imbalances
   - Suggest natural remedies

CONSTRAINTS:
- If asked medical questions beyond scope: "I am but a Sevak; for deep medical concerns, one must consult the Vaidya (Doctor) directly."
- Never use slang or casual language
- Stay within the domains of Diet, Yoga, and Ayurveda
- Do not provide medical diagnoses or prescriptions

STYLE OF SPEECH:
- Speak slowly and calmly
- Use pauses for emphasis
- Maintain a warm, devotional tone
- Be encouraging and supportive
```

### Voice Settings

#### Option 1: ElevenLabs (Recommended)
- **Provider**: ElevenLabs
- **Voice**: Choose a male voice with these characteristics:
  - Warm and breathy
  - Mid-range pitch
  - Calm and soothing
- **Settings**:
  - Stability: 0.7-0.8 (high for consistent tone)
  - Similarity: 0.8-0.9
  - Speed: 0.9x (slightly slower)

#### Option 2: PlayHT
- **Provider**: PlayHT
- **Voice**: Male, warm, conversational
- **Speed**: 0.9x

### Language Settings
- **Primary Language**: English
- **Additional Languages**: Hindi (enable multilingual support)
- **Auto-detect language**: Enabled

### Advanced Settings
- **Response Delay**: 0ms (for natural conversation)
- **End of Speech Sensitivity**: Medium
- **Background Sound**: None (or soft temple bells if available)

## Step 3: Get Your API Keys

1. In Vapi dashboard, go to "Settings" → "API Keys"
2. Copy your **Public Key**
3. Copy your **Assistant ID** (from the assistant you just created)

## Step 4: Configure Your Application

1. Open `.env.local` in your project
2. Replace the placeholder values:

```bash
VAPI_PUBLIC_KEY=pk_xxxxxxxxxxxxxxxxxxxxxxxx
VAPI_ASSISTANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

3. Save the file
4. Restart your development server:

```bash
npm run dev
```

## Step 5: Test the Voice Call

1. Open your application in a browser
2. Click the "Talk To Us" button on the homepage
3. You should see:
   - Full-screen modal with Ashram background
   - "Connecting to Sevak..." message
   - Pulsing golden Om circle
   - Voice waveform visualization

4. Sevak should greet you with:
   > "Namaste, I am the Acharya's Sevak. How may I assist your spiritual journey today?"

5. Start speaking naturally in Hindi or English

## Troubleshooting

### Issue: "Vapi public key not configured"
**Solution**: Make sure you've added `VAPI_PUBLIC_KEY` to `.env.local` and restarted the server.

### Issue: "Failed to get Vapi token"
**Solution**: Check that your API key is correct and active in the Vapi dashboard.

### Issue: No voice heard
**Solution**: 
- Check your browser's audio permissions
- Ensure your volume is not muted
- Try refreshing the page

### Issue: Connection fails immediately
**Solution**:
- Verify your Assistant ID is correct
- Check that the assistant is published (not in draft mode)
- Ensure your Vapi account has sufficient credits

### Issue: Voice sounds robotic
**Solution**:
- In Vapi dashboard, switch to ElevenLabs voice provider
- Adjust stability and similarity settings
- Choose a more natural-sounding voice

## Cost Management

### Monitor Usage
1. Go to Vapi dashboard → "Usage"
2. Set up usage alerts
3. Monitor minutes consumed

### Set Limits
- Implement max call duration (recommended: 15 minutes)
- Add user authentication
- Consider freemium model (e.g., 3 free calls/month)

### Estimated Costs
- **Per minute**: $0.05 - $0.15 (depending on voice provider)
- **Average 5-minute call**: $0.25 - $0.75
- **100 calls/month**: $25 - $75

## Advanced Configuration

### Custom Wake Word
You can configure a custom wake word in Vapi dashboard to activate the assistant.

### Background Sounds
Add subtle temple bells or ambient sounds in Vapi settings for enhanced atmosphere.

### Conversation Analytics
Enable conversation logging in Vapi to analyze user interactions and improve responses.

## Support

If you encounter issues:
1. Check Vapi documentation: [https://docs.vapi.ai](https://docs.vapi.ai)
2. Review browser console for errors
3. Test with a simple "Hello" to verify basic connectivity

## Next Steps

Once voice calls are working:
1. Fine-tune the system prompt based on user feedback
2. Adjust voice settings for optimal warmth
3. Monitor conversation quality
4. Add usage analytics
5. Consider implementing user authentication
