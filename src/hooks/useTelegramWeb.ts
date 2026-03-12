'use client';
/**
 * useTelegramWeb.ts — Pure JS MTProto Hook (GramJS)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHY THIS EXISTS:
 *   Previous WASM-based solutions (tdweb) conflicted with Next.js webpack
 *   bundlers and internal Web Worker URL routing.
 *   We use `telegram` (GramJS), which is a pure JavaScript implementation
 *   of MTProto that runs native in the browser without WASM.
 *
 * INITIALIZATION SEQUENCE:
 *   1. We initialize TelegramClient with a StringSession (saved in localStorage).
 *   2. The user inputs their phone -> submitPhone() calls client.sendCode().
 *   3. The user inputs OTP -> submitCode() calls client.invoke(SignIn).
 *   4. On success, we save the StringSession to localStorage and fetch contacts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSutraConnectStore } from '@/stores/sutraConnectStore';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';

export type TelegramAuthStep =
    | 'IDLE'
    | 'INITIALIZING'
    | 'WAIT_PHONE'
    | 'WAIT_CODE'
    | 'VERIFYING'
    | 'READY'
    | 'ERROR';

export interface TelegramContact {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    username?: string;
}

export interface UseTelegramWebReturn {
    step: TelegramAuthStep;
    error: string | null;
    contactCount: number;
    isMockMode: boolean;
    submitPhone: (phone: string) => Promise<void>;
    submitCode: (code: string) => Promise<void>;
    reset: () => void;
}

const API_ID = parseInt(process.env.NEXT_PUBLIC_TDLIB_API_ID ?? '0', 10);
const API_HASH = process.env.NEXT_PUBLIC_TDLIB_API_HASH ?? '';
const IS_MOCK = !API_ID || !API_HASH;

// Store session in localStorage to persist login
const SESSION_KEY = 'sutraconnect_tg_session';

export function useTelegramWeb(): UseTelegramWebReturn {
    const [step, setStep] = useState<TelegramAuthStep>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [contactCount, setContactCount] = useState(0);

    const clientRef = useRef<TelegramClient | null>(null);
    const phoneRef = useRef<string>('');
    const phoneCodeHashRef = useRef<string>('');

    const setTelegramSynced = useSutraConnectStore((s) => s.setTelegramSynced);
    const setContactMap = useSutraConnectStore((s) => s.setContactMap);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let destroyed = false;

        async function initGramJS() {
            setStep('INITIALIZING');

            if (IS_MOCK) {
                console.warn('[GramJS] MOCK MODE — set NEXT_PUBLIC_TDLIB_API_ID to go live.');
                await sleep(600);
                if (!destroyed) setStep('WAIT_PHONE');
                return;
            }

            try {
                // Determine if we already have a saved session
                const savedSession = localStorage.getItem(SESSION_KEY) || '';
                const stringSession = new StringSession(savedSession);

                const client = new TelegramClient(stringSession, API_ID, API_HASH, {
                    connectionRetries: 5,
                    deviceModel: 'Web Browser',
                    systemVersion: 'Web',
                    appVersion: '1.0',
                });

                clientRef.current = client;

                await client.connect();
                console.log('[GramJS] Connected to Telegram servers');

                if (!destroyed) {
                    if (await client.checkAuthorization()) {
                        // We are already logged in
                        setStep('READY');
                        fetchAndStoreContacts(client);
                    } else {
                        // We need to login
                        setStep('WAIT_PHONE');
                    }
                }
            } catch (err: any) {
                console.error('[GramJS] Init failed:', err);
                if (!destroyed) {
                    setStep('ERROR');
                    setError('Telegram could not connect. Please check your internet and try again.');
                }
            }
        }

        initGramJS();

        return () => { destroyed = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── SUBMIT PHONE ────────────────────────────────────────────────────────────
    const submitPhone = useCallback(async (phone: string) => {
        setError(null);

        if (IS_MOCK) {
            setStep('VERIFYING');
            await sleep(1500);
            setStep('WAIT_CODE');
            return;
        }

        if (!clientRef.current) {
            setError('Telegram client not ready. Please wait a moment and try again.');
            return;
        }

        try {
            setStep('VERIFYING');
            const normalizedPhone = normalizePhone(phone);
            phoneRef.current = normalizedPhone;

            // Send auth code
            const result = await clientRef.current.sendCode({
                apiId: API_ID,
                apiHash: API_HASH,
            }, normalizedPhone);

            phoneCodeHashRef.current = result.phoneCodeHash;
            setStep('WAIT_CODE');

        } catch (err: any) {
            console.error('[GramJS] sendCode error:', err);
            setError(friendlyError(err?.message));
            setStep('WAIT_PHONE');
        }
    }, []);

    // ── SUBMIT OTP CODE ─────────────────────────────────────────────────────────
    const submitCode = useCallback(async (code: string) => {
        setError(null);

        if (IS_MOCK) {
            setStep('VERIFYING');
            await sleep(1500);
            setStep('READY');
            setTelegramSynced('mock_tg_user_id_777', '+919876543210');
            setContactCount(4);
            setContactMap({
                '+919876500001': { telegram_user_id: '111001', is_onesutra_user: true, onesutra_uid: 'demo_uid_01' },
                '+919876500002': { telegram_user_id: '111002', is_onesutra_user: false, onesutra_uid: null },
            });
            return;
        }

        if (!clientRef.current || !phoneCodeHashRef.current || !phoneRef.current) return;

        try {
            setStep('VERIFYING');

            await clientRef.current.invoke(new Api.auth.SignIn({
                phoneNumber: phoneRef.current,
                phoneCodeHash: phoneCodeHashRef.current,
                phoneCode: code.trim()
            }));

            // Successfully logged in — save session to local storage
            const sessionString = (clientRef.current.session as StringSession).save();
            localStorage.setItem(SESSION_KEY, sessionString as unknown as string);

            setStep('READY');
            fetchAndStoreContacts(clientRef.current);

        } catch (err: any) {
            console.error('[GramJS] SignIn error:', err);
            if (err.message && err.message.includes('SESSION_PASSWORD_NEEDED')) {
                setError('2FA password required. Please temporarily disable it in Telegram and try again.');
                setStep('ERROR');
            } else {
                setError(friendlyError(err?.message));
                setStep('WAIT_CODE');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTelegramSynced, setContactMap]);

    // ── FETCH CLOUD CONTACTS ────────────────────────────────────────────────────
    const fetchAndStoreContacts = useCallback(async (client: TelegramClient) => {
        try {
            // Get our own profile
            const me = await client.getMe();

            const myId = String(me?.id ?? 'tg_user');
            const myPhone = me?.phone ?? '';
            setTelegramSynced(myId, myPhone);

            // Get contacts
            const result = await client.invoke(new Api.contacts.GetContacts({
                hash: BigInt(0) as any,
            }));

            // result is contacts.Contacts or contacts.ContactsNotModified
            if (result.className === 'contacts.Contacts') {
                const users = result.users;

                const contactsList: TelegramContact[] = [];
                for (const u of users) {
                    if (u.className === 'User' && u.phone) {
                        contactsList.push({
                            id: Number(u.id),
                            first_name: u.firstName ?? '',
                            last_name: u.lastName ?? '',
                            phone_number: normalizePhone(u.phone),
                            username: u.username ?? undefined,
                        });
                    }
                }

                setContactCount(contactsList.length);
                await crossReferenceWithFirestore(contactsList, setContactMap);
            }

        } catch (err) {
            console.error('[GramJS] Contact fetch error:', err);
        }
    }, [setTelegramSynced, setContactMap]);

    const reset = useCallback(() => {
        setStep('IDLE');
        setError(null);
        setContactCount(0);
    }, []);

    return { step, error, contactCount, isMockMode: IS_MOCK, submitPhone, submitCode, reset };
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore Cross-Reference (Dual User Detection)
// ─────────────────────────────────────────────────────────────────────────────

async function crossReferenceWithFirestore(
    contacts: TelegramContact[],
    setContactMap: (map: Record<string, { telegram_user_id: string; is_onesutra_user: boolean; onesutra_uid: string | null }>) => void
) {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();

        const phones = contacts.map((c) => c.phone_number).filter(Boolean);
        const contactByPhone: Record<string, TelegramContact> = {};
        for (const c of contacts) contactByPhone[c.phone_number] = c;

        const CHUNK = 30;
        const newMap: Record<string, { telegram_user_id: string; is_onesutra_user: boolean; onesutra_uid: string | null }> = {};

        for (let i = 0; i < phones.length; i += CHUNK) {
            const chunk = phones.slice(i, i + CHUNK);
            const q = query(collection(db, 'onesutra_users'), where('telegram_phone', 'in', chunk));
            const snap = await getDocs(q);

            for (const d of snap.docs) {
                const phone: string = d.data().telegram_phone;
                if (phone) {
                    newMap[phone] = {
                        telegram_user_id: String(contactByPhone[phone]?.id ?? ''),
                        is_onesutra_user: true,
                        onesutra_uid: d.id,
                    };
                }
            }
        }

        for (const phone of phones) {
            if (!newMap[phone] && contactByPhone[phone]) {
                newMap[phone] = {
                    telegram_user_id: String(contactByPhone[phone].id),
                    is_onesutra_user: false,
                    onesutra_uid: null,
                };
            }
        }

        setContactMap(newMap);
        console.log(`[GramJS] Cross-referenced ${contacts.length} contacts. Dual users: ${Object.values(newMap).filter(v => v.is_onesutra_user).length}`);
    } catch (err) {
        console.error('[GramJS] Firestore cross-reference error:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? `+${digits}` : digits;
}

function friendlyError(msg: string = ''): string {
    if (msg.includes('PHONE_NUMBER_INVALID')) return 'Invalid phone number. Please include your country code (e.g. +91).';
    if (msg.includes('PHONE_CODE_INVALID')) return 'Incorrect code. Please check the OTP and try again.';
    if (msg.includes('PHONE_CODE_EXPIRED')) return 'Your OTP has expired. Please go back and request a new one.';
    if (msg.includes('FLOOD_WAIT') || msg.includes('TOO_MANY_REQUESTS')) return 'Too many attempts. Please wait a few minutes and try again.';
    if (msg.includes('NETWORK')) return 'Network error. Check your connection and try again.';
    return msg || 'Something went wrong. Please try again.';
}
