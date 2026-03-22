import prisma from "@/lib/prisma";
import Link from "next/link";
import BecomeSellerForm from "@/components/product/BecomeSellerForm";
import ProductSearchBar from "@/components/product/ProductSearchBar";
import BuyProductButton from "@/components/product/BuyProductButton";
import SwadeshiAuthButtons from "@/components/product/SwadeshiAuthButtons";
import { getMockProducts, getMockSellerApps } from "@/lib/mockStore";

const CATEGORIES = ["All", "Ayurvedic", "Khadi", "Organic Food", "Swadeshi Handicrafts", "Herbal Cosmetics", "Pooja Essentials", "Handlooms"];

export default async function CustomerProductListPage(props: {
  searchParams: Promise<{ category?: string, search?: string }>;
}) {
  const searchParamsData = await props.searchParams;
  const category = searchParamsData.category;
  const searchStr = searchParamsData.search || "";
  
  const sellerApps = getMockSellerApps();
  const approvedSellerEmails = sellerApps.filter((a: any) => a.status === "approved").map((a: any) => a.email);

  const currentCategory = (typeof category === "string" && CATEGORIES.includes(category)) ? category : "All";
  let products = getMockProducts();
  if (currentCategory !== "All") {
    products = products.filter((p: any) => p.category === currentCategory);
  }
  if (searchStr.trim() !== "") {
    const q = searchStr.toLowerCase();
    products = products.filter((p: any) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  return (
    <div className="page-container" style={{ padding: "2rem 1rem", color: "var(--text-main)" }}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .market-title { font-size: 2.8rem; }
        .mobile-orders-btn { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-gold), var(--accent-saffron)); color: #000; font-size: 1.2rem; text-decoration: none; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); flex-shrink: 0; }
        .desktop-orders-btn { display: flex; align-items: center; gap: 0.5rem; justify-content: center; padding: 0 1.2rem; height: 100%; border-radius: 8px; font-weight: 700; color: var(--text-main); text-decoration: none; min-height: 48px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); white-space: nowrap; flex-shrink: 0; }
        .search-row { display: flex; gap: 1rem; align-items: stretch; width: 100%; flex-wrap: nowrap; }
        .search-container { flex: 1; min-width: 0; }
        
        @media (max-width: 600px) {
           .desktop-orders-btn { display: none !important; }
           .mobile-orders-btn { display: flex !important; }
           .market-title { font-size: 1.8rem !important; flex: 1; margin-right: 0.5rem; }
           .search-row { flex-direction: column; }
        }
      `}</style>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1.5rem", marginBottom: "2.5rem" }}>
        <div style={{ marginBottom: "1rem", flex: "1 1 500px", maxWidth: "800px", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
             <h1 className="market-title" style={{ fontWeight: "bold", color: "var(--accent-gold)", letterSpacing: "-0.5px" }}>Swadeshi Marketplace</h1>
             <Link href="/swadesi-product/my-orders" className="mobile-orders-btn" title="My Orders">
               🛒
             </Link>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>Discover authentic, homemade, and traditional products directly from verified sellers.</p>
          
          <div className="search-row">
              <div className="search-container">
                  <ProductSearchBar />
              </div>
              <Link href="/swadesi-product/my-orders" className="desktop-orders-btn glass-panel" title="My Orders">
                 🛒 My Orders
              </Link>
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "flex-end", maxWidth: "100%" }}>
          <SwadeshiAuthButtons approvedSellerEmails={approvedSellerEmails} />
          
          <div className="hide-scrollbar" style={{ display: "flex", gap: "0.5rem", flexWrap: "nowrap", overflowX: "auto", whiteSpace: "nowrap", padding: "0.5rem", WebkitOverflowScrolling: "touch", width: "100%", maxWidth: "100vw" }}>
            {CATEGORIES.map(cat => (
              <Link 
                key={cat}
                href={cat === "All" ? "/swadesi-product" : `/swadesi-product?category=${cat}`}
                style={{
                  padding: "0.6rem 1.2rem", fontSize: "0.9rem", fontWeight: "600", borderRadius: "8px",
                  background: currentCategory === cat ? "var(--accent-saffron)" : "transparent",
                  color: currentCategory === cat ? "#fff" : "var(--text-muted)",
                  transition: "all 0.3s ease", textDecoration: "none"
                }}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* UI UPGRADE: Native inline grid layout inside Dark Mode containers */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3rem", marginBottom: "4rem" }}>
        {CATEGORIES.filter(c => c !== "All").map(cat => {
          const catProducts = products.filter((p: any) => p.category === cat);
          if (currentCategory !== "All" && currentCategory !== cat) return null;
          if (catProducts.length === 0) return null;
          
          return (
            <div key={cat} className="glass-panel-heavy" style={{ padding: "2.5rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "6px", height: "100%", background: "var(--accent-saffron)" }}></div>
              <h2 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <span style={{ color: "var(--accent-gold)", fontSize: "2.4rem" }}>✦</span> {cat}
              </h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }}>
                {catProducts.map((product: any) => (
                  <div key={product.id} className="glass-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden", transition: "transform 0.3s, box-shadow 0.3s" }}>
                    <div style={{ width: "100%", height: "240px", background: "rgba(0,0,0,0.4)", position: "relative", overflow: "hidden" }}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666", fontSize: "0.9rem" }}>No Image Available</div>
                      )}
                    </div>
                    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "0.5rem" }}>{product.name}</h3>
                      <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "1.5rem", flexGrow: 1, minHeight: "45px" }}>{product.description}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--accent-amber)" }}>₹{product.price.toFixed(2)}</span>
                          <Link href={`/swadesi-product/${product.id}`} style={{ color: "var(--accent-saffron)", fontSize: "0.9rem", textDecoration: "underline" }}>View details</Link>
                        </div>
                        <BuyProductButton product={product} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {products.length === 0 && (
           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2rem", background: "rgba(255,255,255,0.03)", borderRadius: "24px", border: "1px dashed rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
              <p style={{ color: "var(--text-muted)", fontWeight: "500", fontSize: "1.2rem" }}>No products found in "{currentCategory}".</p>
           </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "3rem", paddingBottom: "2rem", maxWidth: "650px", margin: "0 auto" }}>
         <BecomeSellerForm />
      </div>
    </div>
  );
}
