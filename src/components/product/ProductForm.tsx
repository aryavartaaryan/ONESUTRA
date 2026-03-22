"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Ayurvedic", "Khadi", "Organic Food", "Swadeshi Handicrafts"];

export default function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    imageUrl: initialData?.imageUrl || "",
    category: initialData?.category || CATEGORIES[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData ? `/api/products/${initialData.id}` : "/api/products";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Failed to save product");

      alert("Product saved successfully!");
      if (initialData?.isAdmin) {
         router.push("/swadesi-product/admin-products");
      } else {
         router.push("/swadesi-product/seller-products");
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error saving product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      <div>
        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "0.5rem", fontWeight: "600" }}>Product Name *</label>
        <input 
          required 
          type="text" 
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "var(--text-main)", outline: "none" }} 
        />
      </div>

      <div>
         <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "0.5rem", fontWeight: "600" }}>Category *</label>
         <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "var(--text-main)", outline: "none" }}
         >
            {CATEGORIES.map(cat => (
               <option key={cat} value={cat} style={{ background: "var(--bg-primary)", color: "var(--text-main)" }}>{cat}</option>
            ))}
         </select>
      </div>

      <div>
        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "0.5rem", fontWeight: "600" }}>Description *</label>
        <textarea 
          required 
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "var(--text-main)", outline: "none" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "0.5rem", fontWeight: "600" }}>Price (₹) *</label>
        <input 
          required 
          type="number" 
          min="0"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "var(--text-main)", outline: "none" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "0.5rem", fontWeight: "600" }}>Image URL *</label>
        <input 
          required 
          type="url" 
          value={formData.imageUrl}
          placeholder="https://example.com/image.jpg"
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "var(--text-main)", outline: "none" }} 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="btn-primary"
        style={{ width: "100%", marginTop: "1rem", padding: "1.2rem", fontSize: "1.1rem" }}
      >
        {loading ? "Saving..." : initialData ? "Update Product" : "Publish Product"}
      </button>
    </form>
  );
}
