'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────────
const BODHI_CHAT_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const OUTPUT_SAMPLE_RATE = 24000;

// ── Types ─────────────────────────────────────────────────────────────────────
export type BodhiChatState = 'idle' | 'connecting' | 'ready' | 'thinking' | 'speaking' | 'error';

export interface BodhiChatTask {
    id: string;
    text: string;
    done: boolean;
    category?: string;
    startTime?: string;
}

export interface BodhiMessage {
    role: 'user' | 'bodhi';
    text: string;
    timestamp: number;
}

const MAX_HISTORY_TURNS = 50;
const HISTORY_CONTEXT_TURNS = 10;

// ── isTaskDue: returns true only for tasks that are due now or overdue ─────────
function isTaskDue(startTime?: string): boolean {
    if (!startTime) return true;
    const s = startTime.toLowerCase().trim();
    // Future-day keywords → not due yet
    if (/\btomorrow\b|\bkal\b|\bnext\s+\w+|\bagle\b|\bparson\b|परसों|कल/.test(s)) return false;
    // Parse clock time
    const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|बजे)?/i);
    if (!m) {
        const dayMatch = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
        if (dayMatch && parseInt(dayMatch[1]) > new Date().getDate()) return false;
        return true;
    }
    let h = parseInt(m[1]);
    const min = parseInt(m[2] || '0');
    const ap = m[3]?.toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    else if (ap === 'am' && h === 12) h = 0;
    else if (!ap) {
        if (/\b(evening|shaam|raat|night|afternoon|dopahar)\b/.test(s) && h < 12) h += 12;
    }
    const taskTime = new Date(); taskTime.setHours(h, min, 0, 0);
    // Due if already past OR starts within next 30 min
    return taskTime.getTime() - Date.now() <= 30 * 60 * 1000;
}

async function saveConversationHistory(uid: string, newTurns: BodhiMessage[]): Promise<void> {
    if (newTurns.length === 0) return;
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, getDoc, setDoc, collection, addDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();

        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        const existing: BodhiMessage[] = snap.exists() ? (snap.data()?.bodhi_history ?? []) : [];
        const merged = [...existing, ...newTurns].slice(-MAX_HISTORY_TURNS);
        await setDoc(ref, { bodhi_history: merged }, { merge: true });

        const transcriptRef = collection(db, 'users', uid, 'bodhi_full_transcript');
        for (const turn of newTurns) {
            await addDoc(transcriptRef, {
                role: turn.role,
                text: turn.text,
                timestamp: turn.timestamp,
                savedAt: Date.now()
            });
        }
    } catch (e) {
        console.warn('[Bodhi] Could not save conversation history to Firebase', e);
    }
}

async function loadConversationHistory(uid: string, userName: string): Promise<{ history: string; lastTimestamp: number | null }> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return { history: '', lastTimestamp: null };
        const data = snap.data();
        const history: BodhiMessage[] = data?.bodhi_history ?? [];

        const lastTimestamp = history.length > 0 ? history[history.length - 1].timestamp : null;
        const recentTurns = history.slice(-HISTORY_CONTEXT_TURNS);
        if (recentTurns.length === 0) return { history: '', lastTimestamp };

        const historyStr = recentTurns
            .map(m => (m.role === 'user' ? userName : 'Bodhi') + ': ' + m.text)
            .join('\n');

        return { history: historyStr, lastTimestamp };
    } catch (e) {
        console.warn('[Bodhi] Could not load conversation history from Firebase', e);
        return { history: '', lastTimestamp: null };
    }
}

interface UseBodhiChatVoiceOptions {
    userName: string;
    preferredLanguage?: 'hi' | 'en';
    pendingTasks: BodhiChatTask[];
    userId: string | null;
    userMood?: string;
    /** Called with full text reply when Bodhi finishes a turn */
    onMessage: (text: string) => void;
    /** Called to persist a new task */
    onAddTask?: (task: Record<string, unknown>) => Promise<void>;
    /** Called to remove a task by ID */
    onRemoveTask?: (taskId: string) => Promise<void>;
}

