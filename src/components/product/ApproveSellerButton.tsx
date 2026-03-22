"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveSellerButton({ id }: { id: string }) {
   const [loading, setLoading] = useState(false);
   const router = useRouter();

   const onApprove = async () => {
      setLoading(true);
      try {
        await fetch(`/api/seller-requests/${id}/approve`, { method: "POST" });
        alert("✅ Seller Application Approved Successfully! They now have dashboard access.");
        router.refresh();
      } catch (error) {
        alert("Failed to approve seller.");
      } finally {
        setLoading(false);
      }
   }

   return (
      <button onClick={onApprove} disabled={loading} className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "8px", border: "none" }}>
         {loading ? "Approving..." : "✅ Approve Seller"}
      </button>
   );
}
