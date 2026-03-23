'use client';
/**
 * telegramClientManager.ts — Production-Grade Telegram Client Manager
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages a singleton GramJS TelegramClient with:
 *   ✅ Window-level singleton — survives Next.js HMR reloads (prevents AUTH_KEY_DUPLICATED)
 *   ✅ Explicit disconnect() before reconnect — kills old WebSocket before creating new one
 *   ✅ Persistent session restore from localStorage on startup
 *   ✅ ensureConnected() wrapper — auto-reconnects before every operation
 *   ✅ 30-second keep-alive ping to prevent MTProto WebSocket drop
 *   ✅ AUTH_KEY_DUPLICATED / AUTH_KEY_UNREGISTERED detection → session clear + UI event
 *   ✅ Idempotent init — concurrent calls share the same Promise
 *
 * ROOT CAUSE FIX: AUTH_KEY_DUPLICATED
 * ─────────────────────────────────────
 * In Next.js dev mode, HMR resets module-level variables (let _client = null)
 * but the OLD GramJS WebSocket connection stays alive in the browser.
 * When initializeGlobalClient() creates a NEW client with the same session key,
 * Telegram's servers see TWO simultaneous connections → sends 406 AUTH_KEY_DUPLICATED.
 *
 * Solution: store the live client on `window.__sutraconnect_tg` so HMR-surviving
 * singletons can be found and cleanly disconnected before a new one is created.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared Constants
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_KEY = 'sutraconnect_tg_session';

// DOM event fired when server invalidates the auth key
export const SESSION_EXPIRED_EVENT = 'telegram-session-expired';

// ─────────────────────────────────────────────────────────────────────────────
// Window-level singleton interface (survives HMR)
// ─────────────────────────────────────────────────────────────────────────────

declare global {
    interface Window {
        __sutraconnect_tg?: {
            client: any;
            keepAliveTimer: ReturnType<typeof setInterval> | null;
            isReady: boolean;
            initPromise: Promise<void> | null;
        };
    }
}

function getStore() {
    if (typeof window === 'undefined') return null;
    if (!window.__sutraconnect_tg) {
        window.__sutraconnect_tg = {
            client: null,
            keepAliveTimer: null,
            isReady: false,
            initPromise: null,
        };
    }
    return window.__sutraconnect_tg;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Getters / Setters
// ─────────────────────────────────────────────────────────────────────────────

export function getGlobalTelegramClient(): any {
    return getStore()?.client ?? null;
}

export function setGlobalTelegramClient(client: any): void {
    const store = getStore();
    if (!store) return;
    store.client = client;
    store.isReady = !!client;
    console.log('[TelegramClient] Global client set:', !!client);
}

export function isGlobalClientInitialized(): boolean {
    const store = getStore();
    return !!(store?.isReady && store?.client);
}

// ─────────────────────────────────────────────────────────────────────────────
// ensureConnected — call this before EVERY Telegram API operation
// ─────────────────────────────────────────────────────────────────────────────

export async function ensureConnected(): Promise<void> {
    const store = getStore();
    if (!store?.client) {
        throw new Error('Telegram client not initialised. Please log in first.');
    }

    try {
        if (!store.client.connected) {
            console.log('[TelegramClient] Not connected — reconnecting silently...');
            await store.client.connect();
            console.log('[TelegramClient] ✅ Reconnected successfully');
        }
    } catch (err: any) {
        handleClientError(err);
        throw err;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// handleClientError — Detect fatal auth errors and fire UI event
// ─────────────────────────────────────────────────────────────────────────────

export function handleClientError(err: any): void {
    const msg: string = err?.message ?? String(err);
    const errCode: number = err?.code ?? err?.errorCode ?? 0;
    const errMsg: string = err?.errorMessage ?? '';

    const isDuplicated =
        msg.includes('AUTH_KEY_DUPLICATED') ||
        errMsg === 'AUTH_KEY_DUPLICATED' ||
        errCode === 406;

    const isExpired =
        isDuplicated ||
        msg.includes('AUTH_KEY_UNREGISTERED') ||
        msg.includes('AUTH_KEY_INVALID') ||
        msg.includes('SESSION_REVOKED') ||
        msg.includes('USER_DEACTIVATED') ||
        errMsg === 'AUTH_KEY_UNREGISTERED';

    if (isExpired) {
        if (isDuplicated) {
            // AUTH_KEY_DUPLICATED: session key is still valid but there's a competing connection.
            // Clear the session so user re-authenticates fresh with a new key.
            console.warn('[TelegramClient] ⚠️ AUTH_KEY_DUPLICATED — competing connection detected. Clearing session.');
        } else {
            console.warn('[TelegramClient] ⚠️ Auth key expired or revoked — clearing session');
        }

        clearGlobalClient();

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Keep-Alive Ping
// ─────────────────────────────────────────────────────────────────────────────

function startKeepAlive(): void {
    stopKeepAlive();
    const store = getStore();
    if (!store) return;

    store.keepAliveTimer = setInterval(async () => {
        const s = getStore();
        if (!s?.client || !s.isReady) return;

        try {
            if (!s.client.connected) {
                console.log('[TelegramClient] Keep-alive: client disconnected — reconnecting...');
                await s.client.connect();

                const { reinitMessagingListener } = await import('./telegramMessaging');
                await reinitMessagingListener();

                console.log('[TelegramClient] ✅ Keep-alive reconnect succeeded');
            } else {
                try {
                    const { Api } = await import('telegram');
                    await s.client.invoke(new Api.Ping({ pingId: BigInt(Math.floor(Math.random() * 1e12)) as any }));
                } catch (_pingErr) {
                    // Ping failure is non-fatal
                }
            }
        } catch (err: any) {
            handleClientError(err);
        }
    }, 30_000); // Every 30 seconds
}

function stopKeepAlive(): void {
    const store = getStore();
    if (!store) return;
    if (store.keepAliveTimer !== null) {
        clearInterval(store.keepAliveTimer);
        store.keepAliveTimer = null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// killExistingClient — Explicitly disconnect any surviving WebSocket
// This is the KEY fix for AUTH_KEY_DUPLICATED in HMR / dev mode.
// ─────────────────────────────────────────────────────────────────────────────

async function killExistingClient(): Promise<void> {
    const store = getStore();
    if (!store?.client) return;

    console.log('[TelegramClient] 🔪 Disconnecting existing client before re-init...');
    stopKeepAlive();

    try {
        store.client.removeAllListeners?.();
        await store.client.disconnect();
        // Give Telegram's servers 1.5 seconds to register the disconnect
        // before we create a new connection with the same auth key.
        await new Promise<void>((r) => setTimeout(r, 1500));
    } catch (_) {
        // best-effort
    }

    store.client = null;
    store.isReady = false;
    console.log('[TelegramClient] ✅ Old client disconnected');
}

// ─────────────────────────────────────────────────────────────────────────────
// initializeGlobalClient — Restore session on app startup (IDEMPOTENT)
// ─────────────────────────────────────────────────────────────────────────────

export async function initializeGlobalClient(): Promise<boolean> {
    const store = getStore();
    if (!store) return false;

    // Already fully initialised — skip
    if (store.isReady && store.client) return true;

    // Prevent double-init race: share the same Promise across concurrent callers
    if (store.initPromise) {
        await store.initPromise;
        return store.isReady && !!store.client;
    }

    let resolveInit!: () => void;
    store.initPromise = new Promise<void>((res) => { resolveInit = res; });

    let restored = false;

    try {
        if (typeof window === 'undefined') {
            resolveInit();
            return false;
        }

        const savedSession = localStorage.getItem(SESSION_KEY);
        if (!savedSession) {
            console.log('[TelegramClient] No saved session — skipping restore');
            resolveInit();
            return false;
        }

        const API_ID = parseInt(process.env.NEXT_PUBLIC_TDLIB_API_ID ?? '0', 10);
        const API_HASH = process.env.NEXT_PUBLIC_TDLIB_API_HASH ?? '';

        if (!API_ID || !API_HASH) {
            console.warn('[TelegramClient] API credentials missing');
            resolveInit();
            return false;
        }

        // ⚡ CRITICAL: Kill any surviving WebSocket from a previous HMR cycle
        // before creating a new client with the same auth key.
        await killExistingClient();

        console.log('[TelegramClient] 🔄 Restoring session from localStorage...');
        const { TelegramClient, StringSession } = await loadGramJS();
        const session = new StringSession(savedSession);

        const client = new TelegramClient(session, API_ID, API_HASH, {
            connectionRetries: 3,
            retryDelay: 3000,
            autoReconnect: true,
            deviceModel: 'PranavSamadhaan Web',
            systemVersion: 'Web 2.0',
            appVersion: '2.0.0',
            langCode: 'en',
            useWSS: true,
            requestRetries: 2,
        });

        await client.connect();

        // Verify the auth key is still valid on Telegram servers
        const isAuthorised = await client.checkAuthorization();

        if (!isAuthorised) {
            console.warn('[TelegramClient] Session exists but auth failed — clearing');
            localStorage.removeItem(SESSION_KEY);
            try { await client.disconnect(); } catch (_) { }
            resolveInit();
            return false;
        }

        // ✅ Session valid — store on window (survives HMR)
        store.client = client;
        store.isReady = true;

        console.log('[TelegramClient] ✅ Session restored successfully');

        const { initializeTelegramMessaging } = await import('./telegramMessaging');
        await initializeTelegramMessaging(client);

        startKeepAlive();

        restored = true;
    } catch (err: any) {
        console.error('[TelegramClient] Session restore failed:', err);
        handleClientError(err);
        const s = getStore();
        if (s) { s.client = null; s.isReady = false; }
    } finally {
        // Resolve BEFORE nulling so concurrent awaiters see the final state
        resolveInit();
        const s = getStore();
        if (s) s.initPromise = null;
    }

    return restored;
}

// ─────────────────────────────────────────────────────────────────────────────
// Called after a fresh login (phone+OTP) to wire up keep-alive
// ─────────────────────────────────────────────────────────────────────────────

export function activateKeepAlive(): void {
    if (getStore()?.client) startKeepAlive();
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-initialize messaging service
// ─────────────────────────────────────────────────────────────────────────────

export async function reinitializeMessagingService(): Promise<void> {
    const store = getStore();
    if (!store?.client) {
        throw new Error('No global client — cannot re-initialise messaging service');
    }
    await ensureConnected();
    const { initializeTelegramMessaging } = await import('./telegramMessaging');
    await initializeTelegramMessaging(store.client);
    console.log('[TelegramClient] Messaging service re-initialised');
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout / Clear
// ─────────────────────────────────────────────────────────────────────────────

export function clearGlobalClient(): void {
    stopKeepAlive();
    const store = getStore();
    if (store?.client) {
        try { store.client.disconnect(); } catch (_) { /* best-effort */ }
        store.client = null;
        store.isReady = false;
        store.initPromise = null;
    }
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
    }
    console.log('[TelegramClient] Global client cleared + session wiped');
}

// ─────────────────────────────────────────────────────────────────────────────
// Lazy GramJS loader (avoids 'fs' import error in Next.js SSR)
// ─────────────────────────────────────────────────────────────────────────────

async function loadGramJS() {
    const [{ TelegramClient }, { StringSession }] = await Promise.all([
        import('telegram'),
        import('telegram/sessions/StringSession'),
    ]);
    return { TelegramClient, StringSession };
}
