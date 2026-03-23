'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';

const TEMPLES = [
  { name: 'Brihadeeswarar Temple', location: 'Thanjavur, Tamil Nadu', desc: 'A Hindu temple dedicated to Shiva built by Chola emperor Rajaraja I.', img: 'https://loremflickr.com/800/600/hindu,temple,architecture?lock=201' },
  { name: 'Konark Sun Temple', location: 'Konark, Odisha', desc: 'A 13th-century Sun temple renowned for its chariot-like architecture.', img: 'https://loremflickr.com/800/600/hindu,temple,architecture?lock=202' },
  { name: 'Kailasa Temple', location: 'Ellora, Maharashtra', desc: 'The largest rock-cut Hindu temple, carved from a single piece of rock.', img: 'https://loremflickr.com/800/600/hindu,temple,architecture?lock=203' },
  { name: 'Meenakshi Amman Temple', location: 'Madurai, Tamil Nadu', desc: 'A historic Hindu temple dedicated to Goddess Meenakshi and Lord Sundareswarar.', img: 'https://loremflickr.com/800/600/hindu,temple,architecture?lock=204' },
  { name: 'Jagannath Temple', location: 'Puri, Odisha', desc: 'An important Hindu temple dedicated to Lord Jagannath, famous for its annual Ratha Yatra.', img: 'https://loremflickr.com/800/600/hindu,temple,architecture?lock=205' },
  { name: 'Ramanathaswamy Temple', location: 'Rameswaram, Tamil Nadu', desc: 'A prominent pilgrimage site featuring the longest temple corridor in the world.', img: 'https://loremflickr.com/800/600/hindu,temple,architecture?lock=206' }
];

export default function AncientTemplesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#FDF5E6', padding: '40px 20px', position: 'relative' }}>
      <Link href="/vedic-sangrah" style={{ position: 'absolute', top: '30px', left: '30px', color: '#FFD700' }}>
        <ArrowLeft size={32} />
      </Link>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: '"Noto Serif Devanagari", serif', color: '#FFD700', marginBottom: '10px', textShadow: '0 2px 10px rgba(255,215,0,0.3)' }}>प्राचीन हिन्दू मंदिर</h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '50px' }}>भारत के भव्य और प्राचीन मंदिर (Grand and Ancient Hindu Temples of India)</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          {TEMPLES.map((t) => (
            <div key={t.name} style={{
              background: 'linear-gradient(145deg, rgba(20, 30, 40, 0.8), rgba(10, 15, 20, 0.9))',
              border: '1px solid rgba(135, 206, 235, 0.2)',
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
                <img src={t.img} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} onError={(e) => { e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Brihadeeswarar_Temple_at_Thanjavur.jpg/800px-Brihadeeswarar_Temple_at_Thanjavur.jpg' }}/>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10, 15, 20, 1) 0%, transparent 60%)' }}></div>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', color: '#87CEEB' }}>
                  <h2 style={{ fontSize: '1.6rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{t.name}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCA5A5', marginBottom: '16px', fontSize: '0.95rem' }}>
                  <MapPin size={18} /> <span>{t.location}</span>
                </div>
                <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.7' }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          .temple-card:hover {
            transform: translateY(-12px);
            border-color: rgba(135, 206, 235, 0.6) !important;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(135, 206, 235, 0.2) !important;
          }
          .temple-card:hover img {
            transform: scale(1.1);
          }
        `}</style>
      </div>
    </div>
  );
}
