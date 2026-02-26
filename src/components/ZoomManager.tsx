'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ZoomManager() {
    const pathname = usePathname();

    useEffect(() => {
        const checkZoom = () => {
            const isHome = pathname === '/';
            const hasStarted = localStorage.getItem('pranav_has_started') === 'true';

            if (!isHome || hasStarted) {
                document.documentElement.classList.add('app-zoomed');
            } else {
                document.documentElement.classList.remove('app-zoomed');
            }
        };

        checkZoom();

        // Listen for storage changes if they happen in other tabs
        window.addEventListener('storage', checkZoom);

        // Also observe mutations on body or custom event if needed
        // But since hasStarted inside app/page.tsx is the main trigger for the same page,
        // we should just add the class there too when they click start.

        return () => window.removeEventListener('storage', checkZoom);
    }, [pathname]);

    return null;
}
