'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackType: 'feedback' | 'bug' | 'issue';
}

export default function FeedbackModal({ isOpen, onClose, feedbackType }: FeedbackModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const modalTitles = {
    feedback: 'Share Your Feedback',
    bug: 'Report a Bug',
    issue: 'Suggest Improvement',
  };

  const placeholders = {
    feedback: 'Tell us what you think about Pranav Samadhaan...',
    bug: 'Describe the bug you encountered...',
    issue: 'Share your improvement suggestion...',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !email.trim()) {
      setErrorMessage('Please fill in all fields');
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to backend API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: feedbackType,
          title,
          description,
          email,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        setTitle('');
        setDescription('');
        setEmail('');
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTheming = () => {
    switch (feedbackType) {
      case 'bug':
        return {
          borderColor: 'rgba(255, 100, 100, 0.5)',
          bgGradient: 'linear-gradient(145deg, rgba(255, 130, 130, 0.12), rgba(255, 66, 66, 0.08))',
          textColor: 'rgba(255, 180, 180, 0.98)',
          accentColor: 'rgba(255, 100, 100, 0.7)',
        };
      case 'issue':
        return {
          borderColor: 'rgba(100, 200, 255, 0.5)',
          bgGradient: 'linear-gradient(145deg, rgba(130, 214, 255, 0.12), rgba(66, 140, 255, 0.08))',
          textColor: 'rgba(186, 236, 255, 0.98)',
          accentColor: 'rgba(100, 200, 255, 0.7)',
        };
      default: // feedback
        return {
          borderColor: 'rgba(255, 204, 112, 0.5)',
          bgGradient: 'linear-gradient(145deg, rgba(255, 214, 130, 0.12), rgba(255, 140, 66, 0.08))',
          textColor: 'rgba(255, 236, 186, 0.98)',
          accentColor: 'rgba(255, 204, 112, 0.7)',
        };
    }
  };

  const theming = getTheming();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 201,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              style={{
                width: '100%',
                maxWidth: 500,
                maxHeight: '90vh',
                borderRadius: 16,
                border: `1px solid ${theming.borderColor}`,
                background: theming.bgGradient,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${theming.borderColor}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: theming.textColor,
                  margin: 0,
                  letterSpacing: '0.01em',
                }}
              >
                {modalTitles[feedbackType]}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theming.textColor,
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                title="Close"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div
              style={{
                padding: '10px 24px 14px',
                borderBottom: `1px solid ${theming.borderColor}`,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.78)',
                  letterSpacing: '0.01em',
                }}
              >
                Share feedback, report bugs, or suggest improvements. Every submission helps us improve your app experience.
              </p>
            </div>

            {/* Content */}
            <form
              onSubmit={handleSubmit}
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                gap: 16,
              }}
            >
              {/* Title Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: theming.textColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {feedbackType === 'feedback' ? 'Feedback Title' : feedbackType === 'bug' ? 'Bug Title' : 'Suggestion Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={feedbackType === 'feedback' ? 'e.g., Add guided sessions with a Guru or Rishi recommendation' : feedbackType === 'bug' ? 'e.g., Login button not working' : 'e.g., Add dark mode'}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: `1px solid ${theming.borderColor}`,
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'rgba(255, 255, 255, 0.92)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theming.accentColor;
                    e.currentTarget.style.boxShadow = `0 0 12px ${theming.accentColor}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theming.borderColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Description Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: theming.textColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={placeholders[feedbackType]}
                  rows={4}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: `1px solid ${theming.borderColor}`,
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'rgba(255, 255, 255, 0.92)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    resize: 'vertical',
                    minHeight: 100,
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theming.accentColor;
                    e.currentTarget.style.boxShadow = `0 0 12px ${theming.accentColor}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theming.borderColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Email Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: theming.textColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: `1px solid ${theming.borderColor}`,
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'rgba(255, 255, 255, 0.92)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theming.accentColor;
                    e.currentTarget.style.boxShadow = `0 0 12px ${theming.accentColor}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theming.borderColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Status Messages */}
              <AnimatePresence>
                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: 'rgba(255, 100, 100, 0.15)',
                      border: '1px solid rgba(255, 100, 100, 0.4)',
                      color: 'rgba(255, 180, 180, 0.95)',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={16} strokeWidth={1.5} />
                    {errorMessage}
                  </motion.div>
                )}
                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: 'rgba(100, 200, 100, 0.15)',
                      border: '1px solid rgba(100, 200, 100, 0.4)',
                      color: 'rgba(180, 255, 180, 0.95)',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <CheckCircle size={16} strokeWidth={1.5} />
                    Thank you! Your {feedbackType} has been received.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer - Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting || submitStatus === 'success'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  marginTop: 'auto',
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${theming.accentColor}`,
                  background: `linear-gradient(145deg, ${theming.accentColor}, rgba(255,255,255,0.08))`,
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isSubmitting ? 0.6 : 1,
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                }}
              >
                <Send size={16} strokeWidth={1.5} />
                {isSubmitting ? 'Submitting...' : 'Send ' + (feedbackType === 'feedback' ? 'Feedback' : feedbackType === 'bug' ? 'Bug Report' : 'Suggestion')}
              </motion.button>
            </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
