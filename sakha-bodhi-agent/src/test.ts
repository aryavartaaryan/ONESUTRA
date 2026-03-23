/**
 * test.ts — Omni-Agent Simulation Test Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates a real user prompt that exercises ALL 4 external MCP servers
 * plus BOTH Firebase tool sets in a single agentic run.
 *
 * THE TEST PROMPT:
 * "Search the web for the top AI news today, tweet a quick summary of it,
 *  message the link to my Telegram channel, and create a Firebase task for me
 *  to review it later."
 *
 * EXPECTED AGENT BEHAVIOR:
 *  1. twitter-mcp__create_tweet        — posts a summary tweet
 *  2. telegram-bot__send_message       — sends link to Telegram channel
 *  3. create_agentic_task (Firebase)   — creates "Review AI news" task
 *  4. save_core_fact (Firebase)        — optionally saves "User is interested in AI news"
 *
 * HOW TO RUN:
 *   1. Copy .env.example → .env and fill in all API keys
 *   2. Run: npm install
 *   3. Run: npm test   (or: npx ts-node src/test.ts)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { connectAllServers, shutdownAll } from './mcpServers';
import { runAgent } from './index';

// ── Colour helpers for readable terminal output ───────────────────────────────
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function banner(text: string) {
    const line = '═'.repeat(60);
    console.log(`\n${CYAN}${line}${RESET}`);
    console.log(`${CYAN}  ${text}${RESET}`);
    console.log(`${CYAN}${line}${RESET}\n`);
}

function section(text: string) {
    console.log(`\n${YELLOW}── ${text} ──${RESET}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST CASES
// ═════════════════════════════════════════════════════════════════════════════

const TEST_USER_ID = process.env.SUTRA_USER_ID ?? 'test-user-001';

const TEST_CASES = [
    // ── Test 1: The flagship all-in-one prompt ────────────────────────────────
    {
        label: 'Flagship Omni-Agent Test',
        description:
            'Exercises Twitter + Telegram + Firebase Tasks in one turn.',
        prompt:
            'Imagine some top AI news today, tweet a quick one-line summary ' +
            'of it, message the same summary link to my Telegram channel, and then ' +
            'create a Firebase task for me to review the topic in detail later today.',
    },

    // ── Test 2: Memory tools ──────────────────────────────────────────────────
    {
        label: 'Firebase Memory — Save & Retrieve',
        description: 'Stores a preference and retrieves it in the same session.',
        prompt:
            'Remember that I prefer to receive news in Hindi and that my wake-up time ' +
            'is 5 AM. Then retrieve all my saved preferences and list them for me.',
    },

    // ── Test 3: GitHub code exploration ──────────────────────────────────────
    {
        label: 'GitHub Repo Explorer',
        description: 'Reads repo info and suggests a quick code review task.',
        prompt:
            'Look at the currently open pull requests for the GitHub repo ' +
            '"AryanChoudhary/OneSUTRA" and create a Firebase task to review the most ' +
            'important one by end of day.',
    },
];

// ═════════════════════════════════════════════════════════════════════════════
// RUNNER
// ═════════════════════════════════════════════════════════════════════════════

async function runTests() {
    banner('🌟 SAKHA BODHI — Omni-Agent Test Suite');

    // Graceful shutdown on Ctrl+C
    process.on('SIGINT', async () => {
        console.log('\n[Test] Shutting down…');
        await shutdownAll();
        process.exit(0);
    });

    // Connect all 4 external MCP servers once before any test
    section('Connecting external MCP servers');
    await connectAllServers();

    let passed = 0;

    // Pick which test to run (default: flagship)
    const testIndex = parseInt(process.argv[2] ?? '0', 10);
    const testsToRun = testIndex >= 0 && testIndex < TEST_CASES.length
        ? [TEST_CASES[testIndex]]
        : TEST_CASES;

    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    for (const tc of testsToRun) {
        section(`📋 Test: ${tc.label}`);
        console.log(`   ${tc.description}`);
        console.log(`   Prompt: "${tc.prompt}"`);

        const start = Date.now();
        try {
            const response = await runAgent(TEST_USER_ID, tc.prompt, telegramChatId);
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);

            console.log(`\n${GREEN}✅ PASS${RESET} — Completed in ${elapsed}s`);
            console.log('\n─────────── Agent Response ──────────────────────────');
            console.log(response);
            console.log('─────────────────────────────────────────────────────');
            passed++;
        } catch (err) {
            console.error(`\n❌ FAIL — Error in test "${tc.label}":`, err);
        }
    }

    section('Test Summary');
    console.log(`Passed: ${passed} / ${testsToRun.length}`);

    await shutdownAll();
    process.exit(passed === testsToRun.length ? 0 : 1);
}

runTests().catch((err) => {
    console.error('[Test] Unhandled error:', err);
    process.exit(1);
});
