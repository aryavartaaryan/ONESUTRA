/**
 * firebaseTools.ts — Custom Firebase-Backed Local MCP Tools
 * ─────────────────────────────────────────────────────────────────────────────
 * Registers TWO sets of tools directly in the agent's tool loop (no external
 * MCP server needed — they run in-process using firebase-admin).
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ SET A — AGENTIC MEMORY                                         │
 * │  save_core_fact       → extracts & stores a long-term fact     │
 * │  retrieve_core_facts  → fetches facts to enrich LLM context    │
 * │                                                                 │
 * │ SET B — AGENTIC TO-DO LIST                                     │
 * │  create_agentic_task  → breaks a goal into sub-tasks & saves   │
 * │  read_tasks           → queries pending tasks from Firestore   │
 * │  update_task_status   → marks a task complete / in-progress    │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * DATA FLOW:
 *   LLM decides to call a tool
 *   ──► executeLocalTool(name, args) dispatches to handler below
 *   ──► Firestore read / write via `db`
 *   ──► Returns structured result string back to the LLM
 */

import { db, now } from './firebase';
import { GoogleGenAI } from '@google/genai';

// ── Firestore collection paths ────────────────────────────────────────────────
const MEMORY_COL = (uid: string) => `users/${uid}/core_memory`;
const TASKS_COL = (uid: string) => `users/${uid}/tasks`;

// ── Gemini client (reused for task-decomposition inside create_agentic_task) ──
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// =============================================================================
// SET A — AGENTIC MEMORY
// =============================================================================

/**
 * save_core_fact
 * Extracts a long-term preference or fact from the conversation and persists it
 * to Firestore so future sessions can recall it.
 *
 * Firestore path: users/{userId}/core_memory/{auto-id}
 * Document shape: { fact, category, createdAt }
 */
async function saveCoreFactHandler(args: any): Promise<string> {
    const { userId, fact, category = 'general' } = args as {
        userId: string;
        fact: string;
        category?: string;
    };

    if (!userId || !fact) {
        return JSON.stringify({ error: 'userId and fact are required' });
    }

    const docRef = await db.collection(MEMORY_COL(userId)).add({
        fact,
        category,
        createdAt: now(),
    });

    console.log(`[Memory] ✅ Saved fact for user ${userId} → doc ${docRef.id}`);
    return JSON.stringify({ success: true, docId: docRef.id, saved: fact });
}

/**
 * retrieve_core_facts
 * Fetches the most recent long-term facts for a user.
 * Ordered by newest-first, limited to `limit` (default 10).
 *
 * Firestore path: users/{userId}/core_memory (ordered by createdAt desc)
 */
async function retrieveCoreFactsHandler(args: any): Promise<string> {
    const { userId, category, limit = 10 } = args as {
        userId: string;
        category?: string;
        limit?: number;
    };

    if (!userId) return JSON.stringify({ error: 'userId is required' });

    let query = db
        .collection(MEMORY_COL(userId))
        .orderBy('createdAt', 'desc')
        .limit(limit);

    if (category) {
        query = query.where('category', '==', category) as typeof query;
    }

    const snap = await query.get();
    const facts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`[Memory] 📖 Retrieved ${facts.length} facts for user ${userId}`);
    return JSON.stringify({ facts, count: facts.length });
}

// =============================================================================
// SET B — AGENTIC TO-DO LIST
// =============================================================================

/**
 * create_agentic_task
 * Accepts a vague high-level goal, uses Gemini to decompose it into actionable
 * sub-tasks, then saves the entire task tree to Firestore.
 *
 * Firestore path: users/{userId}/tasks/{auto-id}
 * Document shape: { goal, subTasks, priority, deadline, status, createdAt }
 */
