'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { NewsAction } from '@/data/outplugs-news';

interface ActionEngineProps {
    action: NewsAction;
    headline: string;
    summary: string;
}

export default function ActionEngine({ action, headline, summary }: ActionEngineProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const generateShareImage = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
        grad.addColorStop(0, '#050a30');
        grad.addColorStop(1, '#0a1445');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1080);

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        ctx.roundRect(20, 20, 1040, 1040, 32);
        ctx.stroke();

        // outPLUGS wordmark
        ctx.fillStyle = 'rgba(255,119,34,0.9)';
        ctx.font = 'bold 36px monospace';
        ctx.letterSpacing = '8px';
        ctx.fillText('outPLUGS', 60, 90);

        // Headline
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = 'bold 52px Georgia, serif';
        ctx.letterSpacing = '0px';

        // Word wrap
        const words = headline.split(' ');
        let line = '';
        let y = 200;
        for (const word of words) {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > 960 && line) {
                ctx.fillText(line, 60, y); y += 70; line = word + ' ';
            } else { line = test; }
        }
        ctx.fillText(line, 60, y); y += 100;

        // Summary
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '32px Inter, sans-serif';
        const sumWords = summary.substring(0, 200).split(' ');
        let sLine = '';
        for (const word of sumWords) {
            const test = sLine + word + ' ';
            if (ctx.measureText(test).width > 960 && sLine) {
                ctx.fillText(sLine, 60, y); y += 50; sLine = word + ' ';
            } else { sLine = test; }
        }
        ctx.fillText(sLine + '...', 60, y);

        // Footer
        ctx.fillStyle = 'rgba(255,119,34,0.6)';
        ctx.font = '26px monospace';
        ctx.fillText('OneSUTRA · Conscious News · Act Now', 60, 1000);

        // Convert and share
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: headline,
                        text: summary.substring(0, 100) + '...',
                        files: [new File([blob], 'outplugs-news.png', { type: 'image/png' })],
                    });
                } catch (_) {
                    // Fallback: download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'outplugs-news.png'; a.click();
                    URL.revokeObjectURL(url);
                }
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'outplugs-news.png'; a.click();
                URL.revokeObjectURL(url);
            }
        }, 'image/png');
    };

    const handleAction = () => {
        if (action.type === 'share') {
            generateShareImage();
        } else if (action.type === 'petition' || action.type === 'donate') {
            window.open(action.link, '_blank', 'noopener,noreferrer');
        }
    };

    const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
        petition: {
            bg: 'rgba(232,93,4,0.15)', border: 'rgba(232,93,4,0.45)',
            text: '#ff8c52', glow: 'rgba(232,93,4,0.4)',
        },
        share: {
            bg: 'rgba(85,239,196,0.12)', border: 'rgba(85,239,196,0.4)',
            text: '#55efc4', glow: 'rgba(85,239,196,0.35)',
        },
        donate: {
            bg: 'rgba(247,183,49,0.13)', border: 'rgba(247,183,49,0.42)',
            text: '#f7b731', glow: 'rgba(247,183,49,0.38)',
        },
    };
    const c = colors[action.type] || colors.share;
    const icons: Record<string, string> = { petition: '✍️', share: '📡', donate: '💛' };

    return (
        <motion.button
            onClick={handleAction}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            animate={{ boxShadow: [`0 0 0 0 ${c.glow}`, `0 0 14px 4px transparent`, `0 0 0 0 ${c.glow}`] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1.1rem', borderRadius: 9999,
                background: c.bg, border: `1.5px solid ${c.border}`,
                cursor: 'pointer', width: '100%', justifyContent: 'center',
            }}
        >
            <span style={{ fontSize: '1rem' }}>{icons[action.type]}</span>
            <span style={{
                fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em',
                color: c.text, fontFamily: 'var(--font-header)',
            }}>
                {action.label}
            </span>
        </motion.button>
    );
}
