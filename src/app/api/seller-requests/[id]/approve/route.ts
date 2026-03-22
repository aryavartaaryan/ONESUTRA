import { NextResponse } from "next/server";
import { approveMockSellerApp } from "@/lib/mockStore";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    approveMockSellerApp(id, "admin@example.com");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving seller:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
