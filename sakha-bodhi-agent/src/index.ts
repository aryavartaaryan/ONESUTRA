/**
 * index.ts — Sakha Bodhi Omni-Agent Main Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the brain of the agentic loop. It ties together:
 *
 *  • External MCP Servers (GitHub, Twitter, Telegram)        — via STDIO
 *  • Local Firebase Tools  (Memory, Tasks)                   — in-process
 *  • Google Gemini         (LLM)                             — via @google/genai
 *
 * ════════════════════════════════════════════════════════════════════════════
 * AGENT LOOP DATA FLOW:
 *
 *  User Prompt
 *      │
 *      ▼
 *  Gemini (system prompt + all tool definitions)
 *      │
 *      ├──► Text response → print to console → DONE
 *      │
 *      └──► Tool call(s) detected
 *               │
 *               ├──► Namespaced "server__tool" → callExternalTool(mcpServers.ts)
 *               │        └──► MCP client → child process → result
 *               │
 *               └──► Local tool name → executeLocalTool(firebaseTools.ts)
 *                        └──► Firestore read / write → result
 *               │
 *               ▼
 *           Inject tool results back as "tool" turn
 *               │
 *               ▼
 *           Gemini again (now with tool results in context)
 *               │
 *               ▼
 *           Final text response
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

import * as dotenv from 'dotenv';
dotenv.config();                          // Load .env FIRST, before any other import

import { GoogleGenAI, type Tool, type Part } from '@google/genai';
import {
    connectAllServers,
    getAllExternalToolDefinitions,
    callExternalTool,
    shutdownAll,
} from './mcpServers';
import { LOCAL_TOOL_DEFINITIONS, executeLocalTool } from './firebaseTools';

// ── Gemini model configuration ────────────────────────────────────────────────
const LLM_MODEL = 'gemini-2.0-flash';

// Maximum agentic loop turns before we break (safety guard)
const MAX_TURNS = 10;

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are Sakha Bodhi, the intelligent companion agent for the oneSUTRA app.
You are proactive, deeply knowledgeable, and speak like a wise friend — never like an AI.

You have access to powerful tools:
- Access GitHub repositories to help with code reviews and PR analysis.
- Post tweets and search Twitter to amplify insights.
- Send and read Telegram messages to keep the user connected.
- Store and retrieve long-term memories about the user in Firebase.
- Create, track and update agentic tasks in the user's Firebase To-Do list.

RULES:
- Always use tools when the user asks for real-time or external information.
- After using external tools, synthesize a clear, warm summary in Hindi/English.
- Save important user preferences automatically using save_core_fact.
- When creating a task, always decompose the goal into sub-tasks.
- Be concise; 2-3 sentences max after tool results unless asked for more detail.
`.trim();

// ═════════════════════════════════════════════════════════════════════════════
// MAIN AGENT FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * runAgent
 * Executes one full agentic turn for the given user prompt.
 *
 * @param userId           oneSUTRA user ID (used for Firebase scoping)
 * @param userPrompt       Raw natural-language request from the user
 * @param telegramChatId   (Optional) The user's Telegram Chat ID for targeted messages
 */
