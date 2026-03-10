import { useState, useEffect, useRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Homepage.css';

/* ─── Animated counter hook ─────────────────────────────── */
function useCountUp(target, trigger) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger || !target) return;
    let start = 0;
    const dur = 2000;
    const step = target / (dur / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, trigger]);
  return val;
}

/* ─── Intersection observer hook ────────────────────────── */
function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

/* ─── Constants ─────────────────────────────────────────── */
const MEMBERS_PER_PAGE = 4;
const TEAMS_PER_PAGE = 12;

const PROGRAMS = [
  { icon: 'https://cdn-icons-png.flaticon.com/512/3050/3050541.png', title: 'Komite Kompetisi', desc: 'Menyelenggarakan berbagai kompetisi baris-berbaris dari tingkat daerah hingga nasional untuk mengembangkan bakat dan prestasi.' },
  { icon: 'https://cdn-icons-png.flaticon.com/512/1570/1570887.png', title: 'Komite Keanggotaan', desc: 'Mengelola keanggotaan FORBASI di seluruh Indonesia dan membangun jaringan antar anggota.' },
  { icon: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png', title: 'Komite Kepelatihan', desc: 'Menyelenggarakan pelatihan dan pembinaan untuk meningkatkan kualitas pelatih baris-berbaris.' },
  { icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176272.png', title: 'Sertifikasi Juri & Pelatih', desc: 'Melaksanakan program sertifikasi untuk menjamin kualitas juri dan pelatih baris-berbaris.' },
  { icon: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png', title: 'Daftar Anggota', desc: 'Lihat daftar lengkap anggota FORBASI dari seluruh Indonesia dan bergabung dengan komunitas kami.' },
  { icon: 'https://cdn-icons-png.flaticon.com/512/2989/2989988.png', title: 'Semua Program', desc: 'Temukan lebih banyak program menarik dari FORBASI untuk pengembangan baris-berbaris di Indonesia.', highlight: true },
];

/* ═══════════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════════════ */
export default function Homepage() {
  /* ── navbar scroll effect ── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  /* ── members ── */
  const [allClubs, setAllClubs] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const membersRef = useRef(null);
  const membersInView = useInView(membersRef);
  const memberCountAnim = useCountUp(totalMembers, membersInView);

  /* ── competition teams ── */
  const [teams, setTeams] = useState([]);
  const [teamsAll, setTeamsAll] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamCategory, setTeamCategory] = useState('all');
  const [teamLevel, setTeamLevel] = useState('all');
  const [teamPage, setTeamPage] = useState(1);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const compRef = useRef(null);
  const compInView = useInView(compRef);
  const totalTeamsAnim = useCountUp(teamsAll.length, compInView);

  /* ── visitor stats ── */
  const [visitors, setVisitors] = useState(null);
  const footerRef = useRef(null);
  const footerInView = useInView(footerRef);
  const visitorAnim = useCountUp(visitors?.totals?.total_visits || 0, footerInView);
  const uniqueAnim  = useCountUp(visitors?.totals?.total_unique_visitors || 0, footerInView);

  /* ── boot ── */
  useEffect(() => {
    (async () => {
      try { await api.post('/config/track-visitor'); } catch {}
      try {
        const r = await api.get('/public/clubs', { params: { page: 1, limit: 500 } });
        setAllClubs(r.data.data?.clubs || []);
        setTotalMembers(r.data.data?.total || 0);
      } catch {}
      try {
        const r = await api.get('/public/approved-teams', { params: { limit: 500 } });
        setTeamsAll(r.data.data?.teams || []);
        setCategories(r.data.data?.categories || []);
      } catch {}
      try {
        const r = await api.get('/public/visitor-stats');
        setVisitors(r.data.data);
      } catch {}
      setTeamsLoading(false);
    })();
  }, []);

  /* ── member filtering + pagination ── */
  const filteredClubs = allClubs.filter(c =>
    !memberSearch ||
    c.club_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    c.coach_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    c.manager_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    c.club_address?.toLowerCase().includes(memberSearch.toLowerCase())
  );
  const memberTotalPages = Math.max(1, Math.ceil(filteredClubs.length / MEMBERS_PER_PAGE));
  const memberSlice = filteredClubs.slice((memberPage - 1) * MEMBERS_PER_PAGE, memberPage * MEMBERS_PER_PAGE);

  /* ── team filtering + pagination ── */
  const filteredTeams = teamsAll.filter(t => {
    const matchSearch = !teamSearch ||
      t.club_name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.province_name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.region?.toLowerCase().includes(teamSearch.toLowerCase());
    const matchCat = teamCategory === 'all' ||
      (t.category_name || '').toLowerCase().replace(/ /g, '_') === teamCategory;
    const matchLevel = teamLevel === 'all' || t.level === teamLevel;
    return matchSearch && matchCat && matchLevel;
  });
  const teamTotalPages = Math.max(1, Math.ceil(filteredTeams.length / TEAMS_PER_PAGE));
  const teamSlice = filteredTeams.slice((teamPage - 1) * TEAMS_PER_PAGE, teamPage * TEAMS_PER_PAGE);

  /* comp stats */
  const rukibraCount = teamsAll.filter(t => (t.category_name || '').toLowerCase().includes('rukibra')).length;
  const barisCount   = teamsAll.filter(t => (t.category_name || '').toLowerCase().includes('baris')).length;
  const varforCount  = teamsAll.filter(t => (t.category_name || '').toLowerCase().includes('varfor')).length;

  /* ─── render ─────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#f1faee', minHeight: '100vh' }}>

      {/* ════ NAVBAR ════ */}
      <nav className={`hp-navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="hp-nav">
          <button className="hp-nav-link" onClick={() => scrollTo('hero')} style={{ padding: 0, background: 'none' }}>
            <img src="/logo-forbasi.png" alt="FORBASI" style={{ height: 40, width: 'auto' }} />
          </button>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[['hero','Beranda','fa-home'],['what','Tentang','fa-info-circle'],['program','Program','fa-calendar-alt'],['lisensi','Lisensi','fa-certificate'],['members','Anggota','fa-users'],['competition','Kompetisi','fa-trophy']].map(([id, label, icon]) => (
              <button key={id} className="hp-nav-link" onClick={() => scrollTo(id)}>
                <i className={`fas ${icon}`} />
                {label}
              </button>
            ))}
          </div>
          <Link to="/login" className="hp-login-btn">Login</Link>
        </div>
      </nav>

      {/* ════ HERO ════ */}
      <section id="hero" className="hp-hero-section">
        <div className="hp-video-bg">
          <video autoPlay loop muted playsInline poster="/logo-forbasi.png">
            <source src="/forbasi.mp4" type="video/mp4" />
          </video>
          <div className="hp-video-overlay" />
        </div>
        <div className="hp-hero-content">
          <img src="/logo-forbasi.png" alt="FORBASI"
            style={{ height: 100, width: 'auto', margin: '0 auto 1.5rem', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))' }} />
          <h1>PB FORBASI</h1>
          <p>Federasi Olahraga Baris Berbaris Seluruh Indonesia</p>
          <div className="hp-hero-btns">
            <Link to="/login" className="hp-hero-btn-primary">
              <i className="fas fa-sign-in-alt" /> Login
            </Link>
            <button className="hp-hero-btn-outline" onClick={() => scrollTo('program')}>
              <i className="fas fa-calendar-alt" /> Program Kami
            </button>
          </div>
        </div>
        <div className="hp-scroll-indicator">
          <div className="hp-mouse"><div className="hp-scroller" /></div>
          <span>Scroll Down</span>
        </div>
      </section>

      {/* ════ ABOUT ════ */}
      <section id="what" className="hp-section" style={{ backgroundColor: '#fff' }}>
        <div className="hp-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title">Tentang FORBASI</h2>
            <div className="hp-divider" />
          </div>
          <div className="hp-about-content">
            <div className="hp-about-text">
              <p>FORBASI (Federasi Olahraga Baris-Berbaris Seluruh Indonesia) adalah organisasi yang membina, mengembangkan, dan memasyarakatkan olahraga baris-berbaris di Indonesia. Kami berkomitmen untuk membentuk generasi muda yang disiplin, tangguh, dan berkarakter melalui berbagai program pelatihan dan kompetisi.</p>
              <p>Dengan jaringan di seluruh Indonesia, FORBASI menjadi wadah bagi para pecinta baris-berbaris untuk mengembangkan bakat, meningkatkan keterampilan, dan berprestasi di tingkat nasional maupun internasional.</p>
            </div>
            <div className="hp-about-logos">
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="hp-logo-card">
                  <img src="/logo-forbasi.png" alt="FORBASI"
                    style={{ height: 110, width: 'auto', objectFit: 'contain' }} />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="hp-logo-card">
                  <img src="/logo-forbasi.png" alt="KORMI"
                    style={{ height: 110, width: 'auto', objectFit: 'contain', opacity: 0.7 }} />
                  <div className="hp-badge">Anggota KORMI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ PROGRAMS ════ */}
      <section id="program" className="hp-section" style={{ backgroundColor: '#f1faee' }}>
        <div className="hp-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title">Program Kami</h2>
            <div className="hp-divider" />
            <p className="hp-section-desc">Berbagai program unggulan untuk pengembangan olahraga baris-berbaris di Indonesia</p>
          </div>
          <div className="hp-programs-grid">
            {PROGRAMS.map(p => (
              <div key={p.title} className={`hp-program-card${p.highlight ? ' highlight' : ''}`}>
                <div className="hp-program-icon">
                  <img src={p.icon} alt={p.title} style={{ width: 48, height: 48, objectFit: 'contain' }} loading="lazy" />
                </div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <span className="hp-program-more">
                  Selengkapnya <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem', marginLeft: 4 }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ LICENSE ════ */}
      <section id="lisensi" className="hp-section" style={{ backgroundColor: '#fff' }}>
        <div className="hp-container" style={{ maxWidth: 900 }}>
          <div className="hp-section-header">
            <h2 className="hp-section-title">
              <i className="fas fa-certificate" style={{ marginRight: 10, color: 'rgb(0,73,24)' }} />
              Lisensi Pelatih &amp; Juri
            </h2>
            <div className="hp-divider" />
            <p className="hp-section-desc">Daftarkan diri Anda untuk mengikuti program sertifikasi lisensi pelatih atau juri FORBASI</p>
          </div>

          {/* Event card */}
          <div className="hp-license-event">
            <div className="hp-license-tag">
              <i className="fas fa-calendar-star" style={{ marginRight: 6 }} />Jadwal Terbaru
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Lisensi Pelatih dan Juri (Muda &amp; Madya)
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.95rem' }}>
              <span><i className="fas fa-calendar-alt" style={{ marginRight: 8, opacity: 0.8 }} />Minggu, 12 April 2026</span>
              <span><i className="fas fa-clock" style={{ marginRight: 8, opacity: 0.8 }} />08.00 WIB s/d selesai</span>
              <span><i className="fas fa-map-marker-alt" style={{ marginRight: 8, opacity: 0.8 }} />Semarang, Jawa Tengah</span>
            </div>
          </div>

          {/* License cards */}
          <div className="hp-license-cards">
            <div className="hp-license-card">
              <div className="hp-license-card-header" style={{ backgroundColor: 'rgb(0,73,24)' }}>
                <i className="fas fa-chalkboard-teacher" />
                <h3>Lisensi Pelatih</h3>
              </div>
              <div className="hp-license-card-body">
                <p className="hp-price-label">Investasi</p>
                <p className="hp-price" style={{ color: 'rgb(0,73,24)' }}>Rp 750.000</p>
                <Link to="/register-license" className="hp-license-btn" style={{ backgroundColor: 'rgb(0,73,24)' }}>
                  <i className="fas fa-user-plus" style={{ marginRight: 8 }} />Daftar Sekarang
                </Link>
              </div>
            </div>
            <div className="hp-license-card" style={{ border: '2px solid #1d3557' }}>
              <div className="hp-license-card-header" style={{ backgroundColor: '#1d3557', position: 'relative' }}>
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#ffc107', color: '#1d3557',
                  fontSize: '0.72rem', fontWeight: 700,
                  padding: '0.2rem 0.7rem', borderRadius: 50
                }}>Muda &amp; Madya</span>
                <i className="fas fa-gavel" />
                <h3>Lisensi Juri</h3>
              </div>
              <div className="hp-license-card-body">
                <p className="hp-price-label">Investasi</p>
                <p className="hp-price" style={{ color: '#1d3557' }}>Rp 2.000.000</p>
                <Link to="/register-license" className="hp-license-btn" style={{ backgroundColor: '#1d3557' }}>
                  <i className="fas fa-user-plus" style={{ marginRight: 8 }} />Daftar Sekarang
                </Link>
              </div>
            </div>
          </div>

          {/* Registration steps */}
          <div className="hp-steps-wrap">
            <h4 style={{ fontWeight: 600, color: '#1d3557', fontSize: '1.05rem' }}>
              <i className="fas fa-list-ol" style={{ marginRight: 8, color: 'rgb(0,73,24)' }} />
              Langkah Pendaftaran
            </h4>
            <div className="hp-steps">
              {[['Buat Akun','Daftar akun sebagai Pelatih atau Juri'],['Lengkapi Data','Isi formulir dan upload dokumen persyaratan'],['Verifikasi PB','Pengajuan akan diverifikasi oleh PB FORBASI'],['Selesai','Lisensi disetujui dan Anda siap mengikuti pelatihan']].map(([title, desc], i) => (
                <Fragment key={title}>
                  <div className="hp-step">
                    <div className="hp-step-num">{i + 1}</div>
                    <p className="hp-step-title">{title}</p>
                    <p className="hp-step-desc">{desc}</p>
                  </div>
                  {i < 3 && <i className="fas fa-arrow-right hp-step-arrow" style={{ color: '#dee2e6', fontSize: '1.2rem', flexShrink: 0 }} />}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════ MERCHANDISE ════ */}
      <section id="product" className="hp-section" style={{ backgroundColor: '#f1faee' }}>
        <div className="hp-container" style={{ maxWidth: 900 }}>
          <div className="hp-section-header">
            <h2 className="hp-section-title">Merchandise</h2>
            <div className="hp-divider" />
            <p className="hp-section-desc">Dapatkan merchandise resmi FORBASI untuk mendukung kegiatan kami</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '2rem', maxWidth: 640, margin: '0 auto' }}>
            {[['Kemeja Forbasi','Rp 150.000'],['Jersey Forbasi','Rp 170.000']].map(([name, price]) => (
              <div key={name} className="hp-merch-card">
                <div className="hp-merch-image">
                  <i className="fas fa-tshirt" style={{ fontSize: '5rem', color: 'rgba(29,53,87,0.2)' }} />
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, color: '#1d3557', marginBottom: '0.5rem' }}>{name}</h3>
                  <div className="hp-merch-price">{price}</div>
                  <button className="hp-buy-btn">
                    <i className="fas fa-shopping-cart" style={{ marginRight: 8 }} />Beli Sekarang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ MEMBERS ════ */}
      <section id="members" className="hp-section" style={{ backgroundColor: '#fff' }} ref={membersRef}>
        <div className="hp-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title">Anggota Resmi FORBASI</h2>
            <div className="hp-divider" />
            <p className="hp-section-desc">Daftar klub yang telah menjadi anggota resmi FORBASI dengan KTA terbit.</p>
          </div>

          {/* Counter */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
            <div className="hp-count-card">
              <div className="hp-count-icon">
                <i className="fas fa-users" />
              </div>
              <div>
                <div className="hp-count-number">{memberCountAnim.toLocaleString('id-ID')}</div>
                <div className="hp-count-label">Total Anggota Resmi</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="hp-search-wrap">
            <div className="hp-search-box">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Cari nama klub, pelatih, atau manajer..."
                value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setMemberPage(1); }}
              />
              {memberSearch && (
                <button className="hp-clear-btn" onClick={() => { setMemberSearch(''); setMemberPage(1); }}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            {memberSearch && (
              <div className="hp-search-result">
                Ditemukan <strong>{filteredClubs.length}</strong> anggota untuk &quot;{memberSearch}&quot;
              </div>
            )}
          </div>

          {/* Members grid */}
          {filteredClubs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '3rem 0', fontSize: '1.1rem' }}>
              Belum ada anggota resmi yang terdaftar saat ini.
            </p>
          ) : (
            <div className="hp-members-grid">
              {memberSlice.map(club => (
                <div key={club.id} className="hp-member-card">
                  <div className="hp-member-img-wrap">
                    {club.logo_path ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${club.logo_path}`}
                        alt={club.club_name}
                        onError={e => { e.target.src = '/logo-forbasi.png'; }}
                      />
                    ) : (
                      <span className="hp-member-initial">{(club.club_name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="hp-member-badge">ANGGOTA RESMI FORBASI</div>
                  <h3>{club.club_name}</h3>
                  {club.club_address && <p><strong>Alamat:</strong> {club.club_address}</p>}
                  <p><strong>Pelatih:</strong> {club.coach_name || '-'}</p>
                  <p><strong>Manajer:</strong> {club.manager_name || '-'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {memberTotalPages > 1 && (
            <div className="hp-pagination">
              <button className="hp-page-btn" onClick={() => setMemberPage(p => p - 1)} disabled={memberPage <= 1}>
                <i className="fas fa-chevron-left" /> Sebelumnya
              </button>
              <div className="hp-page-info">
                Halaman <span>{memberPage}</span> dari <span>{memberTotalPages}</span>
                <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: 2 }}>
                  ({MEMBERS_PER_PAGE} anggota per halaman)
                </div>
              </div>
              <button className="hp-page-btn" onClick={() => setMemberPage(p => p + 1)} disabled={memberPage >= memberTotalPages}>
                Selanjutnya <i className="fas fa-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ════ COMPETITION ════ */}
      <section id="competition" className="hp-section" style={{ backgroundColor: '#f1faee' }} ref={compRef}>
        <div className="hp-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title">
              <i className="fas fa-trophy" style={{ marginRight: 10, color: '#f0a500' }} />
              Tim Kompetisi Kejurnas
            </h2>
            <div className="hp-divider" />
            <p className="hp-section-desc">Tim-tim terbaik yang telah lolos seleksi untuk mengikuti kompetisi nasional</p>
          </div>

          {/* Stats */}
          <div className="hp-comp-stats">
            {[
              { label: 'Total Tim', val: totalTeamsAnim, icon: 'fa-users', bg: 'linear-gradient(135deg,#0d9500,#0a7300)' },
              { label: 'Rukibra', val: rukibraCount, icon: 'fa-flag', bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
              { label: 'Baris Berbaris', val: barisCount, icon: 'fa-drum', bg: 'linear-gradient(135deg,#eab308,#ca8a04)' },
              { label: 'Varfor Musik', val: varforCount, icon: 'fa-music', bg: 'linear-gradient(135deg,#ef4444,#b91c1c)' },
            ].map(s => (
              <div key={s.label} className="hp-comp-stat" style={{ background: s.bg }}>
                <i className={`fas ${s.icon}`} />
                <div className="stat-num">{s.val}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Level filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="hp-search-box" style={{ flex: 1, minWidth: 240, maxWidth: '100%', margin: 0 }}>
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Cari nama klub, provinsi..."
                value={teamSearch}
                onChange={e => { setTeamSearch(e.target.value); setTeamPage(1); }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-graduation-cap" style={{ color: '#6c757d' }} />
              <select
                value={teamLevel}
                onChange={e => { setTeamLevel(e.target.value); setTeamPage(1); }}
                style={{
                  padding: '0.75rem 1rem', border: '1px solid #dee2e6',
                  borderRadius: 10, fontSize: '0.95rem',
                  fontFamily: "'Poppins',sans-serif", background: '#fff'
                }}
              >
                <option value="all">Semua Tingkat</option>
                {['SD','SMP','SMA','Purna'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Category tabs */}
          <div className="hp-comp-tabs">
            {[['all','Semua','fa-th'],['rukibra','Rukibra','fa-flag'],['baris_berbaris','Baris Berbaris','fa-person-military-rifle'],['varfor_musik','Varfor Musik','fa-drum']].map(([val, label, icon]) => (
              <button key={val} className={`hp-tab-btn${teamCategory === val ? ' active' : ''}`}
                onClick={() => { setTeamCategory(val); setTeamPage(1); }}>
                <i className={`fas ${icon}`} />{label}
              </button>
            ))}
          </div>

          {teamSearch && (
            <p style={{ fontSize: '0.95rem', color: '#6c757d', marginBottom: '1rem' }}>
              Ditemukan <strong>{filteredTeams.length}</strong> tim
            </p>
          )}

          {/* Teams grid */}
          {teamsLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6c757d' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }} />
              Memuat data tim...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6c757d' }}>
              <i className="fas fa-trophy" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.3 }} />
              Tidak ada tim ditemukan
            </div>
          ) : (
            <div className="hp-teams-grid">
              {teamSlice.map(team => (
                <div key={team.id} className="hp-team-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {team.logo_path ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${team.logo_path}`}
                        alt={team.club_name}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                        onError={e => { e.target.src = '/logo-forbasi.png'; }}
                      />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(0,73,24,0.08)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'rgb(0,73,24)', fontSize: '1.1rem'
                      }}>
                        {(team.club_name || '?')[0]}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: '#1d3557', fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {team.club_name}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: 0 }}>{team.province_name || '-'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {team.category_name && (
                      <span style={{ background: 'rgba(0,73,24,0.1)', color: 'rgb(0,73,24)', fontSize: '0.75rem', padding: '0.2rem 0.7rem', borderRadius: 50 }}>
                        {team.category_name}
                      </span>
                    )}
                    {team.level && (
                      <span style={{ background: 'rgba(29,53,87,0.1)', color: '#1d3557', fontSize: '0.75rem', padding: '0.2rem 0.7rem', borderRadius: 50 }}>
                        {team.level}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Teams pagination */}
          {teamTotalPages > 1 && (
            <div className="hp-pagination">
              <button className="hp-page-btn" onClick={() => setTeamPage(p => p - 1)} disabled={teamPage <= 1}>
                <i className="fas fa-chevron-left" /> Sebelumnya
              </button>
              <div className="hp-page-info">
                Halaman <span>{teamPage}</span> dari <span>{teamTotalPages}</span>
                <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: 2 }}>({filteredTeams.length} tim)</div>
              </div>
              <button className="hp-page-btn" onClick={() => setTeamPage(p => p + 1)} disabled={teamPage >= teamTotalPages}>
                Selanjutnya <i className="fas fa-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer id="footer" className="hp-footer" ref={footerRef}>
        {/* Stats bar — dark green gradient */}
        <div className="hp-footer-stats">
          <div className="hp-container">
            <div className="hp-footer-stats-grid">
              {[
                { icon: 'fa-eye', val: visitorAnim.toLocaleString('id-ID'), label: 'Total Kunjungan' },
                { icon: 'fa-users', val: (totalMembers || 0).toLocaleString('id-ID'), label: 'Anggota Resmi' },
                { icon: 'fa-trophy', val: teamsAll.length, label: 'Tim Kompetisi' },
                { icon: 'fa-calendar-check', val: '2025', label: 'Sejak Tahun' },
              ].map(s => (
                <div key={s.label} className="hp-stat-item">
                  <div className="hp-stat-icon">
                    <i className={`fas ${s.icon}`} />
                  </div>
                  <div>
                    <div className="hp-stat-number">{s.val}</div>
                    <div className="hp-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer content */}
        <div className="hp-container">
          <div className="hp-footer-content">
            <div>
              <img src="/logo-forbasi.png" alt="FORBASI" style={{ height: 60, width: 'auto', marginBottom: '1rem' }} />
              <p style={{ opacity: 0.8, fontSize: '0.95rem', lineHeight: 1.6 }}>
                Federasi Olahraga Baris Berbaris Seluruh Indonesia
              </p>
              <p style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Membina dan mengembangkan baris-berbaris di seluruh Indonesia.
              </p>
            </div>
            <div className="hp-footer-links">
              <h3>Quick Links</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[['hero','Beranda'],['what','Tentang'],['program','Program'],['lisensi','Lisensi'],['members','Anggota Resmi'],['competition','Kompetisi']].map(([id, label]) => (
                  <li key={id}>
                    <button className="hp-footer-link" onClick={() => scrollTo(id)}>{label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', paddingBottom: '0.5rem', position: 'relative', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                Newsletter
              </h3>
              <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: 0 }}>
                Daftar untuk mendapatkan informasi terbaru dari FORBASI
              </p>
              <form onSubmit={e => e.preventDefault()} className="newsletter-form">
                <input type="email" placeholder="Email Anda" />
                <button type="submit">
                  <i className="fas fa-paper-plane" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="hp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} FORBASI. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
