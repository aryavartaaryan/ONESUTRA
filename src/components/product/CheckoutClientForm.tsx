"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutClientForm({ product }: { product: any }) {
  const [codData, setCodData] = useState({ name: "", phone: "", address: "", city: "", pin: "" });
  const router = useRouter();

  const handleCODSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, type: "Cash on Delivery", deliveryDetails: codData })
      });
      alert(`🎉 Order Placed successfully!\n\nDelivery to:\n${codData.name}\n${codData.address}, ${codData.city} - ${codData.pin}\nPhone: ${codData.phone}\n\nYou will pay ₹${product.price.toFixed(2)} on delivery.`);
      router.push("/swadesi-product/my-orders");
    } catch (e) {
      console.error(e);
      alert("Error placing order.");
    }
  };

  const inputStyle = { width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.4)", color: "var(--text-main)", outline: "none", fontSize: "1rem" };

  return (
    <div className="page-container" style={{ padding: "4rem 1rem", color: "var(--text-main)", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <Link href={`/swadesi-product/${product.id}`} style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-block", marginBottom: "2rem", fontWeight: "bold" }}>
          &larr; Back to {product.name}
        </Link>
        
        <div className="glass-panel-heavy" style={{ padding: "3rem", borderRadius: "24px" }}>
           <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent-gold)", marginBottom: "0.5rem" }}>Cash on Delivery</h1>
           <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
              Total Amount to be Paid on Delivery: <strong style={{ color: "var(--accent-amber)", fontSize: "1.4rem", marginLeft: "0.5rem" }}>₹{product.price.toFixed(2)}</strong>
           </p>

           <form onSubmit={handleCODSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                 <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Full Name</label>
                 <input required type="text" placeholder="e.g. Sumant Saini" value={codData.name} onChange={e => setCodData({...codData, name: e.target.value})} style={inputStyle} />
              </div>

              <div>
                 <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Phone Number</label>
                 <input required type="tel" placeholder="e.g. +91 99999 99999" value={codData.phone} onChange={e => setCodData({...codData, phone: e.target.value})} style={inputStyle} />
              </div>

              <div>
                 <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Complete Delivery Address</label>
                 <textarea required placeholder="House No., Street Name, Area/Locality" rows={3} value={codData.address} onChange={e => setCodData({...codData, address: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                 <div style={{ flex: 2 }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>City</label>
                    <input required type="text" placeholder="e.g. New Delhi" value={codData.city} onChange={e => setCodData({...codData, city: e.target.value})} style={inputStyle} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>PIN Code</label>
                    <input required type="text" placeholder="e.g. 110001" value={codData.pin} onChange={e => setCodData({...codData, pin: e.target.value})} style={inputStyle} />
                 </div>
              </div>

              <div style={{ marginTop: "2rem", width: "100%" }}>
                 <button type="submit" className="btn-primary" style={{ width: "100%", padding: "1.2rem", borderRadius: "12px", fontSize: "1.2rem", fontWeight: "bold", boxShadow: "var(--shadow-amber-glow)", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                    ✅ Place Order (COD)
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
