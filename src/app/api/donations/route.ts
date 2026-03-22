import { NextResponse } from "next/server";
import { addMockDonation } from "@/lib/mockStore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, message, user } = body;
        
        if (!amount) {
            return NextResponse.json({ error: "Amount required" }, { status: 400 });
        }

        const donation = addMockDonation(amount, message, user || 'Anonymous Contributor');
        return NextResponse.json({ success: true, donation });
    } catch (e) {
        return NextResponse.json({ error: "Error saving donation" }, { status: 500 });
    }
}
