import { NextResponse } from "next/server";
import { addMockProUser, getMockProUsers } from "@/lib/mockStore";
import { getServerFirestore } from "@/lib/firebaseServer";
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

function tryAdminDb() {
  try {
    const { getAdminDb } = require("@/lib/firebaseAdmin");
    return getAdminDb();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const listAll = url.searchParams.get("list") === "all";

  // -- Admin SDK --
  const adminDb = tryAdminDb();
  if (adminDb) {
    try {
      if (listAll) {
        const snap = await adminDb.collection("pro_users").orderBy("createdAt", "desc").limit(200).get();
        const proUsers = snap.docs.map((d: any) => ({
          email: d.id, ...d.data(),
          date: d.data().createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
        }));
        return NextResponse.json({ proUsers });
      }
      if (!email) return NextResponse.json({ isPro: false });
      const docSnap = await adminDb.collection("pro_users").doc(email.toLowerCase()).get();
      return NextResponse.json({ isPro: docSnap.exists });
    } catch { /* fall through */ }
  }

  // -- Client SDK fallback --
  try {
    const db = getServerFirestore();
    if (listAll) {
      const snap = await getDocs(query(collection(db, "pro_users"), orderBy("createdAt", "desc"), limit(200)));
      const proUsers = snap.docs.map((d) => {
        const data = d.data() as any;
        return { email: d.id, ...data, date: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString() };
      });
      return NextResponse.json({ proUsers });
    }
    if (!email) return NextResponse.json({ isPro: false });
    const docSnap = await getDoc(doc(collection(db, "pro_users"), email.toLowerCase()));
    return NextResponse.json({ isPro: docSnap.exists() });
  } catch { /* fall through */ }

  // -- In-memory fallback --
  const proUsers = getMockProUsers();
  if (listAll) return NextResponse.json({ proUsers });
  if (!email) return NextResponse.json({ isPro: false });
  const isPro = proUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
  return NextResponse.json({ isPro });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const emailKey = email.toLowerCase();
    const data = { name: name || "Pro Member", email: emailKey };

    // Admin SDK
    const adminDb = tryAdminDb();
    if (adminDb) {
      try {
        await adminDb.collection("pro_users").doc(emailKey).set(
          { ...data, createdAt: new Date() }, { merge: true }
        );
        return NextResponse.json({ success: true, proUser: { ...data, date: new Date().toISOString() } });
      } catch { /* fall through */ }
    }

    // Client SDK fallback
    try {
      const db = getServerFirestore();
      await setDoc(doc(collection(db, "pro_users"), emailKey), {
        ...data, createdAt: serverTimestamp()
      }, { merge: true });
      return NextResponse.json({ success: true, proUser: { ...data, date: new Date().toISOString() } });
    } catch { /* fall through */ }

    // In-memory fallback
    const proUser = addMockProUser(email, name || "Pro Member");
    return NextResponse.json({ success: true, proUser });
  } catch (e) {
    console.error("Pro POST error:", e);
    return NextResponse.json({ error: "Error saving pro user" }, { status: 500 });
  }
}
