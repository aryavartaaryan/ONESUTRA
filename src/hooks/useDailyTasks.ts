'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface TaskItem {
    id: string;
    text: string;
    icon: string;
    colorClass: string;
    accentColor: string;
    category: string;
    done: boolean;
    scheduledDate?: string;
    scheduledTime?: string;
    aiAdvice?: string;
    createdAt: number;
    uid?: string;
    // ── Sankalpa Agent time fields (set by Bodhi's add_sankalpa_task tool) ──
    allocatedMinutes?: number;   // How many minutes the user plans to spend on this task
    startTime?: string;          // Optional start time e.g. "9:00 AM" or "after lunch"
}

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            (out as any)[key] = value;
        }
    }
    return out;
}

function toFirestoreUpdate<T extends Record<string, any>>(updates: T): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
        out[key] = value === undefined ? deleteField() : value;
    }
    return out;
}

export function useDailyTasks() {
    const [tasks, setTasks] = useState<TaskItem[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const s = localStorage.getItem('pranav_tasks_v3');
                if (s) return JSON.parse(s);
            } catch { /* ignore */ }
        }
        return [];
    });
    const [uid, setUid] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Track authentication state
    useEffect(() => {
        let unsubscribe = () => { };
        (async () => {
            try {
                const auth = await getFirebaseAuth();
                unsubscribe = onAuthStateChanged(auth, (user) => {
                    setUid(user?.uid ?? null);
                    if (!user) setIsLoading(false);
                });
            } catch (err) {
                console.error("Failed to init auth for tasks", err);
                setIsLoading(false);
            }
        })();
        return () => unsubscribe();
    }, []);

    // Real-time Firestore sync
    useEffect(() => {
        if (!uid) return;

        let unsubscribe = () => { };
        (async () => {
            try {
                const db = await getFirebaseFirestore();
                const q = query(
                    collection(db, 'users', uid, 'tasks'),
                    orderBy('createdAt', 'desc')
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const fetchedTasks = snapshot.docs.map(doc => doc.data() as TaskItem);
                    setTasks(fetchedTasks);
                    setIsLoading(false);
                    // Update cache for quick offline/initial load
                    try {
                        localStorage.setItem('pranav_tasks_v3', JSON.stringify(fetchedTasks));
                    } catch { /* ignore */ }
                }, (error) => {
                    console.error("Firestore tasks snapshot error:", error);
                    setIsLoading(false);
                });
            } catch (error) {
                console.error("Failed to init Firestore tasks listener:", error);
                setIsLoading(false);
            }
        })();

        return () => unsubscribe();
    }, [uid]);

    // Actions
    const addTask = useCallback(async (task: TaskItem) => {
        setTasks(prev => {
            // Avoid duplicates if called multiple times for the same task id
            if (prev.some(t => t.id === task.id)) return prev;
            return [task, ...prev];
        });
        if (uid) {
            try {
                const db = await getFirebaseFirestore();
                const payload = stripUndefined({ ...task, uid });
                await setDoc(doc(db, 'users', uid, 'tasks', task.id), payload);
            } catch (error) {
                console.error("Error adding task:", error);
            }
        } else {
            // localStorage fallback for unauthenticated users
            setTasks(prev => {
                const updated = prev.some(t => t.id === task.id) ? prev : [task, ...prev];
                localStorage.setItem('pranav_tasks_v3', JSON.stringify(updated));
                return updated;
            });
        }
    }, [uid]);

    const updateTask = useCallback(async (taskId: string, updates: Partial<TaskItem>) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            const merged = { ...t, ...updates } as Record<string, any>;
            for (const [k, v] of Object.entries(updates)) {
                if (v === undefined) delete merged[k];
            }
            return merged as TaskItem;
        }));
        if (uid) {
            try {
                const db = await getFirebaseFirestore();
                await updateDoc(doc(db, 'users', uid, 'tasks', taskId), toFirestoreUpdate(updates as Record<string, any>));
            } catch (error) {
                console.error("Error updating task:", error);
            }
        } else {
            setTasks(prev => {
                const updated = prev.map(t => {
                    if (t.id !== taskId) return t;
                    const merged = { ...t, ...updates } as Record<string, any>;
                    for (const [k, v] of Object.entries(updates)) {
                        if (v === undefined) delete merged[k];
                    }
                    return merged as TaskItem;
                });
                localStorage.setItem('pranav_tasks_v3', JSON.stringify(updated));
                return updated;
            });
        }
    }, [uid]);

    const tasksRef = useRef<TaskItem[]>(tasks);
    useEffect(() => { tasksRef.current = tasks; }, [tasks]);

    const toggleTaskDone = useCallback(async (taskId: string) => {
        const task = tasksRef.current.find(t => t.id === taskId);
        if (!task) return;
        const newDone = !task.done;
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: newDone } : t));
        if (uid) {
            try {
                const db = await getFirebaseFirestore();
                await updateDoc(doc(db, 'users', uid, 'tasks', taskId), { done: newDone });
            } catch (error) {
                console.error("Error toggling task:", error);
            }
        } else {
            setTasks(prev => {
                const updated = prev.map(t => t.id === taskId ? { ...t, done: newDone } : t);
                localStorage.setItem('pranav_tasks_v3', JSON.stringify(updated));
                return updated;
            });
        }
    }, [uid]);

    const removeTask = useCallback(async (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (uid) {
            try {
                const db = await getFirebaseFirestore();
                await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
            } catch (error) {
                console.error("Error removing task:", error);
            }
        } else {
            setTasks(prev => {
                const updated = prev.filter(t => t.id !== taskId);
                localStorage.setItem('pranav_tasks_v3', JSON.stringify(updated));
                return updated;
            });
        }
    }, [uid]);

    return {
        tasks,
        isLoading,
        addTask,
        updateTask,
        toggleTaskDone,
        removeTask
    };
}
