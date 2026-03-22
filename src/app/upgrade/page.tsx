'use client';

import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

export default function UpgradeProPage() {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: 499 }),
            });
            if (!res.ok) throw new Error("Failed to create Razorpay order");
            
            const order = await res.json();
            
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Rl29SthKKg50mB",
                amount: order.amount,
                currency: order.currency,
                name: "OneSHUTRA Pro",
                description: "Pro Subscription (Monthly)",
                order_id: order.id,
                handler: async function (response: any) {
                    localStorage.setItem('has_oneshutra_pro', 'true');
                    try {
                        await fetch("/api/pro", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: "pro@oneshutra.in", name: "Pro Member" })
                        });
                    } catch (e) { console.error(e) }

                    alert(`✅ Welcome to OneSHUTRA Pro! Your premium features are now unlocked.`);
                    window.location.href = "/";
                },
                prefill: {
                    name: "Pro Member",
                    email: "pro@oneshutra.in",
                    contact: "9999999999"
                },
                theme: {
                    color: "#f59e0b"
                }
            };
            
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert("Payment Failed: " + response.error.description);
            });
            rzp.open();
        } catch (error) {
            console.error(error);
            alert("Error initializing payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090a0f', color: '#fff', padding: '1rem' }}>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            
            <style>{`
                .pro-container { padding: 4rem 3rem; }
                @media (max-width: 600px) {
                    .pro-container { padding: 2.5rem 1.5rem; }
                    .pro-title { font-size: 2rem !important; }
                    .pro-icon { font-size: 3rem !important; }
                }
            `}</style>

            <div className="pro-container" style={{ textAlign: 'center', width: '100%', maxWidth: '650px', background: 'linear-gradient(145deg, rgba(20,20,22,0.8), rgba(10,10,12,0.9))', borderRadius: '24px', border: '1px solid rgba(245, 158, 11, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                <div className="pro-icon" style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>👑</div>
                <h1 className="pro-title" style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fcd34d', marginBottom: '0.5rem' }}>OneSHUTRA Pro</h1>
                <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '90%', margin: '0 auto 2rem auto' }}>
                    Unlock infinite deep focus windows, exclusive marketplace seller privileges, and cognitive mastery.
                </p>

                <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-gold)', marginBottom: '1rem', fontWeight: 'bold' }}>Exclusive Pro Features:</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <li style={{ display: 'flex', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}><span>✨</span> Advanced AI features of Sakha Bodhi.</li>
                        <li style={{ display: 'flex', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}><span>🤖</span> Full AI Agentic Mode & advanced voice capability across all apps.</li>
                        <li style={{ display: 'flex', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}><span>🎟</span> Auto-booking for tickets and products via Sakha Bodhi.</li>
                        <li style={{ display: 'flex', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}><span>📜</span> Complete access to Vedas through AI Gurus & Sakha Bodhi.</li>
                        <li style={{ display: 'flex', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}><span>🚀</span> And many more premium features...</li>
                    </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={handleUpgrade} disabled={loading} style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', background: 'linear-gradient(90deg, #f59e0b, #d97706)', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)', opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Initializing..." : "Subscribe - ₹499/mo"}
                    </button>
                    <Link href="/" style={{ width: '100%', padding: '1.2rem', fontSize: '1rem', fontWeight: 'bold', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none' }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
