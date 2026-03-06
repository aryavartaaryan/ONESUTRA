'use client';
/**
 * AutoPilotBackgroundService
 *
 * Queue-based processing disabled — AutoPilot is now handled directly
 * in the useEffect in page.tsx via the /api/autopilot route.
 * This stub preserves the component interface so GlobalAutoPilot.tsx compiles.
 */

interface Props {
    userId: string | null;
    userName: string;
    isAutoPilotEnabled: boolean;
}

export default function AutoPilotBackgroundService({ }: Props) {
    // No-op — queue listener disabled to avoid Firestore composite index requirement
    return null;
}
