'use client';

import { useEffect } from 'react';
import { X, Mic, MicOff, Phone } from 'lucide-react';
import { useVedicCall } from '@/hooks/useVedicCall';
import VoiceVisualizer from './VoiceVisualizer';
import styles from './VoiceCallModal.module.css';

interface VoiceCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact?: {
        name: string;
        photoURL?: string | null;
        isAI?: boolean;
    } | null;
}

export default function VoiceCallModal({ isOpen, onClose, contact }: VoiceCallModalProps) {
    const { callState, startCall, endCall, resetToIdle, error, isMuted, toggleMute, volumeLevel } = useVedicCall();

    // Auto-start call when modal opens (only if AI or unspecified)
    useEffect(() => {
        if (isOpen && callState === 'idle') {
            if (!contact || contact.isAI) {
                startCall();
            }
        }
    }, [isOpen, callState, startCall, contact]);

    // Handle close: end call and reset so next open starts fresh; avoids errors from stale state
    const handleClose = () => {
        if (!contact || contact.isAI) {
            endCall();
            resetToIdle();
        }
        onClose();
    };

    if (!isOpen) return null;

    // Determine visual state based on contact type
    const isPeerCall = contact && !contact.isAI;
    const displayName = contact ? contact.name : 'Unknown';
    
    // For peer calls, we simulate a "Ring" state since we don't have WebRTC yet
    // In a real implementation, this would connect to a signaling server.
    const statusText = isPeerCall 
        ? 'Calling...' 
        : (callState === 'connecting' ? 'Connecting to Ashram...' : (callState === 'active' ? 'Connected' : 'Disconnected'));

    return (
        <div className={styles.overlay}>
            {/* Blurred Ashram background */}
            <div
                className={styles.background}
                style={{
                    backgroundImage: 'url(/images/ashram-dawn.jpg)',
                }}
            />

            {/* Content */}
            <div className={styles.content}>
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className={styles.closeButton}
                    aria-label="Close"
                >
                    <X size={24} />
                </button>

                {/* Status */}
                <div className={styles.status}>
                    <div className={styles.statusDot + ' ' + ((callState === 'active' || isPeerCall) ? styles.active : '')} />
                    <span>{statusText}</span>
                </div>

                {/* Avatar / Visualizer */}
                <div className={styles.visualizerContainer}>
                     {/* If it's a peer call, show their photo big */}
                     {isPeerCall && contact?.photoURL ? (
                        <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', marginBottom: 20 }}>
                            <img src={contact.photoURL} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                     ) : (
                        <VoiceVisualizer volumeLevel={isPeerCall ? 0.05 : volumeLevel} isActive={isPeerCall || callState === 'active'} />
                     )}
                     
                     {isPeerCall && (
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: 10 }}>
                            (Simulated — P2P Calling not yet connected)
                        </p>
                     )}
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <button
                        onClick={toggleMute}
                        className={styles.controlButton + ' ' + (isMuted ? styles.muted : '')}
                        disabled={callState !== 'active' && !isPeerCall}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    
                    <button
                        onClick={handleClose}
                        className={styles.controlButton + ' ' + styles.hangup}
                    >
                        <Phone size={24} style={{ transform: 'rotate(135deg)' }} />
                    </button>
                </div>

                {/* Error message */}
                {error && <div className={styles.error}>{error}</div>}
            </div>
        </div>
    );
}


