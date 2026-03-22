"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      
      // Force Next.js to re-fetch the server data
      router.refresh(); 
    } catch (error) {
      console.error(error);
      alert("Error deleting product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading}
      style={{ 
        color: "#FCA5A5", fontWeight: "bold", padding: "0.4rem 0.8rem", 
        background: "rgba(239, 68, 68, 0.1)", borderRadius: "6px", 
        border: "none", cursor: loading ? "wait" : "pointer" 
      }}
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
