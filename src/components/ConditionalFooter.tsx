'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/**
 * Renders Footer on all pages except the splash landing page (/).
 */
export default function ConditionalFooter() {
    const pathname = usePathname();

    // Hide footer on the splash/landing page
    if (pathname === '/') return null;

    return <Footer />;
}
