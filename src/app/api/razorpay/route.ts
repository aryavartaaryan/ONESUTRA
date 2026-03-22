import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "INR" } = body;

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: process.env.KEY_SECRET || "",
    });

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
