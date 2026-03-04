// src/lib/firebase.ts — SSR-safe, offline-persistent Firestore init
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { type Auth, type GoogleAuthProvider } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _provider: GoogleAuthProvider | null = null;
let _db: Firestore | null = null;
let _persistenceEnabled = false;

function getOrInitApp(): FirebaseApp {
    if (app) return app;
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    return app;
}

export async function getFirebaseAuth(): Promise<Auth> {
    if (_auth) return _auth;
    const { getAuth } = await import('firebase/auth');
    _auth = getAuth(getOrInitApp());
    return _auth;
}

export async function getGoogleProvider(): Promise<GoogleAuthProvider> {
    if (_provider) return _provider;
    const { GoogleAuthProvider } = await import('firebase/auth');
    _provider = new GoogleAuthProvider();
    _provider.setCustomParameters({ prompt: 'select_account' });
    return _provider;
}

export async function getFirebaseFirestore(): Promise<Firestore> {
    if (_db) return _db;

    const { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = await import('firebase/firestore');

    try {
        // Enable multi-tab offline persistence so reactions work offline too
        if (!_persistenceEnabled) {
            _persistenceEnabled = true;
            _db = initializeFirestore(getOrInitApp(), {
                localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
            });
        } else {
            _db = getFirestore(getOrInitApp());
        }
    } catch {
        // Already initialised — just get the existing instance
        _db = getFirestore(getOrInitApp());
    }

    return _db;
}
