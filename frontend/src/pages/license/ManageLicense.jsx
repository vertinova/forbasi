import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiCheck, FiX, FiEye, FiAward } from 'react-icons/fi';

export default function ManageLicense() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/license/applications', { params: { status: filterStatus, search } }),
        api.get('/license/stats')
      ]);
      setApplications(appsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/license/applications/${id}/status`, { status });
      toast.success('Status berhasil diperbarui');
      setDetail(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', proses: 'badge-info', approved: 'badge-success', rejected: 'badge-danger' };
    return <span className={`badge ${map[status] || ''}`}>{status}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1faee' }}>
      <Navbar title="Kelola Lisensi" />
      <div className="page-container">
        {stats && (
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0', color: '#ef6c00' }}><FiAward /></div><div className="stat-value">{stats.pending || 0}</div><div className="stat-label">Pending</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}><FiAward /></div><div className="stat-value">{stats.proses || 0}</div><div className="stat-label">Diproses</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}><FiAward /></div><div className="stat-value">{stats.approved || 0}</div><div className="stat-label">Approved</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: '#ffebee', color: '#d32f2f' }}><FiAward /></div><div className="stat-value">{stats.rejected || 0}</div><div className="stat-label">Ditolak</div></div>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); setLoading(true); fetchData(); }} className="filters-bar">
          <div className="filter-group">
            <label>Status</label>
            <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua</option>
              <option value="pending">Pending</option>
              <option value="proses">Diproses</option>
              <option value="approved">Approved</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Pencarian</label>
            <input className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama..." />
          </div>
          <button type="submit" className="btn btn-primary"><FiSearch /> Filter</button>
        </form>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Pengajuan Lisensi</h3>
            <span style={{ fontSize: '0.85rem' }}>{applications.length} pengajuan</span>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="table-responsive">
              <table>
                <thead><tr><th>No</th><th>Nama</th><th>Jenis</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr key={app.id}>
                      <td>{idx + 1}</td>
                      <td><strong>{app.full_name || app.username}</strong></td>
                      <td>{app.license_type}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>{new Date(app.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" style={{ background: '#e3f2fd', color: '#1976d2' }} onClick={() => setDetail(app)}><FiEye /></button>
                          {(app.status === 'pending' || app.status === 'proses') && (
                            <>
                              <button className="btn-icon" style={{ background: '#e8f5e9', color: '#388e3c' }} onClick={() => handleUpdateStatus(app.id, 'approved')}><FiCheck /></button>
                              <button className="btn-icon" style={{ background: '#ffebee', color: '#d32f2f' }} onClick={() => handleUpdateStatus(app.id, 'rejected')}><FiX /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {detail && (
          <div className="modal-overlay" onClick={() => setDetail(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <h3>Detail Pengajuan Lisensi</h3>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><strong>Nama:</strong> {detail.full_name || detail.username}</div>
                <div><strong>Jenis:</strong> {detail.license_type}</div>
                <div><strong>Status:</strong> {getStatusBadge(detail.status)}</div>
                <div><strong>Tanggal:</strong> {new Date(detail.created_at).toLocaleDateString('id-ID')}</div>
                {detail.notes && <div><strong>Catatan:</strong> {detail.notes}</div>}
                {detail.document && (
                  <a href={`${import.meta.env.VITE_API_URL}/uploads/license/${detail.document}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                    Lihat Dokumen
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                {(detail.status === 'pending' || detail.status === 'proses') && (
                  <>
                    <button className="btn btn-primary" onClick={() => handleUpdateStatus(detail.id, 'approved')}>Approve</button>
                    <button className="btn btn-danger" onClick={() => handleUpdateStatus(detail.id, 'rejected')}>Reject</button>
                  </>
                )}
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Tutup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
