/**
 * src/lib/firebaseAdmin.ts
 * Server-side Firebase Admin SDK — safe to import inside API Routes only.
 *
 * HOW TO SET UP (one-time):
 * 1. Go to Firebase Console → Project Settings → Service Accounts
 * 2. Click "Generate new private key" → download the JSON file
 * 3. Open .env.local and add:
 *    FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
 *    (paste the entire downloaded JSON as a single line value)
 * 4. Add to Vercel: Settings → Environment Variables → same key/value
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function initAdminApp(): App {
    if (adminApp) return adminApp;

    // Already initialised (e.g. hot-reload in dev)
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        throw new Error(
            '[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_JSON env var is missing. ' +
            'Generate a service account key from Firebase Console and paste the JSON as a single-line env var.'
        );
    }

    let serviceAccount: object;
    try {
        serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
        throw new Error('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }

    adminApp = initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
    return adminApp;
}

export function getAdminDb(): Firestore {
    if (adminDb) return adminDb;
    initAdminApp();
    adminDb = getFirestore();
    return adminDb;
}
