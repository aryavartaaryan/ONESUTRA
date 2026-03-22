'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function UpgradeDonateCard() {
    const [isPro, setIsPro] = useState(false);
    
    useEffect(() => {
        setIsPro(localStorage.getItem('has_oneshutra_pro') === 'true');
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
                background: 'linear-gradient(145deg, rgba(23, 23, 25, 0.95), rgba(15, 15, 18, 0.98))',
                border: '1px solid rgba(255, 215, 0, 0.15)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginTop: '45rem'
            }}
        >
            {/* Background Glow */}
            <div style={{
                position: 'absolute',
                top: '-50%', left: '-50%',
                width: '200%', height: '200%',
                background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.15), transparent 60%)',
                pointerEvents: 'none'
            }} />

            <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '999px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>👑</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fcd34d', letterSpacing: '0.05em' }}>OneSHUTRA Pro</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>Unlock Infinite Focus</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    Access unlimited Deep Focus windows, advanced Sakha Bodhi AI models, and priority marketplace listings.
                </p>
            </div>

            {isPro ? (
                <div style={{
                    width: '100%', padding: '0.7rem',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fcd34d', fontSize: '0.9rem', fontWeight: 700,
                    border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px',
                    textAlign: 'center', letterSpacing: '0.02em',
                    boxShadow: '0 2px 12px rgba(245, 158, 11, 0.1)'
                }}>
                    ✨ Active Pro User
                </div>
            ) : (
                <Link href="/upgrade" style={{
                    width: '100%', padding: '0.7rem',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                    border: 'none', borderRadius: '8px',
                    textAlign: 'center', textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    transition: 'transform 0.2s'
                }}>
                    Upgrade to Pro
                </Link>
            )}

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />

            <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.3rem' }}>💖 Support Our Mission</h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.8rem' }}>
                    Help us build an ad-free, conscious ecosystem for Bharat.
                </p>
                <Link href="/donate" style={{
                    display: 'block', width: '100%', padding: '0.6rem',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                    textAlign: 'center', textDecoration: 'none',
                    transition: 'background 0.2s'
                }}>
                    Donate Us 🙏
                </Link>
            </div>
        </motion.div>
    );
}
