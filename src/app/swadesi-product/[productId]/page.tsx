import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getMockProducts } from "@/lib/mockStore";

import BuyProductButton from "@/components/product/BuyProductButton";

export default async function CustomerProductPage(props: { params: Promise<{ productId: string }> }) {
  const { productId } = await props.params;
  const products = getMockProducts();
  const product = products.find((p: any) => p.id === productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="page-container" style={{ padding: "2rem 1rem", color: "var(--text-main)" }}>
      <Link href="/swadesi-product" style={{ color: "var(--accent-saffron)", textDecoration: "none", display: "inline-block", marginBottom: "2rem", fontWeight: "bold" }}>&larr; Back to Marketplace</Link>
      
      <div className="glass-panel-heavy" style={{ display: "flex", flexWrap: "wrap", gap: "3rem", padding: "3rem", borderRadius: "24px" }}>
        <div style={{ flex: "1 1 400px", maxWidth: "600px" }}>
          <div className="glass-panel" style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", borderRadius: "16px", background: "rgba(0,0,0,0.4)" }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>No Image</div>
            )}
          </div>
        </div>
        
        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: "2.8rem", fontWeight: "bold", color: "var(--accent-gold)", marginBottom: "1rem", lineHeight: "1.2" }}>{product.name}</h1>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.85rem", marginBottom: "1rem", alignSelf: "flex-start" }}>
            {product.category}
          </div>
          <p style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "1.5rem", fontWeight: "500" }}>
            Sold by: <span style={{ color: "var(--accent-saffron)" }}>{product.seller?.name || "Verified Swadeshi Seller"}</span>
          </p>
          
          <div style={{ fontSize: "3.5rem", fontWeight: "300", color: "var(--text-main)", marginBottom: "2rem" }}>₹{product.price.toFixed(2)}</div>
          
          <p style={{ color: "var(--text-muted)", lineHeight: "1.8", fontSize: "1.1rem", marginBottom: "3rem", whiteSpace: "pre-line" }}>{product.description}</p>
          
          <BuyProductButton product={product} />
        </div>
      </div>
    </div>
  );
}
