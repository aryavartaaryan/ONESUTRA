"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

export default function BuyProductButton({ product }: { product: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: product.price }),
      });
      if (!res.ok) throw new Error("Failed to create Razorpay order");
      
      const order = await res.json();
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Rl29SthKKg50mB",
        amount: order.amount,
        currency: order.currency,
        name: "Swadeshi Marketplace",
        description: `Purchase of ${product.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ product, type: "Razorpay (Online Payment)", paymentId: response.razorpay_payment_id })
            });
            alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
            router.push("/swadesi-product/my-orders");
          } catch(e) {
            console.error(e);
          }
        },
        prefill: {
          name: "Swadeshi Customer",
          email: "customer@swadeshi.in",
          contact: "9999999999"
        },
        theme: {
          color: "#f59e0b" // bg-amber-500
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Error initializing payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div style={{ display: "flex", gap: "0.5rem", width: "100%", flexDirection: "row", marginTop: "0.5rem" }}>
        <button 
          onClick={handleRazorpay} 
          disabled={loading}
          className="btn-primary" 
          style={{ flex: 1, padding: "0.6rem", fontSize: "0.9rem", borderRadius: "8px", boxShadow: "var(--shadow-amber-glow)", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem" }}
        >
          {loading ? "..." : "💳 Pay"}
        </button>
        <button 
          onClick={() => router.push(`/swadesi-product/checkout/${product.id}`)} 
          disabled={loading}
          style={{ flex: 1, padding: "0.6rem", fontSize: "0.9rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontWeight: "bold" }}
        >
          🚚 COD
        </button>
      </div>
    </>
  );
}
