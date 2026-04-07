'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Merged into /lifestyle/ayurvedic-habits
export default function HabitsRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/lifestyle/ayurvedic-habits'); }, [router]);
    return null;
}
