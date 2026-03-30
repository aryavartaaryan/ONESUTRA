'use client';

import { usePathname } from 'next/navigation';
import VahanaBar from './HomePage/VahanaBar';

/**
 * Renders VahanaBar on all pages except the meditation experience.
 */
export default function ConditionalVahanaBar() {
    const pathname = usePathname();

    // Hide navigation in the Dhyan Kshetra experience, acharya sanctum, and pranaverse (needs full screen)
    const hideNav = pathname.startsWith('/dhyan-kshetra') || pathname.startsWith('/acharya-sanctum') || pathname.startsWith('/pranaverse');

    if (hideNav) return null;

    return <VahanaBar />;
}
