import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, status, userId } = body;

    const request = await prisma.sellerRequest.update({
      where: { id: requestId },
      data: { status }
    });

    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "SELLER" }
      });
    }

    return NextResponse.json(request, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
