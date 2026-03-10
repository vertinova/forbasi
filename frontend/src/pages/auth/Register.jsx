import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    club_name: '', username: '', email: '', password: '', password_confirmation: '',
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
      await api.post('/auth/register', form);
      toast.success('Registrasi berhasil! Silakan login.');
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
        <h2>Daftar Akun Klub</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Buat akun untuk mendaftarkan klub Anda di FORBASI
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Klub *</label>
            <input type="text" name="club_name" value={form.club_name} onChange={handleChange} required />
          </div>
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
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Sudah punya akun? <Link to="/login">Login di sini</Link>
        </p>
      </div>
    </div>
  );
}
