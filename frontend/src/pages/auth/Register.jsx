import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [registerType, setRegisterType] = useState('klub'); // 'klub' or 'penyelenggara'
  const [form, setForm] = useState({
    club_name: '', nama_organisasi: '', username: '', email: '', password: '', password_confirmation: '',
    phone: '', address: '', province_id: '', city_id: ''
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users/provinces').then(res => setProvinces(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.province_id) {
      api.get(`/users/cities/${form.province_id}`).then(res => setCities(res.data.data)).catch(() => {});
    } else {
      setCities([]);
    }
  }, [form.province_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'province_id') setForm(prev => ({ ...prev, city_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      return toast.error('Password tidak cocok');
    }
    setLoading(true);
    try {
      if (registerType === 'penyelenggara') {
        await api.post('/auth/register-penyelenggara', {
          nama_organisasi: form.nama_organisasi,
          username: form.username,
          email: form.email,
          password: form.password,
          confirm_password: form.password_confirmation,
          phone: form.phone,
          address: form.address,
          province_id: form.province_id,
          city_id: form.city_id
        });
        toast.success('Registrasi penyelenggara berhasil! Silakan login.');
      } else {
        await api.post('/auth/register', form);
        toast.success('Registrasi berhasil! Silakan login.');
      }
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal registrasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <h2>Daftar Akun</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Pilih jenis akun yang ingin didaftarkan
        </p>

        {/* Register type selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setRegisterType('klub')}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '8px', border: '2px solid',
              borderColor: registerType === 'klub' ? '#10b981' : '#333',
              background: registerType === 'klub' ? 'rgba(16,185,129,0.1)' : 'transparent',
              color: registerType === 'klub' ? '#10b981' : '#ccc',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            🏫 Klub / Anggota
          </button>
          <button
            type="button"
            onClick={() => setRegisterType('penyelenggara')}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '8px', border: '2px solid',
              borderColor: registerType === 'penyelenggara' ? '#f59e0b' : '#333',
              background: registerType === 'penyelenggara' ? 'rgba(245,158,11,0.1)' : 'transparent',
              color: registerType === 'penyelenggara' ? '#f59e0b' : '#ccc',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            🎪 Penyelenggara Event
          </button>
        </div>

        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
          {registerType === 'klub'
            ? 'Daftarkan klub Anda untuk mengajukan KTA dan mengikuti kejuaraan FORBASI.'
            : 'Daftarkan organisasi Anda sebagai penyelenggara event FORBASI untuk mengajukan perizinan event.'}
        </p>

        <form onSubmit={handleSubmit}>
          {registerType === 'klub' ? (
            <div className="form-group">
              <label>Nama Klub *</label>
              <input type="text" name="club_name" value={form.club_name} onChange={handleChange} required />
            </div>
          ) : (
            <div className="form-group">
              <label>Nama Organisasi / Instansi *</label>
              <input type="text" name="nama_organisasi" value={form.nama_organisasi} onChange={handleChange} required placeholder="Nama organisasi penyelenggara" />
            </div>
          )}
          <div className="form-group">
            <label>Username *</label>
            <input type="text" name="username" value={form.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Konfirmasi Password *</label>
              <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>No. Telepon</label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Provinsi *</label>
              <select name="province_id" value={form.province_id} onChange={handleChange} required>
                <option value="">Pilih Provinsi</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Kota/Kabupaten *</label>
              <select name="city_id" value={form.city_id} onChange={handleChange} required>
                <option value="">Pilih Kota</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Alamat</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={3} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Mendaftar...' : registerType === 'penyelenggara' ? 'Daftar Sebagai Penyelenggara' : 'Daftar'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Sudah punya akun? <Link to="/login">Login di sini</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Pelatih / Juri? <Link to="/register-license">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}