async function createAgenticTaskHandler(args: any): Promise<string> {
    const { userId, goal, priority = 'medium', deadline } = args as {
        userId: string;
        goal: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        deadline?: string;
    };

    if (!userId || !goal) return JSON.stringify({ error: 'userId and goal are required' });

    // ── Step 1: Ask Gemini to decompose the goal into concrete sub-tasks ──────
    const decompositionPrompt = `
You are a senior project manager. Break the following goal into 3-5 concrete, 
actionable sub-tasks. Reply ONLY with a JSON array of objects with keys:
{ "title": string, "description": string, "estimatedMinutes": number }

Goal: "${goal}"
Deadline (if given): ${deadline ?? 'Not specified'}
`.trim();

    const resp = await gemini
        .models
        .generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: decompositionPrompt }] }],
        });

    let subTasks: any[] = [];
    try {
        const raw = resp.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
        // Strip markdown code fences if present
        const clean = raw.replace(/```json|```/g, '').trim();
        subTasks = JSON.parse(clean);
    } catch {
        subTasks = [{ title: goal, description: 'Auto-created single task', estimatedMinutes: 30 }];
    }

    // ── Step 2: Save to Firestore ─────────────────────────────────────────────
    const docData = {
        goal,
        subTasks: subTasks.map((st: any, idx: number) => ({
            index: idx,
            title: st.title,
            description: st.description ?? '',
            estimatedMinutes: st.estimatedMinutes ?? 30,
            status: 'pending',
        })),
        priority,
        deadline: deadline ?? null,
        status: 'pending',
        createdAt: now(),
        updatedAt: now(),
    };

    const docRef = await db.collection(TASKS_COL(userId)).add(docData);
    console.log(`[Tasks] ✅ Created task for user ${userId} → doc ${docRef.id}`);

    return JSON.stringify({ success: true, docId: docRef.id, goal, subTasks });
}

/**
 * read_tasks
 * Queries pending (or all) tasks from Firestore for a user.
 *
 * Firestore path: users/{userId}/tasks (filtered by status)
 */
async function readTasksHandler(args: any): Promise<string> {
    const { userId, status = 'pending', limit = 10 } = args as {
        userId: string;
        status?: string;
        limit?: number;
    };

    if (!userId) return JSON.stringify({ error: 'userId is required' });

    let query = db
        .collection(TASKS_COL(userId))
        .orderBy('createdAt', 'desc')
        .limit(limit);

    if (status !== 'all') {
        query = query.where('status', '==', status) as typeof query;
    }

    const snap = await query.get();
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`[Tasks] 📖 Found ${tasks.length} tasks (status: ${status}) for user ${userId}`);
    return JSON.stringify({ tasks, count: tasks.length });
}

/**
 * update_task_status
 * Marks a task (or a specific sub-task) as complete / in-progress / cancelled.
 *
 * Firestore path: users/{userId}/tasks/{taskId}
 */
async function updateTaskStatusHandler(args: any): Promise<string> {
    const { userId, taskId, status, subTaskIndex } = args as {
        userId: string;
        taskId: string;
        status: 'pending' | 'in-progress' | 'complete' | 'cancelled';
        subTaskIndex?: number;
    };

    if (!userId || !taskId || !status) {
        return JSON.stringify({ error: 'userId, taskId, and status are required' });
    }

    const docRef = db.collection(TASKS_COL(userId)).doc(taskId);
    const snap = await docRef.get();

    if (!snap.exists) return JSON.stringify({ error: `Task ${taskId} not found` });

    const data = snap.data()!;

    if (subTaskIndex !== undefined && Array.isArray(data.subTasks)) {
        // Update a specific sub-task's status
        const subTasks = [...data.subTasks];
        if (subTaskIndex < 0 || subTaskIndex >= subTasks.length) {
            return JSON.stringify({ error: `subTaskIndex ${subTaskIndex} out of range` });
        }
        subTasks[subTaskIndex] = { ...subTasks[subTaskIndex], status };

        // If all sub-tasks complete, mark parent complete too
        const allDone = subTasks.every((st: any) => st.status === 'complete');
        await docRef.update({ subTasks, updatedAt: now(), ...(allDone ? { status: 'complete' } : {}) });
    } else {
        // Update the top-level task status
        await docRef.update({ status, updatedAt: now() });
    }

    console.log(`[Tasks] ✅ Updated task ${taskId} → ${status}`);
    return JSON.stringify({ success: true, taskId, status });
}

