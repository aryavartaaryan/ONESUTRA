/**
 * mcpServers.ts — External MCP Server Management
 * ─────────────────────────────────────────────────────────────────────────────
 * Spawns 4 community MCP servers as child processes (STDIO transport) and
 * returns initialized MCP Client instances for each.
 *
 * SERVER MAP:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  1. brave-search    → web / internet research                   │
 * │  2. github          → read repos, PRs, code                     │
 * │  3. twitter-mcp     → post tweets, search Twitter               │
 * │  4. telegram-bot    → read & send Telegram messages             │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * DATA FLOW:
 *   npx <package> ──STDIO──► StdioClientTransport ──► Client.connect()
 *   After connect: Client.tools() returns available tool definitions.
 *   Client.callTool(name, args) executes a tool and returns the result.
 *
 * IMPORTANT: Always call `shutdownAll()` on process exit to gracefully
 * terminate the child processes.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Each entry describes one external MCP server to spawn
interface ServerConfig {
    /** Human-readable name for logs */
    name: string;
    /** The npm package to run via npx */
    command: string;
    /** CLI args passed to the package */
    args: string[];
    /** Environment variables injected into the child process */
    env: Record<string, string>;
}

// ── Server configurations ─────────────────────────────────────────────────────

function buildServerConfigs(): ServerConfig[] {
    return [
        // ── 1. GitHub ───────────────────────────────────────────────────────
        // Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/github
        {
            name: 'github',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN ?? '',
            },
        },

        // ── 3. Twitter / X ──────────────────────────────────────────────────
        // Package: https://www.npmjs.com/package/@enescinar/twitter-mcp
        {
            name: 'twitter-mcp',
            command: 'npx',
            args: ['-y', '@enescinar/twitter-mcp'],
            env: {
                TWITTER_API_KEY: process.env.TWITTER_API_KEY ?? '',
                TWITTER_API_KEY_SECRET: process.env.TWITTER_API_KEY_SECRET ?? '',
                TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN ?? '',
                TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET ?? '',
            },
        },

        // ── 4. Telegram Bot ─────────────────────────────────────────────────
        // Package: https://www.npmjs.com/package/telegram-bot-mcp-server
        {
            name: 'telegram-bot',
            command: 'npx',
            args: ['-y', 'telegram-bot-mcp-server'],
            env: {
                TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? '',
            },
        },
    ];
}

// ── Shared state (module-level singletons) ────────────────────────────────────

// Map from server name → connected MCP Client
const _clients: Map<string, Client> = new Map();

// ── Connect function ──────────────────────────────────────────────────────────

/**
 * connectAllServers
 * Spawns all 4 external MCP servers and establishes STDIO connections.
 * Must be called once at startup before any tool is used.
 *
 * @returns  Map<serverName, Client>
 */
export async function connectAllServers(): Promise<Map<string, Client>> {
    const configs = buildServerConfigs();

    for (const cfg of configs) {
        console.log(`[MCP] Connecting to: ${cfg.name} …`);

        // StdioClientTransport spawns the process and wires up stdin/stdout
        const transport = new StdioClientTransport({
            command: cfg.command,
            args: cfg.args,
            env: { ...process.env, ...cfg.env } as Record<string, string>,
        });

        const client = new Client(
            { name: 'sakha-bodhi-agent', version: '1.0.0' },
            { capabilities: {} }
        );

        try {
            await client.connect(transport);
            _clients.set(cfg.name, client);
            console.log(`[MCP] ✅ Connected: ${cfg.name}`);
        } catch (err) {
            // Non-fatal: log the error and continue — the agent can run without this server
            console.error(`[MCP] ⚠️  Failed to connect to ${cfg.name}:`, err);
        }
    }

    return _clients;
}

/**
 * getAllExternalToolDefinitions
 * Aggregates tool definitions from all connected external MCP servers.
 * Returns an array of tool definitions in the format Gemini expects.
 */
export async function getAllExternalToolDefinitions(): Promise<any[]> {
    const allTools: any[] = [];

    for (const [serverName, client] of _clients.entries()) {
        try {
            const { tools } = await client.listTools();
            for (const tool of tools) {
                allTools.push({
                    // Namespace the tool name so we know which server owns it
                    name: `${serverName}__${tool.name}`,
                    description: `[${serverName}] ${tool.description}`,
                    parameters: tool.inputSchema ?? { type: 'object', properties: {} },
                });
            }
            console.log(`[MCP] 🔧 ${serverName}: ${tools.length} tools registered`);
        } catch (err) {
            console.warn(`[MCP] Could not list tools for ${serverName}:`, err);
        }
    }

    return allTools;
}

/**
 * callExternalTool
 * Routes a namespaced tool call (`serverName__toolName`) to the correct client.
 *
 * @param namespacedName  e.g. "brave-search__brave_web_search"
 * @param args            Arguments object from the LLM
 * @returns               JSON string of the tool result
 */
export async function callExternalTool(namespacedName: string, args: any): Promise<string> {
    // Extract server name and actual tool name from the namespaced identifier
    const separatorIdx = namespacedName.indexOf('__');
    if (separatorIdx === -1) {
        return JSON.stringify({ error: `Invalid namespaced tool name: ${namespacedName}` });
    }

    const serverName = namespacedName.slice(0, separatorIdx);
    const toolName = namespacedName.slice(separatorIdx + 2);
    const client = _clients.get(serverName);

    if (!client) {
        return JSON.stringify({ error: `MCP server not connected: ${serverName}` });
    }

    console.log(`[MCP] ▶ Calling ${serverName}.${toolName}`, JSON.stringify(args, null, 2));

    try {
        const result = await client.callTool({ name: toolName, arguments: args });
        // result.content is an array of content blocks; extract text
        const text = (result.content as any[])
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n');
        console.log(`[MCP] ✅ ${serverName}.${toolName} returned ${text.length} chars`);
        return text || JSON.stringify(result.content);
    } catch (err: any) {
        console.error(`[MCP] ❌ Error calling ${serverName}.${toolName}:`, err);
        return JSON.stringify({ error: err?.message ?? String(err) });
    }
}

/**
 * shutdownAll
 * Gracefully closes all MCP client connections.
 * Call this in your process.on('exit') / SIGINT handler.
 */
export async function shutdownAll(): Promise<void> {
    for (const [name, client] of _clients.entries()) {
        try {
            await client.close();
            console.log(`[MCP] 🔴 Disconnected: ${name}`);
        } catch { /* swallow */ }
    }
    _clients.clear();
}
