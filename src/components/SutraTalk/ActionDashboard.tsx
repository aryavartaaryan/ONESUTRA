'use client';
/**
 * ActionDashboard — Feature 3: Pinned Task Dashboard
 *
 * Subscribes to Firestore onesutra_chats/{chatId}/dashboard/main via onSnapshot.
 * Renders a collapsible pinned panel at the top of the chat view showing
 * AI-extracted tasks: Who · What · Deadline · Status toggle.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Zap } from 'lucide-react';
import { getFirestore, doc, onSnapshot, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';

interface Task {
    id: string;
    who: string;
    what: string;
    deadline: string;
    status: 'pending' | 'done';
}

interface ActionDashboardProps {
    chatId: string | null;
    accent: string;
}

export default function ActionDashboard({ chatId, accent }: ActionDashboardProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        if (!chatId) return;

        let db: ReturnType<typeof getFirestore>;
        let unsub: (() => void) | null = null;

        (async () => {
            const { getApp } = await import('firebase/app');
            db = getFirestore(getApp());
            const dashRef = doc(db, `onesutra_chats/${chatId}/dashboard/main`);

            unsub = onSnapshot(dashRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setTasks((data.tasks as Task[]) ?? []);
                } else {
                    setTasks([]);
                }
            });
        })();

        return () => { unsub?.(); };
    }, [chatId]);

    async function toggleTask(task: Task) {
        if (!chatId) return;
        const { getApp } = await import('firebase/app');
        const db = getFirestore(getApp());
        const dashRef = doc(db, `onesutra_chats/${chatId}/dashboard/main`);

        await updateDoc(dashRef, {
            tasks: arrayRemove(task),
        });
        await updateDoc(dashRef, {
            tasks: arrayUnion({ ...task, status: task.status === 'done' ? 'pending' : 'done' }),
        });
    }

    if (!chatId || tasks.length === 0) return null;

    const pending = tasks.filter((t) => t.status === 'pending');
    const done = tasks.filter((t) => t.status === 'done');

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                borderBottom: `1px solid ${accent}22`,
                background: `rgba(6,4,18,0.7)`,
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
            }}
        >
            {/* Header row */}
            <button
                onClick={() => setExpanded((e) => !e)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.8)',
                }}
            >
                <Zap size={13} style={{ color: accent, flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em', color: accent }}>
                    AI TASKS
                </span>
                <span style={{ fontSize: '0.6rem', background: `${accent}22`, border: `1px solid ${accent}44`, borderRadius: 999, padding: '0.05rem 0.4rem', color: accent, fontFamily: 'monospace' }}>
                    {pending.length} pending
                </span>
                <div style={{ flex: 1 }} />
                {expanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 0.75rem 0.65rem', display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {[...pending, ...done].map((task) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                        padding: '0.55rem 0.75rem',
                                        borderRadius: 12,
                                        background: task.status === 'done' ? 'rgba(255,255,255,0.03)' : `${accent}0f`,
                                        border: `1px solid ${task.status === 'done' ? 'rgba(255,255,255,0.06)' : accent + '28'}`,
                                        opacity: task.status === 'done' ? 0.5 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <button
                                        onClick={() => toggleTask(task)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0, padding: 0, flexShrink: 0, marginTop: 1 }}
                                    >
                                        {task.status === 'done'
                                            ? <CheckCircle2 size={16} style={{ color: '#5DDD88' }} />
                                            : <Circle size={16} style={{ color: `${accent}88` }} />}
                                    </button>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.45, fontFamily: "'Inter', sans-serif", textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                                            {task.what}
                                        </p>
                                        <div style={{ display: 'flex', gap: 8, marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.58rem', color: `${accent}99`, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                                                👤 {task.who}
                                            </span>
                                            {task.deadline !== 'unspecified' && (
                                                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                                                    📅 {task.deadline}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
