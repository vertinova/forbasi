import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const G = 'rgb(0,73,24)';
const GL = 'rgb(0,128,43)';
const NAVY = '#1d3557';

const STATUS_META = {
  pending:                 { label: 'Pending',           color: '#f59e0b', bg: '#fef3c7' },
  approved_pengcab:        { label: 'Acc Pengcab',        color: '#3b82f6', bg: '#dbeafe' },
  approved_pengda:         { label: 'Acc Pengda',         color: '#6366f1', bg: '#ede9fe' },
  approved_pb:             { label: 'Approved PB',        color: '#10b981', bg: '#d1fae5' },
  kta_issued:              { label: 'KTA Terbit',         color: '#059669', bg: '#a7f3d0' },
  rejected_pengcab:        { label: 'Tolak Pengcab',      color: '#ef4444', bg: '#fee2e2' },
  rejected_pengda:         { label: 'Tolak Pengda',       color: '#ef4444', bg: '#fee2e2' },
  rejected_pb:             { label: 'Tolak PB',           color: '#ef4444', bg: '#fee2e2' },
  rejected:                { label: 'Ditolak',            color: '#ef4444', bg: '#fee2e2' },
  resubmit_to_pengda:      { label: 'Resubmit',           color: '#f59e0b', bg: '#fef3c7' },
  pending_pengda_resubmit: { label: 'Re-review',          color: '#f59e0b', bg: '#fef3c7' },
};

const fmtRp = (n) => 'Rp\u00a0' + Number(n || 0).toLocaleString('id-ID');

