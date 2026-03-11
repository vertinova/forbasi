import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PRIMARY       = 'rgb(0,73,24)';
const PRIMARY_DARK  = 'rgb(3,107,3)';
const SECONDARY     = '#1d3557';
const SECONDARY_DK  = '#122a44';

const roleRedirects = {
  super_admin: '/superadmin',
  anggota:     '/anggota',
  pengcab:     '/pengcab',
  pengda:      '/pengda',
  pb:          '/pb',
  pelatih:     '/license-user',
  juri:        '/license-user'
};

/* ── shared input/label styles ── */
const IS = {
  width: '100%', padding: '0.75rem 1rem',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#ddd', borderRadius: 6,
  fontFamily: "'Poppins',sans-serif", fontSize: '0.95rem',
  outline: 'none', transition: 'border-color .3s, box-shadow .3s',
  boxSizing: 'border-box', background: '#fff', color: '#0a1128'
};
const LS = {
  display: 'block', marginBottom: '0.45rem',
  fontSize: '0.85rem', fontWeight: 600, color: SECONDARY
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={LS}>{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ style, onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...IS, ...(focused ? { borderColor: PRIMARY, boxShadow: `0 0 0 3px rgba(0,128,0,0.15)` } : {}), ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function StyledSelect({ style, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{ ...IS, ...(focused ? { borderColor: PRIMARY, boxShadow: `0 0 0 3px rgba(0,128,0,0.15)` } : {}), ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

export default function Login() {
  const [showRegister, setShowRegister] = useState(false);

  /* Login state */
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd,  setShowPwd]    = useState(false);
  const [loginError, setLoginError] = useState('');

  /* Register state */
  const [form, setForm] = useState({
    club_name: '', email: '', phone: '', address: '',
    province_id: '', city_id: '', username: '', password: '', confirm_password: ''
  });
  const [showRegPwd,  setShowRegPwd]  = useState(false);
  const [showConPwd,  setShowConPwd]  = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [cities,    setCities]    = useState([]);
  const [regError,  setRegError]  = useState('');
  const [loading,   setLoading]   = useState(false);

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
      setShowRegister(false);
    } catch (err) {
      setRegError(err.response?.data?.message || 'Terjadi kesalahan saat mendaftar.');
    } finally { setLoading(false); }
  };

  const setField = (name, val) =>
    setForm(p => ({ ...p, [name]: val, ...(name === 'province_id' ? { city_id: '' } : {}) }));

  /* ─── RENDER ─── */
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Poppins',sans-serif",
      background: '#f1faee'
    }}>

      {/* ── LEFT PANEL – video branding ── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh'
      }} className="login-left-panel">
        {/* video */}
        <video autoPlay loop muted playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
          <source src="/forbasi.mp4" type="video/mp4" />
        </video>
        {/* overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,73,24,0.80), rgba(29,53,87,0.70))'
        }} />
        {/* content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', padding: '2rem' }}>
          <img src="/logo-forbasi.png" alt="FORBASI"
            style={{ height: 100, width: 'auto', margin: '0 auto 1.5rem', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))' }} />
          <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 800, marginBottom: '0.75rem', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            PB FORBASI
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, marginBottom: '2rem', lineHeight: 1.6 }}>
            Federasi Olahraga Baris Berbaris<br />Seluruh Indonesia
          </p>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.8rem 2rem', background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: 50, color: '#fff', fontWeight: 600, fontSize: '0.9rem',
            textDecoration: 'none', transition: 'all .3s ease'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <i className="fas fa-home" /> Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* ── RIGHT PANEL – auth card ── */}
      <div style={{
        width: 480, flexShrink: 0,
        background: '#f1faee',
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(0,128,0,0.1) 0%, transparent 30%), radial-gradient(circle at 80% 70%, rgba(29,53,87,0.1) 0%, transparent 30%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', overflowY: 'auto'
      }} className="login-right-panel">

        {/* 3D flip container */}
        <div style={{
          width: '100%', maxWidth: 400,
          perspective: '1200px'
        }}>
          <div style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.8s cubic-bezier(0.68,-0.55,0.265,1.55)',
            transform: showRegister ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}>

            {/* ════ LOGIN CARD ════ */}
            <div style={{
              background: '#fff', borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              padding: '2.5rem', position: 'relative', overflow: 'hidden',
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden'
            }}>
              {/* top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: PRIMARY }} />

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img src="/logo-forbasi.png" alt="FORBASI"
                  style={{ height: 75, objectFit: 'contain', margin: '0 auto 1rem' }}
                  onError={e => e.target.style.display = 'none'} />
                <h2 style={{ fontSize: '1.7rem', fontWeight: 700, color: SECONDARY, marginBottom: '0.3rem' }}>
                  Selamat Datang
                </h2>
                <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>Masuk ke akun FORBASI Anda</p>
              </div>

              {loginError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 6, background: '#fff5f5', border: '1px solid #f5c6cb', color: '#842029', fontSize: '0.9rem' }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />{loginError}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <Field label="Username">
                  <StyledInput type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Masukkan username" autoComplete="username" required />
                </Field>
                <Field label="Password">
                  <div style={{ position: 'relative' }}>
                    <StyledInput type={showPwd ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Masukkan password" autoComplete="current-password" required
                      style={{ paddingRight: '2.8rem' }} />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '1rem' }}>
                      <i className={`far ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </Field>

                <div style={{ textAlign: 'right', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
                  <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: PRIMARY, textDecoration: 'none' }}>
                    Lupa password?
                  </Link>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '0.9rem', background: PRIMARY,
                  color: '#fff', border: 'none', borderRadius: 6,
                  fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all .3s ease', marginBottom: '1.5rem',
                  opacity: loading ? 0.7 : 1, fontFamily: "'Poppins',sans-serif"
                }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.background = PRIMARY_DARK)}
                  onMouseLeave={e => (e.currentTarget.style.background = PRIMARY)}
                >
                  {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Memproses...</> : 'Masuk'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
                Belum punya akun?{' '}
                <span onClick={() => setShowRegister(true)}
                  style={{ color: PRIMARY, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  Daftar sekarang
                </span>
              </p>
            </div>

            {/* ════ REGISTER CARD ════ */}
            <div style={{
              background: '#fff', borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              padding: '2.5rem', position: 'absolute', top: 0, left: 0, right: 0,
              overflow: 'visible',
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}>
              {/* top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: SECONDARY, borderRadius: '12px 12px 0 0' }} />

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <img src="/logo-forbasi.png" alt="FORBASI"
                  style={{ height: 60, objectFit: 'contain', margin: '0 auto 0.75rem' }}
                  onError={e => e.target.style.display = 'none'} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: SECONDARY, marginBottom: '0.3rem' }}>
                  Buat Akun Baru
                </h2>
                <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>Bergabung dengan FORBASI</p>
              </div>

              {regError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 6, background: '#fff5f5', border: '1px solid #f5c6cb', color: '#842029', fontSize: '0.87rem' }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />{regError}
                </div>
              )}

              <form onSubmit={handleRegister}>
                {[
                  { label: 'Nama Club', name: 'club_name', type: 'text', placeholder: 'Nama Club' },
                  { label: 'Email', name: 'email', type: 'email', placeholder: 'Masukan email' },
                  { label: 'No. WhatsApp', name: 'phone', type: 'text', placeholder: 'Masukan no WhatsApp' },
                  { label: 'Alamat', name: 'address', type: 'text', placeholder: 'Alamat' },
                ].map(f => (
                  <Field key={f.name} label={f.label}>
                    <StyledInput type={f.type} name={f.name} value={form[f.name]}
                      onChange={e => setField(e.target.name, e.target.value)}
                      placeholder={f.placeholder} required />
                  </Field>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Provinsi">
                    <StyledSelect name="province_id" value={form.province_id}
                      onChange={e => setField('province_id', e.target.value)} required>
                      <option value="">Pilih Provinsi</option>
                      {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </StyledSelect>
                  </Field>
                  <Field label="Kab/Kota">
                    <StyledSelect name="city_id" value={form.city_id}
                      onChange={e => setField('city_id', e.target.value)} required
                      disabled={!form.province_id}
                      style={{ opacity: form.province_id ? 1 : 0.5 }}>
                      <option value="">Pilih Kota</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </StyledSelect>
                  </Field>
                </div>

                <Field label="Username">
                  <StyledInput type="text" name="username" value={form.username}
                    onChange={e => setField('username', e.target.value)}
                    placeholder="Username" required />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Password">
                    <div style={{ position: 'relative' }}>
                      <StyledInput type={showRegPwd ? 'text' : 'password'} name="password" value={form.password}
                        onChange={e => setField('password', e.target.value)}
                        placeholder="Buat password" required style={{ paddingRight: '2.8rem' }} />
                      <button type="button" onClick={() => setShowRegPwd(v => !v)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <i className={`far ${showRegPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                  </Field>
                  <Field label="Konfirmasi">
                    <div style={{ position: 'relative' }}>
                      <StyledInput type={showConPwd ? 'text' : 'password'} name="confirm_password" value={form.confirm_password}
                        onChange={e => setField('confirm_password', e.target.value)}
                        placeholder="Ulangi password" required style={{ paddingRight: '2.8rem' }} />
                      <button type="button" onClick={() => setShowConPwd(v => !v)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <i className={`far ${showConPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                  </Field>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '0.9rem', background: SECONDARY,
                  color: '#fff', border: 'none', borderRadius: 6,
                  fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all .3s ease', marginTop: '0.5rem', marginBottom: '1.25rem',
                  opacity: loading ? 0.7 : 1, fontFamily: "'Poppins',sans-serif"
                }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.background = SECONDARY_DK)}
                  onMouseLeave={e => (e.currentTarget.style.background = SECONDARY)}
                >
                  {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Mendaftar...</> : 'Daftar'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6c757d', margin: 0 }}>
                Sudah punya akun?{' '}
                <span onClick={() => setShowRegister(false)}
                  style={{ color: PRIMARY, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  Masuk disini
                </span>
              </p>
            </div>

          </div>{/* /flip */}
        </div>
      </div>{/* /right panel */}

      {/* responsive: hide left panel on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; min-height: 100vh; }
        }
      `}</style>
    </div>
  );
}

