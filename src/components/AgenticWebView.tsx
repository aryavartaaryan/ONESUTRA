'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';
import styles from './AgenticWebView.module.css';

interface AgenticWebViewProps {
    isOpen: boolean;
    url: string;
    title?: string;
    onClose: () => void;
}

export default function AgenticWebView({ isOpen, url, title, onClose }: AgenticWebViewProps) {
    const [frameLoaded, setFrameLoaded] = useState(false);

    const safeUrl = useMemo(() => {
        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
            return '';
        } catch {
            return '';
        }
    }, [url]);

    const displayTitle = title?.trim() || 'Final Step · Agentic View';

    const openInSystemBrowser = () => {
        if (!safeUrl) return;
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
    };

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
                                <p className={styles.urlLine} title={safeUrl || 'Invalid URL'}>
                                    {displayTitle} · {safeUrl || 'Unable to open link'}
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
                            {safeUrl ? (
                                <iframe
                                    className={styles.frame}
                                    src={safeUrl}
                                    title={displayTitle}
                                    loading="eager"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                                    onLoad={() => setFrameLoaded(true)}
                                />
                            ) : (
                                <div className={styles.blockHint}>
                                    This URL is not valid for in-app view. Use Open in Browser.
                                </div>
                            )}

                            {safeUrl && !frameLoaded && (
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
