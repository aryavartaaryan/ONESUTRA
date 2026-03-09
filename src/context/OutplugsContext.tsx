'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SutraLayer {
    simpleWords: string;
    historicalContext: string;
    impact: string;
}

interface NewsAction {
    type: 'petition' | 'share' | 'donate';
    label: string;
    link: string;
}

export interface Article {
    id: string;
    headline: string;
    summary60Words: string;
    energyTag: 'Tamasic' | 'Rajasic' | 'Sattvic';
    category: string;
    source: string;
    link?: string;
    imageUrl?: string;
    timeAgo?: string;
    sutraLayer: SutraLayer;
    action?: NewsAction | null;
}

// ── Context Shape ─────────────────────────────────────────────────────────────
interface OutplugsContextValue {
    articles: Article[];
    loading: boolean;
    refreshing: boolean;
    newBadgeCount: number;
    fetchNews: (silent?: boolean) => Promise<void>;
    clearNewBadge: () => void;
}

const OutplugsContext = createContext<OutplugsContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export function OutplugsProvider({ children }: { children: ReactNode }) {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newBadgeCount, setNewBadgeCount] = useState(0);

    const fetchNews = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const res = await fetch('/api/outplugs-feed', { cache: 'no-store' });
            if (!res.ok) throw new Error('Feed fetch failed');

            const data = await res.json();
            if (data.articles?.length) {
                if (silent && articles.length > 0) {
                    setNewBadgeCount(data.articles.length);
                } else {
                    setArticles(data.articles);
                    setNewBadgeCount(0);
                }
            }
        } catch (e) {
            console.error('[OutplugsProvider] Failed to fetch news:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [articles.length]);

    const clearNewBadge = useCallback(() => {
        setNewBadgeCount(0);
        setArticles(prev => [...prev]); // trigger re-render on listeners
    }, []);

    // Initial passive background load
    useEffect(() => {
        fetchNews(false);

        // Background polling every 10 minutes
        const interval = setInterval(() => fetchNews(true), 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchNews]);

    return (
        <OutplugsContext.Provider value={{ articles, loading, refreshing, newBadgeCount, fetchNews, clearNewBadge }}>
            {children}
        </OutplugsContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useOutplugs() {
    const context = useContext(OutplugsContext);
    if (!context) {
        throw new Error('useOutplugs must be used within an OutplugsProvider');
    }
    return context;
}
