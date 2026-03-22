import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { addMockProduct } from "@/lib/mockStore";

export async function POST(req: NextRequest) {
  try {
    const { name, description, price, imageUrl, category } = await req.json();

    const newProduct = { id: "mock_" + Date.now(), name, description, price: parseFloat(price), imageUrl, category };
    addMockProduct(newProduct);
    
    // TEMPORARY MOCK RESPONSE TO BYPASS DATABASE CONNECTION ERROR
    return NextResponse.json(newProduct, { status: 201 });

    // Bypassing DB creation
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryQuery = searchParams.get('category');
    
    let products = (await import("@/lib/mockStore")).getMockProducts();
    if (categoryQuery) {
       products = products.filter((p: any) => p.category === categoryQuery);
    }
    
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
