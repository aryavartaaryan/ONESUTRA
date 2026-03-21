import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getServerFirestore } from '@/lib/firebaseServer';

interface FeedbackPayload {
  type: 'feedback' | 'bug' | 'issue';
  title: string;
  description: string;
  email: string;
  timestamp: string;
  userAgent: string;
}

const ALLOWED_TYPES = new Set(['feedback', 'bug', 'issue']);

function parsePayload(body: Partial<FeedbackPayload>) {
  const type = String(body.type || '').trim();
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const userAgent = String(body.userAgent || '').trim();
  const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

  return { type, title, description, email, userAgent, timestamp };
}

async function writeFeedback(payload: {
  type: string;
  title: string;
  description: string;
  email: string;
  userAgent: string;
  timestamp: Date;
}) {
  const base = {
    ...payload,
    status: 'new',
    read: false,
  };

  try {
    const adminDb = getAdminDb();
    const ref = adminDb.collection('feedback').doc();
    await ref.set({ ...base, createdAt: new Date(), source: 'admin-sdk' });
    return ref.id;
  } catch (adminError) {
    console.warn('Feedback write via admin-sdk failed, falling back to server firestore sdk:', adminError);
    const serverDb = getServerFirestore();
    const ref = await addDoc(collection(serverDb, 'feedback'), {
      ...base,
      createdAt: serverTimestamp(),
      source: 'server-sdk-fallback',
    });
    return ref.id;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<FeedbackPayload> = await req.json();
    const { type, title, description, email, userAgent, timestamp } = parsePayload(body);

    // Validation
    if (!title || !description || !email || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    const id = await writeFeedback({
      type,
      title,
      description,
      email,
      timestamp,
      userAgent,
    });

    // Log the feedback submission
    console.log(`Feedback submitted: ${type} - ${title} from ${email}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Feedback submitted successfully',
        id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feedback API Error:', error);

    if (error instanceof Error && /permission|unauthenticated|missing|credentials|firestore/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Feedback backend is not configured correctly. Please set FIREBASE_SERVICE_ACCOUNT_JSON or relax Firestore write rules for fallback.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit feedback. Please try again later.' },
      { status: 500 }
    );
  }
}
