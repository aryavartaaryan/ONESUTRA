'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Phone, BookOpen, Users, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GURUS, GURUKULS, Person, Institution } from './data';

export default function GuruGurukulPage() {
    const [activeTab, setActiveTab] = useState<'Guru' | 'Gurukul'>('Guru');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGurus = useMemo(() => {
        return GURUS.filter(g => 
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            g.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const filteredGurukuls = useMemo(() => {
        return GURUKULS.filter(g => 
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            g.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // Grouping Gurus by category
    const groupedGurus = filteredGurus.reduce((acc, guru) => {
        if (!acc[guru.category]) acc[guru.category] = [];
        acc[guru.category].push(guru);
        return acc;
    }, {} as Record<string, Person[]>);

    // Grouping Gurukuls by category
    const groupedGurukuls = filteredGurukuls.reduce((acc, gurukul) => {
        if (!acc[gurukul.category]) acc[gurukul.category] = [];
        acc[gurukul.category].push(gurukul);
        return acc;
    }, {} as Record<string, Institution[]>);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background, #020108)', color: '#fff', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                    <Link href="/" style={{ color: '#fff' }}>
                        <ArrowLeft size={28} />
                    </Link>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Guru & Gurukul Directory
                        </h1>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#a1a1aa' }}>Connect with profound Vedic scholars, Sannyasis, and renowned Arya Samaj centers.</p>
                    </div>
                </div>

                {/* Important Links / Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <button style={{ 
                        padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(251, 191, 36, 0.4)', 
                        background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', fontWeight: 600, 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(251, 191, 36, 0.15)'
                    }}>
                        <Star size={18} /> प्रसिद्ध गुरु (Famous Gurus)
                    </button>
                    <button style={{ 
                        padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(56, 189, 248, 0.4)', 
                        background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 600, 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(56, 189, 248, 0.15)'
                    }}>
                        <BookOpen size={18} /> प्रसिद्ध गुरुकुल (Famous Gurukuls)
                    </button>
                    <Link href="/arya-sangrah" style={{ textDecoration: 'none' }}>
                        <button style={{ 
                            padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(255, 154, 68, 0.4)', 
                            background: 'rgba(255, 154, 68, 0.1)', color: '#ffbc80', fontWeight: 600, 
                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(255, 154, 68, 0.15)', transition: 'all 0.3s'
                        }}>
                            <BookOpen size={18} /> आर्य संग्रह - वैदिक संध्या एवं अग्निहोत्र 
                        </button>
                    </Link>
                    <Link href="/laghu-sandhya" style={{ textDecoration: 'none' }}>
                        <button style={{ 
                            padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(236, 72, 153, 0.4)', 
                            background: 'rgba(236, 72, 153, 0.1)', color: '#f472b6', fontWeight: 600, 
                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(236, 72, 153, 0.15)', transition: 'all 0.3s'
                        }}>
                            <BookOpen size={18} /> लघु वैदिक संध्या (Voice Guru)
                        </button>
                    </Link>
                </div>

                {/* Controls: Tabs & Search */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'flex-end' }}>
                    
                    {/* Tabs */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '1rem', gap: '0.5rem' }}>
                        <button 
                            onClick={() => setActiveTab('Guru')}
                            style={{ 
                                padding: '0.75rem 2rem', borderRadius: '0.75rem', border: 'none', 
                                background: activeTab === 'Guru' ? '#fbbf24' : 'transparent', 
                                color: activeTab === 'Guru' ? '#000' : '#a1a1aa', 
                                fontWeight: activeTab === 'Guru' ? 700 : 500, cursor: 'pointer', transition: 'all 0.3s'
                            }}
                        >
                            <Users size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/>
                            Gurus / विद्वान्
                        </button>
                        <button 
                            onClick={() => setActiveTab('Gurukul')}
                            style={{ 
                                padding: '0.75rem 2rem', borderRadius: '0.75rem', border: 'none', 
                                background: activeTab === 'Gurukul' ? '#38bdf8' : 'transparent', 
                                color: activeTab === 'Gurukul' ? '#000' : '#a1a1aa', 
                                fontWeight: activeTab === 'Gurukul' ? 700 : 500, cursor: 'pointer', transition: 'all 0.3s'
                            }}
                        >
                            <BookOpen size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/>
                            Gurukuls / गुरुकुल
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                        <input 
                            type="text" 
                            placeholder="Enquire Name, Location or Category..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ 
                                width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '1rem',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '1rem', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Content Section */}
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {activeTab === 'Guru' && (
                        <div>
                            {Object.entries(groupedGurus).map(([category, items]) => (
                                <div key={category} style={{ marginBottom: '4rem' }}>
                                    <h2 style={{ fontSize: '1.75rem', color: '#fbbf24', borderBottom: '1px solid rgba(251, 191, 36, 0.2)', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
                                        {category} <span style={{ fontSize: '1rem', color: '#a1a1aa', fontWeight: 'normal', marginLeft: '1rem' }}>({items.length})</span>
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        {items.map((guru, idx) => (
                                            <Card key={idx} data={guru} type="guru" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(groupedGurus).length === 0 && <EmptyState />}
                        </div>
                    )}

                    {activeTab === 'Gurukul' && (
                        <div>
                            {Object.entries(groupedGurukuls).map(([category, items]) => (
                                <div key={category} style={{ marginBottom: '4rem' }}>
                                    <h2 style={{ fontSize: '1.75rem', color: '#38bdf8', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
                                        {category} <span style={{ fontSize: '1rem', color: '#a1a1aa', fontWeight: 'normal', marginLeft: '1rem' }}>({items.length})</span>
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        {items.map((gurukul, idx) => (
                                            <Card key={idx} data={gurukul} type="gurukul" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(groupedGurukuls).length === 0 && <EmptyState />}
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
}

function Card({ data, type }: { data: Person | Institution, type: 'guru' | 'gurukul' }) {
    const isGuru = type === 'guru';
    const accent = isGuru ? '#fbbf24' : '#38bdf8';
    
    return (
        <motion.div 
            whileHover={{ y: -5, boxShadow: `0 10px 30px rgba(${isGuru ? '251, 191, 36' : '56, 189, 248'}, 0.15)` }}
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(${isGuru ? '251, 191, 36' : '56, 189, 248'}, 0.2)`,
                borderRadius: '1rem',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: accent }} />
            
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#fff' }}>{data.name}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#d4d4d8', fontSize: '0.95rem' }}>
                    <MapPin size={16} color={accent} />
                    {data.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#d4d4d8', fontSize: '0.95rem' }}>
                    <Phone size={16} color={accent} />
                    {data.contact}
                </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', background: `rgba(${isGuru ? '251, 191, 36' : '56, 189, 248'}, 0.1)`, color: accent, fontSize: '0.8rem', fontWeight: 600 }}>
                {data.category}
            </div>
        </motion.div>
    );
}

function EmptyState() {
    return (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: '#a1a1aa' }}>
            <Search size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>No results found</h3>
            <p style={{ margin: '0.5rem 0 0 0' }}>Try adjusting your search filters.</p>
        </div>
    );
}
