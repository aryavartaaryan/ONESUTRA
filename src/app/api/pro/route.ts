import { NextResponse } from "next/server";
import { addMockProUser } from "@/lib/mockStore";

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
