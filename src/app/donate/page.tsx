'use client';

import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';

export default function DonatePage() {
    const { data: session } = useSession();
    const [amount, setAmount] = useState<number>(100);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handlePreset = (val: number) => {
        setAmount(val);
        setCustomAmount('');
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomAmount(e.target.value);
        const parsed = parseInt(e.target.value, 10);
        if (!isNaN(parsed) && parsed > 0) {
            setAmount(parsed);
        } else {
            setAmount(0);
        }
    };

    const handleDonate = async () => {
        if (amount < 1) return toast.error("Please enter a valid amount.");
        setLoading(true);
        try {
            const res = await fetch("/api/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            if (!res.ok) throw new Error("Failed to create Razorpay order");
            
            const order = await res.json();
            
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Rl29SthKKg50mB",
                amount: order.amount,
                currency: order.currency,
                name: "OneSHUTRA Ecosystem",
                description: "Donation to Conscious Ecosystem",
                order_id: order.id,
                handler: async function (response: any) {
                    const donorName = session?.user?.name || 'Anonymous';
                    const donorEmail = session?.user?.email || '';
                    await fetch("/api/donations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount, message, user: donorName, email: donorEmail })
                    });
                    toast.success(`💖 Thank you for your generous donation!`);
                    setTimeout(() => window.location.href = "/", 2000);
                },
                prefill: {
                    name: "Kind Supporter",
                    email: "support@oneshutra.in",
                    contact: "9999999999"
                },
                theme: { color: "#ec4899" }
            };
            
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error("Payment Failed: " + response.error.description);
            });
            rzp.open();
        } catch (error) {
            console.error(error);
            toast.error("Error initializing payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090a0f', color: '#fff', padding: '1rem' }}>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '500px', background: 'linear-gradient(145deg, rgba(20,20,22,0.8), rgba(10,10,12,0.9))', padding: '3rem 2rem', borderRadius: '24px', border: '1px solid rgba(236, 72, 153, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💖</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f472b6', marginBottom: '1rem' }}>Donate Us</h1>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Your contributions help us keep the servers running, expand the Swadeshi Marketplace securely, and build a completely ad-free conscious ecosystem.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    {[10, 100, 500, 1000].map(val => (
                        <button 
                            key={val} 
                            onClick={() => handlePreset(val)}
                            style={{
                                padding: '0.8rem', fontSize: '1rem', fontWeight: 'bold', borderRadius: '12px',
                                background: amount === val && customAmount === '' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: amount === val && customAmount === '' ? '#f472b6' : '#fff',
                                border: amount === val && customAmount === '' ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            ₹{val}
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Or enter a custom amount (₹)</label>
                    <input 
                        type="number" 
                        placeholder="Custom amount" 
                        value={customAmount}
                        onChange={handleCustomChange}
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none' }}
                    />
                </div>

                <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Leave a Message for the Core Team ✨</label>
                    <textarea 
                        placeholder="Why do you support OneSHUTRA?" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', resize: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={handleDonate} disabled={loading || amount < 1} style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', background: 'linear-gradient(90deg, #ec4899, #db2777)', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(236, 72, 153, 0.4)', opacity: (loading || amount < 1) ? 0.6 : 1 }}>
                        {loading ? "Processing..." : `Donate ₹${amount}`}
                    </button>
                    <Link href="/" style={{ width: '100%', padding: '1.2rem', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none' }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