// =============================================================================
// TOOL REGISTRY — maps tool names → handlers
// =============================================================================

export const LOCAL_TOOL_DEFINITIONS = [
    // ── Memory Tools ──────────────────────────────────────────────────────────
    {
        name: 'save_core_fact',
        description:
            'Extracts a long-term user preference or fact from the conversation and saves it to Firebase memory. Use when the user reveals something important about themselves.',
        parameters: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'The oneSUTRA user ID' },
                fact: { type: 'string', description: 'The fact or preference to remember, e.g. "User prefers Hindi" or "User wakes at 5 AM"' },
                category: { type: 'string', description: 'Category tag: health, preference, habit, goal, professional. Defaults to general.' },
            },
            required: ['userId', 'fact'],
        },
    },
    {
        name: 'retrieve_core_facts',
        description:
            'Fetches the stored long-term memory facts for a user from Firebase. Use at the start of a session to enrich LLM context with past knowledge.',
        parameters: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'The oneSUTRA user ID' },
                category: { type: 'string', description: 'Optional filter by category' },
                limit: { type: 'integer', description: 'Max facts to return. Default 10.' },
            },
            required: ['userId'],
        },
    },

    // ── Task Tools ────────────────────────────────────────────────────────────
    {
        name: 'create_agentic_task',
        description:
            'Accepts a vague user goal, uses AI to break it into actionable sub-tasks with estimated time, then saves the task plan to Firebase.',
        parameters: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'The oneSUTRA user ID' },
                goal: { type: 'string', description: 'The high-level goal, e.g. "Prepare for system design interview"' },
                priority: { type: 'string', description: 'low | medium | high | critical. Default: medium' },
                deadline: { type: 'string', description: 'Optional deadline, e.g. "2026-03-25" or "tomorrow"' },
            },
            required: ['userId', 'goal'],
        },
    },
    {
        name: 'read_tasks',
        description: 'Reads pending (or all) To-Do tasks from Firebase for a user.',
        parameters: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'The oneSUTRA user ID' },
                status: { type: 'string', description: 'Filter by status: pending | in-progress | complete | cancelled | all. Default: pending' },
                limit: { type: 'integer', description: 'Max tasks to return. Default 10.' },
            },
            required: ['userId'],
        },
    },
    {
        name: 'update_task_status',
        description: 'Marks a Firebase task or a specific sub-task as complete, in-progress, or cancelled.',
        parameters: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'The oneSUTRA user ID' },
                taskId: { type: 'string', description: 'The Firestore document ID of the task' },
                status: { type: 'string', description: 'New status: pending | in-progress | complete | cancelled' },
                subTaskIndex: { type: 'integer', description: 'Optional 0-based index of a specific sub-task to update' },
            },
            required: ['userId', 'taskId', 'status'],
        },
    },
];

/**
 * executeLocalTool
 * Dispatcher: given a tool name and args object, calls the right handler.
 * Returns a stringified JSON result to be injected back into the LLM context.
 */
export async function executeLocalTool(name: string, args: any): Promise<string> {
    console.log(`[LocalTool] Executing: ${name}`, JSON.stringify(args, null, 2));

    switch (name) {
        case 'save_core_fact': return saveCoreFactHandler(args);
        case 'retrieve_core_facts': return retrieveCoreFactsHandler(args);
        case 'create_agentic_task': return createAgenticTaskHandler(args);
        case 'read_tasks': return readTasksHandler(args);
        case 'update_task_status': return updateTaskStatusHandler(args);
        default:
            return JSON.stringify({ error: `Unknown local tool: ${name}` });
    }
}
