'use client';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import Link from 'next/link';

export default function SwadeshiAuthButtons({
    approvedSellerEmails
}: {
    approvedSellerEmails: string[]
}) {
    const { user } = useOneSutraAuth();
    const email = user?.email || "";

    if (!email) return null;

    const adminEmails = ["studywithpwno.1@gmail.com", "studywithpwno.1@gmaiil.com", "aryavartaayan9@gmail.com"];
    const isAdmin = adminEmails.includes(email);
    const isApprovedSeller = approvedSellerEmails.includes(email);
    
    const canSeeAdmin = isAdmin;
    const canSeeSeller = isAdmin || isApprovedSeller;

    return (
       <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {canSeeAdmin && (
               <Link href="/swadesi-product/admin-products" className="glass-panel" style={{ padding: "0.6rem 1.2rem", fontSize: "0.95rem", color: "#FCA5A5", fontWeight: "bold", textDecoration: "none" }}>
                 🛠 Admin Dashboard
               </Link>
            )}
            
            {canSeeSeller && (
               <Link href="/swadesi-product/seller-products" className="glass-panel" style={{ padding: "0.6rem 1.2rem", fontSize: "0.95rem", color: "var(--accent-sage)", fontWeight: "bold", textDecoration: "none" }}>
                 🏪 Seller Dashboard
               </Link>
            )}
       </div>
    );
}