export async function runAgent(
    userId: string,
    userPrompt: string,
    telegramChatId?: string
): Promise<string> {

    // ── Step 1: Initialize Gemini client ──────────────────────────────────────
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // ── Step 2: Collect ALL tool definitions (external + local) ───────────────
    const externalTools = await getAllExternalToolDefinitions();
    const localTools = LOCAL_TOOL_DEFINITIONS;

    // Combine into a single flat array of function declarations for Gemini
    const allTools: Tool = {
        functionDeclarations: [
            ...externalTools,   // e.g. "brave-search__brave_web_search"
            ...localTools,      // e.g. "save_core_fact"
        ],
    };

    console.log(`\n[Agent] 🚀 Running agent for user: ${userId}`);
    console.log(`[Agent] 📝 Prompt: "${userPrompt}"`);
    console.log(`[Agent] 🔧 Total tools available: ${allTools.functionDeclarations!.length}`);

    // ── Step 3: Agentic Loop ───────────────────────────────────────────────────
    // We start with the user prompt, then keep looping until Gemini returns a
    // final text response (no more pending tool calls).

    // Build dynamic system instructions
    let dynamicPrompt = SYSTEM_PROMPT;
    if (telegramChatId) {
        dynamicPrompt += `\n\nTELEGRAM ROUTING:\nThe user has linked their Telegram account and their Chat ID is ${telegramChatId}. When you use the telegram_bot tools to send them a message, ALWAYS use this chat_id.`;
    } else {
        dynamicPrompt += `\n\nTELEGRAM ROUTING:\nThe user has NOT linked their Telegram account yet. If they ask you to send a Telegram message, politely inform them to link their Telegram account in the app settings first.`;
    }

    // Build initial message history
    const messages: any[] = [
        { role: 'user', parts: [{ text: userPrompt }] },
    ];

    let finalResponse = 'No response generated.';
    let turns = 0;

    while (turns < MAX_TURNS) {
        turns++;
        console.log(`\n[Agent] ── Turn ${turns} ───────────────────────────────────────`);

        // ── Send to Gemini with all tools ─────────────────────────────────────
        const resp = await ai.models.generateContent({
            model: LLM_MODEL,
            systemInstruction: dynamicPrompt,
            contents: messages,
            tools: [allTools],
            // Force JSON-safe function calling
            toolConfig: {
                functionCallingConfig: { mode: 'AUTO' as any },
            },
        });

        const candidate = resp.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];

        // ── Check for text response (turn is done) ────────────────────────────
        const textParts = parts.filter((p: any) => p.text);
        const toolCalls = parts.filter((p: any) => p.functionCall) as Part[];

        if (toolCalls.length === 0) {
            // No more tool calls → Gemini gave us the final answer
            finalResponse = textParts.map((p: any) => p.text).join('\n');
            console.log(`\n[Agent] ✅ Final response received (${finalResponse.length} chars)`);
            break;
        }

        // ── Execute tool calls in parallel ────────────────────────────────────
        console.log(`[Agent] 🔧 Gemini requested ${toolCalls.length} tool call(s):`);

        // Log + run all tool calls concurrently
        const toolResults = await Promise.all(
            toolCalls.map(async (callPart) => {
                const call = callPart.functionCall!;
                const name = call.name!;
                const args = call.args as Record<string, any>;

                console.log(`  ▶ ${name}(${JSON.stringify(args)})`);

                let result: string;

                // Inject userId from agent context if the tool needs it
                if (name in { save_core_fact: 1, retrieve_core_facts: 1, create_agentic_task: 1, read_tasks: 1, update_task_status: 1 }) {
                    // Local Firebase tool — add userId automatically if not provided
                    result = await executeLocalTool(name, { userId, ...args });
                } else {
                    // External MCP tool (namespaced)
                    result = await callExternalTool(name, args);
                }

                return {
                    functionResponse: {
                        name,
                        response: { result },
                    },
                };
            })
        );

        // ── Inject tool results back into the conversation ────────────────────
        // Gemini expects us to send the model's tool-call turn first,
        // then immediately follow with the tool response turn.
        messages.push({ role: 'model', parts: toolCalls });
        messages.push({ role: 'user', parts: toolResults });
    }

    if (turns >= MAX_TURNS) {
        console.warn(`[Agent] ⚠️  Reached max turns (${MAX_TURNS}). Returning partial response.`);
    }

    return finalResponse;
}

// ═════════════════════════════════════════════════════════════════════════════
// STARTUP & SHUTDOWN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * main
 * Entry point when running the agent directly (not as a library).
 * Connects all MCP servers, runs a sample prompt, then shuts down.
 */
async function main() {
    console.log('\n🌟 ═══════════════════════════════════════════════');
    console.log('   SAKHA BODHI — Omni-Agent MCP Backend');
    console.log('═══════════════════════════════════════════════\n');

    // Graceful shutdown on Ctrl+C or process kill
    process.on('SIGINT', async () => { await shutdownAll(); process.exit(0); });
    process.on('SIGTERM', async () => { await shutdownAll(); process.exit(0); });

    // Connect all 4 external MCP servers
    await connectAllServers();

    // Demo prompt (replace with your real prompt or hook into an HTTP server)
    const userId = process.env.SUTRA_USER_ID ?? 'demo-user';
    const userPrompt = process.argv[2] ??
        'Remind me to review last night\'s build CI failure and create a task for it.';
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    const answer = await runAgent(userId, userPrompt, telegramChatId);

    console.log('\n════════════════════════ BODHI SAYS ════════════════════════');
    console.log(answer);
    console.log('═══════════════════════════════════════════════════════════\n');

    await shutdownAll();
}

// Run main only when this file is executed directly
if (require.main === module) {
    main().catch((err) => {
        console.error('[Agent] Fatal error:', err);
        process.exit(1);
    });
}
