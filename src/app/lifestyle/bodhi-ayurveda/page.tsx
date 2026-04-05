'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, Sparkles, Wind, Flame, Leaf } from 'lucide-react';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { DOSHA_INFO, type Dosha } from '@/lib/doshaService';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'bodhi';
  text: string;
  timestamp: number;
}

// ─── Quick suggestion chips by time of day / dosha ────────────────────────────

const QUICK_CHIPS = [
  { label: 'Morning check-in', message: 'Good morning Bodhi. How should I start my day based on my dosha?', emoji: '🌅' },
  { label: 'I feel bloated', message: 'I am feeling bloated and uncomfortable after eating. What does Ayurveda say?', emoji: '🔥' },
  { label: 'Anxious today', message: 'I am feeling very anxious and scattered today. What should I do?', emoji: '🌬️' },
  { label: 'Heavy and low', message: 'I am feeling heavy, sluggish, and unmotivated today. How do I lift this?', emoji: '🌿' },
  { label: 'What to eat now', message: 'What should I eat right now based on my dosha and the current time?', emoji: '🍛' },
  { label: 'Sleep ritual', message: 'Guide me through my evening wind-down and sleep ritual for tonight.', emoji: '🌙' },
  { label: 'Pranayama now', message: 'Which pranayama should I do right now for my current dosha state?', emoji: '🧘' },
  { label: 'Tongue is coated', message: 'My tongue has a white coating this morning. What does that mean and what should I do?', emoji: '👅' },
];

// ─── Dosha colour theme ───────────────────────────────────────────────────────

const DOSHA_THEME: Record<Dosha, { color: string; bg: string; border: string }> = {
  vata:  { color: '#a78bfa', bg: 'rgba(124,58,237,0.1)',  border: 'rgba(167,139,250,0.3)' },
  pitta: { color: '#fb923c', bg: 'rgba(194,65,12,0.1)',   border: 'rgba(251,146,60,0.3)'  },
  kapha: { color: '#4ade80', bg: 'rgba(21,128,61,0.1)',   border: 'rgba(74,222,128,0.3)'  },
};

