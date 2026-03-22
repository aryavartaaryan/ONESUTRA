"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ProductSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentSearch = searchParams.get('search') || '';
  const [q, setQ] = useState(currentSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (q.trim()) params.set("search", q.trim());
    else params.delete("search");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} style={{ display: "flex", width: "100%", maxWidth: "500px", gap: "0.5rem" }}>
      <input 
         type="text"
         placeholder="Search for Ayurveda, Khadi, Honey..."
         value={q}
         onChange={(e) => setQ(e.target.value)}
         style={{ flex: 1, padding: "0.8rem 1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.4)", color: "var(--text-main)", outline: "none" }}
      />
      <button type="submit" className="btn-primary" style={{ padding: "0.8rem 1.5rem", borderRadius: "12px" }}>
        Search
      </button>
    </form>
  );
}
