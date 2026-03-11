import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiPlus, FiTrash2, FiUsers, FiBarChart2 } from 'react-icons/fi';

export default function KejurnasManage() {
  const [categories, setCategories] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clubSearch, setClubSearch] = useState('');
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [catRes, regRes, statsRes] = await Promise.all([
        api.get('/kejurnas/categories'),
        api.get('/kejurnas/registrations'),
        api.get('/kejurnas/stats')
      ]);
      setCategories(catRes.data.data || []);
      setRegistrations(regRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleSearchClub = async () => {
    if (clubSearch.length < 2) return toast.error('Minimal 2 karakter');
    try {
      const res = await api.get('/kejurnas/search-clubs', { params: { q: clubSearch } });
      setClubs(res.data.data || []);
      if (res.data.data.length === 0) toast('Tidak ditemukan klub');
    } catch { toast.error('Gagal mencari'); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedClub || !selectedCategory || !teamName.trim()) return toast.error('Lengkapi semua field');
    setSubmitting(true);
    try {
      await api.post('/kejurnas/registrations', {
        club_id: selectedClub.id,
        category_id: selectedCategory,
        team_name: teamName.trim()
      });
      toast.success('Tim berhasil didaftarkan');
      setSelectedClub(null); setSelectedCategory(''); setTeamName(''); setClubs([]);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mendaftar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/kejurnas/registrations/${deleteId}`);
      toast.success('Pendaftaran dihapus');
      setDeleteId(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1faee' }}>
      <Navbar title="Kejurnas" />
      <div className="page-container">
        {stats && (
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}><FiUsers /></div><div className="stat-value">{stats.total || 0}</div><div className="stat-label">Total Pendaftar</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}><FiBarChart2 /></div><div className="stat-value">{stats.jawa || 0}</div><div className="stat-label">Region Jawa</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0', color: '#ef6c00' }}><FiBarChart2 /></div><div className="stat-value">{stats.luarJawa || 0}</div><div className="stat-label">Region Luar Jawa</div></div>
          </div>
        )}

        {/* Registration Form */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}><FiPlus /> Daftarkan Tim</h3></div>
          <div className="card-body">
            {/* Club Search */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input className="form-control" style={{ flex: 1, minWidth: 200 }} value={clubSearch} onChange={e => setClubSearch(e.target.value)} placeholder="Cari nama klub..." />
              <button type="button" className="btn btn-secondary" onClick={handleSearchClub}><FiSearch /> Cari</button>
            </div>
            {clubs.length > 0 && !selectedClub && (
              <div style={{ marginBottom: '1rem', maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 8 }}>
                {clubs.map(c => (
                  <div key={c.id} onClick={() => { setSelectedClub(c); setClubs([]); }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'} onMouseOut={e => e.currentTarget.style.background = ''}>
                    <strong>{c.club_name}</strong> — {c.city_name}, {c.province_name}
                  </div>
                ))}
              </div>
            )}
            {selectedClub && (
              <div style={{ padding: '0.75rem 1rem', background: '#e8f5e9', borderRadius: 8, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>{selectedClub.club_name}</strong> — {selectedClub.city_name}, {selectedClub.province_name}</span>
                <button className="btn-icon" style={{ background: '#ffebee', color: '#d32f2f' }} onClick={() => setSelectedClub(null)}>✕</button>
              </div>
            )}
            <form onSubmit={handleRegister} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Kategori *</label>
                <select className="form-control" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} required>
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Nama Tim *</label>
                <input className="form-control" value={teamName} onChange={e => setTeamName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting || !selectedClub}>
                {submitting ? 'Mendaftar...' : 'Daftarkan'}
              </button>
            </form>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Daftar Pendaftaran</h3>
            <span style={{ fontSize: '0.85rem' }}>{registrations.length} tim</span>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="table-responsive">
              <table>
                <thead><tr><th>No</th><th>Tim</th><th>Klub</th><th>Kategori</th><th>Region</th><th>Tanggal</th><th>Aksi</th></tr></thead>
                <tbody>
                  {registrations.map((r, idx) => (
                    <tr key={r.id}>
                      <td>{idx + 1}</td>
                      <td><strong>{r.team_name}</strong></td>
                      <td>{r.club_name}</td>
                      <td>{r.category_name}</td>
                      <td><span className={`badge ${r.region === 'Jawa' ? 'badge-info' : 'badge-warning'}`}>{r.region}</span></td>
                      <td>{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <button className="btn-icon" style={{ background: '#ffebee', color: '#d32f2f' }} onClick={() => setDeleteId(r.id)}><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {deleteId && (
          <ConfirmModal
            title="Hapus Pendaftaran?"
            message="Pendaftaran tim ini akan dihapus."
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </div>
    </div>
  );
}