// ─── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, doshaColor }: { msg: ChatMessage; doshaColor: string }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '0.5rem',
        marginBottom: '0.9rem',
      }}
    >
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: `radial-gradient(circle at 35% 30%, rgba(251,191,36,0.55) 0%, rgba(139,92,246,0.45) 60%, transparent 100%)`,
          border: '1.5px solid rgba(251,191,36,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', boxShadow: '0 0 14px rgba(251,191,36,0.2)',
        }}>✦</div>
      )}
      <div style={{
        maxWidth: '80%',
        padding: '0.75rem 1rem',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser
          ? `linear-gradient(135deg, ${doshaColor}30, ${doshaColor}18)`
          : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isUser ? doshaColor + '40' : 'rgba(255,255,255,0.09)'}`,
        fontSize: '0.88rem',
        lineHeight: 1.65,
        color: isUser ? '#fff' : 'rgba(255,255,255,0.85)',
        fontFamily: "'Outfit', sans-serif",
        whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.9rem' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.55) 0%, rgba(139,92,246,0.45) 60%, transparent 100%)',
        border: '1.5px solid rgba(251,191,36,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
      }}>✦</div>
      <div style={{ padding: '0.75rem 1rem', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(251,191,36,0.6)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BodhiAyurvedaPage() {
  const router = useRouter();
  const { user } = useOneSutraAuth();
  const {
    prakriti, vikriti, currentPhase, currentSeason,
    inBrahmaMuhurta, todayLog, doshaOnboardingComplete,
  } = useDoshaEngine();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chipsUsed, setChipsUsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const doshaColor = prakriti ? DOSHA_THEME[prakriti.primary].color : '#a78bfa';
  const doshaTheme = prakriti ? DOSHA_THEME[prakriti.primary] : DOSHA_THEME.vata;

  // Opening message from Bodhi
  useEffect(() => {
    const hour = new Date().getHours();
    const greeting = inBrahmaMuhurta
      ? 'The pre-dawn stillness is yours. In Brahma Muhurta, even silence is medicine. What is stirring in you right now?'
      : hour < 12
        ? `Good morning${prakriti ? `, ${prakriti.combo.toUpperCase()} soul` : ''}. Your Agni is kindling. How did you sleep, and what does your body feel like right now?`
        : hour < 18
          ? `Good afternoon. The Pitta fire is bright right now. How is your energy and digestion today?`
          : `Good evening. The Kapha calm is settling in. How are you winding down today?`;

    setMessages([{
      id: 'opening',
      role: 'bodhi',
      text: greeting,
      timestamp: Date.now(),
    }]);
  }, [inBrahmaMuhurta, prakriti]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildConversationHistory = useCallback(() => {
    return messages
      .slice(-10)
      .map(m => `[${m.role === 'user' ? (user?.name?.split(' ')[0] ?? 'User') : 'Bodhi'}]: ${m.text}`)
      .join('\n');
  }, [messages, user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/bodhi/ayurvedic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          userName: user?.name ?? 'friend',
          prakriti: prakriti?.primary ?? null,
          prakritiCombo: prakriti?.combo ?? null,
          vikriti: vikriti?.primary ?? null,
          vikritiLevel: vikriti?.imbalanceLevel ?? null,
          currentDoshaPhase: currentPhase.phase,
          currentPhaseLabel: currentPhase.label,
          season: currentSeason.name,
          seasonFocus: currentSeason.focus,
          tongueCoating: todayLog?.tongueCoating ?? null,
          energyLevel: todayLog?.energyLevel ?? null,
          emotionalState: todayLog?.emotionalState ?? null,
          sleepQuality: todayLog?.sleepQuality ?? null,
          isBrahmaMuhurta: inBrahmaMuhurta,
          conversationHistory: buildConversationHistory(),
        }),
      });

      const data = await res.json();
      const bodhiMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'bodhi',
        text: data.response || 'I am here. Speak freely.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, bodhiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'bodhi',
        text: 'I am momentarily still. Try again in a breath.',
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, user, prakriti, vikriti, currentPhase, currentSeason, todayLog, inBrahmaMuhurta, buildConversationHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const bg = inBrahmaMuhurta
    ? 'linear-gradient(160deg, #0a0808 0%, #1a0f05 60%, #050810 100%)'
    : 'linear-gradient(160deg, #0a0a0f 0%, #0f0a1a 50%, #050d08 100%)';

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '1rem 1.2rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0, zIndex: 10,
        background: inBrahmaMuhurta ? 'rgba(26,15,5,0.96)' : 'rgba(10,10,15,0.96)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '0.25rem' }}>
            <ArrowLeft size={18} />
          </button>

          <motion.div
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.6) 0%, rgba(139,92,246,0.5) 60%, transparent 100%)',
              border: '1.5px solid rgba(251,191,36,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              boxShadow: '0 0 20px rgba(251,191,36,0.2)', flexShrink: 0,
            }}>✦</motion.div>

          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
              Bodhi
              {inBrahmaMuhurta && <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', color: 'rgba(251,191,36,0.8)', fontFamily: "'Outfit', sans-serif" }}>✦ Brahma Muhurta</span>}
            </p>
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>
              Ayurvedic Wisdom · {currentPhase.label}
            </p>
          </div>

          {prakriti && (
            <div style={{ padding: '0.3rem 0.65rem', borderRadius: 99, background: doshaTheme.bg, border: `1px solid ${doshaTheme.border}` }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: doshaColor, fontFamily: "'Outfit', sans-serif" }}>
                {DOSHA_INFO[prakriti.primary].emoji} {prakriti.combo.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Dosha + season context strip */}
        {(vikriti?.primary || inBrahmaMuhurta) && (
          <div style={{ marginTop: '0.6rem', padding: '0.45rem 0.75rem', borderRadius: 10, background: inBrahmaMuhurta ? 'rgba(251,191,36,0.07)' : `${doshaTheme.bg}`, border: `1px solid ${inBrahmaMuhurta ? 'rgba(251,191,36,0.2)' : doshaTheme.border}` }}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: inBrahmaMuhurta ? 'rgba(251,191,36,0.75)' : doshaColor, fontFamily: "'Outfit', sans-serif", lineHeight: 1.4 }}>
              {inBrahmaMuhurta
                ? '✦ Sacred pre-dawn window. Speak of what matters most.'
                : vikriti?.primary
                  ? `${DOSHA_INFO[vikriti.primary].emoji} ${DOSHA_INFO[vikriti.primary].name} is currently elevated — Bodhi is calibrated to help pacify it.`
                  : `${currentSeason.name} · ${currentSeason.focus}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.1rem 0.5rem' }}>

        {/* No Prakriti banner */}
        {!doshaOnboardingComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: 14, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#c084fc', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
              Bodhi works best with your Prakriti
            </p>
            <p style={{ margin: '0 0 0.7rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
              Take the 15-minute Prakriti assessment for fully personalised Ayurvedic guidance.
            </p>
            <button onClick={() => router.push('/lifestyle/prakriti')}
              style={{ padding: '0.45rem 1rem', borderRadius: 10, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
              Discover My Prakriti →
            </button>
          </motion.div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} doshaColor={doshaColor} />
        ))}

        {loading && <TypingIndicator />}

        {/* Quick chips — show after first Bodhi message, before user replies */}
        {!chipsUsed && messages.length === 1 && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <p style={{ margin: '0.5rem 0 0.6rem', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif" }}>
              Quick starts
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
              {QUICK_CHIPS.map(chip => (
                <motion.button key={chip.label} whileTap={{ scale: 0.95 }}
                  onClick={() => { setChipsUsed(true); sendMessage(chip.message); }}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: 20, cursor: 'pointer',
                    background: doshaTheme.bg, border: `1px solid ${doshaTheme.border}`,
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem',
                    fontFamily: "'Outfit', sans-serif", color: 'rgba(255,255,255,0.7)', fontWeight: 500,
                  }}>
                  <span>{chip.emoji}</span> {chip.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '0.75rem 1rem 1.2rem',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: inBrahmaMuhurta ? 'rgba(26,15,5,0.97)' : 'rgba(10,10,15,0.97)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inBrahmaMuhurta ? 'Speak softly in this sacred hour…' : 'Ask Bodhi anything about your body, food, sleep, breath…'}
            rows={1}
            style={{
              flex: 1, resize: 'none', padding: '0.75rem 1rem', borderRadius: 16, fontSize: '0.88rem',
              fontFamily: "'Outfit', sans-serif", background: 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${input.trim() ? doshaTheme.border : 'rgba(255,255,255,0.1)'}`,
              color: '#fff', outline: 'none', lineHeight: 1.5, minHeight: 44, maxHeight: 120,
              transition: 'border-color 0.2s',
            }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 120) + 'px';
            }}
          />
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: 14, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              background: input.trim() && !loading
                ? `linear-gradient(135deg, ${doshaColor}60, ${doshaColor}35)`
                : 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all 0.2s', color: input.trim() && !loading ? doshaColor : 'rgba(255,255,255,0.2)',
            }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
          </motion.button>
        </div>
        <p style={{ margin: '0.45rem 0 0', textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.18)', fontFamily: "'Outfit', sans-serif" }}>
          Bodhi offers lifestyle wisdom only — not medical diagnosis or treatment
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
