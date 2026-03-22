import prisma from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { getMockProducts, getMockSellerApps } from "@/lib/mockStore";
import DeleteProductButton from "@/components/product/DeleteProductButton";
import ApproveSellerButton from "@/components/product/ApproveSellerButton";

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  
  // This route is protected by middleware, but adding double check
  // if ((session?.user as any)?.role !== "SUPER_ADMIN") {
  //     return <div className="p-16 text-center text-red-500 font-bold text-3xl">Access Denied</div>;
  // }

  let products = getMockProducts();
  let sellerApps = getMockSellerApps();

  return (
    <div className="page-container" style={{ padding: "2rem 1rem", color: "var(--text-main)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>
         <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--accent-gold)", marginBottom: "0.5rem" }}>Admin Dashboard</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>You have ultimate access to manage all products across the platform.</p>
         </div>
      </div>

      <div className="glass-panel" style={{ overflowX: "auto", borderRadius: "16px" }}>
         <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
               <tr style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "1.2rem 1rem", fontWeight: "600", color: "var(--text-muted)" }}>Product</th>
                  <th style={{ padding: "1.2rem 1rem", fontWeight: "600", color: "var(--text-muted)" }}>Category</th>
                  <th style={{ padding: "1.2rem 1rem", fontWeight: "600", color: "var(--text-muted)" }}>Price</th>
                  <th style={{ padding: "1.2rem 1rem", fontWeight: "600", color: "var(--text-muted)" }}>Seller ID</th>
                  <th style={{ padding: "1.2rem 1rem", fontWeight: "600", color: "var(--text-muted)" }}>Actions</th>
               </tr>
            </thead>
            <tbody>
               {products.map((p: any, idx: number) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                     <td style={{ padding: "1rem", fontWeight: "bold", color: "var(--text-main)" }}>{p.name}</td>
                     <td style={{ padding: "1rem", color: "var(--text-muted)" }}>{p.category}</td>
                     <td style={{ padding: "1rem", color: "var(--accent-amber)", fontWeight: "600" }}>₹{p.price.toFixed(2)}</td>
                     <td style={{ padding: "1rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "0.85rem" }}>{p.sellerId}</td>
                     <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <Link 
                             href={`/swadesi-product/admin-products/${p.id}/edit`} 
                             style={{ color: "var(--accent-saffron)", fontWeight: "bold", textDecoration: "none", padding: "0.4rem 0.8rem", background: "rgba(255,119,34,0.1)", borderRadius: "6px" }}
                          >
                             Edit
                          </Link>
                          <DeleteProductButton productId={p.id} />
                        </div>
                     </td>
                  </tr>
               ))}
               {products.length === 0 && (
                  <tr>
                     <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No products found.</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>

      <div style={{ marginTop: "4rem", marginBottom: "2rem" }}>
         <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent-saffron)", marginBottom: "1.5rem" }}>Pending Seller Applications</h2>
         <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sellerApps.length === 0 ? (
               <div style={{ padding: "2rem", color: "var(--text-muted)", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  No applications right now.
               </div>
            ) : (
               sellerApps.map((app: any) => (
                  <div key={app.id} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "2rem", flexWrap: "wrap", borderLeft: app.status === "pending" ? "4px solid var(--accent-amber)" : "4px solid var(--accent-sage)" }}>
                     <div style={{ flex: 1, minWidth: "250px" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "0.2rem" }}>{app.email}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{app.description}</div>
                        <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Applied on: {new Date(app.createdAt).toLocaleDateString()}</div>
                     </div>
                     <div>
                        {app.status === "pending" ? (
                           <ApproveSellerButton id={app.id} />
                        ) : (
                           <div style={{ color: "var(--accent-sage)", fontWeight: "bold", padding: "0.5rem 1rem", background: "rgba(34, 197, 94, 0.1)", borderRadius: "8px" }}>✅ Approved</div>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
    </div>
  );
}
