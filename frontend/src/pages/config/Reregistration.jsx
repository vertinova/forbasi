import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import toast from 'react-hot-toast';

export default function Reregistration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ competition_name: '', year: new Date().getFullYear(), notes: '' });
  const [docFile, setDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/config/reregistrations');
      setItems(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.competition_name) return toast.error('Nama kompetisi wajib diisi');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('competition_name', form.competition_name);
      formData.append('year', form.year);
      formData.append('notes', form.notes);
      if (docFile) formData.append('document_file', docFile);

      await api.post('/config/reregistration', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Pendaftaran ulang berhasil diajukan');
      setShowForm(false);
      setForm({ competition_name: '', year: new Date().getFullYear(), notes: '' });
      setDocFile(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan');
    } finally { setSubmitting(false); }
  };

  const statusBadge = (status) => {
    const colors = { pending: '#f0ad4e', approved: '#0d9500', rejected: '#dc3545' };
    return <span className="badge" style={{ backgroundColor: colors[status] || '#666', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{status}</span>;
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Pendaftaran Ulang Kompetisi</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Tutup Form' : '+ Ajukan Pendaftaran Ulang'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nama Kompetisi *</label>
              <input type="text" value={form.competition_name} onChange={e => setForm(p => ({ ...p, competition_name: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Tahun</label>
                <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Dokumen Pendukung</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files[0])} />
              </div>
            </div>
            <div className="form-group">
              <label>Catatan</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Mengajukan...' : 'Ajukan'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <p>Memuat...</p> : items.length === 0 ? <p>Belum ada data pendaftaran ulang.</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kompetisi</th>
                <th>Tahun</th>
                <th>Status</th>
                <th>Catatan</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.competition_name}</td>
                  <td>{item.year}</td>
                  <td>{statusBadge(item.status)}</td>
                  <td>{item.notes || '-'}</td>
                  <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
