'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ════════════════════════════════════════════════════════
//  REDIRECT: bodhi-chat → pranaverse-chat (consolidated)
//  The standalone Bodhi chat has been merged into the
//  PranaVerse Chat Hub. This page now redirects there.
// ════════════════════════════════════════════════════════
export default function BodhiChatRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/pranaverse-chat');
    }, [router]);
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'Outfit',sans-serif",
            fontSize: '0.9rem',
        }}>
            ✦ Redirecting to Sakha Bodhi…
        </div>
    );
}
