'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';

const JYOTIRLINGAS = [
  { name: 'Somnath', location: 'Gujarat', desc: 'The first among the twelve Jyotirlingas, located in Prabhas Patan near Veraval.', img: '/images/somnath.png' },
  { name: 'Mallikarjuna', location: 'Srisailam, Andhra Pradesh', desc: 'Located on the Shri Saila Mountain by the banks of the Patal Ganga, Krishna river.', img: '/images/Mallikarjuna.png' },
  { name: 'Mahakaleshwar', location: 'Ujjain, Madhya Pradesh', desc: 'The only Jyotirlinga facing south (Dakshinamurti), situated on the banks of the Kshipra river.', img: '/images/Mahakaleswar.png' },
  { name: 'Omkareshwar', location: 'Khandwa, Madhya Pradesh', desc: 'Located on an island called Mandhata or Shivapuri in the Narmada river.', img: '/images/omkareswar.png' },
  { name: 'Kedarnath', location: 'Kedarnath, Uttarakhand', desc: 'Located in the Himalayas and revered as the highest Jyotirlinga.', img: '/images/kedarnath.png' },
  { name: 'Bhimashankar', location: 'Pune, Maharashtra', desc: 'Situated in the Sahyadri hills, the source of the river Bhima.', img: '/images/Bimashankar.png' },
  { name: 'Kashi Vishwanath', location: 'Varanasi, Uttar Pradesh', desc: 'Located in the holy city of Kashi on the western bank of the river Ganga.', img: '/images/kashi-visvanath.png' },
  { name: 'Trimbakeshwar', location: 'Nashik, Maharashtra', desc: 'Located at the source of the Godavari river, the longest river in peninsular India.', img: '/images/trimbakeshwar.png' },
  { name: 'Vaidyanath', location: 'Deoghar, Jharkhand', desc: 'Also known as Baba Baidyanath dham, a highly revered temple.', img: '/images/vidyanath.png' },
  { name: 'Nageshvara', location: 'Dwarka, Gujarat', desc: 'Located on the coast of Saurashtra in Gujarat, mentioned in the Shiva Purana.', img: '/images/nagareshwar.png' },
  { name: 'Ramanathaswamy', location: 'Rameswaram, Tamil Nadu', desc: 'The southernmost Jyotirlinga, associated with Lord Rama.', img: '/images/Ramanathaswamy.png' },
  { name: 'Grishneshwar', location: 'Aurangabad, Maharashtra', desc: 'Located near the Ellora Caves, representing the power of faith and devotion.', img: '/images/Grinareshwar.png' }
];

export default function JyotirlingaPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#FDF5E6', padding: '40px 20px', position: 'relative' }}>
      <Link href="/vedic-sangrah" style={{ position: 'absolute', top: '30px', left: '30px', color: '#FFD700' }}>
        <ArrowLeft size={32} />
      </Link>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: '"Noto Serif Devanagari", serif', color: '#FFD700', marginBottom: '10px', textShadow: '0 2px 10px rgba(255,215,0,0.3)' }}>१२ ज्योतिर्लिंग</h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '50px' }}>भगवान शिव के बारह पवित्र ज्योतिर्लिंग (The Twelve Sacred Jyotirlingas of Lord Shiva)</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          {JYOTIRLINGAS.map((j) => (
            <div key={j.name} style={{
              background: 'linear-gradient(145deg, rgba(30, 20, 15, 0.8), rgba(15, 10, 5, 0.9))',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '24px',
              textAlign: 'left',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              transition: 'transform 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            className="temple-card"
            >
              <div style={{ height: '220px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                <img src={j.img} alt={j.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} onError={(e) => { e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Kedarnath_Temple_in_monsoon.jpg/800px-Kedarnath_Temple_in_monsoon.jpg' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 10, 5, 1) 0%, transparent 60%)' }}></div>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', color: '#FFD700' }}>
                  <h2 style={{ fontSize: '1.6rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{j.name}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCA5A5', marginBottom: '16px', fontSize: '0.95rem' }}>
                  <MapPin size={18} /> <span>{j.location}</span>
                </div>
                <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.7' }}>{j.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          .temple-card:hover {
            transform: translateY(-12px);
            border-color: rgba(255, 215, 0, 0.6) !important;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.2) !important;
          }
          .temple-card:hover img {
            transform: scale(1.1);
          }
        `}</style>
      </div>
    </div>
  );
}
