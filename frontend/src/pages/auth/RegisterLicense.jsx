import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'pelatih', label: 'Pelatih', icon: 'fa-chalkboard-teacher', desc: 'Pelatih baris-berbaris', color: '#10b981' },
  { value: 'juri', label: 'Juri', icon: 'fa-gavel', desc: 'Juri kompetisi', color: '#f59e0b' },
];

function Orb({ size, x, y, color, delay }) {
  return (
    <div style={{
      position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      left: x, top: y, opacity: 0.4, filter: 'blur(60px)',
      animation: `orbFloat 8s ease-in-out ${delay}s infinite alternate`,
      pointerEvents: 'none'
    }} />
  );
}

export default function RegisterLicense() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: 'pelatih' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConPwd, setShowConPwd] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email || !form.password) { setError('Semua field wajib diisi'); return; }
    if (form.password.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (form.password !== form.confirmPassword) { setError('Password tidak cocok'); return; }

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
    } finally { setLoading(false); }
  };

  const activeRole = ROLES.find(r => r.value === form.role);

  return (
    <div className="auth-page">
      <Orb size="450px" x="65%" y="-10%" color="rgba(245,158,11,0.4)" delay={0} />
      <Orb size="400px" x="-10%" y="60%" color="rgba(16,185,129,0.5)" delay={2} />
      <Orb size="300px" x="40%" y="70%" color="rgba(29,53,87,0.5)" delay={3.5} />

      <div className="auth-grid-overlay" />

      <div className="auth-container">
        <div className="auth-card auth-card-enter">
          <div className="auth-brand">
            <Link to="/login" className="auth-home-link">
              <i className="fas fa-arrow-left" /> Kembali ke Login
            </Link>
            <img src="/logo-forbasi.png" alt="FORBASI" className="auth-logo" />
            <h1 className="auth-title">Lisensi FORBASI</h1>
            <p className="auth-subtitle">Daftar sebagai Pelatih atau Juri bersertifikat</p>
          </div>

          {error && (
            <div className="auth-alert error">
              <i className="fas fa-exclamation-triangle" />
              <span>{error}</span>
              <button onClick={() => setError('')}>&times;</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Role selector */}
            <div className="auth-field">
              <label>Jenis Akun</label>
              <div className="auth-role-grid">
                {ROLES.map(r => (
                  <button type="button" key={r.value}
                    className={`auth-role-card ${form.role === r.value ? 'active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, role: r.value }))}
                    style={{ '--role-color': r.color }}>
                    <i className={`fas ${r.icon}`} />
                    <span className="auth-role-label">{r.label}</span>
                    <span className="auth-role-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-field">
              <label>Username</label>
              <div className="auth-input-wrap">
                <i className="fas fa-user" />
                <input type="text" className="auth-input" name="username" value={form.username}
                  onChange={handleChange} placeholder="Masukkan username" required />
              </div>
            </div>

            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrap">
                <i className="fas fa-envelope" />
                <input type="email" className="auth-input" name="email" value={form.email}
                  onChange={handleChange} placeholder="email@contoh.com" required />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <i className="fas fa-lock" />
                <input type={showPwd ? 'text' : 'password'} className="auth-input" name="password"
                  value={form.password} onChange={handleChange} placeholder="Min. 6 karakter" required />
                <button type="button" className="auth-eye" onClick={() => setShowPwd(v => !v)}>
                  <i className={`far ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Konfirmasi Password</label>
              <div className="auth-input-wrap">
                <i className="fas fa-lock" />
                <input type={showConPwd ? 'text' : 'password'} className="auth-input" name="confirmPassword"
                  value={form.confirmPassword} onChange={handleChange} placeholder="Ulangi password" required />
                <button type="button" className="auth-eye" onClick={() => setShowConPwd(v => !v)}>
                  <i className={`far ${showConPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn primary" disabled={loading}
              style={{ background: `linear-gradient(135deg, ${activeRole.color}, ${activeRole.color}cc)` }}>
              {loading ? <><i className="fas fa-spinner fa-spin" /> Memproses...</> : <><i className="fas fa-certificate" /> Daftar Sekarang</>}
            </button>
          </form>

          <div className="auth-switch-row">
            <p>Sudah punya akun?</p>
            <Link to="/login" className="auth-btn outline" style={{ textDecoration: 'none' }}>
              <i className="fas fa-sign-in-alt" /> Masuk
            </Link>
          </div>
        </div>

        <p className="auth-footer">&copy; 2026 PB FORBASI. All rights reserved.</p>
      </div>

      <style>{`
        @keyframes orbFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -40px) scale(1.15); }
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #0a0f1a; font-family: 'Poppins', system-ui, sans-serif;
          position: relative; overflow: hidden; padding: 2rem 1rem;
        }
        .auth-grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px; pointer-events: none;
        }
        .auth-container {
          position: relative; z-index: 1; width: 100%; max-width: 480px;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        }
        .auth-brand { text-align: center; margin-bottom: 1.5rem; }
        .auth-home-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.5); font-size: 0.8rem; text-decoration: none;
          margin-bottom: 1.2rem; transition: color 0.3s;
        }
        .auth-home-link:hover { color: #10b981; }
        .auth-logo {
          height: 72px; width: auto; display: block; margin: 0 auto 0.75rem;
          filter: drop-shadow(0 0 30px rgba(16,185,129,0.3));
        }
        .auth-title {
          font-size: 1.6rem; font-weight: 800; margin: 0; letter-spacing: 2px;
          background: linear-gradient(135deg, #f59e0b, #10b981);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .auth-subtitle { color: rgba(255,255,255,0.45); font-size: 0.78rem; margin: 0.4rem 0 0; }
        .auth-card {
          width: 100%; padding: 2rem; overflow: hidden;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .auth-card-enter { animation: cardEnter 0.4s ease-out forwards; }
        .auth-card-header { text-align: center; margin-bottom: 1.5rem; }
        .auth-card-header h2 { color: #fff; font-size: 1.4rem; font-weight: 700; margin: 0 0 0.25rem; }
        .auth-card-header p { color: rgba(255,255,255,0.45); font-size: 0.85rem; margin: 0; }
        .auth-icon-wrap {
          width: 52px; height: 52px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem; font-size: 1.3rem;
        }
        .auth-alert {
          display: flex; align-items: center; gap: 10px; padding: 0.75rem 1rem;
          border-radius: 12px; margin-bottom: 1.25rem; font-size: 0.85rem;
        }
        .auth-alert.error {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5;
        }
        .auth-alert span { flex: 1; }
        .auth-alert button { background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; }
        .auth-form { display: flex; flex-direction: column; gap: 1rem; }
        .auth-field label {
          display: block; margin-bottom: 0.35rem;
          font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.55);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .auth-input-wrap {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 0 14px; transition: all 0.3s;
        }
        .auth-input-wrap:focus-within {
          border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
          background: rgba(255,255,255,0.07);
        }
        .auth-input-wrap > i { color: rgba(255,255,255,0.3); font-size: 0.9rem; flex-shrink: 0; }
        .auth-input-wrap:focus-within > i { color: #10b981; }
        .auth-input {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 0.9rem; padding: 0.75rem 0; font-family: inherit;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-eye {
          background: none; border: none; color: rgba(255,255,255,0.3);
          cursor: pointer; font-size: 0.95rem; padding: 4px; transition: color 0.3s;
        }
        .auth-eye:hover { color: #10b981; }
        .auth-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

        /* Role cards */
        .auth-role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .auth-role-card {
          padding: 1rem 0.75rem; border-radius: 12px; cursor: pointer; text-align: center;
          background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.08);
          transition: all 0.3s ease; font-family: inherit;
        }
        .auth-role-card:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); }
        .auth-role-card.active {
          border-color: var(--role-color); background: color-mix(in srgb, var(--role-color) 10%, transparent);
        }
        .auth-role-card i {
          font-size: 1.4rem; display: block; margin-bottom: 6px; color: rgba(255,255,255,0.3);
          transition: color 0.3s;
        }
        .auth-role-card.active i { color: var(--role-color); }
        .auth-role-label {
          display: block; font-weight: 600; font-size: 0.9rem; color: rgba(255,255,255,0.6);
          transition: color 0.3s;
        }
        .auth-role-card.active .auth-role-label { color: #fff; }
        .auth-role-desc { display: block; font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-top: 2px; }

        .auth-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 0.85rem; border-radius: 12px;
          font-size: 0.95rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s ease; font-family: inherit; border: none;
        }
        .auth-btn.primary {
          color: #fff; box-shadow: 0 4px 20px rgba(16,185,129,0.3);
        }
        .auth-btn.primary:hover:not(:disabled) {
          box-shadow: 0 8px 30px rgba(16,185,129,0.45); transform: translateY(-1px);
        }
        .auth-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-btn.outline {
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .auth-btn.outline:hover {
          background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.2);
        }
        .auth-switch-row { text-align: center; margin-top: 1rem; }
        .auth-switch-row p { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0 0 0.6rem; }
        .auth-footer { color: rgba(255,255,255,0.2); font-size: 0.72rem; margin: 0; }

        @media (max-width: 520px) {
          .auth-card { padding: 1.5rem; }
          .auth-row-2, .auth-role-grid { grid-template-columns: 1fr; }
          .auth-title { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  );
}
