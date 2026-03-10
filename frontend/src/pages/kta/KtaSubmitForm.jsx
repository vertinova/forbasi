import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSend } from 'react-icons/fi';

export default function KtaSubmitForm() {
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    club_name: '', province_id: '', city_id: '', club_address: '',
    leader_name: '', school_name: '', coach_name: '', manager_name: '',
    phone: '', email: '', nominal_paid: '',
  });
  const [files, setFiles] = useState({ sk_file: null, logo: null, payment_proof: null, ad_file: null, art_file: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/users/provinces').then(r => setProvinces(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.province_id) {
      api.get(`/users/cities/${formData.province_id}`).then(r => setCities(r.data.data || [])).catch(() => {});
    } else { setCities([]); }
  }, [formData.province_id]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleFile = (e) => setFiles(p => ({ ...p, [e.target.name]: e.target.files[0] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.club_name || !formData.province_id || !formData.city_id || !files.sk_file || !files.payment_proof) {
      return toast.error('Lengkapi semua field wajib');
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      await api.post('/kta/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pengajuan KTA berhasil dikirim!');
      navigate('/anggota');
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengirim pengajuan'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1faee' }}>
      <Navbar title="Pengajuan KTA" />
      <div className="page-container" style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1.1rem' }}>Form Pengajuan KTA</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nama Klub *</label>
                <input className="form-control" name="club_name" value={formData.club_name} onChange={handleChange} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Provinsi *</label>
                  <select className="form-control" name="province_id" value={formData.province_id} onChange={handleChange} required>
                    <option value="">Pilih Provinsi</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kota/Kabupaten *</label>
                  <select className="form-control" name="city_id" value={formData.city_id} onChange={handleChange} required>
                    <option value="">Pilih Kota</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Alamat Sekretariat</label>
                <textarea className="form-control" name="club_address" value={formData.club_address} onChange={handleChange} rows={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Ketua</label>
                  <input className="form-control" name="leader_name" value={formData.leader_name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Sekolah</label>
                  <input className="form-control" name="school_name" value={formData.school_name} onChange={handleChange} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Pelatih</label>
                  <input className="form-control" name="coach_name" value={formData.coach_name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Manajer</label>
                  <input className="form-control" name="manager_name" value={formData.manager_name} onChange={handleChange} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">No. HP</label>
                  <input className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nominal Bayar</label>
                  <input className="form-control" name="nominal_paid" value={formData.nominal_paid} onChange={handleChange} type="number" min="0" />
                </div>
              </div>

              <hr />
              <h4 style={{ fontSize: '1rem', margin: 0 }}>Upload Dokumen</h4>
              <div className="form-group">
                <label className="form-label">SK Pendirian Klub * (JPG/PNG/PDF, max 2MB)</label>
                <input type="file" className="form-control" name="sk_file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile} required />
              </div>
              <div className="form-group">
                <label className="form-label">Logo Klub (opsional)</label>
                <input type="file" className="form-control" name="logo" accept=".jpg,.jpeg,.png" onChange={handleFile} />
              </div>
              <div className="form-group">
                <label className="form-label">AD/ART/SK (opsional)</label>
                <input type="file" className="form-control" name="ad_file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile} />
              </div>
              <div className="form-group">
                <label className="form-label">Bukti Pembayaran * (JPG/PNG/PDF, max 2MB)</label>
                <input type="file" className="form-control" name="payment_proof" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile} required />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
                <FiSend /> {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
