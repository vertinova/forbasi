import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiBell, FiSend, FiUsers, FiActivity } from 'react-icons/fi';

export default function NotificationPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/notifications/stats').then(r => setStats(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return toast.error('Judul dan isi wajib diisi');
    setSending(true);
    try {
      const res = await api.post('/notifications/send', { title, body, url: url || undefined });
      toast.success(`Terkirim ke ${res.data.data.successful} subscriber`);
      setTitle(''); setBody(''); setUrl('');
      const updated = await api.get('/notifications/stats');
      setStats(updated.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
    finally { setSending(false); }
  };

  if (loading) return <><Navbar title="Push Notifications" /><LoadingSpinner /></>;

  return (
    <div style={{ minHeight: '100vh', background: '#f1faee' }}>
      <Navbar title="Push Notifications" />
      <div className="page-container" style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
        {stats && (
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card"><div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}><FiUsers /></div><div className="stat-value">{stats.totalSubscribers || 0}</div><div className="stat-label">Subscribers</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}><FiSend /></div><div className="stat-value">{stats.totalSent || 0}</div><div className="stat-label">Terkirim</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0', color: '#ef6c00' }}><FiActivity /></div><div className="stat-value">{stats.totalClicks || 0}</div><div className="stat-label">Clicks</div></div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}><FiBell /> Kirim Notifikasi</h3></div>
          <div className="card-body">
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Judul *</label>
                <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Isi Pesan *</label>
                <textarea className="form-control" value={body} onChange={e => setBody(e.target.value)} rows={3} required />
              </div>
              <div className="form-group">
                <label className="form-label">URL Tujuan (opsional)</label>
                <input className="form-control" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Mengirim...' : 'Kirim'}</button>
            </form>
          </div>
        </div>

        {stats?.recentLogs?.length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Log Terakhir</h3></div>
            <div className="table-responsive">
              <table>
                <thead><tr><th>Judul</th><th>Terkirim</th><th>Gagal</th><th>Tanggal</th></tr></thead>
                <tbody>
                  {stats.recentLogs.map((log, i) => (
                    <tr key={i}>
                      <td><strong>{log.title}</strong></td>
                      <td><span className="badge badge-success">{log.successful}</span></td>
                      <td><span className="badge badge-danger">{log.failed}</span></td>
                      <td>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
