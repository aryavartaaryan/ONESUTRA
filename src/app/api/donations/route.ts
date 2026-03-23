import { NextResponse } from "next/server";
import { addMockDonation, getMockDonations } from "@/lib/mockStore";
import { getServerFirestore } from "@/lib/firebaseServer";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

async function saveDonationToFirestore(amount: number, message: string, user: string, email: string = "") {
  // Try Admin SDK first
  try {
    const { getAdminDb } = require("@/lib/firebaseAdmin");
    const db = getAdminDb();
    const ref = db.collection("donations").doc();
    const data = { amount, message: message || "", user, email, createdAt: new Date() };
    await ref.set(data);
    return { id: ref.id, ...data, date: data.createdAt.toISOString() };
  } catch { /* fall through */ }

  // Fallback: client SDK (NEXT_PUBLIC_FIREBASE_*)
  const db = getServerFirestore();
  const ref = await addDoc(collection(db, "donations"), {
    amount,
    message: message || "",
    user,
    email,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, amount, message, user, email, date: new Date().toISOString() };
}


export async function GET() {
  // Try Admin SDK
  try {
    const { getAdminDb } = require("@/lib/firebaseAdmin");
    const db = getAdminDb();
    const snap = await db.collection("donations").orderBy("createdAt", "desc").limit(100).get();
    const donations = snap.docs.map((doc: any) => ({
      id: doc.id, ...doc.data(),
      date: doc.data().createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    }));
    return NextResponse.json({ donations });
  } catch { /* fall through */ }

  // Fallback: client SDK
  try {
    const db = getServerFirestore();
    const snap = await getDocs(query(collection(db, "donations"), orderBy("createdAt", "desc"), limit(100)));
    const donations = snap.docs.map((doc) => {
      const d = doc.data() as any;
      return { id: doc.id, ...d, date: d.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString() };
    });
    return NextResponse.json({ donations });
  } catch { /* fall through */ }

  return NextResponse.json({ donations: getMockDonations() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, message, user, email } = body;

    if (!amount) {
      return NextResponse.json({ error: "Amount required" }, { status: 400 });
    }

    const donorName = user || "Anonymous";
    const donorEmail = email || "";

    try {
      const donation = await saveDonationToFirestore(Number(amount), message || "", donorName, donorEmail);
      return NextResponse.json({ success: true, donation });
    } catch (e) {
      console.error("Firestore save failed, using mock:", e);
      const donation = addMockDonation(amount, message, donorName);
      return NextResponse.json({ success: true, donation });
    }
  } catch (e) {
    console.error("Donation POST error:", e);
    return NextResponse.json({ error: "Error saving donation" }, { status: 500 });
  }
}

