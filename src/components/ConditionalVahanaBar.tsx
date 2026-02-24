'use client';

import { usePathname } from 'next/navigation';
import VahanaBar from './HomePage/VahanaBar';

/**
 * Renders VahanaBar on all pages except the meditation experience.
 */
export default function ConditionalVahanaBar() {
    const pathname = usePathname();

    // Hide navigation in the Dhyan Kshetra experience (Meditation Room, Entry, etc)
    const isMeditationRoom = pathname.startsWith('/dhyan-kshetra');

    if (isMeditationRoom) return null;

    return <VahanaBar />;
}
