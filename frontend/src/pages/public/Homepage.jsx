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
function useInView(ref, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

/* ─── Constants ─────────────────────────────────────────── */
const MEMBERS_PER_PAGE = 8;

const NAV_ITEMS = [
  ['hero', 'Beranda', 'fa-home'],
  ['about', 'Tentang', 'fa-info-circle'],
  ['struktur', 'Organisasi', 'fa-sitemap'],
  ['katalog', 'Katalog', 'fa-id-badge'],
  ['members', 'Anggota', 'fa-users'],
  ['berita', 'Berita', 'fa-newspaper'],
  ['marketplace', 'Marketplace', 'fa-store'],
];

const STRUKTUR_DATA = [
  { jabatan: 'Ketua Umum', nama: '-', icon: 'fa-crown' },
  { jabatan: 'Sekretaris Jenderal', nama: '-', icon: 'fa-pen-fancy' },
  { jabatan: 'Bendahara Umum', nama: '-', icon: 'fa-coins' },
  { jabatan: 'Ketua Bidang Kompetisi', nama: '-', icon: 'fa-trophy' },
  { jabatan: 'Ketua Bidang Keanggotaan', nama: '-', icon: 'fa-users' },
  { jabatan: 'Ketua Bidang Kepelatihan', nama: '-', icon: 'fa-chalkboard-teacher' },
];

const KATALOG_JURI = [
  { level: 'Juri Muda (C)', syarat: ['Minimal usia 20 tahun', 'Mengikuti diklat juri muda', 'Lulus ujian teori & praktek'], warna: 'emerald' },
  { level: 'Juri Madya (B)', syarat: ['Memiliki lisensi Juri Muda', 'Pengalaman menilai min. 5 event', 'Mengikuti diklat juri madya'], warna: 'blue' },
  { level: 'Juri Utama (A)', syarat: ['Memiliki lisensi Juri Madya', 'Pengalaman menilai min. 10 event', 'Rekomendasi PB FORBASI'], warna: 'amber' },
];

const KATALOG_PELATIH = [
  { level: 'Pelatih C', syarat: ['Minimal usia 18 tahun', 'Mengikuti diklat pelatih dasar', 'Lulus ujian teori & praktek'], warna: 'emerald' },
  { level: 'Pelatih B', syarat: ['Memiliki lisensi Pelatih C', 'Pengalaman melatih min. 3 tahun', 'Membina min. 1 klub aktif'], warna: 'blue' },
  { level: 'Pelatih A', syarat: ['Memiliki lisensi Pelatih B', 'Pengalaman melatih min. 5 tahun', 'Prestasi di tingkat nasional'], warna: 'amber' },
];

const BERITA_PLACEHOLDER = [
  { id: 1, judul: 'Kejurnas FORBASI 2026 Segera Digelar', ringkasan: 'Kompetisi baris-berbaris tingkat nasional akan diselenggarakan di Semarang, Jawa Tengah pada April 2026.', tanggal: '10 Mar 2026', kategori: 'Kompetisi', icon: 'fa-trophy' },
  { id: 2, judul: 'Pendaftaran Lisensi Pelatih & Juri Dibuka', ringkasan: 'PB FORBASI membuka pendaftaran lisensi pelatih dan juri untuk periode 2026. Daftar sekarang!', tanggal: '5 Mar 2026', kategori: 'Lisensi', icon: 'fa-certificate' },
  { id: 3, judul: 'Rakor Pengda Se-Indonesia', ringkasan: 'Rapat koordinasi seluruh Pengda FORBASI untuk membahas program kerja tahun 2026.', tanggal: '28 Feb 2026', kategori: 'Organisasi', icon: 'fa-handshake' },
  { id: 4, judul: 'Workshop Perjurian Nasional', ringkasan: 'Workshop peningkatan kompetensi juri baris-berbaris diselenggarakan secara hybrid.', tanggal: '20 Feb 2026', kategori: 'Pelatihan', icon: 'fa-graduation-cap' },
];

const MARKETPLACE_ITEMS = [
  { nama: 'Kemeja Resmi FORBASI', harga: 'Rp 150.000', icon: 'fa-shirt', warna: 'from-emerald-500 to-teal-600' },
  { nama: 'Jersey Latihan FORBASI', harga: 'Rp 170.000', icon: 'fa-vest-patches', warna: 'from-blue-500 to-indigo-600' },
  { nama: 'Topi Official FORBASI', harga: 'Rp 75.000', icon: 'fa-hat-cowboy', warna: 'from-amber-500 to-orange-600' },
  { nama: 'Jaket Bomber FORBASI', harga: 'Rp 250.000', icon: 'fa-jacket', warna: 'from-violet-500 to-purple-600' },
];

/* ═══════════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════════════ */
export default function Homepage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id) => {
    setMobileNav(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ── Data: members ── */
  const [allClubs, setAllClubs] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const membersRef = useRef(null);
  const membersInView = useInView(membersRef);
  const memberCountAnim = useCountUp(totalMembers, membersInView);

  /* ── Data: visitors ── */
  const [visitors, setVisitors] = useState(null);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef);
  const visitorAnim = useCountUp(visitors?.totals?.total_visits || 0, statsInView);
  const uniqueAnim = useCountUp(visitors?.totals?.total_unique_visitors || 0, statsInView);

  /* ── Katalog tab ── */
  const [katalogTab, setKatalogTab] = useState('juri');

  /* ── Boot ── */
  useEffect(() => {
    (async () => {
      try { await api.post('/config/track-visitor'); } catch {}
      try {
        const r = await api.get('/public/clubs', { params: { page: 1, limit: 500 } });
        setAllClubs(r.data.data?.clubs || []);
        setTotalMembers(r.data.data?.total || 0);
      } catch {}
      try {
        const r = await api.get('/public/visitor-stats');
        setVisitors(r.data.data);
      } catch {}
    })();
  }, []);

  /* ── Member filtering ── */
  const filteredClubs = allClubs.filter(c =>
    !memberSearch ||
    c.club_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    c.coach_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    c.club_address?.toLowerCase().includes(memberSearch.toLowerCase())
  );
  const memberTotalPages = Math.max(1, Math.ceil(filteredClubs.length / MEMBERS_PER_PAGE));
  const memberSlice = filteredClubs.slice((memberPage - 1) * MEMBERS_PER_PAGE, memberPage * MEMBERS_PER_PAGE);

  /* ─── Render ──────────────────────────────────────────── */
  return (
    <div className="hp-root">

      {/* ════ NAVBAR ════ */}
      <nav className={`hp-navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="hp-nav">
          <button className="hp-brand" onClick={() => scrollTo('hero')}>
            <img src="/logo-forbasi.png" alt="FORBASI" />
            <span className="hp-brand-text">FORBASI</span>
          </button>
          <div className="hp-nav-links">
            {NAV_ITEMS.map(([id, label, icon]) => (
              <button key={id} className="hp-nav-link" onClick={() => scrollTo(id)}>
                <i className={`fas ${icon}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="hp-nav-actions">
            <Link to="/login" className="hp-login-btn">
              <i className="fas fa-sign-in-alt" /> Masuk
            </Link>
            <button className="hp-mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>
              <i className={`fas ${mobileNav ? 'fa-times' : 'fa-bars'}`} />
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        {mobileNav && (
          <div className="hp-mobile-nav">
            {NAV_ITEMS.map(([id, label, icon]) => (
              <button key={id} onClick={() => scrollTo(id)}>
                <i className={`fas ${icon}`} /> {label}
              </button>
            ))}
            <Link to="/login" className="hp-mobile-login" onClick={() => setMobileNav(false)}>
              <i className="fas fa-sign-in-alt" /> Masuk
            </Link>
          </div>
        )}
      </nav>

      {/* ════ HERO ════ */}
      <section id="hero" className="hp-hero">
        <div className="hp-hero-bg">
          <video autoPlay loop muted playsInline poster="/logo-forbasi.png">
            <source src="/forbasi.mp4" type="video/mp4" />
          </video>
          <div className="hp-hero-overlay" />
        </div>
        <div className="hp-hero-content">
          <div className="hp-hero-badge">
            <i className="fas fa-star" /> Forum Baris Indonesia
          </div>
          <h1 className="hp-hero-title">
            PB <span>FORBASI</span>
          </h1>
          <p className="hp-hero-subtitle">
            Federasi Olahraga Baris Berbaris Seluruh Indonesia
          </p>
          <p className="hp-hero-desc">
            Membina, mengembangkan, dan memasyarakatkan olahraga baris-berbaris untuk membentuk generasi muda yang disiplin, tangguh, dan berkarakter.
          </p>
          <div className="hp-hero-btns">
            <Link to="/register" className="hp-btn-primary">
              <i className="fas fa-user-plus" /> Daftar Anggota
            </Link>
            <button className="hp-btn-glass" onClick={() => scrollTo('about')}>
              <i className="fas fa-arrow-down" /> Selengkapnya
            </button>
          </div>
        </div>
        <div className="hp-hero-scroll">
          <div className="hp-mouse"><div className="hp-scroller" /></div>
        </div>
      </section>

      {/* ════ STATS BAR ════ */}
      <section className="hp-stats-bar" ref={statsRef}>
        <div className="hp-container">
          <div className="hp-stats-grid">
            {[
              { icon: 'fa-users', val: memberCountAnim, label: 'Anggota Resmi', suffix: '+' },
              { icon: 'fa-eye', val: visitorAnim, label: 'Total Kunjungan', suffix: '' },
              { icon: 'fa-map-marked-alt', val: 34, label: 'Provinsi', suffix: '' },
              { icon: 'fa-calendar-check', val: 2025, label: 'Sejak Tahun', suffix: '' },
            ].map(s => (
              <div key={s.label} className="hp-stat-card">
                <i className={`fas ${s.icon}`} />
                <div className="hp-stat-val">{typeof s.val === 'number' ? s.val.toLocaleString('id-ID') : s.val}{s.suffix}</div>
                <div className="hp-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ TENTANG KAMI ════ */}
      <section id="about" className="hp-section hp-section-dark">
        <div className="hp-container">
          <div className="hp-section-head">
            <span className="hp-tag">Tentang Kami</span>
            <h2>Forum Baris Indonesia</h2>
            <p>Mengenal lebih dekat organisasi yang membina baris-berbaris di Indonesia</p>
          </div>
          <div className="hp-about-grid">
            <div className="hp-about-text-col">
              <div className="hp-glass-card">
                <div className="hp-about-icon-row">
                  <div className="hp-about-icon"><i className="fas fa-bullseye" /></div>
                  <h3>Visi</h3>
                </div>
                <p>Menjadi federasi olahraga baris-berbaris yang profesional, mandiri, dan berdaya saing di tingkat nasional maupun internasional.</p>
              </div>
              <div className="hp-glass-card">
                <div className="hp-about-icon-row">
                  <div className="hp-about-icon"><i className="fas fa-rocket" /></div>
                  <h3>Misi</h3>
                </div>
                <ul className="hp-mission-list">
                  <li>Membina dan mengembangkan olahraga baris-berbaris di seluruh Indonesia</li>
                  <li>Menyelenggarakan kompetisi berkualitas dari daerah hingga nasional</li>
                  <li>Meningkatkan kualitas pelatih dan juri melalui program sertifikasi</li>
                  <li>Membangun jaringan keanggotaan yang solid dan profesional</li>
                </ul>
              </div>
            </div>
            <div className="hp-about-visual">
              <div className="hp-about-logo-wrap">
                <img src="/logo-forbasi.png" alt="FORBASI" />
              </div>
              <div className="hp-about-badges">
                <div className="hp-about-badge-item">
                  <i className="fas fa-shield-alt" />
                  <span>Anggota KORMI</span>
                </div>
                <div className="hp-about-badge-item">
                  <i className="fas fa-globe-asia" />
                  <span>Seluruh Indonesia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ STRUKTUR ORGANISASI ════ */}
      <section id="struktur" className="hp-section hp-section-light">
        <div className="hp-container">
          <div className="hp-section-head dark-text">
            <span className="hp-tag green">Struktur Organisasi</span>
            <h2>Pengurus PB FORBASI</h2>
            <p>Susunan pengurus Pengurus Besar FORBASI periode aktif</p>
          </div>
          <div className="hp-struktur-grid">
            {STRUKTUR_DATA.map((s, i) => (
              <div key={i} className={`hp-struktur-card${i === 0 ? ' primary' : ''}`}>
                <div className="hp-struktur-icon">
                  <i className={`fas ${s.icon}`} />
                </div>
                <h4>{s.jabatan}</h4>
                <p>{s.nama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ KATALOG JURI & PELATIH ════ */}
      <section id="katalog" className="hp-section hp-section-dark">
        <div className="hp-container">
          <div className="hp-section-head">
            <span className="hp-tag">Katalog Lisensi</span>
            <h2>Juri & Pelatih FORBASI</h2>
            <p>Jenjang lisensi dan persyaratan untuk menjadi juri atau pelatih baris-berbaris profesional</p>
          </div>

          {/* Tabs */}
          <div className="hp-katalog-tabs">
            <button className={`hp-ktab${katalogTab === 'juri' ? ' active' : ''}`} onClick={() => setKatalogTab('juri')}>
              <i className="fas fa-gavel" /> Katalog Juri
            </button>
            <button className={`hp-ktab${katalogTab === 'pelatih' ? ' active' : ''}`} onClick={() => setKatalogTab('pelatih')}>
              <i className="fas fa-chalkboard-teacher" /> Katalog Pelatih
            </button>
          </div>

          {/* Juri Cards */}
          {katalogTab === 'juri' && (
            <div className="hp-katalog-grid">
              {KATALOG_JURI.map((k, i) => (
                <div key={i} className={`hp-katalog-card ${k.warna}`}>
                  <div className="hp-katalog-level">
                    <div className="hp-katalog-badge">{k.warna === 'emerald' ? 'C' : k.warna === 'blue' ? 'B' : 'A'}</div>
                    <h3>{k.level}</h3>
                  </div>
                  <ul>
                    {k.syarat.map((s, j) => (
                      <li key={j}><i className="fas fa-check-circle" /> {s}</li>
                    ))}
                  </ul>
                  <div className="hp-katalog-price">
                    <span className="hp-katalog-price-label">Biaya Lisensi</span>
                    <span className="hp-katalog-price-val">Rp 2.000.000 <small>(tanpa kamar)</small></span>
                    <span className="hp-katalog-price-val secondary">Rp 2.250.000 <small>(dengan kamar)</small></span>
                  </div>
                  <Link to="/register-license" className={`hp-katalog-btn ${k.warna}`}>
                    <i className="fas fa-user-plus" /> Daftar Lisensi
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pelatih Cards */}
          {katalogTab === 'pelatih' && (
            <div className="hp-katalog-grid">
              {KATALOG_PELATIH.map((k, i) => (
                <div key={i} className={`hp-katalog-card ${k.warna}`}>
                  <div className="hp-katalog-level">
                    <div className="hp-katalog-badge">{k.warna === 'emerald' ? 'C' : k.warna === 'blue' ? 'B' : 'A'}</div>
                    <h3>{k.level}</h3>
                  </div>
                  <ul>
                    {k.syarat.map((s, j) => (
                      <li key={j}><i className="fas fa-check-circle" /> {s}</li>
                    ))}
                  </ul>
                  <div className="hp-katalog-price">
                    <span className="hp-katalog-price-label">Biaya Lisensi</span>
                    <span className="hp-katalog-price-val">Rp 750.000 <small>(tanpa kamar)</small></span>
                    <span className="hp-katalog-price-val secondary">Rp 1.000.000 <small>(dengan kamar)</small></span>
                  </div>
                  <Link to="/register-license" className={`hp-katalog-btn ${k.warna}`}>
                    <i className="fas fa-user-plus" /> Daftar Lisensi
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════ ANGGOTA AKTIF ════ */}
      <section id="members" className="hp-section hp-section-light" ref={membersRef}>
        <div className="hp-container">
          <div className="hp-section-head dark-text">
            <span className="hp-tag green">Anggota Aktif</span>
            <h2>Klub Anggota Resmi FORBASI</h2>
            <p>Daftar klub yang telah menjadi anggota resmi dengan KTA terbit</p>
          </div>

          {/* Counter + Search */}
          <div className="hp-members-toolbar">
            <div className="hp-member-count">
              <i className="fas fa-id-card" />
              <span><strong>{memberCountAnim.toLocaleString('id-ID')}</strong> Anggota Aktif</span>
            </div>
            <div className="hp-member-search">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Cari nama klub, pelatih..."
                value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setMemberPage(1); }}
              />
              {memberSearch && (
                <button onClick={() => { setMemberSearch(''); setMemberPage(1); }}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>

          {memberSearch && (
            <p className="hp-search-info">Ditemukan <strong>{filteredClubs.length}</strong> anggota untuk &quot;{memberSearch}&quot;</p>
          )}

          {/* Members Grid */}
          {filteredClubs.length === 0 ? (
            <div className="hp-empty">
              <i className="fas fa-users-slash" />
              <p>Belum ada anggota resmi yang terdaftar</p>
            </div>
          ) : (
            <div className="hp-members-grid">
              {memberSlice.map(club => (
                <div key={club.id} className="hp-member-card">
                  <div className="hp-member-avatar">
                    {club.logo_path ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${club.logo_path}`}
                        alt={club.club_name}
                        onError={e => { e.target.src = '/logo-forbasi.png'; }}
                      />
                    ) : (
                      <span>{(club.club_name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="hp-member-info">
                    <h4>{club.club_name}</h4>
                    {club.club_address && <p className="hp-member-addr"><i className="fas fa-map-marker-alt" /> {club.club_address}</p>}
                    <div className="hp-member-meta">
                      <span><i className="fas fa-user-tie" /> {club.coach_name || '-'}</span>
                      <span><i className="fas fa-user-shield" /> {club.manager_name || '-'}</span>
                    </div>
                  </div>
                  <div className="hp-member-badge-wrap">
                    <span className="hp-kta-badge"><i className="fas fa-check-circle" /> KTA Terbit</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {memberTotalPages > 1 && (
            <div className="hp-pagination">
              <button onClick={() => setMemberPage(p => Math.max(1, p - 1))} disabled={memberPage <= 1}>
                <i className="fas fa-chevron-left" />
              </button>
              <span className="hp-page-info">
                {memberPage} / {memberTotalPages}
              </span>
              <button onClick={() => setMemberPage(p => Math.min(memberTotalPages, p + 1))} disabled={memberPage >= memberTotalPages}>
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ════ BERITA ════ */}
      <section id="berita" className="hp-section hp-section-dark">
        <div className="hp-container">
          <div className="hp-section-head">
            <span className="hp-tag">Informasi Terkini</span>
            <h2>Berita & Pengumuman</h2>
            <p>Ikuti perkembangan terbaru dari PB FORBASI</p>
          </div>
          <div className="hp-berita-grid">
            {BERITA_PLACEHOLDER.map(b => (
              <article key={b.id} className="hp-berita-card">
                <div className="hp-berita-icon-wrap">
                  <i className={`fas ${b.icon}`} />
                </div>
                <div className="hp-berita-body">
                  <div className="hp-berita-meta">
                    <span className="hp-berita-cat">{b.kategori}</span>
                    <span className="hp-berita-date"><i className="fas fa-calendar" /> {b.tanggal}</span>
                  </div>
                  <h3>{b.judul}</h3>
                  <p>{b.ringkasan}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════ MARKETPLACE ════ */}
      <section id="marketplace" className="hp-section hp-section-light">
        <div className="hp-container">
          <div className="hp-section-head dark-text">
            <span className="hp-tag green">Marketplace</span>
            <h2>Merchandise Resmi FORBASI</h2>
            <p>Dapatkan merchandise resmi untuk mendukung kegiatan baris-berbaris</p>
          </div>
          <div className="hp-market-grid">
            {MARKETPLACE_ITEMS.map((item, i) => (
              <div key={i} className="hp-market-card">
                <div className={`hp-market-icon bg-gradient-to-br ${item.warna}`}>
                  <i className={`fas ${item.icon}`} />
                </div>
                <h4>{item.nama}</h4>
                <div className="hp-market-price">{item.harga}</div>
                <button className="hp-market-btn">
                  <i className="fas fa-shopping-cart" /> Beli Sekarang
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="hp-cta">
        <div className="hp-container">
          <div className="hp-cta-inner">
            <h2>Bergabung Bersama FORBASI</h2>
            <p>Jadilah bagian dari komunitas baris-berbaris terbesar di Indonesia</p>
            <div className="hp-cta-btns">
              <Link to="/register" className="hp-btn-primary">
                <i className="fas fa-user-plus" /> Daftar Anggota
              </Link>
              <Link to="/register-license" className="hp-btn-glass">
                <i className="fas fa-certificate" /> Daftar Lisensi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="hp-footer">
        <div className="hp-container">
          <div className="hp-footer-grid">
            <div className="hp-footer-brand">
              <img src="/logo-forbasi.png" alt="FORBASI" />
              <p>Federasi Olahraga Baris Berbaris Seluruh Indonesia</p>
              <p className="hp-footer-small">Membina dan mengembangkan baris-berbaris di seluruh Indonesia sejak 2025.</p>
            </div>
            <div className="hp-footer-col">
              <h4>Navigasi</h4>
              <ul>
                {NAV_ITEMS.map(([id, label]) => (
                  <li key={id}><button onClick={() => scrollTo(id)}>{label}</button></li>
                ))}
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Layanan</h4>
              <ul>
                <li><Link to="/register">Pendaftaran Anggota</Link></li>
                <li><Link to="/register-license">Lisensi Pelatih</Link></li>
                <li><Link to="/register-license">Lisensi Juri</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Kontak</h4>
              <ul className="hp-footer-contact">
                <li><i className="fas fa-envelope" /> info@forbasi.or.id</li>
                <li><i className="fas fa-phone" /> (021) xxxx-xxxx</li>
                <li><i className="fas fa-map-marker-alt" /> Jakarta, Indonesia</li>
              </ul>
              <div className="hp-footer-socials">
                <a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a>
                <a href="#" aria-label="YouTube"><i className="fab fa-youtube" /></a>
                <a href="#" aria-label="Facebook"><i className="fab fa-facebook" /></a>
              </div>
            </div>
          </div>
        </div>
        <div className="hp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} PB FORBASI — Forum Baris Indonesia. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
