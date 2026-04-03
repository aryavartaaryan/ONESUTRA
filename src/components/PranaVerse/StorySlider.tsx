'use client';

/**
 * StorySlider.tsx — Zero-Latency Reels/Stories Slider for PranaVerse
 *
 * ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. NATIVE PHYSICS ENGINE: CSS scroll-snap (scroll-snap-type: x mandatory)
 *    offloads all drag physics to the GPU — identical to Instagram / TikTok.
 *    No JavaScript drag, no Swiper, no Framer Motion drag prop.
 *
 * 2. DOM VIRTUALIZATION (Rule of 3): An IntersectionObserver tracks which slide
 *    is in the center viewport. Only the current, prev, and next slides mount
 *    real media. All others render as lightweight bg-color skeleton placeholders
 *    preserving scroll width without consuming memory.
 *
 * 3. MEDIA OPTIMIZATION:
 *    - Next.js <Image> with priority={true} for slides 0 and 1.
 *    - Images outside the active window use loading="lazy".
 *    - Videos use preload="metadata". Videos outside the window are paused
 *      and have their src detached to free memory.
 *
 * 4. HARDWARE ACCELERATION: Every slide wrapper has transform: translateZ(0)
 *    to force GPU compositing layer — eliminates paint flicker on scroll.
 *
 * 5. PROGRESS BARS: position: absolute, driven by CSS var(--progress) via a
 *    setInterval on requestAnimationFrame. Zero DOM reflow / layout shift.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StorySlide {
    id: string;
    /** Display label shown below the bubble and in the viewer */
    label: string;
    /** Small icon / emoji for the bubble strip */
    icon: string;
    /** Accent colour for ring, progress bar, and overlays */
    color: string;
    /** Full gradient string for skeletons and fallback backgrounds */
    gradient: string;
    /** Ring gradient stop colours */
    ringColors: [string, string];
    /** Optional public video URL (relative to /public or absolute CDN) */
    videoSrc?: string;
    /** Thumbnail image URL — used by <Image> for non-video slides */
    imageSrc: string;
    /** Short description shown in the viewer overlay */
    description?: string;
    /** Sanskrit/spiritual text overlay */
    mantra?: string;
}

