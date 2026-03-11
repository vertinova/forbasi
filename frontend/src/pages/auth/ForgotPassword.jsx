import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Alert from '../../components/common/Alert';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Email wajib diisi' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Terjadi kesalahan' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1d3557 0%, #0a1128 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ color: '#1d3557', marginBottom: '0.5rem' }}>Lupa Password</h2>
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Masukkan email untuk menerima link reset password.</p>

        {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: '#0d9500', fontSize: '0.85rem' }}>← Kembali ke Login</Link>
        </div>
      </div>
    </div>
  );
}
