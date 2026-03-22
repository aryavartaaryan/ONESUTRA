import { getMockOrders } from "@/lib/mockStore";
import Link from "next/link";

export default function MyOrdersPage() {
  const orders = getMockOrders();

  return (
    <div className="page-container" style={{ padding: "3rem 1rem", color: "var(--text-main)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--accent-gold)" }}>My Orders</h1>
          <Link href="/swadesi-product" style={{ color: "var(--accent-saffron)", textDecoration: "none", fontWeight: "bold", padding: "0.6rem 1rem", background: "rgba(255,119,34,0.1)", borderRadius: "8px" }}>
            &larr; Back to Shop
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", borderRadius: "24px" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
            <h2 style={{ fontSize: "1.5rem", color: "var(--text-main)", marginBottom: "1rem" }}>Your Cart is Empty</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Looks like you haven't bought anything yet.</p>
            <Link href="/swadesi-product" className="btn-primary" style={{ padding: "0.8rem 1.5rem", borderRadius: "12px", textDecoration: "none" }}>
              Explore Products
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {orders.map((order: any) => (
              <div key={order.orderId} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "16px", display: "flex", gap: "1.5rem", flexWrap: "wrap", borderTop: order.type === "Cash on Delivery" ? "4px solid var(--accent-sage)" : "4px solid var(--accent-gold)" }}>
                
                <div style={{ flex: "0 0 100px", height: "100px", borderRadius: "12px", background: "rgba(0,0,0,0.4)", overflow: "hidden" }}>
                  {order.product?.imageUrl ? (
                    <img src={order.product.imageUrl} alt={order.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "2rem" }}>📦</div>
                  )}
                </div>

                <div style={{ flex: "1 1 min-content", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "0.2rem" }}>{order.product?.name}</h3>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Order ID: {order.orderId}</div>
                  <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", color: order.type === "Cash on Delivery" ? "var(--accent-sage)" : "var(--accent-gold)", fontWeight: "bold", width: "max-content" }}>
                    {order.type}
                  </div>
                </div>

                <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--accent-amber)" }}>₹{order.product?.price.toFixed(2)}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
