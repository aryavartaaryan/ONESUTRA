'use client';
import AetherProfile from '@/components/profile/AetherProfile';
import InviteCard from '@/components/PranaVerse/InviteCard';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';

export default function ProfilePage() {
  const { user } = useOneSutraAuth();
  return (
    <>
      <AetherProfile />
      {/* Viral growth — InviteCard below profile content */}
      <InviteCard userName={user?.name} style={{ margin: '0.5rem 0.75rem 5rem' }} />
    </>
  );
}
