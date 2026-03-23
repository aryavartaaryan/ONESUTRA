/**
 * firebase.ts — Firebase Admin SDK Initialization
 * ─────────────────────────────────────────────────────────────────────────────
 * This module initializes the Firebase Admin SDK using a service account.
 * It exports a Firestore client that all other modules share.
 *
 * DATA FLOW:
 *   .env (GOOGLE_APPLICATION_CREDENTIALS path) ──► Admin SDK init ──► `db`
 *   The `db` export is used by firebaseTools.ts (memory + tasks).
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

// ── Initialize only once (guard for hot-reloads in ts-node) ──────────────────
if (!admin.apps.length) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Option A: service account JSON file path (recommended)
    if (credPath && fs.existsSync(path.resolve(credPath))) {
        const serviceAccount = require(path.resolve(credPath));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('[Firebase] ✅ Initialized via service account file:', credPath);
    }
    // Option B: inline env vars (CI/CD / serverless)
    else if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace literal \n from env var with actual newlines
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
        console.log('[Firebase] ✅ Initialized via inline env vars');
    } else {
        throw new Error(
            '[Firebase] ❌ No credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or ' +
            'FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env'
        );
    }
}

// Export the Firestore database client — used throughout the agent
export const db = admin.firestore();

// Export a timestamp helper for consistent document metadata
export const now = () => admin.firestore.FieldValue.serverTimestamp();
