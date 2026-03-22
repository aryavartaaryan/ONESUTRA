import { NextResponse } from "next/server";
import { addMockProUser, getMockProUsers } from "@/lib/mockStore";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    if (!email) return NextResponse.json({ isPro: false });
    
    const proUsers = getMockProUsers();
    const isPro = proUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
    return NextResponse.json({ isPro });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name } = body;
        
        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const proUser = addMockProUser(email, name || 'Pro Member');
        return NextResponse.json({ success: true, proUser });
    } catch (e) {
        return NextResponse.json({ error: "Error saving pro user" }, { status: 500 });
    }
}
