import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Alert from '../../components/common/Alert';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (password !== confirm) { setError('Password tidak cocok'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password berhasil direset!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mereset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1d3557' }}>
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, textAlign: 'center' }}>
          <h3>Token tidak valid</h3>
          <Link to="/login" style={{ color: '#0d9500' }}>Kembali ke Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1d3557, #0a1128)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', maxWidth: 420, width: '100%' }}>
        <h2 style={{ color: '#1d3557', marginBottom: '1.5rem' }}>Reset Password</h2>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Password Baru</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter" />
          </div>
          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input type="password" className="form-control" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ulangi password baru" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Memproses...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