const Badge = ({ status }) => {
  const m = STATUS_META[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: m.bg, color: m.color,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
};

const StatCard = ({ icon, value, label, gradient, iconBg }) => (
  <div style={{
    background: '#fff', borderRadius: 16,
    padding: '1.25rem 1rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', gap: '1rem',
    borderLeft: `4px solid ${iconBg}`,
    transition: 'transform .2s, box-shadow .2s'
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
  >
    <div style={{
      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
      background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <i className={`fas ${icon}`} style={{ color: '#fff', fontSize: '1.1rem' }} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>{label}</div>
    </div>
  </div>
);

const SectionCard = ({ children, title, icon, actions }) => (
  <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '1.5rem' }}>
    {title && (
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${G},${GL})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`fas ${icon}`} style={{ color: '#fff', fontSize: '0.8rem' }} />
          </span>
          {title}
        </h2>
        {actions}
      </div>
    )}
    {children}
  </div>
);

const SECTIONS = [
  { key: 'kta',       label: 'Pengajuan KTA',  icon: 'fa-file-alt' },
  { key: 'keuangan',  label: 'Keuangan',        icon: 'fa-wallet' },
  { key: 'transaksi', label: 'Transaksi',        icon: 'fa-exchange-alt' },
  { key: 'pengguna',  label: 'Pengguna',         icon: 'fa-users' },
  { key: 'log',       label: 'Log Aktivitas',    icon: 'fa-history' },
  { key: 'profil',    label: 'Profil',           icon: 'fa-user-cog' },
];

export default function PbDashboard() {
  const [activeSection, setActiveSection] = useState('kta');

  // ── KTA section ──
  const [stats, setStats]               = useState(null);
  const [applications, setApplications] = useState([]);
  const [visitorStats, setVisitorStats] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState('all');
  const [rejectModal, setRejectModal]   = useState({ show: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [provinces, setProvinces]       = useState([]);
  const [cities, setCities]             = useState([]);
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity]         = useState('');

  // ── Keuangan section ──
  const [saldo, setSaldo]             = useState(null);
  const [saldoLoading, setSaldoLoading] = useState(false);
  const [recipientList, setRecipientList] = useState([]);
  const [recapModal, setRecapModal]   = useState({ show: false });
  const [recapForm, setRecapForm]     = useState({
    recipient_user_id: '', recipient_type: 'pengda',
    recap_month: String(new Date().getMonth() + 1),
    recap_year: String(new Date().getFullYear()),
    amount_paid: '', notes: '', file: null
  });
  const [recapSubmitting, setRecapSubmitting] = useState(false);

  // ── Transaksi section ──
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // ── Pengguna section ──
  const [users, setUsers]       = useState([]);
  const [userPagination, setUserPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch]   = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [resetConfirm, setResetConfirm]   = useState({ show: false, id: null, name: '' });

  // ── Log section ──
  const [activityLog, setActivityLog] = useState([]);
  const [logLoading, setLogLoading]   = useState(false);

  // ── Profil section ──
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // ────────────────────────────────────────────────
  // Data loaders
  // ────────────────────────────────────────────────
  const fetchKtaData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search, limit: 200 };
      if (filterProvince) params.province_id = filterProvince;
      if (filterCity)     params.city_id     = filterCity;
      const [dashRes, appsRes, visitorRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/kta/applications', { params }),
        api.get('/config/visitor-stats').catch(() => ({ data: { data: null } }))
      ]);
      setStats(dashRes.data.data);
      setApplications(appsRes.data.data?.applications || []);
      setVisitorStats(visitorRes.data.data);
    } catch { toast.error('Gagal memuat data KTA'); }
    finally { setLoading(false); }
  }, [search, filterProvince, filterCity]);

  const fetchProvinces = useCallback(async () => {
    if (provinces.length) return;
    try {
      const res = await api.get('/users/provinces');
      setProvinces(res.data.data || []);
    } catch { /* silent */ }
  }, [provinces.length]);

  const fetchCities = useCallback(async (pid) => {
    if (!pid) { setCities([]); return; }
    try {
      const res = await api.get(`/users/cities/${pid}`);
      setCities(res.data.data || []);
    } catch { setCities([]); }
  }, []);

  const fetchSaldo = useCallback(async () => {
    setSaldoLoading(true);
    try {
      const res = await api.get('/pb-payment/saldo-summary');
      setSaldo(res.data.data);
    } catch { toast.error('Gagal memuat data keuangan'); }
    finally { setSaldoLoading(false); }
  }, []);

  const fetchRecipientList = useCallback(async () => {
    if (recipientList.length) return;
    try {
      const [pgdRes, pgcRes] = await Promise.all([
        api.get('/users/list', { params: { role_id: 3, limit: 100 } }),
        api.get('/users/list', { params: { role_id: 2, limit: 200 } }),
      ]);
      const pgdUsers = (pgdRes.data.data?.users || []).map(u => ({ ...u, _type: 'pengda' }));
      const pgcUsers = (pgcRes.data.data?.users || []).map(u => ({ ...u, _type: 'pengcab' }));
      setRecipientList([...pgdUsers, ...pgcUsers]);
    } catch { /* silent */ }
  }, [recipientList.length]);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await api.get('/pb-payment/history', { params: { limit: 100 } });
      setTransactions(res.data.data || []);
    } catch { toast.error('Gagal memuat transaksi'); }
    finally { setTxLoading(false); }
  }, []);

  const fetchUsers = useCallback(async (pg = 1) => {
    setUsersLoading(true);
    try {
      const res = await api.get('/users/list', { params: { search: userSearch, role_id: userRoleFilter || undefined, page: pg, limit: 20 } });
      setUsers(res.data.data?.users || []);
      setUserPagination(res.data.data?.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch { toast.error('Gagal memuat pengguna'); }
    finally { setUsersLoading(false); }
  }, [userSearch, userRoleFilter]);

  const fetchActivityLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const res = await api.get('/admin/activity', { params: { limit: 50 } });
      setActivityLog(res.data.data || []);
    } catch { toast.error('Gagal memuat log aktivitas'); }
    finally { setLogLoading(false); }
  }, []);

  // ── Initial load ──
  useEffect(() => { fetchKtaData(); fetchProvinces(); }, []);

  // ── Section-specific loads ──
  useEffect(() => {
    if (activeSection === 'kta')       fetchKtaData();
    if (activeSection === 'keuangan')  { fetchSaldo(); fetchRecipientList(); }
    if (activeSection === 'transaksi') fetchTransactions();
    if (activeSection === 'pengguna')  fetchUsers(1);
    if (activeSection === 'log')       fetchActivityLog();
  }, [activeSection]);

  // reload when province filter changes (also refresh cities)
  useEffect(() => {
    fetchCities(filterProvince);
    setFilterCity('');
  }, [filterProvince]);

  useEffect(() => {
    if (activeSection === 'kta') fetchKtaData();
  }, [filterProvince, filterCity]);

  // ── KTA handlers ──
  const handleUpdateStatus = async (id, status, extraNotes) => {
    try {
      const payload = { status };
      if (status === 'rejected_pb') payload.rejection_reason = extraNotes || '';
      if (extraNotes) payload.notes = extraNotes;
      await api.patch(`/kta/applications/${id}/status`, payload);
      toast.success('Status berhasil diperbarui');
      fetchKtaData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleRejectConfirm = async () => {
    await handleUpdateStatus(rejectModal.id, 'rejected_pb', rejectReason);
    setRejectModal({ show: false, id: null });
    setRejectReason('');
  };

  // ── Recap payment handler ──
  const handleRecapSubmit = async (e) => {
    e.preventDefault();
    if (!recapForm.recipient_user_id) { toast.error('Pilih penerima terlebih dahulu'); return; }
    if (!recapForm.file) { toast.error('Bukti transfer wajib diunggah'); return; }
    if (!recapForm.amount_paid) { toast.error('Masukkan nominal pembayaran'); return; }
    setRecapSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('recipient_user_id', recapForm.recipient_user_id);
      fd.append('recipient_type', recapForm.recipient_type);
      fd.append('recap_month', recapForm.recap_month);
      fd.append('recap_year', recapForm.recap_year);
      fd.append('amount_paid', recapForm.amount_paid);
      fd.append('notes', recapForm.notes);
      fd.append('payment_proof_file', recapForm.file);
      await api.post('/pb-payment/recap-payment', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Rekap pembayaran berhasil disimpan');
      setRecapModal({ show: false });
      setRecapForm({ recipient_user_id: '', recipient_type: 'pengda', recap_month: String(new Date().getMonth() + 1), recap_year: String(new Date().getFullYear()), amount_paid: '', notes: '', file: null });
      fetchSaldo();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan rekap'); }
    finally { setRecapSubmitting(false); }
  };

  // ── User management handlers ──
  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${deleteConfirm.id}`);
      toast.success('Pengguna berhasil dihapus');
      setDeleteConfirm({ show: false, id: null, name: '' });
      fetchUsers(userPagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
  };

  const handleResetPassword = async () => {
    try {
      await api.put(`/users/${resetConfirm.id}/reset-password`);
      toast.success('Password berhasil direset');
      setResetConfirm({ show: false, id: null, name: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal reset password'); }
  };

  // ── Change password handler ──
  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Konfirmasi password tidak cocok'); return; }
    if (pwForm.newPw.length < 6)         { toast.error('Password minimal 6 karakter'); return; }
    setPwLoading(true);
    try {
      await api.put('/users/change-password', { current_password: pwForm.current, new_password: pwForm.newPw });
      toast.success('Password berhasil diubah');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengubah password'); }
    finally { setPwLoading(false); }
  };

  // ────────────────────────────────────────────────
  // Derived data
  // ────────────────────────────────────────────────
  const TAB_FILTERS = [
    { key: 'all',              label: 'Semua' },
    { key: 'needs_pb_action',  label: 'Menunggu PB' },
    { key: 'approved_pb',      label: 'Approved PB' },
    { key: 'kta_issued',       label: 'KTA Terbit' },
    { key: 'rejected_pb',      label: 'Ditolak' },
  ];

  const NEEDS_PB_STATUSES = ['approved_pengda', 'pending_pengda_resubmit'];

  const filtered = applications.filter(a => {
    const matchTab = activeTab === 'all'
      || (activeTab === 'needs_pb_action' && NEEDS_PB_STATUSES.includes(a.status))
      || (activeTab !== 'needs_pb_action' && a.status === activeTab);
    const matchSearch = !search || a.club_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const menuItems = [
    { label: 'Pengajuan KTA',   icon: <i className="fas fa-file-alt" />,       onClick: () => setActiveSection('kta'),       active: activeSection === 'kta' },
    { label: 'Keuangan',        icon: <i className="fas fa-wallet" />,          onClick: () => setActiveSection('keuangan'),  active: activeSection === 'keuangan' },
    { label: 'Transaksi',       icon: <i className="fas fa-exchange-alt" />,    onClick: () => setActiveSection('transaksi'), active: activeSection === 'transaksi' },
    { label: 'Pengguna',        icon: <i className="fas fa-users" />,           onClick: () => setActiveSection('pengguna'),  active: activeSection === 'pengguna' },
    { label: 'Log Aktivitas',   icon: <i className="fas fa-history" />,         onClick: () => setActiveSection('log'),       active: activeSection === 'log' },
    { label: 'Profil',          icon: <i className="fas fa-user-cog" />,        onClick: () => setActiveSection('profil'),    active: activeSection === 'profil' },
    { divider: true, dividerLabel: 'Fitur' },
    { to: '/pb/license',         icon: <i className="fas fa-id-badge" />,       label: 'Kelola Lisensi' },
    { to: '/pb/notifications',   icon: <i className="fas fa-bell" />,           label: 'Push Notifikasi' },
    { to: '/pb/kejurnas',        icon: <i className="fas fa-trophy" />,         label: 'Kejurnas' },
    { to: '/pb/kta-config',      icon: <i className="fas fa-cogs" />,           label: 'Konfigurasi KTA' },
    { to: '/pb/reregistrations', icon: <i className="fas fa-redo" />,           label: 'Daftar Ulang' },
  ];

  const ROLE_LABELS = { 1: 'Anggota', 2: 'Pengcab', 3: 'Pengda', 4: 'PB' };

  // ────────────────────────────────────────────────
  // Section renderers
  // ────────────────────────────────────────────────
  const renderKtaSection = () => (
    <>
      {/* Stat Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard icon="fa-users"         value={stats.users?.total || 0}             label="Total Anggota"    gradient="linear-gradient(135deg,#667eea,#764ba2)" iconBg="#667eea" />
          <StatCard icon="fa-clock"         value={stats.kta?.pending || 0}             label="KTA Pending"     gradient="linear-gradient(135deg,#f59e0b,#d97706)"  iconBg="#f59e0b" />
          <StatCard icon="fa-hourglass-half" value={(stats.kta?.approved_pengda || 0) + (stats.kta?.pending_pengda_resubmit || 0)} label="Menunggu PB" gradient="linear-gradient(135deg,#6366f1,#4f46e5)" iconBg="#6366f1" />
          <StatCard icon="fa-check-circle"  value={stats.kta?.kta_issued || 0}         label="KTA Terbit"      gradient={`linear-gradient(135deg,${GL},${G})`}      iconBg={G} />
          <StatCard icon="fa-times-circle"  value={stats.kta?.rejected || 0}           label="Ditolak"         gradient="linear-gradient(135deg,#ef4444,#b91c1c)"  iconBg="#ef4444" />
          <StatCard icon="fa-wallet"        value={`Rp\u00a0${((stats.balance?.total_saldo_masuk || 0) / 1000).toFixed(0)}K`} label="Total Saldo" gradient="linear-gradient(135deg,#10b981,#047857)" iconBg="#10b981" />
        </div>
      )}

      {/* Visitor Stats */}
      {visitorStats && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-chart-line" style={{ color: '#fff', fontSize: '0.8rem' }} />
            </span>
            Statistik Pengunjung
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Total Kunjungan', value: (visitorStats.totals?.total_visits || 0).toLocaleString('id-ID'), icon: 'fa-eye', color: '#3b82f6', bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
              { label: 'Pengunjung Unik', value: (visitorStats.totals?.total_unique_visitors || 0).toLocaleString('id-ID'), icon: 'fa-user-check', color: '#10b981', bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' },
              { label: 'Hari Ini', value: (visitorStats.daily?.[0]?.visit_count || 0).toLocaleString('id-ID'), icon: 'fa-calendar-day', color: '#f59e0b', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
            ].map(v => (
              <div key={v.label} style={{ background: v.bg, borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className={`fas ${v.icon}`} style={{ color: v.color, fontSize: '1.25rem', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{v.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{v.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KTA Table */}
      <SectionCard title="Pengajuan KTA" icon="fa-list"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Province filter */}
            <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem', minWidth: 140, background: '#fff' }}>
              <option value="">Semua Provinsi</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {/* City filter */}
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
              disabled={!filterProvince || !cities.length}
              style={{ padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem', minWidth: 140, background: (!filterProvince || !cities.length) ? '#f8fafc' : '#fff' }}>
              <option value="">Semua Kota</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }} />
              <input type="text" placeholder="Cari klub..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '0.45rem 0.75rem 0.45rem 2rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', width: 180 }} />
            </div>
            <button onClick={() => { setSearch(''); setFilterProvince(''); setFilterCity(''); }}
              style={{ padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.82rem', cursor: 'pointer', color: '#64748b' }}>
              Reset
            </button>
          </div>
        }
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid #f1f5f9', padding: '0 1.5rem' }}>
          {TAB_FILTERS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
                color: activeTab === tab.key ? G : '#64748b',
                borderBottom: `2px solid ${activeTab === tab.key ? G : 'transparent'}`,
                transition: 'all .2s'
              }}>
              {tab.label}
              {tab.key !== 'all' && (
                <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 20, background: activeTab === tab.key ? G : '#f1f5f9', color: activeTab === tab.key ? '#fff' : '#64748b', fontSize: 10, fontWeight: 700 }}>
                  {tab.key === 'needs_pb_action'
                    ? applications.filter(a => NEEDS_PB_STATUSES.includes(a.status)).length
                    : applications.filter(a => a.status === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table body */}
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <i className="fas fa-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Tidak ada pengajuan ditemukan</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Klub', 'Provinsi', 'Kota', 'Tanggal', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, idx) => (
                  <tr key={app.id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg,${G},${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                          {(app.club_name || '?')[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{app.club_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569' }}>{app.province_name || '-'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569' }}>{app.city_name || '-'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(app.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}><Badge status={app.status} /></td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <Link to={`/pb/kta/${app.id}`}
                          style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#dbeafe', color: '#2563eb', textDecoration: 'none', fontSize: '0.8rem', transition: 'background .2s' }}
                          title="Detail"
                          onMouseEnter={e => e.currentTarget.style.background = '#bfdbfe'}
                          onMouseLeave={e => e.currentTarget.style.background = '#dbeafe'}>
                          <i className="fas fa-eye" />
                        </Link>
                        {(app.status === 'approved_pengda' || app.status === 'pending_pengda_resubmit' || app.status === 'rejected_pb') && (
                          <>
                            <button onClick={() => handleUpdateStatus(app.id, 'approved_pb')}
                              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#d1fae5', color: '#059669', border: 'none', cursor: 'pointer', transition: 'background .2s' }}
                              title="Approve PB"
                              onMouseEnter={e => e.currentTarget.style.background = '#a7f3d0'}
                              onMouseLeave={e => e.currentTarget.style.background = '#d1fae5'}>
                              <i className="fas fa-check" style={{ fontSize: '0.75rem' }} />
                            </button>
                            <button onClick={() => setRejectModal({ show: true, id: app.id })}
                              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', transition: 'background .2s' }}
                              title="Tolak"
                              onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                              onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}>
                              <i className="fas fa-times" style={{ fontSize: '0.75rem' }} />
                            </button>
                          </>
                        )}
                        {app.status === 'approved_pb' && (
                          <button onClick={() => handleUpdateStatus(app.id, 'kta_issued')}
                            style={{ padding: '0 12px', height: 32, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', transition: 'background .2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = GL}
                            onMouseLeave={e => e.currentTarget.style.background = G}>
                            Issue KTA
                          </button>
                        )}
                        {app.status === 'kta_issued' && app.kta_pdf_url && (
                          <a href={app.kta_pdf_url} target="_blank" rel="noreferrer"
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#d1fae5', color: '#059669', textDecoration: 'none', fontSize: '0.8rem' }}
                            title="Download KTA PDF">
                            <i className="fas fa-file-pdf" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Menampilkan <strong style={{ color: '#475569' }}>{filtered.length}</strong> dari <strong style={{ color: '#475569' }}>{applications.length}</strong> pengajuan</span>
          </div>
        )}
      </SectionCard>
    </>
  );

  const renderKeuanganSection = () => {
    const filteredRecipients = recipientList.filter(u => u._type === recapForm.recipient_type);
    return (
      <>
        {/* Saldo Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {saldoLoading ? <LoadingSpinner /> : (
            <>
              <StatCard icon="fa-arrow-down"  value={fmtRp(saldo?.saldo_masuk)}  label="Saldo Masuk"  gradient="linear-gradient(135deg,#10b981,#047857)" iconBg="#10b981" />
              <StatCard icon="fa-arrow-up"    value={fmtRp(saldo?.saldo_keluar)} label="Saldo Keluar" gradient="linear-gradient(135deg,#ef4444,#b91c1c)" iconBg="#ef4444" />
              <StatCard icon="fa-wallet"      value={fmtRp(saldo?.saldo_sisa)}   label="Saldo Bersih" gradient="linear-gradient(135deg,#6366f1,#4f46e5)" iconBg="#6366f1" />
            </>
          )}
        </div>

        {/* Payment rates info */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
            <i className="fas fa-info-circle" style={{ marginRight: 8, color: '#6366f1' }} />
            Tarif Bagi Hasil per KTA
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Pengda',    amount: 'Rp 35.000', color: '#6366f1', bg: '#ede9fe' },
              { label: 'Pengcab',   amount: 'Rp 50.000', color: '#3b82f6', bg: '#dbeafe' },
              { label: 'Developer', amount: 'Rp 5.000',  color: '#f59e0b', bg: '#fef3c7' },
              { label: 'PB Net',    amount: 'Rp 10.000', color: '#10b981', bg: '#d1fae5' },
            ].map(t => (
              <div key={t.label} style={{ background: t.bg, borderRadius: 10, padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: t.color, marginTop: 4 }}>{t.amount}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>per KTA terbit</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rekap Pembayaran */}
        <SectionCard title="Rekap Pembayaran" icon="fa-money-bill-wave"
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`${import.meta.env.VITE_API_URL}/pb-payment/export-full-saldo`} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.45rem 1rem', borderRadius: 8, background: '#d1fae5', color: '#059669', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                <i className="fas fa-file-excel" /> Export Excel
              </a>
              <button onClick={() => setRecapModal({ show: true })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.45rem 1rem', borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                <i className="fas fa-plus" /> Proses Pembayaran
              </button>
            </div>
          }
        >
          <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>
            <i className="fas fa-hand-holding-usd" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: '#d1d5db' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Klik "Proses Pembayaran" untuk mencatat rekap pembayaran ke Pengda/Pengcab</p>
          </div>
        </SectionCard>

        {/* Recap Payment Modal */}
        {recapModal.show && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => { if (e.target === e.currentTarget) setRecapModal({ show: false }); }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Proses Rekap Pembayaran</h3>
                <button onClick={() => setRecapModal({ show: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>×</button>
              </div>
              <form onSubmit={handleRecapSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Tipe Penerima</label>
                    <select value={recapForm.recipient_type}
                      onChange={e => setRecapForm(f => ({ ...f, recipient_type: e.target.value, recipient_user_id: '' }))}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                      <option value="pengda">Pengda</option>
                      <option value="pengcab">Pengcab</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Penerima</label>
                    <select value={recapForm.recipient_user_id}
                      onChange={e => setRecapForm(f => ({ ...f, recipient_user_id: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                      <option value="">-- Pilih Penerima --</option>
                      {filteredRecipients.map(u => (
                        <option key={u.id} value={u.id}>{u.club_name || u.username}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Bulan</label>
                      <select value={recapForm.recap_month}
                        onChange={e => setRecapForm(f => ({ ...f, recap_month: e.target.value }))}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Tahun</label>
                      <input type="number" value={recapForm.recap_year} min="2024" max="2030"
                        onChange={e => setRecapForm(f => ({ ...f, recap_year: e.target.value }))}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Nominal Pembayaran (Rp)</label>
                    <input type="number" value={recapForm.amount_paid} min="1"
                      onChange={e => setRecapForm(f => ({ ...f, amount_paid: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      placeholder="Contoh: 350000" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Catatan</label>
                    <textarea value={recapForm.notes}
                      onChange={e => setRecapForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                      placeholder="Catatan transfer..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Bukti Transfer <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf"
                      onChange={e => setRecapForm(f => ({ ...f, file: e.target.files[0] || null }))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Format: JPG, PNG, PDF. Maks 5MB.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setRecapModal({ show: false })}
                      style={{ flex: 1, padding: '0.65rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Batal
                    </button>
                    <button type="submit" disabled={recapSubmitting}
                      style={{ flex: 1, padding: '0.65rem', borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, opacity: recapSubmitting ? 0.7 : 1 }}>
                      {recapSubmitting ? 'Menyimpan...' : 'Proses Pembayaran'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderTransaksiSection = () => (
    <SectionCard title="Riwayat Transaksi" icon="fa-exchange-alt"
      actions={
        <a href={`${import.meta.env.VITE_API_URL}/pb-payment/export-full-saldo`} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.45rem 1rem', borderRadius: 8, background: '#d1fae5', color: '#059669', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
          <i className="fas fa-file-excel" /> Export Excel
        </a>
      }
    >
      {txLoading ? <LoadingSpinner /> : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <i className="fas fa-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
          <p style={{ margin: 0 }}>Belum ada riwayat transaksi</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Tanggal', 'Tipe Penerima', 'Penerima', 'Provinsi / Kota', 'Nominal', 'Catatan'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={tx.id || i}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#475569', whiteSpace: 'nowrap' }}>
                    {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: tx.recipient_type === 'pengda' ? '#ede9fe' : '#dbeafe', color: tx.recipient_type === 'pengda' ? '#6366f1' : '#3b82f6' }}>
                      {tx.recipient_type === 'pengda' ? 'Pengda' : 'Pengcab'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.87rem', fontWeight: 600, color: '#1e293b' }}>{tx.recipient_name || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>{[tx.province_name, tx.city_name].filter(Boolean).join(' / ') || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.87rem', fontWeight: 700, color: '#ef4444', whiteSpace: 'nowrap' }}>{fmtRp(tx.amount)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>{tx.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );

  const renderPenggunaSection = () => (
    <SectionCard title="Manajemen Pengguna" icon="fa-users"
      actions={
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); }}
            style={{ padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
            <option value="">Semua Role</option>
            <option value="1">Anggota</option>
            <option value="2">Pengcab</option>
            <option value="3">Pengda</option>
            <option value="4">PB</option>
          </select>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }} />
            <input type="text" placeholder="Cari pengguna..." value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchUsers(1); }}
              style={{ padding: '0.45rem 0.75rem 0.45rem 2rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', width: 180 }} />
          </div>
          <button onClick={() => fetchUsers(1)}
            style={{ padding: '0.45rem 1rem', borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            Cari
          </button>
        </div>
      }
    >
      {usersLoading ? <LoadingSpinner /> : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <i className="fas fa-users" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
          <p style={{ margin: 0 }}>Tidak ada pengguna ditemukan</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Nama', 'Username', 'Email', 'Role', 'Provinsi / Kota', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>{(userPagination.page - 1) * 20 + i + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.87rem', fontWeight: 600, color: '#1e293b' }}>{u.club_name || u.username}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>{u.username}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>{u.email || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {(() => {
                        const rc = { 1: '#10b981', 2: '#3b82f6', 3: '#6366f1', 4: '#f59e0b' }[u.role_id] || '#94a3b8';
                        const rb = { 1: '#d1fae5', 2: '#dbeafe', 3: '#ede9fe', 4: '#fef3c7' }[u.role_id] || '#f3f4f6';
                        return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: rb, color: rc }}>{ROLE_LABELS[u.role_id] || '-'}</span>;
                      })()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>{[u.province_name, u.city_name].filter(Boolean).join(' / ') || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {u.role_id !== 4 && (
                          <>
                            <button onClick={() => setResetConfirm({ show: true, id: u.id, name: u.club_name || u.username })}
                              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#fef3c7', color: '#d97706', border: 'none', cursor: 'pointer' }}
                              title="Reset Password">
                              <i className="fas fa-key" style={{ fontSize: '0.75rem' }} />
                            </button>
                            <button onClick={() => setDeleteConfirm({ show: true, id: u.id, name: u.club_name || u.username })}
                              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}
                              title="Hapus Pengguna">
                              <i className="fas fa-trash" style={{ fontSize: '0.75rem' }} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {userPagination.totalPages > 1 && (
            <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Halaman <strong>{userPagination.page}</strong> dari <strong>{userPagination.totalPages}</strong> ({userPagination.total} pengguna)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button disabled={userPagination.page <= 1} onClick={() => fetchUsers(userPagination.page - 1)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: userPagination.page <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', color: '#64748b', opacity: userPagination.page <= 1 ? 0.5 : 1 }}>
                  ← Prev
                </button>
                <button disabled={userPagination.page >= userPagination.totalPages} onClick={() => fetchUsers(userPagination.page + 1)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: userPagination.page >= userPagination.totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', color: '#64748b', opacity: userPagination.page >= userPagination.totalPages ? 0.5 : 1 }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );

  const renderLogSection = () => (
    <SectionCard title="Log Aktivitas PB" icon="fa-history">
      {logLoading ? <LoadingSpinner /> : activityLog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <i className="fas fa-history" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
          <p style={{ margin: 0 }}>Belum ada log aktivitas</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Waktu', 'Tipe Aktivitas', 'Deskripsi'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLog.map((log, i) => (
                <tr key={log.id || i}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#ede9fe', color: '#6366f1' }}>
                      {log.activity_type || log.action || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#475569' }}>{log.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );

  const renderProfilSection = () => (
    <div style={{ maxWidth: 480 }}>
      <SectionCard title="Ubah Password" icon="fa-lock">
        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={handlePwSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'current', label: 'Password Saat Ini', placeholder: 'Masukkan password saat ini' },
                { key: 'newPw',   label: 'Password Baru',     placeholder: 'Minimal 6 karakter' },
                { key: 'confirm', label: 'Konfirmasi Password Baru', placeholder: 'Ulangi password baru' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: '#374151' }}>{f.label}</label>
                  <input type="password" value={pwForm[f.key]} placeholder={f.placeholder}
                    onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <button type="submit" disabled={pwLoading}
                style={{ padding: '0.7rem', borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem', opacity: pwLoading ? 0.7 : 1 }}>
                {pwLoading ? 'Menyimpan...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      </SectionCard>
    </div>
  );

  // ────────────────────────────────────────────────
  // Main render
  // ────────────────────────────────────────────────
  return (
    <SidebarLayout menuItems={menuItems} title="Dashboard PB FORBASI">

      {/* ── HEADER BANNER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${G} 0%, ${NAVY} 100%)`,
        borderRadius: 20, padding: '1.75rem 2rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
        boxShadow: `0 8px 32px rgba(0,73,24,0.25)`
      }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            <i className="fas fa-shield-alt" style={{ marginRight: 10, opacity: 0.9 }} />
            Dashboard PB FORBASI
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: '4px 0 0', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { to: '/pb/license',       icon: 'fa-id-badge',  label: 'Lisensi' },
            { to: '/pb/notifications', icon: 'fa-bell',      label: 'Notifikasi' },
            { to: '/pb/kejurnas',      icon: 'fa-trophy',    label: 'Kejurnas' },
          ].map(q => (
            <Link key={q.to} to={q.to} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.1rem',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10, color: '#fff', textDecoration: 'none',
              fontSize: '0.82rem', fontWeight: 600, transition: 'background .2s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
              <i className={`fas ${q.icon}`} />{q.label}
            </Link>
          ))}
          <a href={`${import.meta.env.VITE_API_URL}/admin/export-members`} target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.1rem',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10, color: '#fff', textDecoration: 'none',
              fontSize: '0.82rem', fontWeight: 600, transition: 'background .2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
            <i className="fas fa-file-excel" />Export
          </a>
        </div>
      </div>

      {/* ── SECTION NAVIGATION ── */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '0.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0.55rem 1.1rem', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: '0.83rem', fontWeight: 600, transition: 'all .2s',
              background: activeSection === s.key ? G : 'transparent',
              color: activeSection === s.key ? '#fff' : '#64748b',
            }}
            onMouseEnter={e => { if (activeSection !== s.key) e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { if (activeSection !== s.key) e.currentTarget.style.background = 'transparent'; }}>
            <i className={`fas ${s.icon}`} style={{ fontSize: '0.8rem' }} />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── SECTION CONTENT ── */}
      {activeSection === 'kta'       && renderKtaSection()}
      {activeSection === 'keuangan'  && renderKeuanganSection()}
      {activeSection === 'transaksi' && renderTransaksiSection()}
      {activeSection === 'pengguna'  && renderPenggunaSection()}
      {activeSection === 'log'       && renderLogSection()}
      {activeSection === 'profil'    && renderProfilSection()}

      {/* ── MODALS ── */}
      <ConfirmModal
        show={rejectModal.show}
        title="Tolak Pengajuan KTA?"
        message="Masukkan alasan penolakan. Pengajuan akan dikembalikan ke Pengda."
        onConfirm={handleRejectConfirm}
        onCancel={() => { setRejectModal({ show: false, id: null }); setRejectReason(''); }}
        danger
        confirmText="Tolak"
        showReason
        reason={rejectReason}
        onReasonChange={setRejectReason}
        reasonLabel="Alasan Penolakan *"
      />
      <ConfirmModal
        show={deleteConfirm.show}
        title="Hapus Pengguna?"
        message={`Yakin hapus pengguna "${deleteConfirm.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteConfirm({ show: false, id: null, name: '' })}
        danger
        confirmText="Hapus"
      />
      <ConfirmModal
        show={resetConfirm.show}
        title="Reset Password?"
        message={`Reset password pengguna "${resetConfirm.name}" ke default?`}
        onConfirm={handleResetPassword}
        onCancel={() => setResetConfirm({ show: false, id: null, name: '' })}
        confirmText="Reset"
      />
    </SidebarLayout>
  );
}

