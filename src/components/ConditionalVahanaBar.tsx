'use client';

import { usePathname } from 'next/navigation';
import VahanaBar from './HomePage/VahanaBar';

/**
 * Renders VahanaBar on all pages except the meditation experience.
 */
export default function ConditionalVahanaBar() {
    const pathname = usePathname();

    // Hide navigation in the Dhyan Kshetra experience and the immersive JustVibe Reels feed
    const isHiddenRoute = pathname.startsWith('/dhyan-kshetra') || pathname.startsWith('/pranaverse');

    if (isHiddenRoute) return null;

    return <VahanaBar />;
}
