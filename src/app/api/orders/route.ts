import { NextResponse } from "next/server";
import { addMockOrder } from "@/lib/mockStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    addMockOrder(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding mock order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
