import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { updateMockProduct, deleteMockProduct } from "@/lib/mockStore";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    deleteMockProduct(params.id);
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const updated = { id: params.id, ...body, price: parseFloat(body.price) };
    updateMockProduct(params.id, updated);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
