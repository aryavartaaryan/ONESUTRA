import { create } from 'zustand';

interface BodhiChatState {
    pendingMessage: string;
    setPendingMessage: (msg: string) => void;
    clearPendingMessage: () => void;
}

export const useBodhiChatStore = create<BodhiChatState>((set) => ({
    pendingMessage: '',
    setPendingMessage: (msg: string) => set({ pendingMessage: msg }),
    clearPendingMessage: () => set({ pendingMessage: '' }),
}));
