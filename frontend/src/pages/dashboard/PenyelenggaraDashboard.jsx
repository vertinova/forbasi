import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  draft: { text: 'Draft', color: '#6b7280' },
  submitted: { text: 'Menunggu Review', color: '#f59e0b' },
  approved_pengcab: { text: 'Disetujui Pengcab', color: '#3b82f6' },
  rejected_pengcab: { text: 'Ditolak Pengcab', color: '#ef4444' },
  approved_admin: { text: 'Disetujui Admin', color: '#10b981' },
  rejected_admin: { text: 'Ditolak Admin', color: '#ef4444' }
};

export default function PenyelenggaraDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/my-events');
      setEvents(res.data.data || []);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const statusBadge = (status) => {
    const s = STATUS_LABELS[status] || { text: status, color: '#666' };
    return (
      <span style={{ background: `${s.color}22`, color: s.color, padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
        {s.text}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0c1222', color: '#e2e8f0' }}>
      {/* Navbar */}
      <nav style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <h3 style={{ margin: 0, color: '#10b981' }}>FORBASI</h3>
          <small style={{ color: '#888' }}>Panel Penyelenggara</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#ccc' }}>{user?.club_name || user?.username}</span>
          <button onClick={handleLogout} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Dashboard Penyelenggara</h2>
            <p style={{ color: '#888', margin: '0.25rem 0 0' }}>Kelola pengajuan event Anda</p>
          </div>
          <button
            onClick={() => navigate('/penyelenggara/event/submit')}
            style={{ background: '#10b981', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Ajukan Event Baru
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Pengajuan', value: events.length, color: '#3b82f6' },
            { label: 'Menunggu', value: events.filter(e => ['submitted', 'approved_pengcab'].includes(e.status)).length, color: '#f59e0b' },
            { label: 'Disetujui', value: events.filter(e => e.status === 'approved_admin').length, color: '#10b981' },
            { label: 'Ditolak', value: events.filter(e => e.status.startsWith('rejected')).length, color: '#ef4444' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem', borderLeft: `3px solid ${stat.color}` }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: '#888' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Event list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Memuat data...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <p style={{ color: '#888', marginBottom: '1rem' }}>Belum ada pengajuan event</p>
            <button onClick={() => navigate('/penyelenggara/event/submit')} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
              Ajukan Event Pertama
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map(event => (
              <div key={event.id} onClick={() => navigate(`/penyelenggara/event/${event.id}`)} style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{event.nama_event}</h3>
                    <p style={{ margin: '0.25rem 0', color: '#888', fontSize: '0.9rem' }}>
                      {event.lokasi} • {new Date(event.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(event.tanggal_selesai).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  {statusBadge(event.status)}
                </div>
                {event.rejection_reason && (
                  <p style={{ margin: '0.5rem 0 0', color: '#ef4444', fontSize: '0.85rem' }}>Alasan: {event.rejection_reason}</p>
                )}
                {event.surat_rekomendasi_path && (
                  <a href={`${api.defaults.baseURL?.replace('/api', '')}/uploads/${event.surat_rekomendasi_path}`} target="_blank" rel="noreferrer"
                    onClick={e => e.stopPropagation()} style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '0.5rem', display: 'inline-block' }}>
                    📄 Download Surat Rekomendasi
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
