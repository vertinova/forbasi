import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Homepage.css';

/* ─── Animated counter hook ─── */
function useCountUp(target, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    if (!target) return;
    let n = 0;
    const step = Math.max(1, target / 120);
    const t = setInterval(() => {
      n += step;
      if (n >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(n));
    }, 16);
    return () => clearInterval(t);
  }, [target, active]);
  return val;
}

/* helper: base URL for uploaded files */
const uploadsBase = () => (import.meta.env.VITE_API_URL?.replace('/api', '') || '') + '/uploads/';

/* ─── Section definitions ─── */
const SECTIONS = [
  { id: 'hero', label: 'Beranda', icon: 'fa-home' },
  { id: 'video', label: 'Video', icon: 'fa-play-circle' },
  { id: 'about', label: 'Tentang Kami', icon: 'fa-info-circle' },
  { id: 'katalog-juri', label: 'Katalog Juri', icon: 'fa-gavel' },
  { id: 'katalog-pelatih', label: 'Katalog Pelatih', icon: 'fa-chalkboard-teacher' },
  { id: 'members', label: 'Anggota Aktif', icon: 'fa-users' },
  { id: 'events', label: 'Event', icon: 'fa-calendar-alt' },
  { id: 'gallery', label: 'Galeri', icon: 'fa-images' },
  { id: 'berita', label: 'Berita', icon: 'fa-newspaper' },
  { id: 'marketplace', label: 'Marketplace', icon: 'fa-store' },
];
const TOTAL = SECTIONS.length;
const MEMBERS_PER_PAGE = 6;

