'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AetherProfile from '@/components/profile/AetherProfile';

function ProfileContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const uid = params?.uid as string | undefined;
    const autoEnquire = searchParams?.get('enquire') === 'true';

    if (!uid) {
        return (
            <div style={{
                display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
                background: '#04020E', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif", fontSize: '0.9rem',
            }}>
                Profile not found 🙏
            </div>
        );
    }

    return <AetherProfile viewedUid={uid} autoEnquire={autoEnquire} />;
}

export default function UserProfilePage() {
    return (
        <Suspense fallback={
            <div style={{
                display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: '#04020E', gap: '1rem',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid rgba(251,191,36,0.15)',
                    borderTop: '3px solid #F59E0B',
                    animation: 'spin 0.9s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ color: '#F59E0B', fontFamily: "'Outfit',sans-serif", fontSize: '0.80rem', letterSpacing: '0.06em', opacity: 0.75 }}>
                    Awakening profile…
                </span>
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}
