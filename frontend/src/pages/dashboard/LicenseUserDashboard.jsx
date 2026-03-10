import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiUpload } from 'react-icons/fi';

export default function LicenseUserDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ license_type: '', notes: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/license/my-applications');
      setApplications(res.data.data || []);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.license_type || !file) return toast.error('Lengkapi semua field wajib');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('license_type', formData.license_type);
      fd.append('notes', formData.notes);
      fd.append('document', file);
      await api.post('/license/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pengajuan lisensi berhasil dikirim');
      setShowForm(false); setFormData({ license_type: '', notes: '' }); setFile(null);
      fetchApplications();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengirim'); }
    finally { setSubmitting(false); }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', proses: 'badge-info', approved: 'badge-success', rejected: 'badge-danger' };
    return <span className={`badge ${map[status] || ''}`}>{status}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1faee' }}>
      <Navbar title="Dashboard Lisensi" />
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Pengajuan Lisensi Saya</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <FiUpload /> {showForm ? 'Batal' : 'Ajukan Lisensi Baru'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Form Pengajuan Lisensi</h3></div>
            <div className="card-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500 }}>
                <div className="form-group">
                  <label className="form-label">Jenis Lisensi *</label>
                  <select className="form-control" value={formData.license_type} onChange={e => setFormData(p => ({ ...p, license_type: e.target.value }))} required>
                    <option value="">Pilih...</option>
                    <option value="pelatih_c">Pelatih C</option>
                    <option value="pelatih_b">Pelatih B</option>
                    <option value="pelatih_a">Pelatih A</option>
                    <option value="juri_c">Juri C</option>
                    <option value="juri_b">Juri B</option>
                    <option value="juri_a">Juri A</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dokumen Pendukung *</label>
                  <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setFile(e.target.files[0])} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan (opsional)</label>
                  <textarea className="form-control" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Riwayat Pengajuan</h3>
            <span style={{ fontSize: '0.85rem' }}>{applications.length} pengajuan</span>
          </div>
          {loading ? <LoadingSpinner /> : applications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Belum ada pengajuan lisensi</div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead><tr><th>No</th><th>Jenis</th><th>Status</th><th>Tanggal</th><th>Catatan</th></tr></thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr key={app.id}>
                      <td>{idx + 1}</td>
                      <td><strong>{app.license_type}</strong></td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>{new Date(app.created_at).toLocaleDateString('id-ID')}</td>
                      <td>{app.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
