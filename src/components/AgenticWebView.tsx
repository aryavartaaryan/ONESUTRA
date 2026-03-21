'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Lock, X } from 'lucide-react';
import styles from './AgenticWebView.module.css';

interface AgenticWebViewProps {
    isOpen: boolean;
    url: string;
    title?: string;
    onClose: () => void;
}

const BLOCKED_IFRAME_DOMAINS = [
    'google.com',
    'amazon.com',
    'amazon.in',
    'flipkart.com',
    'linkedin.com',
    'github.com',
];

function isUrlIframeBlocked(rawUrl: string): { blocked: boolean; domain: string } {
    try {
        const parsed = new URL(rawUrl);
        const host = parsed.hostname.toLowerCase();
        const blockedDomain = BLOCKED_IFRAME_DOMAINS.find((domain) => host === domain || host.endsWith(`.${domain}`));
        return { blocked: !!blockedDomain, domain: blockedDomain ?? host };
    } catch {
        return { blocked: false, domain: '' };
    }
}

function toEmbeddableYoutubeUrl(rawUrl: string, title?: string): string | null {
    try {
        const parsed = new URL(rawUrl);
        const host = parsed.hostname.toLowerCase();
        const isYoutubeHost =
            host === 'youtube.com' ||
            host === 'www.youtube.com' ||
            host === 'm.youtube.com' ||
            host === 'music.youtube.com' ||
            host === 'youtu.be' ||
            host === 'www.youtu.be';

        if (!isYoutubeHost) return null;

        const path = parsed.pathname;
        const watchId = parsed.searchParams.get('v');
        const listId = parsed.searchParams.get('list');

        let videoId = '';
        if (host === 'youtu.be' || host === 'www.youtu.be') {
            videoId = path.replace(/^\//, '').split('/')[0] ?? '';
        } else if (path === '/watch' && watchId) {
            videoId = watchId;
        } else if (path.startsWith('/shorts/')) {
            videoId = path.split('/')[2] ?? '';
        } else if (path.startsWith('/embed/')) {
            return parsed.toString();
        }

        if (videoId) {
            return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1`;
        }

        if (listId) {
            return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(listId)}`;
        }

        const titleQuery = (title ?? '')
            .replace(/\s*[|·-]\s*youtube\s*$/i, '')
            .trim();
        const query =
            parsed.searchParams.get('search_query') ||
            parsed.searchParams.get('q') ||
            parsed.searchParams.get('query') ||
            titleQuery;

        if (query) {
            return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
        }

        return 'https://www.youtube.com/embed?listType=search&list=guided%20meditation';
    } catch {
        return null;
    }
}

export default function AgenticWebView({ isOpen, url, title, onClose }: AgenticWebViewProps) {
    const [loadedFrameUrl, setLoadedFrameUrl] = useState('');
    const autoOpenedRef = useRef<string>('');

    const browserUrl = useMemo(() => {
        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
            return '';
        } catch {
            return '';
        }
    }, [url]);

    const frameUrl = useMemo(() => {
        if (!browserUrl) return '';
        return toEmbeddableYoutubeUrl(browserUrl, title) ?? browserUrl;
    }, [browserUrl, title]);

    const blockedFrame = useMemo(() => isUrlIframeBlocked(frameUrl), [frameUrl]);
    const showBlockedFallback = !!frameUrl && blockedFrame.blocked;

    const frameLoaded = !!frameUrl && loadedFrameUrl === frameUrl;

    const displayTitle = title?.trim() || 'Final Step · Agentic View';

    const openInSystemBrowser = () => {
        if (!browserUrl) return;
        window.open(browserUrl, '_blank', 'noopener,noreferrer');
    };

    useEffect(() => {
        if (!isOpen || !showBlockedFallback || !browserUrl) return;
        if (autoOpenedRef.current === browserUrl) return;

        const timer = window.setTimeout(() => {
            window.open(browserUrl, '_blank', 'noopener,noreferrer');
            autoOpenedRef.current = browserUrl;
        }, 2000);

        return () => window.clearTimeout(timer);
    }, [isOpen, showBlockedFallback, browserUrl]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ y: 20, scale: 0.98, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 16, scale: 0.985, opacity: 0 }}
                        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.header}>
                            <div className={styles.brand}>
                                <p className={styles.brandTitle}>OneSUTRA · Sakha Bodhi</p>
                                <p className={styles.brandSub}>Agentic WebView</p>
                                <p className={styles.urlLine} title={frameUrl || 'Invalid URL'}>
                                    {displayTitle} · {frameUrl || 'Unable to open link'}
                                </p>
                            </div>

                            <div className={styles.actions}>
                                <button className={styles.btnPrimary} onClick={openInSystemBrowser}>
                                    <ExternalLink size={13} /> Open in Browser
                                </button>
                                <button className={styles.btnClose} onClick={onClose} aria-label="Close web view">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.frameShell}>
                            {showBlockedFallback ? (
                                <div className={styles.secureFallback}>
                                    <div className={styles.secureIconWrap}>
                                        <Lock size={22} />
                                    </div>
                                    <p className={styles.secureTitle}>Open Securely Required</p>
                                    <p className={styles.secureText}>
                                        For your security, {blockedFrame.domain} requires this page to be opened directly in your browser.
                                    </p>
                                    <p className={styles.secureSubText}>
                                        We will try opening it automatically in 2 seconds, or tap below.
                                    </p>
                                    <button className={styles.secureButton} onClick={openInSystemBrowser}>
                                        <ExternalLink size={15} /> Open Securely
                                    </button>
                                </div>
                            ) : frameUrl ? (
                                <iframe
                                    className={styles.frame}
                                    src={frameUrl}
                                    title={displayTitle}
                                    loading="eager"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                                    onLoad={() => setLoadedFrameUrl(frameUrl)}
                                />
                            ) : (
                                <div className={styles.blockHint}>
                                    This URL is not valid for in-app view. Use Open in Browser.
                                </div>
                            )}

                            {frameUrl && !frameLoaded && !showBlockedFallback && (
                                <div className={styles.blockHint}>
                                    Loading page... If this site blocks embedded views, tap Open in Browser.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
