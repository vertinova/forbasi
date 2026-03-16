import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const roleRedirects = {
  super_admin: '/superadmin',
  anggota:     '/anggota',
  pengcab:     '/pengcab',
  pengda:      '/pengda',
  pb:          '/pb',
  penyelenggara: '/penyelenggara',
  pelatih:     '/license-user',
  juri:        '/license-user'
};

/* ── Animated floating orb ── */
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

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [animating, setAnimating] = useState(false);

  /* Login state */
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loginError, setLoginError] = useState('');

  /* Register state */
  const [form, setForm] = useState({
    club_name: '', email: '', phone: '', address: '',
    province_id: '', city_id: '', username: '', password: '', confirm_password: ''
  });
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showConPwd, setShowConPwd] = useState(false);
  const [provinces, setProvinces]   = useState([]);
  const [cities, setCities]         = useState([]);
  const [regError, setRegError]     = useState('');
  const [loading, setLoading]       = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    api.get('/users/provinces').then(r => setProvinces(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.province_id) {
      api.get(`/users/cities/${form.province_id}`).then(r => setCities(r.data.data || [])).catch(() => {});
    } else setCities([]);
  }, [form.province_id]);

  const switchMode = (m) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setMode(m); setTimeout(() => setAnimating(false), 400); }, 200);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!username.trim() || !password) return setLoginError('Username dan password wajib diisi');
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      toast.success('Login berhasil!');
      navigate(roleRedirects[user.role || user.user_type] || '/', { replace: true });
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login gagal. Periksa username dan password.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (form.password !== form.confirm_password)
      return setRegError('Password dan konfirmasi password tidak cocok.');
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, password_confirmation: form.confirm_password });
      toast.success('Pendaftaran berhasil! Silakan login.');
      switchMode('login');
    } catch (err) {
      setRegError(err.response?.data?.message || 'Terjadi kesalahan saat mendaftar.');
    } finally { setLoading(false); }
  };

  const setField = (name, val) =>
    setForm(p => ({ ...p, [name]: val, ...(name === 'province_id' ? { city_id: '' } : {}) }));

  const inputClass = 'auth-input';
  const selectClass = 'auth-input auth-select';

  return (
    <div className="auth-page">
      {/* Animated background orbs */}
      <Orb size="500px" x="-10%" y="-15%" color="rgba(16,185,129,0.5)" delay={0} />
      <Orb size="400px" x="70%" y="60%" color="rgba(29,53,87,0.6)" delay={2} />
      <Orb size="300px" x="50%" y="-10%" color="rgba(0,73,24,0.4)" delay={4} />
      <Orb size="350px" x="-5%" y="70%" color="rgba(59,130,246,0.3)" delay={3} />

      {/* Grid pattern overlay */}
      <div className="auth-grid-overlay" />

      {/* Main container */}
      <div className="auth-container">
        {/* Brand header */}
        {/* Card */}
        <div className={`auth-card ${animating ? 'auth-card-exit' : 'auth-card-enter'}`}>
          {mode === 'login' ? (
            /* ════ LOGIN ════ */
            <>
              <div className="auth-brand">
                <Link to="/" className="auth-home-link">
                  <i className="fas fa-arrow-left" /> Beranda
                </Link>
                <img src="/logo-forbasi.png" alt="FORBASI" className="auth-logo" />
                <h1 className="auth-title">FORBASI</h1>
                <p className="auth-subtitle">Forum Baris Indonesia</p>
              </div>

              {loginError && (
                <div className="auth-alert error">
                  <i className="fas fa-exclamation-triangle" />
                  <span>{loginError}</span>
                  <button onClick={() => setLoginError('')}>&times;</button>
                </div>
              )}

              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-field">
                  <label>Username</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-user" />
                    <input type="text" className={inputClass} value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Masukkan username" autoComplete="username" required />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Password</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-lock" />
                    <input type={showPwd ? 'text' : 'password'} className={inputClass}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Masukkan password" autoComplete="current-password" required />
                    <button type="button" className="auth-eye" onClick={() => setShowPwd(v => !v)}>
                      <i className={`far ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="auth-actions-row">
                  
                </div>

                <button type="submit" className="auth-btn primary" disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-spin" /> Memproses...</> : <><i className="fas fa-arrow-right" /> Masuk</>}
                </button>
              </form>

              <div className="auth-divider"><span>atau</span></div>

              <div className="auth-switch-row">
                <p>Belum punya akun?</p>
                <button className="auth-btn outline" onClick={() => switchMode('register')}>
                  <i className="fas fa-user-plus" /> Daftar Klub Baru
                </button>
              </div>

              <Link to="/register-license" className="auth-license-link">
                <i className="fas fa-certificate" /> Daftar Lisensi Pelatih / Juri
              </Link>
            </>
          ) : (
            /* ════ REGISTER ════ */
            <>
              <div className="auth-brand">
                <Link to="/" className="auth-home-link">
                  <i className="fas fa-arrow-left" /> Beranda
                </Link>
                <img src="/logo-forbasi.png" alt="FORBASI" className="auth-logo" />
                <h1 className="auth-title">Daftar Klub Baru</h1>
                <p className="auth-subtitle">Bergabung dengan keluarga besar FORBASI</p>
              </div>

              {regError && (
                <div className="auth-alert error">
                  <i className="fas fa-exclamation-triangle" />
                  <span>{regError}</span>
                  <button onClick={() => setRegError('')}>&times;</button>
                </div>
              )}

              <form onSubmit={handleRegister} className="auth-form">
                <div className="auth-field">
                  <label>Nama Klub</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-shield-alt" />
                    <input type="text" className={inputClass} value={form.club_name}
                      onChange={e => setField('club_name', e.target.value)}
                      placeholder="Nama klub" required />
                  </div>
                </div>

                <div className="auth-row-2">
                  <div className="auth-field">
                    <label>Email</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-envelope" />
                      <input type="email" className={inputClass} value={form.email}
                        onChange={e => setField('email', e.target.value)}
                        placeholder="Email" required />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>No. WhatsApp</label>
                    <div className="auth-input-wrap">
                      <i className="fab fa-whatsapp" />
                      <input type="text" className={inputClass} value={form.phone}
                        onChange={e => setField('phone', e.target.value)}
                        placeholder="08xxxxxxxxxx" required />
                    </div>
                  </div>
                </div>

                <div className="auth-field">
                  <label>Alamat</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-map-marker-alt" />
                    <input type="text" className={inputClass} value={form.address}
                      onChange={e => setField('address', e.target.value)}
                      placeholder="Alamat lengkap" required />
                  </div>
                </div>

                <div className="auth-row-2">
                  <div className="auth-field">
                    <label>Provinsi</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-map" />
                      <select className={selectClass} value={form.province_id}
                        onChange={e => setField('province_id', e.target.value)} required>
                        <option value="">Pilih Provinsi</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Kab / Kota</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-city" />
                      <select className={selectClass} value={form.city_id}
                        onChange={e => setField('city_id', e.target.value)} required
                        disabled={!form.province_id}>
                        <option value="">Pilih Kota</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="auth-field">
                  <label>Username</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-user" />
                    <input type="text" className={inputClass} value={form.username}
                      onChange={e => setField('username', e.target.value)}
                      placeholder="Username" required />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Password</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-lock" />
                    <input type={showRegPwd ? 'text' : 'password'} className={inputClass}
                      value={form.password} onChange={e => setField('password', e.target.value)}
                      placeholder="Buat password" required />
                    <button type="button" className="auth-eye" onClick={() => setShowRegPwd(v => !v)}>
                      <i className={`far ${showRegPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Konfirmasi Password</label>
                  <div className="auth-input-wrap">
                    <i className="fas fa-lock" />
                    <input type={showConPwd ? 'text' : 'password'} className={inputClass}
                      value={form.confirm_password} onChange={e => setField('confirm_password', e.target.value)}
                      placeholder="Ulangi password" required />
                    <button type="button" className="auth-eye" onClick={() => setShowConPwd(v => !v)}>
                      <i className={`far ${showConPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-btn primary blue" disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-spin" /> Mendaftar...</> : <><i className="fas fa-check" /> Daftar Sekarang</>}
                </button>
              </form>

              <div className="auth-switch-row">
                <p>Sudah punya akun?</p>
                <button className="auth-btn outline" onClick={() => switchMode('login')}>
                  <i className="fas fa-sign-in-alt" /> Masuk
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
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
        @keyframes cardExit {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.96); }
        }

        .auth-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #0a0f1a;
          font-family: 'Poppins', system-ui, sans-serif;
          position: relative; overflow: hidden;
          padding: 2rem 1rem;
        }
        .auth-grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }
        .auth-container {
          position: relative; z-index: 1; width: 100%; max-width: 480px;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        }

        /* Brand */
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
          font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #10b981, #3b82f6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .auth-subtitle { color: rgba(255,255,255,0.45); font-size: 0.78rem; margin: 0.4rem 0 0; }

        /* Card */
        .auth-card {
          width: 100%; padding: 2rem; overflow: hidden;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .auth-card-enter { animation: cardEnter 0.4s ease-out forwards; }
        .auth-card-exit { animation: cardExit 0.2s ease-in forwards; }

        .auth-card-header { text-align: center; margin-bottom: 1.5rem; }
        .auth-card-header h2 { color: #fff; font-size: 1.4rem; font-weight: 700; margin: 0 0 0.25rem; }
        .auth-card-header p { color: rgba(255,255,255,0.45); font-size: 0.85rem; margin: 0; }

        .auth-icon-wrap {
          width: 52px; height: 52px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem; font-size: 1.3rem;
        }
        .auth-icon-wrap.green { background: rgba(16,185,129,0.15); color: #10b981; }
        .auth-icon-wrap.blue { background: rgba(59,130,246,0.15); color: #3b82f6; }

        /* Alert */
        .auth-alert {
          display: flex; align-items: center; gap: 10px; padding: 0.75rem 1rem;
          border-radius: 12px; margin-bottom: 1.25rem; font-size: 0.85rem;
        }
        .auth-alert.error {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5;
        }
        .auth-alert span { flex: 1; }
        .auth-alert button {
          background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; line-height: 1;
        }

        /* Form */
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

        .auth-input, .auth-select {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 0.9rem; padding: 0.75rem 0;
          font-family: inherit;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-select { cursor: pointer; }
        .auth-select option { background: #1a1f2e; color: #fff; }
        .auth-select:disabled { opacity: 0.4; }

        .auth-eye {
          background: none; border: none; color: rgba(255,255,255,0.3);
          cursor: pointer; font-size: 0.95rem; padding: 4px;
          transition: color 0.3s;
        }
        .auth-eye:hover { color: #10b981; }

        .auth-actions-row {
          display: flex; justify-content: flex-end; margin-top: -0.25rem;
        }
        .auth-forgot {
          font-size: 0.8rem; color: #10b981; text-decoration: none; transition: color 0.3s;
        }
        .auth-forgot:hover { color: #34d399; }

        .auth-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

        /* Buttons */
        .auth-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 0.85rem; border-radius: 12px;
          font-size: 0.95rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s ease; font-family: inherit; border: none;
        }
        .auth-btn.primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff; box-shadow: 0 4px 20px rgba(16,185,129,0.3);
        }
        .auth-btn.primary:hover:not(:disabled) {
          box-shadow: 0 8px 30px rgba(16,185,129,0.45); transform: translateY(-1px);
        }
        .auth-btn.primary.blue {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          box-shadow: 0 4px 20px rgba(59,130,246,0.3);
        }
        .auth-btn.primary.blue:hover:not(:disabled) {
          box-shadow: 0 8px 30px rgba(59,130,246,0.45);
        }
        .auth-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .auth-btn.outline {
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .auth-btn.outline:hover {
          background: rgba(255,255,255,0.1); color: #fff;
          border-color: rgba(255,255,255,0.2);
        }

        /* Divider */
        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 1.25rem 0; color: rgba(255,255,255,0.2); font-size: 0.78rem;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08);
        }

        /* Switch row */
        .auth-switch-row {
          text-align: center; margin-top: 1rem;
        }
        .auth-switch-row p {
          color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0 0 0.6rem;
        }

        /* License link */
        .auth-license-link {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 0.75rem; padding: 0.6rem; border-radius: 10px;
          font-size: 0.82rem; font-weight: 500; text-decoration: none;
          color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.1); transition: all 0.3s;
        }
        .auth-license-link:hover {
          color: #f59e0b; border-color: rgba(245,158,11,0.3);
          background: rgba(245,158,11,0.05);
        }

        /* Footer */
        .auth-footer { color: rgba(255,255,255,0.2); font-size: 0.72rem; margin: 0; }

        /* Responsive */
        @media (max-width: 520px) {
          .auth-card { padding: 1.5rem; }
          .auth-row-2 { grid-template-columns: 1fr; }
          .auth-title { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  );
}

