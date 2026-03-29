import { SutraUser } from '@/hooks/useUsers';

export type Tab = 'story' | 'chat' | 'map';

export interface FriendDoc {
    id: string;
    fromUid: string;
    toUid: string;
    fromName: string;
    fromPhoto: string | null;
    toName: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: number;
}

export type FriendStatus = 'none' | 'sent' | 'received' | 'friends';
