'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Check, User, Heart, BookOpen, AtSign, Loader2 } from 'lucide-react';
import { type SutraUser } from '@/hooks/useUsers';

interface UserProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: SutraUser | null;
    currentUserId: string | null;
    isSelf?: boolean;
}

export default function UserProfilePanel({ isOpen, onClose, user, currentUserId, isSelf = false }: UserProfilePanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editInterests, setEditInterests] = useState<string[]>([]);
    const [editHobbies, setEditHobbies] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // Reset state when user changes or panel opens (only if not editing)
    useEffect(() => {
        if (user && !isEditing) {
            setEditBio(user.bio || '');
            // Default username to email prefix if not set
            const defaultUsername = user.username || (user.email ? user.email.split('@')[0] : '');
            setEditUsername(defaultUsername);
            setEditInterests(user.interests || []);
            setEditHobbies(user.hobbies || []);
        }
    }, [user, isOpen, isEditing]);

    if (!user) return null;

    const handleSave = async () => {
        if (!currentUserId) return;
        setIsSaving(true);
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, updateDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            
            await updateDoc(doc(db, 'onesutra_users', currentUserId), {
                bio: editBio,
                username: editUsername,
                interests: editInterests,
                hobbies: editHobbies
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const addTag = (list: string[], setList: (l: string[]) => void, tag: string) => {
        const t = tag.trim();
        if (t && !list.includes(t)) {
            setList([...list, t]);
        }
    };

    // Helper for tag input
    const TagInput = ({ label, icon: Icon, values, setValues }: { label: string, icon: any, values: string[], setValues: (l: string[]) => void }) => {
        const [input, setInput] = useState('');
        return (
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
                    <Icon size={16} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>
                {isEditing ? (
                    <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {values.map(tag => (
                                <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 999, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {tag}
                                    <button onClick={() => setValues(values.filter(t => t !== tag))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTag(values, setValues, input);
                                    setInput('');
                                }
                            }}
                            placeholder={`Add ${label.toLowerCase()}... (Enter)`}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {values.length > 0 ? values.map(tag => (
                            <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 999, fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
                                {tag}
                            </span>
                        )) : <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>None listed</span>}
                    </div>
                )}
            </div>
        );
    };

    // Calculate display username
    const displayUsername = user.username || (user.email ? user.email.split('@')[0] : 'Sadhaka');

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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000 }}
                    />
                    
                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '380px',
                            background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.1)',
                            zIndex: 2001, display: 'flex', flexDirection: 'column',
                            boxShadow: '-10px 0 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.4rem' }}>Profile</h2>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {isSelf && !isEditing && (
                                    <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                                        <Edit2 size={16} /> Edit
                                    </button>
                                )}
                                {isEditing && (
                                    <button onClick={handleSave} disabled={isSaving} style={{ background: '#44DD44', border: 'none', color: 'black', padding: '6px 14px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                                    </button>
                                )}
                                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem' }}>
                            {/* Avatar & Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                                <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)', marginBottom: '1rem', background: '#222' }}>
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                                            {user.emoji || user.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Playfair Display', serif", textAlign: 'center' }}>{user.name}</h1>
                                
                                {/* Username / Email Display Logic */}
                                <div style={{ marginTop: '0.5rem' }}>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '0 10px', width: '100%', maxWidth: '200px' }}>
                                            <AtSign size={14} color="rgba(255,255,255,0.5)" />
                                            <input 
                                                type="text" 
                                                value={editUsername} 
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                placeholder="username"
                                                style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px 4px', fontSize: '0.9rem', outline: 'none', width: '100%' }}
                                            />
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <AtSign size={13} /> {displayUsername}
                                        </p>
                                    )}
                                </div>

                                {/* Active Status */}
                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 999 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ((user as any).online || (user.lastSeen && (Date.now() - user.lastSeen < 60000 * 5))) ? '#44DD44' : 'rgba(255,255,255,0.3)', boxShadow: ((user as any).online || (user.lastSeen && (Date.now() - user.lastSeen < 60000 * 5))) ? '0 0 8px #44DD44' : 'none' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                                        {((user as any).online || (user.lastSeen && (Date.now() - user.lastSeen < 60000 * 5))) ? 'Active Now' : user.lastSeen ? `Last seen ${new Date(user.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Offline'}
                                    </span>
                                </div>
                            </div>

                            {/* Bio */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
                                    <User size={16} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</span>
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        placeholder="Write a short bio..."
                                        rows={3}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px', color: 'white', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none', outline: 'none' }}
                                    />
                                ) : (
                                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                                        {user.bio || <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>No bio added yet.</span>}
                                    </p>
                                )}
                            </div>

                            <TagInput label="Interests" icon={Heart} values={editInterests} setValues={setEditInterests} />
                            <TagInput label="Hobbies" icon={BookOpen} values={editHobbies} setValues={setEditHobbies} />

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