interface StorySliderProps {
    /** Array of slides to display. */
    slides: StorySlide[];
    /**
     * Duration (ms) each auto-advancing slide holds for.
     * Default: 8000 (8 seconds).
     */
    slideDurationMs?: number;
    /** Called when the user closes the full-screen viewer. */
    onClose?: () => void;
    /** Whether to show the full-screen viewer on mount. Default: true */
    autoOpen?: boolean;
    /** Initial slide index. Default: 0 */
    initialIndex?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** How many frames of buffer around the active slide to fully mount media. */
const VIRTUALIZATION_BUFFER = 1; // prev + current + next = 3 total

/** Interval in ms for progress bar update ticks. */
const PROGRESS_TICK_MS = 80;

// ── Helper: CSS class string without Tailwind (pure inline styles) ────────────

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

// ── Sub-component: individual slide renderer ──────────────────────────────────

interface SlideItemProps {
    slide: StorySlide;
    index: number;
    activeIndex: number;
    isVirtualized: boolean; /** true → render only skeleton */
    progress: number;       /** 0–100, only meaningful for active slide */
}

const SlideItem = React.memo(function SlideItem({
    slide,
    index,
    activeIndex,
    isVirtualized,
    progress,
}: SlideItemProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isActive = index === activeIndex;

    // ── Manage video playback: play active, pause + detach others ────────────
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid || !slide.videoSrc) return;

        if (isVirtualized) {
            // Detach src to free memory
            vid.pause();
            vid.src = '';
            vid.load();
        } else if (isActive) {
            // Reattach src if needed and play
            if (!vid.src || vid.src === window.location.href) {
                vid.src = slide.videoSrc;
                vid.load();
            }
            vid.play().catch(() => { /* autoplay gated — ok */ });
        } else {
            // In buffer (prev/next) — keep src loaded but pause
            if (!vid.src || vid.src === window.location.href) {
                vid.src = slide.videoSrc;
                vid.load();
            }
            vid.pause();
        }
    }, [isActive, isVirtualized, slide.videoSrc]);

    // ── Skeleton placeholder for out-of-buffer slides ────────────────────────
    if (isVirtualized) {
        return (
            <div
                style={{
                    /* Maintain scroll width while consuming zero media memory */
                    width: '100%',
                    height: '100%',
                    flexShrink: 0,
                    scrollSnapAlign: 'center',
                    background: slide.gradient,
                    /* GPU compositing layer — no paint on scroll */
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                }}
            />
        );
    }

    // ── Full slide render ─────────────────────────────────────────────────────
    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                flexShrink: 0,
                scrollSnapAlign: 'center',
                overflow: 'hidden',
                background: '#000',
                /* GPU layer — eliminates flicker between slides */
                transform: 'translateZ(0)',
                willChange: 'transform',
            }}
        >
            {/* ── Media Layer ────────────────────────────────────────────── */}
            {slide.videoSrc ? (
                <video
                    ref={videoRef}
                    src={slide.videoSrc}
                    preload="metadata" /* metadata only — no full pre-buffer */
                    muted
                    loop
                    playsInline
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            ) : (
                <Image
                    src={slide.imageSrc}
                    alt={slide.label}
                    fill
                    /* Only pre-load first two slides — rest are lazy */
                    priority={index < 2}
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                />
            )}

            {/* ── Top scrim for progress bars & close button ─────────────── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 80,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 100%)',
                pointerEvents: 'none',
            }} />

            {/* ── Bottom scrim for text overlay ──────────────────────────── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '50%',
                background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                pointerEvents: 'none',
            }} />

            {/* ── Accent glow overlay ────────────────────────────────────── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse at 50% 25%, ${slide.color}20 0%, transparent 65%)`,
                pointerEvents: 'none',
            }} />

            {/* ── Bottom content ─────────────────────────────────────────── */}
            {isActive && (
                <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    padding: '1.5rem 1.2rem calc(env(safe-area-inset-bottom) + 4rem)',
                    pointerEvents: 'none',
                }}>
                    {/* Mantra line */}
                    {slide.mantra && (
                        <p style={{
                            fontFamily: "'Noto Serif Devanagari', 'Cormorant Garamond', serif",
                            fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                            fontWeight: 700,
                            color: slide.color,
                            textShadow: `0 0 30px ${slide.color}88`,
                            marginBottom: '0.4rem',
                            lineHeight: 1.3,
                        }}>
                            {slide.mantra}
                        </p>
                    )}

                    {/* Label */}
                    <h3 style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 'clamp(1.1rem, 4.5vw, 1.6rem)',
                        fontWeight: 800,
                        color: '#fff',
                        textShadow: '0 2px 16px rgba(0,0,0,0.9)',
                        margin: '0 0 0.35rem',
                        lineHeight: 1.2,
                    }}>
                        {slide.label}
                    </h3>

                    {/* Description */}
                    {slide.description && (
                        <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 'clamp(0.7rem, 2.8vw, 0.85rem)',
                            color: 'rgba(255,255,255,0.72)',
                            margin: 0,
                            lineHeight: 1.55,
                            letterSpacing: '0.02em',
                        }}>
                            {slide.description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
});

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StorySlider({
    slides,
    slideDurationMs = 8000,
    onClose,
    autoOpen = true,
    initialIndex = 0,
}: StorySliderProps) {
    const [isOpen, setIsOpen] = useState(autoOpen);
    const [activeIndex, setActiveIndex] = useState(clamp(initialIndex, 0, slides.length - 1));
    const [progress, setProgress] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const slideRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());

    // ── Compute which slide indices are within the virtualization window ────
    const activeSet = useMemo(() => {
        const set = new Set<number>();
        for (let d = -VIRTUALIZATION_BUFFER; d <= VIRTUALIZATION_BUFFER; d++) {
            const idx = activeIndex + d;
            if (idx >= 0 && idx < slides.length) set.add(idx);
        }
        return set;
    }, [activeIndex, slides.length]);

    // ── Progress bar timer — runs on requestAnimationFrame tick schedule ───
    const resetProgressTimer = useCallback(() => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress(0);

        let elapsed = 0;
        progressTimerRef.current = setInterval(() => {
            elapsed += PROGRESS_TICK_MS;
            const pct = Math.min((elapsed / slideDurationMs) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                if (progressTimerRef.current) clearInterval(progressTimerRef.current);
                // Auto-advance to next slide
                setActiveIndex(prev => {
                    const next = prev + 1;
                    if (next < slides.length) {
                        scrollToSlide(next);
                        return next;
                    }
                    // Loop back to start
                    scrollToSlide(0);
                    return 0;
                });
            }
        }, PROGRESS_TICK_MS);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slideDurationMs, slides.length]);

    // ── Scroll imperative helper ───────────────────────────────────────────
    // Use 'instant' so CSS snap physics take over immediately without fighting smooth easing.
    const scrollToSlide = (index: number) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        // Scroll the container directly to prevent browser fighting itself
        const slideWidth = container.clientWidth;
        container.scrollTo({ left: index * slideWidth, behavior: 'instant' as ScrollBehavior });
    };

    // ── IntersectionObserver: detect which slide is in viewport center ─────
    useEffect(() => {
        if (!isOpen) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        const indexStr = (entry.target as HTMLElement).dataset.slideIndex;
                        if (indexStr !== undefined) {
                            const idx = parseInt(indexStr, 10);
                            setActiveIndex(idx);
                        }
                    }
                });
            },
            {
                root: scrollContainerRef.current,
                threshold: 0.5,
            }
        );

        // Observe all registered slide elements
        slideRefsMap.current.forEach(el => {
            observerRef.current?.observe(el);
        });

        return () => {
            observerRef.current?.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, slides.length]);

    // ── Re-register slides with observer when refs change ─────────────────
    const registerSlideRef = useCallback((index: number, el: HTMLDivElement | null) => {
        if (el) {
            slideRefsMap.current.set(index, el);
            observerRef.current?.observe(el);
        } else {
            slideRefsMap.current.delete(index);
        }
    }, []);

    // ── Reset progress timer on active index change ────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        resetProgressTimer();
        return () => {
            if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        };
    }, [activeIndex, isOpen, resetProgressTimer]);

    // ── Body scroll lock while viewer is open ─────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // ── Scroll to initialIndex on open ────────────────────────────────────
    useEffect(() => {
        if (isOpen && initialIndex > 0) {
            // Defer to next frame so the DOM is painted
            requestAnimationFrame(() => scrollToSlide(initialIndex));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleClose = () => {
        setIsOpen(false);
        onClose?.();
    };

    if (!isOpen || slides.length === 0) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="story-slider-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10500,
                        background: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* ── Progress bars — absolutely positioned, ZERO layout shift ── */}
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            top: 'calc(env(safe-area-inset-top) + 10px)',
                            left: 12,
                            right: 12,
                            display: 'flex',
                            gap: 3,
                            zIndex: 10520,
                            pointerEvents: 'none',
                        }}
                    >
                        {slides.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    height: 2.5,
                                    borderRadius: 2,
                                    background: 'rgba(255,255,255,0.22)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        borderRadius: 2,
                                        background: `linear-gradient(90deg, ${slides[activeIndex]?.color ?? '#fff'}, #fff)`,
                                        /* Absolute width — no layout shift */
                                        width: i < activeIndex
                                            ? '100%'
                                            : i === activeIndex
                                                ? `${progress}%`
                                                : '0%',
                                        transition: i === activeIndex ? 'none' : undefined,
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── Close button ─────────────────────────────────────────────── */}
                    <motion.button
                        key="close-btn"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 340, damping: 26 }}
                        onClick={handleClose}
                        aria-label="Close Stories"
                        style={{
                            position: 'absolute',
                            top: 'calc(env(safe-area-inset-top) + 28px)',
                            right: 14,
                            zIndex: 10530,
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.42)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                        }}
                    >
                        <X size={15} />
                    </motion.button>

                    {/* ── Slide label badge ─────────────────────────────────────────── */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(env(safe-area-inset-top) + 28px)',
                            left: 14,
                            zIndex: 10520,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: `1px solid ${slides[activeIndex]?.color ?? '#fff'}44`,
                            borderRadius: 999,
                            padding: '0.22rem 0.7rem',
                            pointerEvents: 'none',
                        }}
                    >
                        <span style={{ fontSize: '1rem' }}>{slides[activeIndex]?.icon}</span>
                        <span style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: slides[activeIndex]?.color ?? '#fff',
                            textTransform: 'uppercase',
                        }}>
                            {slides[activeIndex]?.label}
                        </span>
                    </div>

                    {/* ════════════════════════════════════════════════════════════════
                     *  THE SCROLL CONTAINER
                     *
                     *  CSS scroll snap ENTIRELY drives the drag physics:
                     *  ─ scrollSnapType: 'x mandatory'   → snap to each slide
                     *  ─ overflowX: 'auto'               → native momentum scroll
                     *  ─ scrollbarWidth: 'none'           → hide scrollbar
                     *  No JS drag handler. No Framer Motion drag. Pure GPU physics.
                     * ══════════════════════════════════════════════════════════════ */}
                    <div
                        ref={scrollContainerRef}
                        className="pv-story-scroll"
                        style={{
                            width: '100%',
                            maxWidth: 480,
                            height: '100dvh',
                            display: 'flex',
                            flexDirection: 'row',
                            /* 'scroll' (not 'auto') required for iOS momentum + consistent snap */
                            overflowX: 'scroll',
                            overflowY: 'hidden',
                            /* Native CSS scroll snap — GPU-composited.
                             * DO NOT add scrollBehavior:smooth here — it fights native drag
                             * deceleration and causes exactly the lag / flicker the user sees. */
                            scrollSnapType: 'x mandatory',
                            /* Hide scrollbar on all browsers */
                            scrollbarWidth: 'none',
                            /* CRITICAL for mobile: forces the browser to handle only horizontal
                             * pan in this element. Vertical page scroll is never hijacked mid-swipe.
                             * This is the single biggest contributor to Instagram-level smoothness. */
                            touchAction: 'pan-x',
                            /* Prevent rubber-band overscroll at first/last slide — eliminates
                             * the flicker when reaching the boundary on iOS. */
                            overscrollBehavior: 'contain',
                            /* Force hardware compositing on the container itself */
                            transform: 'translateZ(0)',
                            willChange: 'scroll-position',
                            /* Momentum scroll on iOS (legacy but still required for WKWebView) */
                            WebkitOverflowScrolling: 'touch',
                            /* Remove blue tap flash on mobile — pure visual polish */
                            WebkitTapHighlightColor: 'transparent',
                        } as React.CSSProperties}
                        onScroll={() => {/* passthrough — IntersectionObserver drives state */ }}
                    >
                        {/* Hide webkit scrollbar — applies to both container + children */}
                        <style>{`
                            .pv-story-scroll::-webkit-scrollbar { display: none; }
                            .pv-story-scroll { -webkit-overflow-scrolling: touch; }
                            /* GPU rasterization hint for animated slides */
                            .pv-story-scroll > * { will-change: transform; }
                        `}</style>

                        {slides.map((slide, index) => {
                            const isVirtualized = !activeSet.has(index);

                            return (
                                <div
                                    key={slide.id}
                                    ref={(el) => registerSlideRef(index, el)}
                                    data-slide-index={String(index)}
                                    className="pv-story-scroll"
                                    style={{
                                        /* Each item takes exactly the full viewport width */
                                        flexShrink: 0,
                                        width: '100%',
                                        height: '100%',
                                        scrollSnapAlign: 'center',
                                        /* GPU compositing: translateZ + backfaceVisibility together
                                         * ensure each slide has its own GPU layer so the compositor
                                         * can slide them without triggering paints — zero flicker. */
                                        transform: 'translateZ(0)',
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        willChange: 'transform',
                                        position: 'relative',
                                        /* Inherit touch handling from container */
                                        touchAction: 'pan-x',
                                    }}
                                    /* Tap left 35% → prev, right 35% → next (desktop/iPad) */
                                    onClick={(e) => {
                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                        const relX = e.clientX - rect.left;
                                        if (relX < rect.width * 0.35) {
                                            const prev = Math.max(0, activeIndex - 1);
                                            scrollToSlide(prev);
                                        } else if (relX > rect.width * 0.65) {
                                            const next = Math.min(slides.length - 1, activeIndex + 1);
                                            scrollToSlide(next);
                                        }
                                    }}
                                >
                                    <SlideItem
                                        slide={slide}
                                        index={index}
                                        activeIndex={activeIndex}
                                        isVirtualized={isVirtualized}
                                        progress={progress}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Left / Right tap zone hints (desktop) ─────────────────────── */}
                    <button
                        onClick={() => {
                            const prev = Math.max(0, activeIndex - 1);
                            scrollToSlide(prev);
                        }}
                        aria-label="Previous story"
                        style={{
                            position: 'absolute',
                            left: 0, top: 80, bottom: 60,
                            width: '12%',
                            zIndex: 10515,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    />
                    <button
                        onClick={() => {
                            const next = Math.min(slides.length - 1, activeIndex + 1);
                            scrollToSlide(next);
                        }}
                        aria-label="Next story"
                        style={{
                            position: 'absolute',
                            right: 0, top: 80, bottom: 60,
                            width: '12%',
                            zIndex: 10515,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── Convenience hook: build slides from the existing VIDEO_STORIES data ───────

export interface MinimalVideoStory {
    id: string;
    label: string;
    icon: string;
    color: string;
    gradient: string;
    ringColors: [string, string];
    videoSrc: string;
    thumbBg: string;
    description: string;
}

export function buildSlidesFromVideoStories(stories: MinimalVideoStory[]): StorySlide[] {
    return stories.map(vs => ({
        id: vs.id,
        label: vs.label,
        icon: vs.icon,
        color: vs.color,
        gradient: vs.gradient,
        ringColors: vs.ringColors,
        videoSrc: vs.videoSrc,
        imageSrc: vs.thumbBg,
        description: vs.description,
    }));
}
