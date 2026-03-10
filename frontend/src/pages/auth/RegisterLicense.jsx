import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Alert from '../../components/common/Alert';
import toast from 'react-hot-toast';

export default function RegisterLicense() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: 'pelatih' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.username || !form.email || !form.password) {
      setError('Semua field wajib diisi'); return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password tidak cocok'); return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register-license', {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role
      });
      toast.success('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1d3557, #0a1128)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', maxWidth: 450, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ color: '#1d3557', marginBottom: '0.25rem' }}>Registrasi Lisensi</h2>
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Daftar akun untuk pengajuan lisensi Pelatih atau Juri</p>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Jenis Akun</label>
            <select name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="pelatih">Pelatih</option>
              <option value="juri">Juri</option>
            </select>
          </div>
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" className="form-control" value={form.username} onChange={handleChange} placeholder="Username" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} placeholder="email@contoh.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} placeholder="Minimal 6 karakter" />
          </div>
          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input type="password" name="confirmPassword" className="form-control" value={form.confirmPassword} onChange={handleChange} placeholder="Ulangi password" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          Sudah punya akun? <Link to="/login" style={{ color: '#0d9500', fontWeight: 500 }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
