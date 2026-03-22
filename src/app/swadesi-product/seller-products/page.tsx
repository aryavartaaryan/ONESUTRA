import ProductForm from "@/components/product/ProductForm";
import Link from "next/link";
import DeleteProductButton from "@/components/product/DeleteProductButton";

import { getMockProducts } from "@/lib/mockStore";

export default function SellerDashboard() {
  // MOCK SELLER DATA from global store
  const myProducts = getMockProducts();

  return (
    <div className="page-container" style={{ padding: "2rem 1rem", color: "var(--text-main)" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--accent-gold)", marginBottom: "2.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>🏪 My Seller Dashboard</h1>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3rem" }}>
        <div className="glass-panel-heavy" style={{ flex: "1 1 400px", padding: "2.5rem", borderRadius: "20px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "2rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--accent-sage)" }}>●</span> Add New Product
          </h2>
          <ProductForm />
        </div>

        <div className="glass-panel" style={{ flex: "1 1 400px", padding: "2.5rem", borderRadius: "20px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "2rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--accent-saffron)" }}>⚡</span> My Listed Products
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {myProducts.map((p: any) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 1.5rem", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <h3 style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "1.1rem" }}>{p.name}</h3>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{p.category}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ fontWeight: "bold", color: "var(--accent-amber)", fontSize: "1.2rem" }}>₹{p.price.toFixed(2)}</div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                     <Link 
                        href={`/swadesi-product/admin-products/${p.id}/edit`} 
                        style={{ color: "var(--accent-saffron)", fontWeight: "bold", textDecoration: "none", padding: "0.4rem 0.8rem", background: "rgba(255,119,34,0.1)", borderRadius: "6px" }}
                     >
                        Edit
                     </Link>
                     <DeleteProductButton productId={p.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
