"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BecomeSellerForm() {
   const [email, setEmail] = useState("");
   const [description, setDescription] = useState("");
   const [loading, setLoading] = useState(false);
   const [success, setSuccess] = useState(false);
   const router = useRouter();

   const [showForm, setShowForm] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
         const res = await fetch("/api/seller-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, description })
         });
         if (!res.ok) throw new Error("Failed to submit request.");
         setSuccess(true);
      } catch (error) {
         console.error(error);
         alert("Could not submit request.");
      } finally {
         setLoading(false);
      }
   }

   if (success) {
      return (
         <div className="glass-panel" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e", color: "#bbf7d0", padding: "1.5rem", borderRadius: "12px", textAlign: "center" }}>
            <h3 style={{ fontWeight: "bold", fontSize: "1.25rem", marginBottom: "0.5rem" }}>Request Submitted Successfully!</h3>
            <p>Our admins will review your product proposal and approve {email} shortly. You will gain Seller access once approved.</p>
         </div>
      );
   }

   if (!showForm) {
      return (
         <div style={{ textAlign: "center", margin: "2rem 0" }}>
            <button onClick={() => setShowForm(true)} className="btn-primary">
               🌟 Want to Become a Swadeshi Seller? Click Here!
            </button>
         </div>
      );
   }

   const inputStyle = { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "8px", padding: "1rem", outline: "none" };

   return (
      <form onSubmit={handleSubmit} className="glass-panel-heavy" style={{ padding: "2rem", marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
         <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--accent-gold)" }}>Become a Swadeshi Seller</h2>
         <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Please describe the products you wish to sell on our platform. The admin will review your proposal and grant you access to the Seller Dashboard.
         </p>
         
         <input 
            required 
            type="email" 
            placeholder="Your Email Address (e.g., store@example.com)" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={inputStyle} 
         />

         <textarea
            required
            rows={5}
            style={inputStyle}
            placeholder="E.g., I want to sell homemade organic honey and khadi clothes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
         ></textarea>
         <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>
               Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
               {loading ? "Submitting..." : "Submit Proposal"}
            </button>
         </div>
      </form>
   );
}
