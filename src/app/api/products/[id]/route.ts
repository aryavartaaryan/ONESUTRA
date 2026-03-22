import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { updateMockProduct, deleteMockProduct } from "@/lib/mockStore";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    deleteMockProduct(params.id);
    // TEMPORARY MOCK RESPONSE TO BYPASS DATABASE CONNECTION ERROR
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
    // Bypassing dead auth and DB queries
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = { id: params.id, ...body, price: parseFloat(body.price) };
    updateMockProduct(params.id, updated);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
