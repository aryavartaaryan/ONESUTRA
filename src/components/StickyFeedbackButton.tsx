'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenSquare, Bug, AlertCircle } from 'lucide-react';
import FeedbackModal from '@/components/HomePage/FeedbackModal';

export default function StickyFeedbackButton() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug' | 'issue'>('feedback');
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const handleOpenFeedback = (type: 'feedback' | 'bug' | 'issue') => {
    setFeedbackType(type);
    setIsFeedbackOpen(true);
  };

  return (
    <>
      {/* Left Sidebar - Feedback Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          position: 'fixed',
          left: 16,
          bottom: isMobile ? 108 : 84,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 12,
        }}
      >
        {/* Main Button */}
        <motion.button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => handleOpenFeedback('feedback')}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1.5px solid rgba(255, 204, 112, 0.5)',
            background: 'linear-gradient(145deg, rgba(255, 214, 130, 0.22), rgba(255, 140, 66, 0.15))',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: 'rgba(255, 236, 186, 0.98)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isHovered 
              ? '0 10px 24px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)' 
              : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 6px rgba(0,0,0,0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <PenSquare size={22} strokeWidth={1.5} />
        </motion.button>

        {/* Quick Action Buttons - Appear on hover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Bug Report Button */}
          <motion.button
            onClick={() => handleOpenFeedback('bug')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1.5px solid rgba(255, 100, 100, 0.5)',
              background: 'linear-gradient(145deg, rgba(255, 130, 130, 0.22), rgba(255, 66, 66, 0.15))',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: 'rgba(255, 180, 180, 0.98)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
            }}
            title="Report a Bug"
          >
            <Bug size={18} strokeWidth={1.5} />
          </motion.button>

          {/* Improvement Button */}
          <motion.button
            onClick={() => handleOpenFeedback('issue')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1.5px solid rgba(100, 200, 255, 0.5)',
              background: 'linear-gradient(145deg, rgba(130, 214, 255, 0.22), rgba(66, 140, 255, 0.15))',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: 'rgba(186, 236, 255, 0.98)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
            }}
            title="Suggest Improvement"
          >
            <AlertCircle size={18} strokeWidth={1.5} />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        feedbackType={feedbackType}
      />
    </>
  );
}