function sanitizeBodhiReply(text: string, preferredLanguage: 'hi' | 'en'): string {
    // CRITICAL: Remove all internal thinking, meta-commentary, and reasoning
    const internalPatterns = [
        // Internal thinking markers
        /\[?[Tt]hinking:.*?\]?/gi,
        /\[?[Ii]nternal:.*?\]?/gi,
        /\[?[Rr]easoning:.*?\]?/gi,
        /\[?[Pp]lanning:.*?\]?/gi,
        /\[?[Aa]nalysis:.*?\]?/gi,
        // Meta instruction leakage
        /provided instructions/gi,
        /responding warmly is the goal/gi,
        /in line with the provided instructions/gi,
        /i will greet the user/gi,
        /acknowledge and inquire/gi,
        /time context/gi,
        /I need to (respond|reply|say)/gi,
        /I should (respond|reply|say|ask)/gi,
        /Let me (respond|reply|say|ask|think)/gi,
        /My response:?/gi,
        /My thoughts:?/gi,
        /Now I'll/gi,
        /First,? I/gi,
        /Next,? I/gi,
        // Parenthetical thinking
        /\([^)]*(?:think|plan|reason|analyze|consider)[^)]*\)/gi,
        // Bullet thinking markers
        /^\s*[•\-\*]\s*(?:thinking|planning|reasoning|analysis):?/gim,
        // Step markers
        /\b[Ss]tep \d+:.*?$/gim,
        // JSON-like structures
        /\{[^}]*(?:task|idea|challenge|issue)[^}]*\}/gi,
        // Process descriptions
        /[Ll]et me (break this down|analyze this|think through this|process this)/gi,
        /[Ii]n order to/gi,
        /[Ss]o,? (?:I'll|I will|I need to|I should)/gi,
    ];

    const headerPattern = /^(\*\*.*\*\*|#{1,6}\s+.*)$/;

    let cleaned = text
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .filter(line => !headerPattern.test(line))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Apply all internal pattern filters
    for (const pattern of internalPatterns) {
        cleaned = cleaned.replace(pattern, '');
    }

    // Clean up artifacts
    cleaned = cleaned
        .replace(/\s+/g, ' ')
        .replace(/\[\s*\]/g, '')
        .replace(/\(\s*\)/g, '')
        .replace(/^\s*[•\-\*]\s*/g, '')
        .trim();

    // Fallback if cleaned text is too short or still contains meta content
    const metaCheckPattern = /(?:thinking|reasoning|planning|analysis|instructions|prompt|system)/i;
    if (!cleaned || cleaned.length < 5 || metaCheckPattern.test(cleaned)) {
        return preferredLanguage === 'en'
            ? 'I am here with you. What would you like to do next?'
            : 'मैं आपके साथ हूँ। अब आप क्या करना चाहते हैं?';
    }

    return cleaned;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useBodhiChatVoice({
    userName,
    preferredLanguage = 'hi',
    pendingTasks,
    userId,
    userMood = '',
    onMessage,
    onAddTask,
    onRemoveTask,
}: UseBodhiChatVoiceOptions) {
    const [chatState, setChatState] = useState<BodhiChatState>('idle');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Memory State
    const [memories, setMemories] = useState<string[]>([]);
    const [conversationHistory, setConversationHistory] = useState('');
    const [timeGapStr, setTimeGapStr] = useState('This is your first conversation for now.');

    // Session & audio
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionRef = useRef<any>(null);
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const isConnectedRef = useRef(false);
    const textBufferRef = useRef('');

    // Memory Refs (for syncing with connect closure)
    const memoriesRef = useRef<string[]>([]);
    const conversationHistoryRef = useRef('');
    const timeGapStrRef = useRef('This is your first conversation for now.');

    // Stable refs for mutable props
    const userNameRef = useRef(userName);
    const preferredLanguageRef = useRef<'hi' | 'en'>(preferredLanguage);
    const tasksRef = useRef(pendingTasks);
    const userIdRef = useRef(userId);
    const onMessageRef = useRef(onMessage);
    const onAddTaskRef = useRef(onAddTask);
    const onRemoveTaskRef = useRef(onRemoveTask);
    const userMoodRef = useRef(userMood);

    useEffect(() => { userNameRef.current = userName; }, [userName]);
    useEffect(() => { preferredLanguageRef.current = preferredLanguage; }, [preferredLanguage]);
    useEffect(() => { tasksRef.current = pendingTasks; }, [pendingTasks]);
    useEffect(() => { userIdRef.current = userId; }, [userId]);
    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
    useEffect(() => { onAddTaskRef.current = onAddTask; }, [onAddTask]);
    useEffect(() => { onRemoveTaskRef.current = onRemoveTask; }, [onRemoveTask]);
    useEffect(() => { userMoodRef.current = userMood; }, [userMood]);

    // Keep memory refs synced for buildSystemPrompt
    useEffect(() => { memoriesRef.current = memories; }, [memories]);
    useEffect(() => { conversationHistoryRef.current = conversationHistory; }, [conversationHistory]);
    useEffect(() => { timeGapStrRef.current = timeGapStr; }, [timeGapStr]);

    // Fetch memory and history on mount / userId change
    useEffect(() => {
        let cancelled = false;
        if (!userId) {
            setMemories([]);
            setConversationHistory('');
            setTimeGapStr('This is your first conversation for now.');
            return;
        }

        (async () => {
            try {
                // Load Memory
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, getDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const snap = await getDoc(doc(db, 'users', userId));
                if (cancelled) return;
                const rawMemories = snap.exists() ? snap.data()?.bodhi_memories : [];
                setMemories(Array.isArray(rawMemories) ? rawMemories : []);

                // Load History
                const { history, lastTimestamp } = await loadConversationHistory(userId, userNameRef.current);
                if (cancelled) return;
                setConversationHistory(history);

                let gapStr = 'This is your first conversation for now.';
                if (lastTimestamp) {
                    const gapMs = Date.now() - lastTimestamp;
                    const timeGapMins = Math.floor(gapMs / (1000 * 60));
                    const hours = Math.floor(timeGapMins / 60);
                    const days = Math.floor(hours / 24);

                    const lastDate = new Date(lastTimestamp);
                    const isToday = new Date().toDateString() === lastDate.toDateString();
                    const dayStr = isToday ? 'today' : (days === 1 ? 'yesterday' : `${days} days ago`);
                    const timeOfDay = lastDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                    let gapLabel: string;
                    let examplePhrase: string;
                    if (timeGapMins < 2) {
                        gapLabel = `abhi abhi — sirf ${timeGapMins < 1 ? 'kuch seconds' : timeGapMins + ' minute'} pehle`;
                        examplePhrase = `Seamlessly continue — e.g. "Abhi-abhi humne baat ki thi — kuch reh gaya tha kya?"`;
                    } else if (timeGapMins < 10) {
                        gapLabel = `bas ${timeGapMins} minute pehle (${timeOfDay})`;
                        examplePhrase = `"Abhi kuch hi der pehle baat kar rahe the — aap wapas aa gaye, achha laga."`;
                    } else if (timeGapMins < 60) {
                        gapLabel = `${timeGapMins} minute pehle (${timeOfDay} baje)`;
                        examplePhrase = `"Humne bas ${timeGapMins} minute pehle baat ki thi — uss baat se aage kuch naya aaya?"`;
                    } else if (hours < 4 && isToday) {
                        gapLabel = `kuch ghante pehle — ${hours} ghante pehle (${timeOfDay} baje)`;
                        examplePhrase = `"Kuch ghante pehle ${timeOfDay} ko humari baat hui thi — kaisa raha baad mein?"`;
                    } else if (hours < 24 && isToday) {
                        gapLabel = `aaj ${timeOfDay} baje (${hours} ghante pehle)`;
                        examplePhrase = `"Aaj ${timeOfDay} baje jo humne baat ki thi — uske baad din kaisa gaya?"`;
                    } else if (days === 1) {
                        gapLabel = `kal ${timeOfDay} baje`;
                        examplePhrase = `"Kal ${timeOfDay} baje humari baat hui thi — ek din mein kuch badla?"`;
                    } else {
                        gapLabel = `${days} din pehle (${timeOfDay} baje)`;
                        examplePhrase = `"${days} din ho gaye the humari baat ko — kaisa chal raha hai sab?"`;
                    }
                    gapStr = `[TIME AWARENESS — USE IN 2ND OR 3RD LINE, NEVER in the first line]
Pichli baat: ${gapLabel} (${dayStr} ko).
Example 2nd line (style only, not verbatim): ${examplePhrase}
RULE: Your FIRST line MUST be the elegant Sanskrit greeting from rule 6. Then your SECOND or THIRD sentence naturally weaves in when you last spoke. Be warm and specific — say the actual time/day. NEVER lead the first line with the time-gap reference.`;
                }
                setTimeGapStr(gapStr);

            } catch (err) {
                console.warn('Could not load Bodhi context from Firebase');
            }
        })();

        return () => { cancelled = true; };
    }, [userId]);

    // ── Audio helpers ──────────────────────────────────────────────────────────
    const base64PCMToFloat32 = useCallback((b64: string): Float32Array => {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pcm16 = new Int16Array(bytes.buffer);
        const f32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 0x8000;
        return f32;
    }, []);

    const applyCrossfade = useCallback((data: Float32Array): Float32Array => {
        const fadeLen = Math.min(64, Math.floor(data.length / 4));
        const out = new Float32Array(data);
        for (let i = 0; i < fadeLen; i++) {
            const t = i / fadeLen;
            out[i] *= t;
            out[data.length - 1 - i] *= t;
        }
        return out;
    }, []);

    const playNextAudio = useCallback(() => {
        if (audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            if (isConnectedRef.current) setChatState('ready');
            return;
        }
        isPlayingRef.current = true;
        setIsSpeaking(true);
        setChatState('speaking');

        // Coalesce tiny chunks into ≥100 ms
        let chunk = audioQueueRef.current.shift()!;
        while (audioQueueRef.current.length > 0 && chunk.length < OUTPUT_SAMPLE_RATE * 0.1) {
            const next = audioQueueRef.current.shift()!;
            const merged = new Float32Array(chunk.length + next.length);
            merged.set(chunk);
            merged.set(next, chunk.length);
            chunk = merged;
        }

        const ctx = playbackCtxRef.current;
        if (!ctx) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            if (isConnectedRef.current) setChatState('ready');
            return;
        }

        const smoothed = applyCrossfade(chunk);
        const buf = ctx.createBuffer(1, smoothed.length, OUTPUT_SAMPLE_RATE);
        buf.getChannelData(0).set(smoothed);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.value = 1.0;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.onended = () => playNextAudio();
        src.start();
    }, [applyCrossfade]);

    const enqueueAudio = useCallback((data: Float32Array) => {
        audioQueueRef.current.push(data);
        if (!isPlayingRef.current) playNextAudio();
    }, [playNextAudio]);

    // ── System prompt ──────────────────────────────────────────────────────────
    const buildSystemPrompt = useCallback((): string => {
        const firstName = (userNameRef.current || 'Mitra').split(' ')[0];
        const istStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false });
        const h = parseInt(istStr, 10) % 24;
        const phase = (h >= 3 && h < 12) ? 'morning' : (h >= 12 && h < 16) ? 'noon' : (h >= 16 && h < 21) ? 'evening' : 'night';
        const istTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        const pendingList = tasksRef.current
            .filter(t => !t.done && isTaskDue(t.startTime)).slice(0, 6)
            .map(t => `- ${t.text}${t.startTime ? ` (due ${t.startTime})` : ''}`)
            .join('\n') || '(none due right now)';
        const futureTasks = tasksRef.current
            .filter(t => !t.done && !isTaskDue(t.startTime))
            .map(t => `- ${t.text} (scheduled: ${t.startTime})`).join('\n');
        const languageLine = preferredLanguageRef.current === 'en'
            ? `LANGUAGE: You MUST speak exclusively in ENGLISH. Do not use Hindi or Hinglish words.`
            : `LANGUAGE: You MUST speak exclusively in Hindi (Devanagari script). Do not use English words, Hinglish, or romanized Hindi.`;

        const memoriesBlock = memoriesRef.current.length > 0
            ? `\n🧠 MEMORIES OF ${firstName} (Implicitly use these to personalize your advice):\n` + memoriesRef.current.map(m => `- ${m}`).join('\n')
            : '';

        const moodLine = userMoodRef.current
            ? `\n💫 ${firstName}'s CURRENT MOOD (User-stated): ${userMoodRef.current}\n→ This is the PRIMARY mood signal. Immediately calibrate your tone, energy, and suggestions to match. A sad mood needs gentle warmth. An excited mood needs matched energy. A tired mood needs soft, easy conversation.\n`
            : '';

        const historyBlock = conversationHistoryRef.current
            ? `\nPREVIOUS CONVERSATION — READ CAREFULLY:\n(This is what you and ${firstName} just talked about before this new session. Acknowledge continuity!)\n${conversationHistoryRef.current}\n\n${timeGapStrRef.current}\n`
            : `\n${timeGapStrRef.current}\n`;

        return `You are Bodhi — ${firstName}'s smart, non-judgmental friend and modern wellness guide. You seamlessly blend high-performance productivity with subtle holistic Vedic wisdom.

This is the BODHI CHAT interface. Your responses appear as BOTH spoken audio AND text in chat.

CRITICAL OUTPUT RULE: ONLY output your final spoken words to ${firstName}. NEVER output thinking steps, reasoning, planning, analysis, internal notes, or meta-commentary.

CURRENT TIME: ${phase.toUpperCase()} — ${istTime} IST. Today: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}.
${historyBlock}${memoriesBlock}
DUE NOW / OVERDUE TASKS for ${firstName}:
${pendingList}
${futureTasks ? `\nSCHEDULED FOR LATER (not due yet — do NOT treat as pending):
${futureTasks}` : ''}

════════════════════════════════════════════════════════════════
🌟 CORE DIRECTIVES (OMNI-AWARENESS & EVENT ROUTING)
════════════════════════════════════════════════════════════════
You act as the bridge to all Home Page hubs: Work, Logs, and Relationships.
SILENT EXECUTION FIRST: Operate dynamically based on explicit voice commands OR hidden [UI_EVENT] flags sent by the frontend. Always execute the appropriate tool/function silently BEFORE generating your spoken response.
NO YAPPING: Keep your spoken responses under 3 sentences unless actively guiding a meditation or conducting a deep diagnostic.

Handle the following [UI_EVENT] triggers with these specific behaviors:
1. IF [UI_EVENT: WORK_CLICKED]:
   - Acknowledge the Work/Productivity hub.
   - Greeting Example: "Let's lock in. Are we tackling a new challenge, dropping an idea, or setting up a task for today?"
   - Action: If they set a task, trigger \`add_sankalpa_task\` (as create_task). If logging a challenge, trigger \`log_activity\` (as save_work_log).
2. IF [UI_EVENT: LOGS_CLICKED]:
   - Check the current local time to provide context.
   - Morning Greeting: "Morning! Ready to set the vibe for today? We can log your sleep, hydration, or a quick mindfulness session."
   - Evening Greeting: "Good evening. Time to wind down. Want to log your daily wins, your intermittent fasting window, or your sleep schedule?"
   - Action: Trigger \`log_activity\` to save.
3. IF [UI_EVENT: WAKE_UP] OR [UI_EVENT: GOING_TO_SLEEP]:
   - Action: Instantly trigger \`log_activity\` with the exact current timestamp.
   - Response: "Got it. Sleep well," or "Recorded. Have a great day."
4. IF USER LOGS "NOT FEELING WELL" OR [UI_EVENT: NOT_FEELING_WELL] (Diagnostic Mode):
   - Action: Ask ONE gentle question to determine the imbalance without using Tridosha terms.
   - Example: "I'm sorry you're feeling off. Are you feeling burned out and overheated, or is it more of a heavy, brain-fog kind of fatigue?"
   - Wait for their response, trigger \`log_activity\` to log them as unwell, then offer a practical modern Ayurvedic suggestion (refer to "energy", not doshas).
5. IF [UI_EVENT: RELATIONSHIPS_CLICKED]:
   - Acknowledge the Bandhan (connection) hub.
   - Greeting Example: "The people around us definitely shape our energy. Did you want to vent about a conflict, share some gratitude, or figure out a connection?"
   - Action: Trigger \`log_activity\` to log the relationship update.

REMINDER SYSTEM: The user can ask to set a reminder from ANY state.
Trigger: User says "Remind me to..."
Action: Execute the \`set_reminder\` tool with the parsed ISO time and text.
Response: "Consider it done. I'll tap you when it's time."

════════════════════════════════════════════════════════════════
🗣️ YOUR VIBE & GEN-Z TRANSLATION RULE
════════════════════════════════════════════════════════════════
- Speak like a deeply caring, wise best friend who also happens to be a genius.
- Warm, personal, occasionally playful — never robotic.
- Avoid heavy traditional or religious jargon.
- TRANSLATE VEDIC CONCEPTS INTO MODERN MINDFUL TERMS: Use words like "energy", "flow", "alignment", "deep work", and "wins" instead of their Sanskrit equivalents.
- Use the user's first name naturally (${firstName}) but not every sentence.
- NEVER say "As an AI", "I'm just an AI", "I cannot" — you ARE Bodhi. ${moodLine}

${languageLine}

RULES:
1. Always respond — never go silent.
2. Keep responses SHORT and warm (<3 sentences).
3. Plain text only — no markdown asterisks or headers.
4. After saving a task or logging an activity, confirm warmly in EXACTLY ONE sentence.
5. Apply the Evening, Morning, Noon, Night time-gap greeting logic contextually when continuing conversation.
6. Match ${firstName}'s energy — if they're excited, be excited. If they're stressed, be calm and grounding.
7. Humor is welcome. A single well-placed wit beats a paragraph of advice.
8. HINDI RESPECT RULE: When speaking Hindi, ALWAYS use "आप" (aap) — NEVER "तुम" (tum) or "तू".`;
    }, []);

    // ── Cleanup ────────────────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        isConnectedRef.current = false;
        if (sessionRef.current) {
            try { sessionRef.current.close(); } catch (_) { /* ignore */ }
            sessionRef.current = null;
        }
        if (playbackCtxRef.current) {
            playbackCtxRef.current.close().catch(() => { /* ignore */ });
            playbackCtxRef.current = null;
        }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        textBufferRef.current = '';
        setIsConnected(false);
        setIsSpeaking(false);
    }, []);

    // ── Connect to Gemini Live ─────────────────────────────────────────────────
    const connect = useCallback(async () => {
        if (isConnectedRef.current || sessionRef.current) return;
        setChatState('connecting');
        try {
            const res = await fetch('/api/gemini-live-token', { method: 'POST' });
            if (!res.ok) throw new Error('Token fetch failed');
            const { apiKey } = await res.json();
            if (!apiKey) throw new Error('No API key');

            playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });

            const { GoogleGenAI, Modality, Type } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });

            const session = await ai.live.connect({
                model: BODHI_CHAT_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
                    },
                    systemInstruction: buildSystemPrompt(),
                    tools: [{
                        functionDeclarations: [
                            {
                                name: 'save_memory',
                                description: 'Saves important facts, preferences, or personal details about the user that Bodhi should remember for future conversations.',
                                parameters: {
                                    type: Type.OBJECT,
                                    properties: {
                                        memory: {
                                            type: Type.STRING,
                                            description: 'The fact or preference to remember (e.g. "User is learning piano", "User prefers morning workouts").',
                                        },
                                    },
                                    required: ['memory'],
                                },
                            },
                            {
                                name: 'add_sankalpa_task',
                                description: "Saves a task, idea, challenge, or issue to the user's Sankalpa planner. Use immediately when user mentions any task/idea/challenge/issue without waiting for confirmation.",
                                parameters: {
                                    type: Type.OBJECT,
                                    properties: {
                                        task_name: {
                                            type: Type.STRING,
                                            description: 'Name of the task, idea, challenge or issue.',
                                        },
                                        category: {
                                            type: Type.STRING,
                                            description: 'One of: Task, Idea, Challenge, Issue.',
                                        },
                                        start_time: {
                                            type: Type.STRING,
                                            description: 'Optional scheduled date/time (e.g. "tomorrow at 9am", "25th at 3pm").',
                                        },
                                        allocated_time_minutes: {
                                            type: Type.INTEGER,
                                            description: 'Optional duration in minutes.',
                                        },
                                    },
                                    required: ['task_name'],
                                },
                            },
                            {
                                name: 'remove_sankalpa_task',
                                description: "Removes a task, idea, challenge or issue from the user's Sankalpa planner. Only use AFTER user confirms removal. Trigger: 'remove', 'delete', 'hata do', 'cancel', 'nahi karna'.",
                                parameters: {
                                    type: Type.OBJECT,
                                    properties: {
                                        task_name: {
                                            type: Type.STRING,
                                            description: 'Exact name/text of the task to remove.',
                                        },
                                        task_id: {
                                            type: Type.STRING,
                                            description: 'Optional: ID of the task for precise matching.',
                                        },
                                    },
                                    required: ['task_name'],
                                },
                            },
                            {
                                name: 'log_activity',
                                description: "Logs a daily life activity, emotion, or UI event. Use this for WORK_CLICKED, LOGS_CLICKED, RELATIONSHIPS_CLICKED, WAKE_UP, GOING_TO_SLEEP, or general logging.",
                                parameters: {
                                    type: Type.OBJECT,
                                    properties: {
                                        activity_name: {
                                            type: Type.STRING,
                                            description: 'Name of the activity (e.g. WAKE UP, MEDITATE, LUNCH, STUDY, WORK_CLICKED, LOGS_CLICKED, NOT_FEELING_WELL)',
                                        },
                                        context: {
                                            type: Type.STRING,
                                            description: 'Optional additional context or feelings about the activity.',
                                        },
                                    },
                                    required: ['activity_name'],
                                },
                            },
                            {
                                name: 'set_reminder',
                                description: "Sets a reminder or alarm for the user.",
                                parameters: {
                                    type: Type.OBJECT,
                                    properties: {
                                        reminder_text: {
                                            type: Type.STRING,
                                            description: 'What the reminder is about.',
                                        },
                                        iso_time: {
                                            type: Type.STRING,
                                            description: 'The exact ISO string format time for the reminder, parsed from user intention. e.g. "2026-04-04T10:00:00.000Z"',
                                        },
                                    },
                                    required: ['reminder_text', 'iso_time'],
                                },
                            }],
                    }],
                },
                callbacks: {
                    onopen: () => {
                        console.log('[Bodhi Chat] ✅ Gemini Live connected');
                        isConnectedRef.current = true;
                        setIsConnected(true);
                        setChatState('ready');
                    },

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onmessage: async (message: any) => {
                        // ── Tool calls ────────────────────────────────────────────
                        if (message.toolCall?.functionCalls?.length > 0) {
                            // Discard any pre-tool text already buffered — only the post-tool
                            // confirmation should appear in chat (prevents duplicate messages)
                            textBufferRef.current = '';
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'save_memory') {
                                    const memoryStr: string = fc.args?.memory;
                                    const currentUid = userIdRef.current;
                                    if (memoryStr && currentUid) {
                                        setMemories(prev => [...prev, memoryStr]);
                                        (async () => {
                                            try {
                                                const { getFirebaseFirestore } = await import('@/lib/firebase');
                                                const { doc, setDoc, arrayUnion } = await import('firebase/firestore');
                                                const db = await getFirebaseFirestore();
                                                await setDoc(doc(db, 'users', currentUid), {
                                                    bodhi_memories: arrayUnion(memoryStr)
                                                }, { merge: true });
                                                console.log(`[Bodhi Chat] 🧠 Memory saved: "${memoryStr}"`);
                                            } catch (e) {
                                                console.warn('[Bodhi Chat] Failed to save memory to Firestore', e);
                                            }
                                        })();
                                    }

                                    if (sessionRef.current) {
                                        const session = sessionRef.current as any;
                                        const toolResponse = {
                                            functionResponses: [{
                                                id: fc.id,
                                                name: fc.name,
                                                response: { status: 'success', message: 'Memory saved.' },
                                            }],
                                        };
                                        if (typeof session.sendToolResponse === 'function') {
                                            session.sendToolResponse(toolResponse)?.catch(() => { });
                                        } else {
                                            session.sendClientContent({ turns: [{ role: 'user', parts: [{ functionResponse: { name: fc.name, id: fc.id, response: { status: 'success' } } }] }], turnComplete: true })?.catch(() => { });
                                        }
                                    }
                                }

                                if (fc.name === 'remove_sankalpa_task') {
                                    const taskName: string = fc.args?.task_name ?? '';
                                    const taskId: string = fc.args?.task_id ?? '';
                                    const currentUid = userIdRef.current;

                                    const targetTask = tasksRef.current.find(t =>
                                        (taskId && t.id === taskId) ||
                                        t.text.toLowerCase().includes(taskName.toLowerCase())
                                    );

                                    if (targetTask) {
                                        const removeResult = onRemoveTaskRef.current?.(targetTask.id);
                                        if (removeResult && typeof removeResult.then === 'function') {
                                            removeResult.catch(() => { });
                                        }
                                        if (currentUid) {
                                            (async () => {
                                                try {
                                                    const { getFirebaseFirestore } = await import('@/lib/firebase');
                                                    const { doc, deleteDoc } = await import('firebase/firestore');
                                                    const db = await getFirebaseFirestore();
                                                    await deleteDoc(doc(db, 'users', currentUid, 'tasks', targetTask.id));
                                                    console.log(`[Bodhi Chat] 🗑️ Task removed: "${targetTask.text}"`);
                                                } catch (e) {
                                                    console.warn('[Bodhi Chat] Firestore remove failed', e);
                                                }
                                            })();
                                        }
                                    }

                                    if (sessionRef.current) {
                                        const session = sessionRef.current as any;
                                        const toolResponse = {
                                            functionResponses: [{
                                                id: fc.id,
                                                name: fc.name,
                                                response: { status: 'success', message: targetTask ? `"${targetTask.text}" removed.` : 'Task not found.' },
                                            }],
                                        };
                                        if (typeof session.sendToolResponse === 'function') {
                                            session.sendToolResponse(toolResponse)?.catch(() => { });
                                        } else {
                                            session.sendClientContent({ turns: [{ role: 'user', parts: [{ functionResponse: { name: fc.name, id: fc.id, response: { status: 'success' } } }] }], turnComplete: true })?.catch(() => { });
                                        }
                                    }
                                }

                                if (fc.name === 'add_sankalpa_task') {
                                    const taskName: string = fc.args?.task_name ?? 'Task';
                                    const category: string = fc.args?.category ?? 'Task';
                                    const startTime: string = fc.args?.start_time ?? '';
                                    const allocatedMins: number | undefined = fc.args?.allocated_time_minutes;
                                    const currentUid = userIdRef.current;

                                    const iconMap: Record<string, string> = { Task: '✅', Idea: '💡', Challenge: '⚡', Issue: '🔥' };
                                    const colorMap: Record<string, string> = { Task: '#fbbf24', Idea: '#2dd4bf', Challenge: '#fb923c', Issue: '#f87171' };

                                    const newTask = {
                                        id: Date.now().toString(),
                                        text: taskName,
                                        done: false,
                                        category,
                                        colorClass: 'gold',
                                        accentColor: colorMap[category] ?? '#fbbf24',
                                        icon: iconMap[category] ?? '✅',
                                        createdAt: Date.now(),
                                        startTime: startTime || undefined,
                                        ...(allocatedMins ? { allocatedMinutes: allocatedMins } : {}),
                                        uid: currentUid || undefined,
                                    };

                                    // Notify parent - safely handle if onAddTask is not provided or doesn't return a promise
                                    const addTaskResult = onAddTaskRef.current?.(newTask);
                                    if (addTaskResult && typeof addTaskResult.then === 'function') {
                                        addTaskResult.catch(() => { /* ignore */ });
                                    }

                                    // Direct Firestore write
                                    if (currentUid) {
                                        (async () => {
                                            try {
                                                const { getFirebaseFirestore } = await import('@/lib/firebase');
                                                const { doc, setDoc } = await import('firebase/firestore');
                                                const db = await getFirebaseFirestore();
                                                await setDoc(doc(db, 'users', currentUid, 'tasks', newTask.id), newTask);
                                                console.log(`[Bodhi Chat] ✅ Task saved: "${taskName}"`);
                                            } catch (e) {
                                                console.warn('[Bodhi Chat] Firestore save failed', e);
                                            }
                                        })();
                                    }

                                    // Acknowledge to Gemini Live with proper toolResponse
                                    if (sessionRef.current) {
                                        const session = sessionRef.current as any;
                                        const toolResponse = {
                                            functionResponses: [{
                                                id: fc.id,
                                                name: fc.name,
                                                response: {
                                                    status: 'success',
                                                    message: `"${taskName}" saved successfully.`,
                                                },
                                            }],
                                        };

                                        if (typeof session.sendToolResponse === 'function') {
                                            session.sendToolResponse(toolResponse)?.catch(() => { });
                                        } else {
                                            session.sendClientContent({ turns: [{ role: 'user', parts: [{ functionResponse: { name: fc.name, id: fc.id, response: { status: 'success' } } }] }], turnComplete: true })?.catch(() => { });
                                        }
                                    }
                                }

                                if (fc.name === 'log_activity') {
                                    const activityName: string = fc.args?.activity_name ?? 'Activity';
                                    const context: string = fc.args?.context ?? '';
                                    const currentUid = userIdRef.current;

                                    if (currentUid) {
                                        (async () => {
                                            try {
                                                const { getFirebaseFirestore } = await import('@/lib/firebase');
                                                const { doc, setDoc } = await import('firebase/firestore');
                                                const db = await getFirebaseFirestore();
                                                const logId = Date.now().toString();
                                                await setDoc(doc(db, 'users', currentUid, 'logs_daily', logId), {
                                                    id: logId,
                                                    text: activityName,
                                                    context,
                                                    createdAt: Date.now(),
                                                    uid: currentUid
                                                });
                                                console.log(`[Bodhi Chat] 📓 Log saved: "${activityName}"`);
                                            } catch (e) {
                                                console.warn('[Bodhi Chat] Firestore log save failed', e);
                                            }
                                        })();
                                    }

                                    if (sessionRef.current) {
                                        const session = sessionRef.current as any;
                                        const toolResponse = {
                                            functionResponses: [{ id: fc.id, name: fc.name, response: { status: 'success', message: 'Logged.' } }],
                                        };
                                        if (typeof session.sendToolResponse === 'function') {
                                            session.sendToolResponse(toolResponse)?.catch(() => { });
                                        } else {
                                            session.sendClientContent({ turns: [{ role: 'user', parts: [{ functionResponse: { name: fc.name, id: fc.id, response: { status: 'success' } } }] }], turnComplete: true })?.catch(() => { });
                                        }
                                    }
                                }

                                if (fc.name === 'set_reminder') {
                                    const reminderText: string = fc.args?.reminder_text ?? 'Reminder';
                                    const isoTime: string = fc.args?.iso_time ?? '';

                                    // Normally you would trigger an OS notification or push to a reminders collection.
                                    // For now, we simulate logging it.
                                    console.log(`[Bodhi Chat] ⏰ Reminder set: "${reminderText}" for ${isoTime}`);

                                    if (sessionRef.current) {
                                        const session = sessionRef.current as any;
                                        const toolResponse = {
                                            functionResponses: [{ id: fc.id, name: fc.name, response: { status: 'success', message: 'Reminder set.' } }],
                                        };
                                        if (typeof session.sendToolResponse === 'function') {
                                            session.sendToolResponse(toolResponse)?.catch(() => { });
                                        } else {
                                            session.sendClientContent({ turns: [{ role: 'user', parts: [{ functionResponse: { name: fc.name, id: fc.id, response: { status: 'success' } } }] }], turnComplete: true })?.catch(() => { });
                                        }
                                    }
                                }
                            }
                        }

                        // ── Audio + text response ─────────────────────────────────
                        if (message.serverContent?.modelTurn?.parts) {
                            setChatState('thinking');
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    enqueueAudio(base64PCMToFloat32(part.inlineData.data));
                                }
                                if (part.text && !part.thought) {
                                    textBufferRef.current += part.text;
                                }
                            }
                        }

                        // ── Turn complete — fire text callback ────────────────────
                        if (message.serverContent?.turnComplete) {
                            const fullText = textBufferRef.current.trim();
                            if (fullText) {
                                const sanitizedText = sanitizeBodhiReply(fullText, preferredLanguageRef.current);
                                onMessageRef.current(sanitizedText);

                                const currentUid = userIdRef.current;
                                if (currentUid) {
                                    saveConversationHistory(currentUid, [{ role: 'bodhi', text: sanitizedText, timestamp: Date.now() }]).catch(() => { });
                                }
                            }
                            textBufferRef.current = '';
                            // If no audio came through, reset to ready
                            if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                                setChatState('ready');
                            }
                        }

                        // ── Interrupted ───────────────────────────────────────────
                        if (message.serverContent?.interrupted) {
                            audioQueueRef.current = [];
                            isPlayingRef.current = false;
                            setIsSpeaking(false);
                            setChatState('ready');
                        }
                    },

                    onerror: (err: unknown) => {
                        console.error('[Bodhi Chat] Session error:', err);
                        isConnectedRef.current = false;
                        setIsConnected(false);
                        setChatState('error');
                    },

                    onclose: () => {
                        console.log('[Bodhi Chat] Session closed');
                        isConnectedRef.current = false;
                        setIsConnected(false);
                        setChatState('idle');
                    },
                },
            });

            sessionRef.current = session;
        } catch (err) {
            console.error('[Bodhi Chat] connect() failed:', err);
            setChatState('error');
        }

    }, [buildSystemPrompt, base64PCMToFloat32, enqueueAudio]);

    // ── Disconnect ─────────────────────────────────────────────────────────────
    const disconnect = useCallback(() => {
        cleanup();
        setChatState('idle');
    }, [cleanup]);

    // ── Send text message ──────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text: string) => {
        // Auto-reconnect if session dropped
        if (!sessionRef.current || !isConnectedRef.current) {
            console.warn('[Bodhi Chat] Not connected — attempting reconnect');
            await connect();
            // Wait up to 3s for connection
            let waited = 0;
            while (!isConnectedRef.current && waited < 3000) {
                await new Promise(r => setTimeout(r, 150));
                waited += 150;
            }
            if (!sessionRef.current || !isConnectedRef.current) {
                console.error('[Bodhi Chat] Reconnect failed');
                setChatState('error');
                return;
            }
        }

        setChatState('thinking');
        textBufferRef.current = '';

        try {
            const currentUid = userIdRef.current;
            if (currentUid && text.trim()) {
                saveConversationHistory(currentUid, [{ role: 'user', text: text.trim(), timestamp: Date.now() }]).catch(() => { });
            }

            await sessionRef.current.sendClientContent({
                turns: [{ role: 'user', parts: [{ text }] }],
                turnComplete: true,
            });
        } catch (err) {
            console.error('[Bodhi Chat] sendMessage failed:', err);
            setChatState('ready');
        }
    }, [connect]);

    // ── Cleanup on unmount ─────────────────────────────────────────────────────
    useEffect(() => () => { cleanup(); }, [cleanup]);

    return {
        chatState,
        isSpeaking,
        isConnected,
        connect,
        disconnect,
        sendMessage,
    };
}