/* ═══════════════════════════════════════════════════════════
   Homepage — Fullpage Fade Transitions
════════════════════════════════════════════════════════════ */
export default function Homepage() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);

  /* Track which sections have been visited (for deferred loading) */
  const visited = useRef(new Set([0]));

  /* ── Data states ── */
  const [allClubs, setAllClubs] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [approvedJuri, setApprovedJuri] = useState([]);
  const [approvedPelatih, setApprovedPelatih] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);

  /* ── Landing page data from API ── */
  const [liveEvents, setLiveEvents] = useState([]);
  const [liveGallery, setLiveGallery] = useState([]);
  const [liveBerita, setLiveBerita] = useState([]);
  const [liveMarketplace, setLiveMarketplace] = useState([]);
  const [liveBanners, setLiveBanners] = useState([]);

  /* ── Track which data has been fetched ── */
  const fetched = useRef({ hero: false, katalog: false, landing: false, clubs: false });

  /* ── Counters ── */
  const memberCount = useCountUp(totalMembers, active === 0);

  /* ── Navigate between slides ── */
  const go = useCallback((idx) => {
    if (animating || idx === active || idx < 0 || idx >= TOTAL) return;
    setAnimating(true);
    setActive(idx);
    setMobileNav(false);
    visited.current.add(idx);
    // Also mark neighbors as visited for preloading
    if (idx > 0) visited.current.add(idx - 1);
    if (idx < TOTAL - 1) visited.current.add(idx + 1);
    setTimeout(() => setAnimating(false), 900);
  }, [active, animating]);

  /* ── Wheel navigation ── */
  useEffect(() => {
    let cooldown = false;
    const onWheel = (e) => {
      const el = e.target.closest('[data-scroll]');
      if (el && el.scrollHeight > el.clientHeight) {
        const atTop = el.scrollTop <= 0;
        const atBot = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBot)) return;
      }
      e.preventDefault();
      if (cooldown) return;
      cooldown = true;
      setTimeout(() => (cooldown = false), 1100);
      go(active + (e.deltaY > 0 ? 1 : -1));
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [active, go]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); go(active + 1); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(active - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go]);

  /* ── Touch/swipe ── */
  useEffect(() => {
    let y0 = 0;
    const onStart = (e) => { y0 = e.touches[0].clientY; };
    const onEnd = (e) => {
      const dy = y0 - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 60) go(active + (dy > 0 ? 1 : -1));
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, [active, go]);

  /* ── Fetch data — deferred by section proximity ── */
  // Hero data (member count) + banners — load immediately (hero visible first)
  useEffect(() => {
    if (fetched.current.hero) return;
    fetched.current.hero = true;
    (async () => {
      try { await api.post('/config/track-visitor'); } catch {}
      try {
        const r = await api.get('/public/clubs', { params: { page: 1, limit: 1 } });
        setTotalMembers(r.data.data?.total || 0);
      } catch {}
      try {
        const r = await api.get('/landing/public');
        if (r.data.success) {
          const d = r.data.data;
          setLiveEvents((d.events || []).map(e => ({ ...e, banner: e.banner ? `${uploadsBase()}landing/${e.banner}` : null })));
          setLiveGallery((d.gallery || []).map(g => ({ ...g, src: g.src ? `${uploadsBase()}landing/${g.src}` : g.src })));
          setLiveBerita(d.berita || []);
          setLiveMarketplace((d.marketplace || []).map(m => ({ ...m, img: m.img ? `${uploadsBase()}landing/${m.img}` : null })));
          setLiveBanners((d.banners || []).map(b => ({ ...b, img: b.img ? `${uploadsBase()}landing/${b.img}` : null, section: b.section_index })));
        }
      } catch {}
    })();
  }, []);

  // Katalog juri/pelatih — load when approaching section 3/4
  useEffect(() => {
    if (fetched.current.katalog) return;
    if (active < 2) return; // defer until section 2+
    fetched.current.katalog = true;
    (async () => {
      try {
        const r = await api.get('/public/licensed-members', { params: { type: 'juri' } });
        setApprovedJuri(r.data.data || []);
      } catch {}
      try {
        const r = await api.get('/public/licensed-members', { params: { type: 'pelatih' } });
        setApprovedPelatih(r.data.data || []);
      } catch {}
    })();
  }, [active]);

  // Clubs list — load when approaching section 5 (members)
  useEffect(() => {
    if (fetched.current.clubs) return;
    if (active < 4) return; // defer until section 4+
    fetched.current.clubs = true;
    (async () => {
      try {
        const r = await api.get('/public/clubs', { params: { page: 1, limit: 500 } });
        setAllClubs(r.data.data?.clubs || []);
      } catch {}
    })();
  }, [active]);

  /* ── Member filtering ── */
  const filteredClubs = allClubs.filter(c =>
    !memberSearch ||
    c.club_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    c.coach_name?.toLowerCase().includes(memberSearch.toLowerCase())
  );
  const memberTotalPages = Math.max(1, Math.ceil(filteredClubs.length / MEMBERS_PER_PAGE));
  const memberSlice = filteredClubs.slice((memberPage - 1) * MEMBERS_PER_PAGE, memberPage * MEMBERS_PER_PAGE);

  /* helper to get jenis label */
  const jenisLabel = (j) => j === 'juri_muda' ? 'Juri Muda' : j === 'juri_madya' ? 'Juri Madya' : 'Pelatih';

  /* ── Drag-to-scroll for gallery row ── */
  const galleryRowRef = useRef(null);
  const galDrag = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const handleGalleryMouseDown = (e) => {
    const el = galleryRowRef.current;
    galDrag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
  };
  const handleGalleryMouseMove = (e) => {
    if (!galDrag.current.active) return;
    e.preventDefault();
    const el = galleryRowRef.current;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = galDrag.current.scrollLeft - (x - galDrag.current.startX);
  };
  const handleGalleryMouseUp = () => { galDrag.current.active = false; };

  /* ── Infinite cycle scroll (gallery only) ── */
  const initCycleRow = useCallback((el) => {
    if (!el || el.dataset.cycleInit) return;
    el.dataset.cycleInit = '1';
    const items = [...el.children];
    items.forEach(c => { const clone = c.cloneNode(true); el.appendChild(clone); });
    items.forEach(c => { const clone = c.cloneNode(true); el.appendChild(clone); });
    const oneSetWidth = items.reduce((s, c) => s + c.offsetWidth + 14, 0);
    el.scrollLeft = oneSetWidth;
    const checkBounds = () => {
      if (el.scrollLeft >= oneSetWidth * 2) el.scrollLeft -= oneSetWidth;
      if (el.scrollLeft <= 0) el.scrollLeft += oneSetWidth;
    };
    el.addEventListener('scroll', checkBounds);
  }, []);

  useEffect(() => {
    initCycleRow(galleryRowRef.current);
  }, [initCycleRow]);

  const scrollRow = (ref, dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector(':scope > *');
    const cardW = card ? card.offsetWidth + 14 : 300;
    el.scrollBy({ left: dir * cardW, behavior: 'smooth' });
  };

  /* ── Events coverflow carousel ── */
  const [evIdx, setEvIdx] = useState(0);
  const [evModal, setEvModal] = useState(null);
  const evLen = liveEvents.length || 1;
  const evAutoRef = useRef(null);
  const evNext = () => setEvIdx(i => (i + 1) % evLen);
  const evPrev = () => setEvIdx(i => (i - 1 + evLen) % evLen);
  const evStopAuto = () => { if (evAutoRef.current) { clearInterval(evAutoRef.current); evAutoRef.current = null; } };

  useEffect(() => {
    if (evLen <= 1) return;
    evAutoRef.current = setInterval(evNext, 4000);
    return () => evStopAuto();
  }, [evLen]);

  /* ── Auto-scroll gallery every 3s, pause on hover ── */
  useEffect(() => {
    const id = setInterval(() => setBannerIdx(i => (i + 1) % (liveBanners.length || 1)), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = galleryRowRef.current;
    if (!el) return;
    let id = setInterval(() => scrollRow(galleryRowRef, 1), 3000);
    const pause = () => clearInterval(id);
    const resume = () => { id = setInterval(() => scrollRow(galleryRowRef, 1), 3000); };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resume);
    return () => clearInterval(id);
  }, []);

  /* ═══════════════════ RENDER ═══════════════════ */

  /* Only mount sections within ±1 of active, or previously visited */
  const shouldRender = (idx) => Math.abs(active - idx) <= 1 || visited.current.has(idx);

  return (
    <div className="fp-root">

      {/* ── Side navigation with text labels ── */}
      <nav className="fp-nav-side" aria-label="Section navigation">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            className={`fp-nav-item${i === active ? ' active' : ''}`}
            onClick={() => go(i)}
            title={s.label}
          >
            <span className="fp-nav-icon"><i className={`fas ${s.icon}`} /></span>
            <span className="fp-nav-text">{s.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Progress bar ── */}
      <div className="fp-progress">
        <div className="fp-progress-fill" style={{ height: `${((active + 1) / TOTAL) * 100}%` }} />
      </div>

      {/* ── Top header ── */}
      <header className="fp-header">
        <button className="fp-brand" onClick={() => go(0)}>
          <img src="/logo-forbasi.png" alt="FORBASI" />
          <span>FORBASI</span>
        </button>
        {liveBanners.length > 0 && (
        <div className="fp-header-center">
          <div className="fp-info-banner">
            {liveBanners.map((b, i) => {
              const bannerContent = (
                <div key={b.id} className={`fp-info-slide${i === bannerIdx ? ' active' : ''}`}>
                  <img src={b.img} alt="" />
                  <span>{b.text}</span>
                  <i className="fas fa-chevron-right fp-info-arrow" />
                </div>
              );
              if (!b.link && b.section != null) {
                return <button key={b.id} className="fp-info-slide-btn" onClick={() => go(b.section)}>{bannerContent}</button>;
              }
              if (b.link) {
                return <Link key={b.id} to={b.link} className="fp-info-slide-btn">{bannerContent}</Link>;
              }
              return bannerContent;
            })}
          </div>
        </div>
        )}
        <div className="fp-header-right">
          <Link to="/login" className="fp-btn-login"><i className="fas fa-sign-in-alt" /> Masuk</Link>
          <button className="fp-mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>
            <i className={`fas ${mobileNav ? 'fa-times' : 'fa-bars'}`} />
          </button>
        </div>
      </header>

      {/* ── Mobile nav ── */}
      {mobileNav && (
        <div className="fp-mobile-nav">
          {SECTIONS.map((s, i) => (
            <button key={s.id} className={i === active ? 'active' : ''} onClick={() => go(i)}>
              <i className={`fas ${s.icon}`} /> {s.label}
            </button>
          ))}
          <Link to="/login" onClick={() => setMobileNav(false)}><i className="fas fa-sign-in-alt" /> Masuk</Link>
        </div>
      )}

      {/* ── Counter ── */}
      <div className="fp-counter">
        <span className="fp-counter-num">{String(active + 1).padStart(2, '0')}</span>
        <span className="fp-counter-sep" />
        <span className="fp-counter-total">{String(TOTAL).padStart(2, '0')}</span>
      </div>

      {/* ── Up/Down arrows (hidden) ── */}
      {/* <div className="fp-arrows">
        <button onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous">
          <i className="fas fa-chevron-up" />
        </button>
        <button onClick={() => go(active + 1)} disabled={active === TOTAL - 1} aria-label="Next">
          <i className="fas fa-chevron-down" />
        </button>
      </div> */}

      {/* ═══════════ SLIDES — FADE TRANSITIONS ═══════════ */}
      <div className="fp-stage">

        {/* ════ 0 — HERO ════ */}
        <section className={`fp-slide fp-hero${active === 0 ? ' active' : ''}`}>
          <div className="fp-hero-bg">
            <div className="fp-hero-gradient" />
            <div className="fp-hero-grid" />
            <div className="fp-hero-glow-line fp-hero-glow-line-1" />
            <div className="fp-hero-glow-line fp-hero-glow-line-2" />
            <div className="fp-hero-orb fp-hero-orb-1" />
            <div className="fp-hero-orb fp-hero-orb-2" />
            <div className="fp-hero-orb fp-hero-orb-3" />
          </div>
          <div className="fp-hero-content">
            <h1 className="fp-anim" style={{ '--d': '0.2s' }}>
              <span className="fp-hero-pb">PENGURUS BESAR</span>
              <span className="fp-hero-forbasi">FORBASI</span>
            </h1>
            <p className="fp-anim fp-hero-tagline" style={{ '--d': '0.4s' }}>
              Forum Baris Indonesia
            </p>
            <p className="fp-anim fp-hero-desc" style={{ '--d': '0.5s' }}>
              Membina, mengembangkan, dan memasyarakatkan olahraga baris-berbaris<br className="fp-hide-mobile" />untuk membentuk generasi muda yang disiplin, tangguh, dan berkarakter.
            </p>
            <div className="fp-anim fp-hero-actions" style={{ '--d': '0.6s' }}>
              <button className="fp-btn-glass" onClick={() => go(1)}><i className="fas fa-play-circle" /> Tonton Video</button>
            </div>
            <div className="fp-anim fp-hero-divider" style={{ '--d': '0.68s' }} />
            <div className="fp-anim fp-hero-stats" style={{ '--d': '0.75s' }}>
              <div className="fp-hero-stat">
                <div className="fp-stat-icon"><i className="fas fa-id-card" /></div>
                <div className="fp-stat-info">
                  <strong>{memberCount > 0 ? memberCount.toLocaleString('id-ID') : '—'}+</strong>
                  <span>Anggota Resmi</span>
                </div>
              </div>
              <div className="fp-hero-stat-sep" />
              <div className="fp-hero-stat">
                <div className="fp-stat-icon"><i className="fas fa-map-marked-alt" /></div>
                <div className="fp-stat-info">
                  <strong>34</strong>
                  <span>Provinsi</span>
                </div>
              </div>
              <div className="fp-hero-stat-sep" />
              <div className="fp-hero-stat">
                <div className="fp-stat-icon"><i className="fas fa-trophy" /></div>
                <div className="fp-stat-info">
                  <strong>2025</strong>
                  <span>Berdiri</span>
                </div>
              </div>
            </div>
          </div>
          <div className="fp-scroll-hint">
            <div className="fp-mouse"><div className="fp-scroller" /></div>
          </div>
        </section>

        {/* ════ 1 — VIDEO ════ */}
        {shouldRender(1) && (
        <section className={`fp-slide fp-video-section${active === 1 ? ' active' : ''}`}>
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag">Profil FORBASI</span>
              <h2>Video Profil Organisasi</h2>
              <p>Kenali lebih dekat FORBASI melalui video profil resmi kami</p>
            </div>
            <div className="fp-anim fp-video-wrap" style={{ '--d': '0.3s' }}>
              <video
                controls
                playsInline
                poster="/logo-forbasi.png"
                preload="none"
                className="fp-video-player"
              >
                <source src="/forbasi.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>
        )}

        {/* ════ 2 — TENTANG KAMI ════ */}
        {shouldRender(2) && (
        <section className={`fp-slide fp-about${active === 2 ? ' active' : ''}`}>
          <div className="fp-deco fp-deco-circle" />
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag">Tentang Kami</span>
              <h2>Forum Baris Indonesia</h2>
              <p>Mengenal lebih dekat organisasi yang membina baris-berbaris di Indonesia</p>
            </div>
            <div className="fp-about-content">
              <div className="fp-about-cards">
                <div className="fp-anim fp-glass-card" style={{ '--d': '0.25s' }}>
                  <div className="fp-card-icon"><i className="fas fa-bullseye" /></div>
                  <h3>Visi</h3>
                  <p>Menjadi Forum Baris Indonesia yang profesional, mandiri, dan berdaya saing di tingkat nasional maupun internasional.</p>
                </div>
                <div className="fp-anim fp-glass-card" style={{ '--d': '0.4s' }}>
                  <div className="fp-card-icon"><i className="fas fa-rocket" /></div>
                  <h3>Misi</h3>
                  <ul>
                    <li>Membina dan mengembangkan olahraga baris-berbaris di seluruh Indonesia</li>
                    <li>Menyelenggarakan kompetisi berkualitas dari daerah hingga nasional</li>
                    <li>Meningkatkan kualitas pelatih dan juri melalui program sertifikasi</li>
                    <li>Membangun jaringan keanggotaan yang solid dan profesional</li>
                  </ul>
                </div>
              </div>
              <div className="fp-anim fp-about-visual" style={{ '--d': '0.5s' }}>
                <div className="fp-about-logo">
                  <img src="/logo-forbasi.png" alt="FORBASI" loading="lazy" />
                </div>
                <div className="fp-about-badges">
                  <span><i className="fas fa-shield-alt" /> Anggota KORMI</span>
                  <span><i className="fas fa-globe-asia" /> Seluruh Indonesia</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* ════ 3 — KATALOG JURI (approved) ════ */}
        {shouldRender(3) && (
        <section className={`fp-slide fp-katalog${active === 3 ? ' active' : ''}`}>
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag">Katalog Juri</span>
              <h2>Juri Berlisensi FORBASI</h2>
              <p>Juri yang telah disetujui dan berlisensi resmi oleh PB FORBASI</p>
            </div>
            {approvedJuri.length === 0 ? (
              <div className="fp-anim fp-empty" style={{ '--d': '0.3s' }}>
                <i className="fas fa-gavel" />
                <p>Belum ada data juri berlisensi</p>
              </div>
            ) : (
              <div className="fp-anim fp-person-grid" style={{ '--d': '0.3s' }} data-scroll>
                {approvedJuri.map((j) => (
                  <div key={j.id} className="fp-person-card">
                    <div className="fp-person-photo">
                      {j.pas_foto ? (
                        <img src={`${uploadsBase()}${j.pas_foto}`} alt={j.nama_lengkap} loading="lazy" onError={e => { e.target.src = '/logo-forbasi.png'; }} />
                      ) : (
                        <div className="fp-person-placeholder"><i className="fas fa-user" /></div>
                      )}
                    </div>
                    <h4>{j.nama_lengkap}</h4>
                    <span className="fp-person-type">{jenisLabel(j.jenis_lisensi)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        {/* ════ 6 — KATALOG PELATIH (approved) ════ */}
        {shouldRender(4) && (
        <section className={`fp-slide fp-katalog fp-katalog-pelatih${active === 4 ? ' active' : ''}`}>
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag green">Katalog Pelatih</span>
              <h2>Pelatih Berlisensi FORBASI</h2>
              <p>Pelatih yang telah disetujui dan berlisensi resmi oleh PB FORBASI</p>
            </div>
            {approvedPelatih.length === 0 ? (
              <div className="fp-anim fp-empty" style={{ '--d': '0.3s' }}>
                <i className="fas fa-chalkboard-teacher" />
                <p>Belum ada data pelatih berlisensi</p>
              </div>
            ) : (
              <div className="fp-anim fp-person-grid" style={{ '--d': '0.3s' }} data-scroll>
                {approvedPelatih.map((p) => (
                  <div key={p.id} className="fp-person-card">
                    <div className="fp-person-photo">
                      {p.pas_foto ? (
                        <img src={`${uploadsBase()}${p.pas_foto}`} alt={p.nama_lengkap} loading="lazy" onError={e => { e.target.src = '/logo-forbasi.png'; }} />
                      ) : (
                        <div className="fp-person-placeholder"><i className="fas fa-user" /></div>
                      )}
                    </div>
                    <h4>{p.nama_lengkap}</h4>
                    <span className="fp-person-type">Pelatih Berlisensi</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        {/* ════ 7 — ANGGOTA AKTIF ════ */}
        {shouldRender(5) && (
        <section className={`fp-slide fp-members${active === 5 ? ' active' : ''}`}>
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag">Anggota Aktif</span>
              <h2>Klub Anggota Resmi FORBASI</h2>
              <p>Daftar klub dengan KTA terbit tahun {new Date().getFullYear()}</p>
            </div>

            <div className="fp-anim fp-member-toolbar" style={{ '--d': '0.28s' }}>
              <div className="fp-member-search">
                <i className="fas fa-search" />
                <input
                  type="text"
                  placeholder="Cari nama klub, pelatih..."
                  value={memberSearch}
                  onChange={e => { setMemberSearch(e.target.value); setMemberPage(1); }}
                />
                {memberSearch && (
                  <button className="fp-search-clear" onClick={() => { setMemberSearch(''); setMemberPage(1); }}>
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              {memberSearch && <span className="fp-search-count">{filteredClubs.length} hasil</span>}
            </div>

            {filteredClubs.length === 0 ? (
              <div className="fp-anim fp-empty" style={{ '--d': '0.4s' }}>
                <i className="fas fa-users-slash" />
                <p>Belum ada anggota yang terdaftar</p>
              </div>
            ) : (
              <div className="fp-anim fp-member-grid" style={{ '--d': '0.35s' }}>
                {memberSlice.map(club => (
                  <div key={club.id} className="fp-member-card">
                    <div className="fp-member-logo">
                      {club.logo_path ? (
                        <img
                          src={`${uploadsBase()}${club.logo_path}`}
                          alt={club.club_name}
                          loading="lazy"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            const el = document.createElement('span');
                            el.className = 'fp-member-initial';
                            el.textContent = (club.club_name || '?')[0];
                            e.target.parentElement.appendChild(el);
                          }}
                        />
                      ) : (
                        <span className="fp-member-initial">{(club.club_name || '?')[0]}</span>
                      )}
                    </div>
                    <div className="fp-member-info">
                      <h4>{club.club_name}</h4>
                      {club.province_name && <p className="fp-member-addr"><i className="fas fa-map-marker-alt" /> {club.province_name}{club.city_name ? `, ${club.city_name}` : ''}</p>}
                      <div className="fp-member-meta">
                        <span><i className="fas fa-user-tie" /> {club.coach_name || '-'}</span>
                        <span><i className="fas fa-user-shield" /> {club.manager_name || '-'}</span>
                      </div>
                    </div>
                    <span className="fp-kta-badge"><i className="fas fa-check-circle" /> KTA Terbit</span>
                  </div>
                ))}
              </div>
            )}

            {memberTotalPages > 1 && (
              <div className="fp-anim fp-pagination" style={{ '--d': '0.45s' }}>
                <button onClick={() => setMemberPage(p => Math.max(1, p - 1))} disabled={memberPage <= 1}>
                  <i className="fas fa-chevron-left" />
                </button>
                <span>{memberPage} / {memberTotalPages}</span>
                <button onClick={() => setMemberPage(p => Math.min(memberTotalPages, p + 1))} disabled={memberPage >= memberTotalPages}>
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            )}
          </div>
        </section>
        )}

        {/* ════ 6 — KATALOG EVENT ════ */}
        {shouldRender(6) && (
        <section className={`fp-slide fp-events${active === 6 ? ' active' : ''}`}>
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag green">Agenda</span>
              <h2>Katalog Event</h2>
              <p>Jadwal kegiatan dan kompetisi resmi FORBASI</p>
            </div>
            {liveEvents.length > 0 ? (
            <div className="fp-anim fp-coverflow" style={{ '--d': '0.3s' }}>
              <button className="fp-cov-arrow fp-cov-arrow-left" onClick={() => { evStopAuto(); evPrev(); }} aria-label="Previous">
                <i className="fas fa-chevron-left" />
              </button>
              <div className="fp-cov-stage">
                {liveEvents.map((ev, i) => {
                  const offset = ((i - evIdx + evLen) % evLen);
                  const pos = offset <= Math.floor(evLen / 2) ? offset : offset - evLen;
                  return (
                    <article
                      key={ev.id}
                      className={`fp-cov-card fp-event-${ev.color}${pos === 0 ? ' fp-cov-active' : ''}`}
                      style={{ '--pos': pos }}
                      onClick={() => pos === 0 ? setEvModal(ev) : setEvIdx(i)}
                    >
                      <div className="fp-cov-img">
                        <img
                          src={ev.banner}
                          alt={ev.nama}
                          loading="lazy"
                          onError={e => { e.target.style.display = 'none'; e.target.parentElement.classList.add('no-img'); }}
                        />
                      </div>
                      <span className="fp-cov-badge"><i className="fas fa-clock" /> Upcoming</span>
                      <div className="fp-cov-info">
                        <h3>{ev.nama}</h3>
                        <div className="fp-cov-meta">
                          <span><i className="fas fa-calendar-alt" /> {ev.tanggal}</span>
                          <span><i className="fas fa-map-marker-alt" /> {ev.lokasi}</span>
                        </div>
                        <span className="fp-cov-hint">Klik untuk melihat</span>
                      </div>
                    </article>
                  );
                })}
              </div>
              <button className="fp-cov-arrow fp-cov-arrow-right" onClick={() => { evStopAuto(); evNext(); }} aria-label="Next">
                <i className="fas fa-chevron-right" />
              </button>
            </div>
            ) : (
              <div className="fp-anim fp-empty" style={{ '--d': '0.3s' }}>
                <i className="fas fa-calendar-alt" />
                <p>Belum ada event yang ditambahkan</p>
              </div>
            )}
          </div>
        </section>
        )}

        {/* ════ 7 — GALERI ════ */}
        {shouldRender(7) && (
        <section className={`fp-slide fp-gallery${active === 7 ? ' active' : ''}`}>
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag blue">Dokumentasi</span>
              <h2>Galeri Kegiatan</h2>
              <p>Momen-momen terbaik dari kegiatan FORBASI di seluruh Indonesia</p>
            </div>
            {liveGallery.length > 0 ? (
            <div className="fp-gallery-carousel">
              <button className="fp-gal-arrow fp-gal-arrow-left" onClick={() => scrollRow(galleryRowRef, -1)} aria-label="Geser kiri">
                <i className="fas fa-arrow-left" />
              </button>
              <div
                className="fp-gallery-track"
                ref={galleryRowRef}
                onMouseDown={handleGalleryMouseDown}
                onMouseMove={handleGalleryMouseMove}
                onMouseUp={handleGalleryMouseUp}
                onMouseLeave={handleGalleryMouseUp}
              >
                {liveGallery.map((img, i) => (
                  <div key={img.id} className={`fp-anim fp-gal-card${i % 3 === 1 ? ' fp-gal-card-tall' : ''}`} style={{ '--d': `${0.15 + i * 0.08}s` }}>
                    <img
                      src={img.src}
                      alt={img.caption}
                      loading="lazy"
                      onError={e => { e.target.style.display = 'none'; e.target.parentElement.classList.add('no-img'); }}
                    />
                    <div className="fp-gal-info">
                      <span className="fp-gal-badge">{img.kategori}</span>
                      <h4>{img.caption}</h4>
                    </div>
                    <div className="fp-gal-shine" />
                  </div>
                ))}
              </div>
              <button className="fp-gal-arrow fp-gal-arrow-right" onClick={() => scrollRow(galleryRowRef, 1)} aria-label="Geser kanan">
                <i className="fas fa-arrow-right" />
              </button>
            </div>
            ) : (
              <div className="fp-anim fp-empty" style={{ '--d': '0.3s' }}>
                <i className="fas fa-images" />
                <p>Belum ada foto di galeri</p>
              </div>
            )}
          </div>
        </section>
        )}

        {/* ════ 8 — BERITA ════ */}
        {shouldRender(8) && (
        <section className={`fp-slide fp-berita${active === 8 ? ' active' : ''}`}>
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag">Informasi Terkini</span>
              <h2>Berita &amp; Pengumuman</h2>
              <p>Ikuti perkembangan terbaru dari PB FORBASI</p>
            </div>
            {liveBerita.length > 0 ? (
            <div className="fp-berita-grid">
              {liveBerita.map((b, i) => (
                <article key={b.id} className="fp-anim fp-berita-card" style={{ '--d': `${0.25 + i * 0.1}s` }}>
                  <div className="fp-berita-icon"><i className={`fas ${b.icon}`} /></div>
                  <div className="fp-berita-body">
                    <div className="fp-berita-meta">
                      <span className="fp-berita-cat">{b.kategori}</span>
                      <span className="fp-berita-date"><i className="fas fa-calendar" /> {b.tanggal}</span>
                    </div>
                    <h3>{b.judul}</h3>
                    <p>{b.ringkasan}</p>
                    {b.link && (
                      <Link to={b.link} className="fp-berita-link">
                        <i className="fas fa-arrow-right" /> Daftar Sekarang
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
            ) : (
              <div className="fp-anim fp-empty" style={{ '--d': '0.3s' }}>
                <i className="fas fa-newspaper" />
                <p>Belum ada berita</p>
              </div>
            )}
          </div>
        </section>
        )}

        {/* ════ 9 — MARKETPLACE ════ */}
        {shouldRender(9) && (
        <section className={`fp-slide fp-market${active === 9 ? ' active' : ''}`}>
          <div className="fp-slide-inner">
            <div className="fp-anim fp-section-head" style={{ '--d': '0.15s' }}>
              <span className="fp-tag green">Marketplace</span>
              <h2>Merchandise Resmi FORBASI</h2>
              <p>Dapatkan merchandise resmi untuk mendukung kegiatan baris-berbaris</p>
            </div>
            {liveMarketplace.length > 0 ? (
            <div className="fp-market-grid">
              {liveMarketplace.map((item, i) => (
                <div key={i} className={`fp-anim fp-market-card ${item.warna}`} style={{ '--d': `${0.25 + i * 0.1}s` }}>
                  <div className="fp-market-img">
                    <img
                      src={item.img}
                      alt={item.nama}
                      loading="lazy"
                      onError={e => { e.target.style.display = 'none'; e.target.parentElement.classList.add('no-img'); }}
                    />
                  </div>
                  <h4>{item.nama}</h4>
                  <div className="fp-market-price">{item.harga}</div>
                  <button className="fp-market-btn"><i className="fas fa-shopping-cart" /> Beli Sekarang</button>
                </div>
              ))}
            </div>
            ) : (
              <div className="fp-anim fp-empty" style={{ '--d': '0.3s' }}>
                <i className="fas fa-store" />
                <p>Belum ada produk di marketplace</p>
              </div>
            )}
            <div className="fp-anim fp-cta-bar" style={{ '--d': '0.65s' }}>
              <span>Bergabung bersama <strong>FORBASI</strong> — komunitas baris-berbaris terbesar di Indonesia</span>
              <div className="fp-cta-btns">
                <Link to="/register" className="fp-btn-primary"><i className="fas fa-user-plus" /> Daftar Anggota</Link>
                <Link to="/register-license" className="fp-btn-glass"><i className="fas fa-certificate" /> Daftar Lisensi</Link>
              </div>
            </div>
          </div>
        </section>
        )}

      </div>

      {/* ════ EVENT DETAIL MODAL ════ */}
      {evModal && (
        <div className="fp-ev-overlay" onClick={() => setEvModal(null)}>
          <div className={`fp-ev-modal fp-event-${evModal.color}`} onClick={e => e.stopPropagation()}>
            <button className="fp-ev-modal-close" onClick={() => setEvModal(null)} aria-label="Close">
              <i className="fas fa-times" />
            </button>
            <div className="fp-ev-modal-banner">
              <img
                src={evModal.banner}
                alt={evModal.nama}
                onError={e => { e.target.style.display = 'none'; e.target.parentElement.classList.add('no-img'); }}
              />
              <div className="fp-ev-modal-banner-overlay" />
              <span className="fp-ev-modal-badge"><i className="fas fa-clock" /> Upcoming</span>
            </div>
            <div className="fp-ev-modal-body">
              <h2>{evModal.nama}</h2>
              <div className="fp-ev-modal-details">
                <div className="fp-ev-modal-detail">
                  <i className="fas fa-calendar-alt" />
                  <div>
                    <span className="fp-ev-modal-label">Tanggal</span>
                    <span>{evModal.tanggal}</span>
                  </div>
                </div>
                <div className="fp-ev-modal-detail">
                  <i className="fas fa-map-marker-alt" />
                  <div>
                    <span className="fp-ev-modal-label">Lokasi</span>
                    <span>{evModal.lokasi}</span>
                  </div>
                </div>
                <div className="fp-ev-modal-detail">
                  <i className={`fas ${evModal.icon}`} />
                  <div>
                    <span className="fp-ev-modal-label">Kategori</span>
                    <span style={{ textTransform: 'capitalize' }}>{evModal.color === 'emerald' ? 'Kompetisi' : evModal.color === 'blue' ? 'Pelatihan' : evModal.color === 'purple' ? 'Organisasi' : 'Event'}</span>
                  </div>
                </div>
              </div>
              <p className="fp-ev-modal-desc">{evModal.deskripsi}</p>
              <div className="fp-ev-modal-actions">
                {evModal.link ? (
                  <Link to={evModal.link} className="fp-ev-modal-btn-primary" onClick={() => setEvModal(null)}><i className="fas fa-ticket-alt" /> Daftar Sekarang</Link>
                ) : (
                  <button className="fp-ev-modal-btn-primary"><i className="fas fa-ticket-alt" /> Daftar Sekarang</button>
                )}
                <button className="fp-ev-modal-btn-glass" onClick={() => setEvModal(null)}><i className="fas fa-arrow-left" /> Kembali</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
