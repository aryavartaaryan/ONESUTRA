'use client';

import { useEffect, useState } from 'react';
import { getFirebaseFirestore } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface Donation {
  id: string;
  user: string;
  email: string;
  amount: number;
  message: string;
  date: string;
}

interface ProUser {
  email: string;
  name: string;
  date: string;
}

interface Feedback {
  id: string;
  type: string;
  email: string;
  title: string;
  description: string;
  date: string;
}

const feedbackTypeColor: Record<string, string> = {
  feedback: 'var(--accent-sage)',
  bug: '#EF4444',
  issue: 'var(--accent-amber)',
};

function toDateStr(ts: any): string {
  if (!ts) return '';
  if (typeof ts?.toDate === 'function') return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

export default function AdminLiveDataSections() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [proUsers, setProUsers] = useState<ProUser[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [donationCount, setDonationCount] = useState(0);
  const [proCount, setProCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    getFirebaseFirestore().then((db) => {
      // DONATIONS — real-time listener
      const donationsQ = query(collection(db, 'donations'), orderBy('createdAt', 'desc'), limit(100));
      unsubs.push(
        onSnapshot(donationsQ, (snap) => {
          const data = snap.docs.map((doc) => ({
            id: doc.id,
            user: doc.data().user || 'Anonymous',
            email: doc.data().email || '',
            amount: Number(doc.data().amount) || 0,
            message: doc.data().message || '',
            date: toDateStr(doc.data().createdAt),
          }));
          setDonations(data);
          setDonationCount(data.length);
        }, (err) => {
          console.error('[AdminLive] Donations listener error:', err.message);
        })
      );

      // PRO USERS — real-time listener
      const proQ = query(collection(db, 'pro_users'), orderBy('createdAt', 'desc'), limit(200));
      unsubs.push(
        onSnapshot(proQ, (snap) => {
          const data = snap.docs.map((doc) => ({
            email: doc.data().email || doc.id,
            name: doc.data().name || '—',
            date: toDateStr(doc.data().createdAt),
          }));
          setProUsers(data);
          setProCount(data.length);
        }, (err) => {
          console.error('[AdminLive] ProUsers listener error:', err.message);
        })
      );

      // FEEDBACK — real-time listener
      const feedbackQ = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(100));
      unsubs.push(
        onSnapshot(feedbackQ, (snap) => {
          const data = snap.docs.map((doc) => ({
            id: doc.id,
            type: doc.data().type || 'feedback',
            email: doc.data().email || '—',
            title: doc.data().title || '—',
            description: doc.data().description || '—',
            date: toDateStr(doc.data().createdAt),
          }));
          setFeedbacks(data);
          setFeedbackCount(data.length);
        }, (err) => {
          console.error('[AdminLive] Feedback listener error:', err.message);
        })
      );

      setLoading(false);
    }).catch((err) => {
      setError('Firebase init failed: ' + err.message);
      setLoading(false);
    });

    return () => unsubs.forEach((u) => u());
  }, []);

  function fmtDate(iso: string) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return iso; }
  }

  const tbodyStyle = { fontSize: '0.9rem' };
  const tdStyle = { padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' };
  const thStyle = { padding: '1.2rem 1rem', fontWeight: '600' as const, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)' };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        ⏳ Loading live data from Firestore...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 12, color: '#FCA5A5', marginTop: '2rem' }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <>
      {/* Stat Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderTop: '4px solid var(--accent-pink)' }}>
          <div style={{ color: 'var(--text-muted)' }}>💖 Donations</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-pink)' }}>{donationCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderTop: '4px solid var(--accent-sage)' }}>
          <div style={{ color: 'var(--text-muted)' }}>👑 Pro Members</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-sage)' }}>{proCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderTop: '4px solid var(--accent-amber)' }}>
          <div style={{ color: 'var(--text-muted)' }}>📝 Feedback</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-amber)' }}>{feedbackCount}</div>
        </div>
      </div>

      {/* 💖 DONATIONS */}
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-pink)', marginBottom: '1.5rem' }}>
          💖 Recent Donations
          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '1rem' }}>● Live</span>
        </h2>
        <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Message</th>
              </tr>
            </thead>
            <tbody style={tbodyStyle}>
              {donations.length === 0 ? (
                <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No donations yet.</td></tr>
              ) : donations.map((d) => (
                <tr key={d.id}>
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(d.date)}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--text-main)' }}>{d.user}</td>
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>{d.email || '—'}</td>
                  <td style={{ ...tdStyle, color: 'var(--accent-pink)', fontWeight: 700, fontSize: '1.1rem' }}>₹{Number(d.amount).toLocaleString('en-IN')}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: 300, whiteSpace: 'normal' }}>
                    {d.message ? `"${d.message}"` : <span style={{ opacity: 0.4 }}>No message</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👑 PRO MEMBERS */}
      <div style={{ marginTop: '4rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-sage)', marginBottom: '1.5rem' }}>
          👑 Pro Members List
          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '1rem' }}>● Live</span>
        </h2>
        <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={thStyle}>Signup Date</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
              </tr>
            </thead>
            <tbody style={tbodyStyle}>
              {proUsers.length === 0 ? (
                <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No Pro users yet.</td></tr>
              ) : proUsers.map((u) => (
                <tr key={u.email}>
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(u.date)}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--accent-gold)' }}>{u.name}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-main)' }}>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📝 FEEDBACK */}
      <div style={{ marginTop: '4rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-amber)', marginBottom: '1.5rem' }}>
          📝 Feedback & Reports
          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '1rem' }}>● Live</span>
        </h2>
        <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>From</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody style={tbodyStyle}>
              {feedbacks.length === 0 ? (
                <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No feedback yet.</td></tr>
              ) : feedbacks.map((f) => (
                <tr key={f.id}>
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(f.date)}</td>
                  <td style={{ ...tdStyle }}>
                    <span style={{
                      background: `${feedbackTypeColor[f.type] || 'var(--accent-amber)'}22`,
                      color: feedbackTypeColor[f.type] || 'var(--accent-amber)',
                      padding: '0.2rem 0.7rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize',
                    }}>{f.type}</span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.82rem' }}>{f.email}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--text-main)', maxWidth: 180 }}>{f.title}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 320, whiteSpace: 'normal' }}>{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
