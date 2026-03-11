import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import {
  Card,
  CardHeader,
  CardBody,
  StatCard as BaseStatCard,
  StatsGrid,
  TableWrapper,
  Th as BaseTh,
  Td as BaseTd,
  Tr,
  Pagination as BasePagination,
  FilterBar,
  FilterInput,
  FilterSelect,
  FilterDivider,
  EmptyState as BaseEmptyState,
  Badge,
  SolidBadge,
  IconButton,
  Avatar as BaseAvatar,
  PageContainer,
  TabPills,
  TabPill,
  SectionLabel,
} from '../../components/layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import { StatusBadge, formatRupiah } from '../../components/common/DashboardUI';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ManageLicense from '../license/ManageLicense';
import KejurnasManage from '../kejurnas/KejurnasManage';
import KtaConfigPage from '../config/KtaConfigPage';
import ManageReregistration from '../config/ManageReregistration';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONSTANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const fileUrl = p => p ? `${API_BASE}/uploads/${p}` : null;

const SECTIONS = [
  { key: 'dashboard',  label: 'Dashboard',      icon: 'fa-tachometer-alt' },
  { key: 'kta',        label: 'Pengajuan KTA',  icon: 'fa-file-alt'       },
  { key: 'kta_terbit', label: 'KTA Terbit',     icon: 'fa-id-card'        },
  { key: 'keuangan',   label: 'Keuangan',       icon: 'fa-wallet'         },
  { key: 'transaksi',  label: 'Transaksi',      icon: 'fa-exchange-alt'   },
  { key: 'pengguna',   label: 'Pengguna',       icon: 'fa-users'          },
  { key: 'log',        label: 'Log Aktivitas',  icon: 'fa-history'        },
  { key: 'profil',     label: 'Profil',         icon: 'fa-user-cog'       },
  { divider: true, dividerLabel: 'Fitur' },
  { key: 'lisensi',       label: 'Kelola Lisensi',   icon: 'fa-id-badge' },
  { key: 'kejurnas',      label: 'Kejurnas',         icon: 'fa-trophy'   },
  { key: 'kta_config',    label: 'Konfigurasi KTA',  icon: 'fa-cogs'     },
  { key: 'daftar_ulang',  label: 'Daftar Ulang',     icon: 'fa-redo'     },
];
const ROLE_LABELS = { 1: 'Anggota', 2: 'Pengcab', 3: 'Pengda', 4: 'PB' };
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DESIGN SYSTEM — Atoms (using MainLayout components)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const INPUT  = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-150';
const INPUT_SEL = INPUT + ' pr-8 cursor-pointer';
const SELECT = 'pl-3 pr-8 py-2 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-150 cursor-pointer';

const BtnPrimary = ({ children, onClick, disabled, type = 'button', sm, className = '' }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    className={`inline-flex items-center gap-2 ${sm ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2 text-sm'} rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold tracking-tight shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/20 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.97] active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ${className}`}>
    {children}
  </button>
);

const BtnGhost = ({ children, onClick, href, target, rel, sm, className = '' }) => {
  const c = `inline-flex items-center gap-2 ${sm ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white active:scale-[0.97] transition-all duration-150 ${className}`;
  if (href) return <a href={href} target={target} rel={rel} className={c}>{children}</a>;
  return <button type="button" onClick={onClick} className={c}>{children}</button>;
};

const BtnDanger = ({ children, onClick, sm, className = '' }) => (
  <button type="button" onClick={onClick}
    className={`inline-flex items-center gap-2 ${sm ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 active:scale-[0.97] transition-all duration-150 ${className}`}>
    {children}
  </button>
);

const BtnApprove = ({ children, onClick }) => (
  <button type="button" onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-xl active:scale-[0.97] transition-all">
    {children}
  </button>
);

// Use Card component from MainLayout
const Panel = Card;

const PanelHeader = ({ icon, grad = 'from-emerald-500 to-emerald-600', title, subtitle, actions }) => (
  <CardHeader>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <i className={`fas ${icon} text-white text-sm`} />
      </div>
      <div>
        <h2 className="m-0 text-[14px] font-bold text-white leading-tight">{title}</h2>
        {subtitle && <p className="m-0 mt-0.5 text-[11px] text-gray-500">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </CardHeader>
);

// Gradient map for StatCard
const GRAD_MAP = {
  emerald: 'from-emerald-500 to-emerald-600',
  amber:   'from-amber-500 to-amber-600',
  blue:    'from-blue-500 to-blue-600',
  violet:  'from-violet-500 to-violet-600',
  red:     'from-red-500 to-red-600',
  cyan:    'from-cyan-500 to-cyan-600',
  indigo:  'from-indigo-500 to-indigo-600',
};

const ACCENT = {
  emerald: 'border-emerald-500/20 hover:border-emerald-500/30',
  amber:   'border-amber-500/20 hover:border-amber-500/30',
  blue:    'border-blue-500/20 hover:border-blue-500/30',
  violet:  'border-violet-500/20 hover:border-violet-500/30',
  red:     'border-red-500/20 hover:border-red-500/30',
  cyan:    'border-cyan-500/20 hover:border-cyan-500/30',
};

// StatCard uses local styling to support grad prop format
const StatCard = ({ icon, grad, label, value, isText, accent = 'emerald' }) => (
  <div className={`group bg-[#141620] border ${ACCENT[accent]} rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden hover:bg-[#191c28]`}>
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg flex-shrink-0`}>
      <i className={`fas ${icon} text-white text-sm`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5 truncate">{label}</p>
      <p className={`font-bold text-white leading-tight tracking-tight truncate ${isText ? 'text-sm' : 'text-[22px] leading-none'}`}>
        {isText ? value : (typeof value === 'number' ? value.toLocaleString('id-ID') : value)}
      </p>
    </div>
  </div>
);

const FileLink = ({ path, label = 'Lihat' }) => {
  const url = fileUrl(path);
  if (!url) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 border border-blue-600 text-white text-[11px] font-bold shadow-sm hover:bg-blue-600 hover:shadow-md active:scale-[0.97] transition-all">
      <i className="fas fa-arrow-up-right-from-square text-[9px]" />{label}
    </a>
  );
};

// Use BaseAvatar with local color mapping
const Avatar = ({ name, color = 'emerald' }) => <BaseAvatar name={name} color={color} size="md" />;

// UseBasePagination wrapper for backward compatibility
const Pagination = ({ page, totalPages, total, onPageChange, itemName = 'item' }) => {
  if (totalPages <= 1) return null;
  return (
    <BasePagination 
      currentPage={page} 
      totalPages={totalPages} 
      totalItems={total || 0} 
      itemLabel={itemName}
      onPageChange={onPageChange}
    />
  );
};

// Use BaseEmptyState wrapper
const EmptyState = ({ icon, text }) => <BaseEmptyState icon={icon?.replace('fa-', '')} message={text} />;

// Table components - use imported
const Th = BaseTh;
const Td = BaseTd;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function PbDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

  /* KTA */
  const [stats, setStats]                     = useState(null);
  const [applications, setApplications]       = useState([]);
  const [ktaPagination, setKtaPagination]     = useState({ total:0, page:1, totalPages:1 });
  const [visitorStats, setVisitorStats]       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [ktaSearch, setKtaSearch]             = useState('');
  const [activeTab, setActiveTab]             = useState('needs_pb_action');
  const [rejectModal, setRejectModal]         = useState({ show:false, id:null });
  const [rejectReason, setRejectReason]       = useState('');
  const [detailModal, setDetailModal]         = useState({ show:false, app:null });
  const [provinces, setProvinces]             = useState([]);
  const [cities, setCities]                   = useState([]);
  const [filterProvince, setFilterProvince]   = useState('');
  const [filterCity, setFilterCity]           = useState('');

  /* Keuangan */
  const [saldo, setSaldo]                       = useState(null);
  const [saldoLoading, setSaldoLoading]         = useState(false);
  const [recipientList, setRecipientList]       = useState([]);
  const [recapModal, setRecapModal]             = useState({ show:false });
  const [recapForm, setRecapForm]               = useState({
    recipient_user_id:'', recipient_type:'pengda',
    recap_month: String(new Date().getMonth()+1),
    recap_year:  String(new Date().getFullYear()),
    amount_paid:'', notes:'', file:null,
  });
  const [recapSubmitting, setRecapSubmitting]   = useState(false);
  const [unpaidAmounts, setUnpaidAmounts]       = useState(null);
  const [saldoFilterMonth, setSaldoFilterMonth] = useState('');
  const [saldoFilterYear, setSaldoFilterYear]   = useState(String(new Date().getFullYear()));

  /* KTA Terbit */
  const [issuedKtas, setIssuedKtas]                   = useState([]);
  const [issuedKtaLoading, setIssuedKtaLoading]       = useState(false);
  const [issuedKtaPagination, setIssuedKtaPagination] = useState({ total:0, page:1, totalPages:1 });
  const [issuedSearch, setIssuedSearch]               = useState('');

  /* Transaksi */
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading]       = useState(false);

  /* Pengguna */
  const [users, setUsers]                   = useState([]);
  const [userPagination, setUserPagination] = useState({ total:0, page:1, totalPages:1 });
  const [usersLoading, setUsersLoading]     = useState(false);
  const [userSearch, setUserSearch]         = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm]   = useState({ show:false, id:null, name:'' });
  const [resetConfirm, setResetConfirm]     = useState({ show:false, id:null, name:'' });

  /* Log */
  const [activityLog, setActivityLog] = useState([]);
  const [logLoading, setLogLoading]   = useState(false);

  /* Profil */
  const [pwForm, setPwForm]       = useState({ current:'', newPw:'', confirm:'' });
  const [pwLoading, setPwLoading] = useState(false);

  /* ━━━━━ Fetchers ━━━━━ */
  const fetchKtaData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const statusFilter = {
        needs_pb_action: 'approved_pengda,pending_pengda_resubmit',
        pending_awal:    'pending,approved_pengcab',
        approved_pb:     'approved_pb',
        kta_issued:      'kta_issued',
        rejected_pb:     'rejected_pb',
      };
      const params = { search: ktaSearch, limit: 10, page };
      if (filterProvince) params.province_id = filterProvince;
      if (filterCity)     params.city_id     = filterCity;
      if (activeTab !== 'all' && statusFilter[activeTab]) params.status = statusFilter[activeTab];
      const [dashRes, appsRes, visitorRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/kta/applications', { params }),
        api.get('/config/visitor-stats').catch(() => ({ data: { data: null } })),
      ]);
      setStats(dashRes.data.data);
      setApplications(appsRes.data.data?.applications || []);
      setKtaPagination(appsRes.data.data?.pagination || { total:0, page:1, totalPages:1 });
      setVisitorStats(visitorRes.data.data);
    } catch { toast.error('Gagal memuat data KTA'); }
    finally { setLoading(false); }
  }, [ktaSearch, filterProvince, filterCity, activeTab]);

  const fetchProvinces = useCallback(async () => {
    if (provinces.length) return;
    try { const r = await api.get('/users/provinces'); setProvinces(r.data.data || []); } catch { /**/ }
  }, [provinces.length]);

  const fetchCities = useCallback(async (pid) => {
    if (!pid) { setCities([]); return; }
    try { const r = await api.get(`/users/cities/${pid}`); setCities(r.data.data || []); } catch { setCities([]); }
  }, []);

  const fetchSaldo = useCallback(async () => {
    setSaldoLoading(true);
    try {
      const params = {};
      if (saldoFilterMonth) params.month = saldoFilterMonth;
      if (saldoFilterYear)  params.year  = saldoFilterYear;
      const [sR, uR] = await Promise.all([
        api.get('/pb-payment/saldo-summary', { params }),
        api.get('/pb-payment/unpaid-amounts', { params }),
      ]);
      setSaldo(sR.data.data);
      setUnpaidAmounts(uR.data.data);
    } catch { toast.error('Gagal memuat data keuangan'); }
    finally { setSaldoLoading(false); }
  }, [saldoFilterMonth, saldoFilterYear]);

  const fetchIssuedKtas = useCallback(async (page = 1) => {
    setIssuedKtaLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterProvince) params.province_id = filterProvince;
      if (filterCity)     params.city_id     = filterCity;
      if (issuedSearch)   params.search      = issuedSearch;
      const res = await api.get('/pb-payment/issued-kta', { params });
      setIssuedKtas(res.data.data?.issued_ktas || []);
      setIssuedKtaPagination(res.data.data?.pagination || { total:0, page:1, totalPages:1 });
    } catch { toast.error('Gagal memuat data KTA terbit'); }
    finally { setIssuedKtaLoading(false); }
  }, [filterProvince, filterCity, issuedSearch]);

  const fetchRecipientList = useCallback(async () => {
    if (recipientList.length) return;
    try {
      const [pgdRes, pgcRes] = await Promise.all([
        api.get('/users/list', { params: { role_id: 3, limit: 100 } }),
        api.get('/users/list', { params: { role_id: 2, limit: 200 } }),
      ]);
      setRecipientList([
        ...(pgdRes.data.data?.users || []).map(u => ({ ...u, _type:'pengda' })),
        ...(pgcRes.data.data?.users || []).map(u => ({ ...u, _type:'pengcab' })),
      ]);
    } catch { /**/ }
  }, [recipientList.length]);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const r = await api.get('/pb-payment/history', { params: { limit: 100 } });
      setTransactions(r.data.data || []);
    } catch { toast.error('Gagal memuat transaksi'); }
    finally { setTxLoading(false); }
  }, []);

  const fetchUsers = useCallback(async (pg = 1) => {
    setUsersLoading(true);
    try {
      const res = await api.get('/users/list', { params: { search: userSearch, role_id: userRoleFilter || undefined, page: pg, limit: 10 } });
      setUsers(res.data.data?.users || []);
      setUserPagination(res.data.data?.pagination || { total:0, page:1, totalPages:1 });
    } catch { toast.error('Gagal memuat pengguna'); }
    finally { setUsersLoading(false); }
  }, [userSearch, userRoleFilter]);

  const fetchActivityLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const r = await api.get('/admin/activity', { params: { limit: 50 } });
      setActivityLog(r.data.data || []);
    } catch { toast.error('Gagal memuat log aktivitas'); }
    finally { setLogLoading(false); }
  }, []);

  /* ━━━━━ Effects ━━━━━ */
  // eslint-disable-next-line
  useEffect(() => { fetchKtaData(1); fetchProvinces(); }, []);
  // eslint-disable-next-line
  useEffect(() => {
    if (activeSection === 'kta')        fetchKtaData(1);
    if (activeSection === 'kta_terbit') fetchIssuedKtas(1);
    if (activeSection === 'keuangan')   { fetchSaldo(); fetchRecipientList(); }
    if (activeSection === 'transaksi')  fetchTransactions();
    if (activeSection === 'pengguna')   fetchUsers(1);
    if (activeSection === 'log')        fetchActivityLog();
  }, [activeSection]); // eslint-disable-line
  // eslint-disable-next-line
  useEffect(() => { fetchCities(filterProvince); setFilterCity(''); }, [filterProvince]);
  // eslint-disable-next-line
  useEffect(() => { if (activeSection === 'keuangan') fetchSaldo(); }, [saldoFilterMonth, saldoFilterYear]);
  // eslint-disable-next-line
  useEffect(() => { if (activeSection === 'kta') fetchKtaData(1); }, [filterProvince, filterCity, activeTab]);

  /* ━━━━━ Handlers ━━━━━ */
  const handleUpdateStatus = async (id, status, extraNotes) => {
    try {
      const payload = { status };
      if (status === 'rejected_pb') payload.rejection_reason = extraNotes || '';
      if (extraNotes) payload.notes = extraNotes;
      await api.patch(`/kta/applications/${id}/status`, payload);
      toast.success('Status berhasil diperbarui');
      fetchKtaData(ktaPagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleRejectConfirm = async () => {
    await handleUpdateStatus(rejectModal.id, 'rejected_pb', rejectReason);
    setRejectModal({ show:false, id:null });
    setRejectReason('');
  };

  const handleRecapSubmit = async (e) => {
    e.preventDefault();
    if (!recapForm.recipient_user_id) { toast.error('Pilih penerima'); return; }
    if (!recapForm.file)              { toast.error('Bukti transfer wajib diunggah'); return; }
    if (!recapForm.amount_paid)       { toast.error('Masukkan nominal'); return; }
    setRecapSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(recapForm).forEach(([k, v]) => {
        if (k === 'file') fd.append('payment_proof_file', v);
        else fd.append(k, v);
      });
      await api.post('/pb-payment/recap-payment', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Rekap pembayaran berhasil disimpan');
      setRecapModal({ show:false });
      setRecapForm({ recipient_user_id:'', recipient_type:'pengda', recap_month: String(new Date().getMonth()+1), recap_year: String(new Date().getFullYear()), amount_paid:'', notes:'', file:null });
      fetchSaldo();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
    finally { setRecapSubmitting(false); }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${deleteConfirm.id}`);
      toast.success('Pengguna dihapus');
      setDeleteConfirm({ show:false, id:null, name:'' });
      fetchUsers(userPagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleResetPassword = async () => {
    try {
      await api.put(`/users/${resetConfirm.id}/reset-password`);
      toast.success('Password berhasil direset');
      setResetConfirm({ show:false, id:null, name:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Konfirmasi tidak cocok'); return; }
    if (pwForm.newPw.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    setPwLoading(true);
    try {
      await api.put('/users/change-password', { current_password: pwForm.current, new_password: pwForm.newPw });
      toast.success('Password berhasil diubah');
      setPwForm({ current:'', newPw:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
    finally { setPwLoading(false); }
  };

  /* ━━━━━ Derived ━━━━━ */
  const NEEDS_PB = ['approved_pengda', 'pending_pengda_resubmit'];
  const tabCounts = {
    needs_pb_action: stats?.kta ? ((stats.kta.approved_pengda||0) + (stats.kta.pending_pengda_resubmit||0)) : 0,
    approved_pb:     stats?.kta?.approved_pb || 0,
    kta_issued:      stats?.kta?.kta_issued  || 0,
    rejected_pb:     stats?.kta?.rejected_pb || 0,
    pending_awal:    stats?.kta ? ((stats.kta.pending||0) + (stats.kta.approved_pengcab||0)) : 0,
  };

  /* ━━━━━ Sidebar menu ━━━━━ */
  const menuItems = SECTIONS.map(s => {
    if (s.divider) return s;
    return {
      label:  s.label,
      icon:   <i className={`fas ${s.icon}`} />,
      onClick: () => setActiveSection(s.key),
      active:  activeSection === s.key,
      badge:   s.key === 'kta' && tabCounts.needs_pb_action > 0 ? tabCounts.needs_pb_action : null,
    };
  });

  /* ══════════════════════════════════════════════
     SECTION RENDERERS
  ══════════════════════════════════════════════ */

  /* ── Dashboard ── */
  const renderDashboardSection = () => (
    <div className="space-y-8">
      {/* Loading skeleton */}
      {loading && !stats ? (
        <div className="py-16 flex justify-center"><LoadingSpinner/></div>
      ) : (
        <div className="space-y-8">
          {/* Welcome Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 md:p-8 shadow-2xl shadow-emerald-500/10">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"/>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"/>
            <div className="absolute top-4 right-4 opacity-10">
              <i className="fas fa-shield-alt text-[120px] text-white"/>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white rounded-full backdrop-blur-sm">
                    <i className="fas fa-crown mr-1.5"/>Admin PB
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight">
                  Selamat Datang! 👋
                </h1>
                <p className="text-emerald-100 text-sm md:text-base max-w-md">
                  Kelola KTA, pantau statistik, dan atur organisasi Anda dengan mudah
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-white/70 text-[11px] uppercase tracking-widest mb-1">Hari Ini</p>
                  <p className="text-white font-bold text-lg">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <i className="fas fa-calendar-alt text-white text-xl"/>
                </div>
              </div>
            </div>
          </div>

          {/* Main Stats Grid */}
          {stats && (
            <div className="space-y-5 mt-8">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <SectionLabel icon="id-card" iconColor="emerald">Statistik KTA</SectionLabel>
                <button 
                  onClick={()=>setActiveSection('kta')}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
                >
                  Lihat Detail <i className="fas fa-arrow-right text-[9px]"/>
                </button>
              </div>
              
              {/* New Modern Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { icon:'fa-users',          iconBg:'bg-gradient-to-br from-violet-500 to-violet-600',  shadowColor:'shadow-violet-500/25',  label:'Total Anggota',  value:stats.users?.total || 0 },
                  { icon:'fa-hourglass-half',  iconBg:'bg-gradient-to-br from-amber-500 to-amber-600',   shadowColor:'shadow-amber-500/25',   label:'Menunggu PB',    value:(stats.kta?.approved_pengda||0)+(stats.kta?.pending_pengda_resubmit||0), highlight:true },
                  { icon:'fa-clock',           iconBg:'bg-gradient-to-br from-blue-500 to-blue-600',     shadowColor:'shadow-blue-500/25',    label:'Proses Pengcab', value:stats.kta?.pending || 0 },
                  { icon:'fa-check-circle',    iconBg:'bg-gradient-to-br from-emerald-500 to-emerald-600',shadowColor:'shadow-emerald-500/25', label:'KTA Terbit',     value:stats.kta?.kta_issued || 0 },
                  { icon:'fa-times-circle',    iconBg:'bg-gradient-to-br from-red-500 to-red-600',       shadowColor:'shadow-red-500/25',     label:'Ditolak',        value:stats.kta?.rejected || 0 },
                  { icon:'fa-wallet',          iconBg:'bg-gradient-to-br from-cyan-500 to-cyan-600',     shadowColor:'shadow-cyan-500/25',    label:'Total Saldo',    value:formatRupiah(stats.balance?.total_saldo_masuk), isText:true },
                ].map((stat,idx)=>(
                  <div key={idx} 
                    className={`relative group bg-[#141620] rounded-2xl p-4 border transition-all duration-300 hover:-translate-y-1 hover:bg-[#191c28] overflow-hidden
                      ${stat.highlight ? 'border-amber-500/30 ring-1 ring-amber-500/20' : 'border-white/[0.06] hover:border-white/[0.1]'}
                    `}>
                    {/* Highlight badge */}
                    {stat.highlight && stat.value > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 items-center justify-center">
                            <i className="fas fa-exclamation text-[8px] text-white"/>
                          </span>
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-2 relative z-10">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                        <p className={`font-black tracking-tight ${stat.isText ? 'text-sm leading-snug' : 'text-2xl'} ${stat.highlight && stat.value > 0 ? 'text-amber-400' : 'text-white'}`}
                           title={stat.isText ? stat.value : undefined}>
                          {stat.isText ? stat.value : stat.value.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg ${stat.shadowColor} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <i className={`fas ${stat.icon} text-white text-sm`}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two Column Layout: Visitor Stats + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Visitor Stats Card */}
            {visitorStats && (
              <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <i className="fas fa-chart-line text-white text-sm"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Statistik Pengunjung</h3>
                      <p className="text-[11px] text-gray-500">Laporan trafik website</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="space-y-3">
                    {[
                      { icon:'eye',         iconBg:'bg-gradient-to-br from-blue-500 to-blue-600',    label:'Total Kunjungan',    value: visitorStats.totals?.total_visits || 0 },
                      { icon:'user-check',  iconBg:'bg-gradient-to-br from-emerald-500 to-emerald-600', label:'Pengunjung Unik',    value: visitorStats.totals?.total_unique_visitors || 0 },
                      { icon:'calendar-day',iconBg:'bg-gradient-to-br from-amber-500 to-amber-600',   label:'Kunjungan Hari Ini', value: visitorStats.daily?.[0]?.visit_count || 0 },
                    ].map((item,idx)=>(
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors">
                        <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center shadow-md flex-shrink-0`}>
                          <i className={`fas fa-${item.icon} text-white text-xs`}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                          <p className="text-lg font-bold text-white">{item.value.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-gray-600">
                          <i className="fas fa-chevron-right text-xs"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Card */}
            <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <i className="fas fa-bolt text-white text-sm"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Aksi Cepat</h3>
                    <p className="text-[11px] text-gray-500">Pintasan menu populer</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key:'lisensi',      icon:'id-badge', iconBg:'bg-gradient-to-br from-violet-500 to-violet-600', hoverCard:'hover:bg-violet-500/10 hover:border-violet-500/20', hoverText:'hover:text-violet-400', label:'Kelola Lisensi',  desc:'Atur lisensi' },
                    { key:'kejurnas',     icon:'trophy',   iconBg:'bg-gradient-to-br from-amber-500 to-amber-600', hoverCard:'hover:bg-amber-500/10 hover:border-amber-500/20', hoverText:'hover:text-amber-400',  label:'Kejurnas',        desc:'Kelola kejuaraan' },
                    { key:'daftar_ulang', icon:'redo',     iconBg:'bg-gradient-to-br from-cyan-500 to-cyan-600',   hoverCard:'hover:bg-cyan-500/10 hover:border-cyan-500/20',   hoverText:'hover:text-cyan-400',   label:'Daftar Ulang',    desc:'Re-registrasi' },
                    { key:'kta_config',   icon:'cogs',     iconBg:'bg-gradient-to-br from-blue-500 to-blue-600',   hoverCard:'hover:bg-blue-500/10 hover:border-blue-500/20',   hoverText:'hover:text-blue-400',   label:'Konfigurasi KTA', desc:'Atur konfigurasi' },
                  ].map(lnk=>(
                    <button key={lnk.key} onClick={() => setActiveSection(lnk.key)}
                      className={`group flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] ${lnk.hoverCard} border border-transparent transition-all duration-200 text-left cursor-pointer`}>
                      <div className={`w-9 h-9 rounded-lg ${lnk.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <i className={`fas fa-${lnk.icon} text-white text-xs`}/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold text-gray-300 ${lnk.hoverText} transition-colors truncate`}>{lnk.label}</p>
                        <p className="text-[10px] text-gray-500 truncate">{lnk.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Actions Alert */}
          {tabCounts.needs_pb_action > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-5 shadow-2xl shadow-amber-500/15 mt-8">
              {/* Decorative */}
              <div className="absolute top-0 right-0 opacity-10">
                <i className="fas fa-bell text-[80px] text-white"/>
              </div>
              
              <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <i className="fas fa-exclamation-triangle text-white text-lg"/>
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">Perlu Tindakan Segera!</p>
                    <p className="text-amber-100 text-sm mt-0.5">
                      <span className="font-black text-white text-lg">{tabCounts.needs_pb_action}</span> pengajuan KTA menunggu persetujuan Anda
                    </p>
                  </div>
                </div>
                <button 
                  onClick={()=>setActiveSection('kta')}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-white text-amber-600 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  Lihat Pengajuan
                  <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ── KTA ── */
  const KTA_TABS = [
    { key:'all',             label:'Semua',          desc:'Semua pengajuan',           icon:'fa-list',          dot:'bg-slate-400',   activeBg:'from-slate-600 to-slate-700',   activeShadow:''                       },
    { key:'needs_pb_action', label:'Menunggu PB',    desc:'Perlu tindakan PB',         icon:'fa-bell',          dot:'bg-amber-400',   activeBg:'from-amber-500 to-orange-500',  activeShadow:'shadow-amber-500/30'    },
    { key:'pending_awal',    label:'Proses Awal',    desc:'Pending & acc Pengcab',     icon:'fa-hourglass-half',dot:'bg-sky-400',     activeBg:'from-sky-500 to-blue-500',      activeShadow:'shadow-sky-500/30'      },
    { key:'approved_pb',     label:'Disetujui PB',   desc:'Menunggu penerbitan KTA',   icon:'fa-check-circle',  dot:'bg-blue-400',    activeBg:'from-blue-500 to-blue-600',     activeShadow:'shadow-blue-500/30'     },
    { key:'kta_issued',      label:'KTA Terbit',     desc:'KTA sudah diterbitkan',     icon:'fa-id-card',       dot:'bg-emerald-400', activeBg:'from-emerald-500 to-teal-500',  activeShadow:'shadow-emerald-500/30'  },
    { key:'rejected_pb',     label:'Ditolak PB',     desc:'Ditolak oleh PB',           icon:'fa-times-circle',  dot:'bg-red-400',     activeBg:'from-red-500 to-red-600',       activeShadow:'shadow-red-500/30'      },
  ];

  const KTA_STATUS_MAP = {
    all:             null,
    needs_pb_action: 'approved_pengda,pending_pengda_resubmit',
    pending_awal:    'pending,approved_pengcab',
    approved_pb:     'approved_pb',
    kta_issued:      'kta_issued',
    rejected_pb:     'rejected_pb',
  };

  const renderKtaSection = () => (
    <div className="space-y-4">
      <Panel>
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-5 border-b border-white/[0.06] space-y-4">

          {/* Title row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
              <i className="fas fa-file-alt text-white text-sm"/>
            </div>
            <div>
              <h2 className="m-0 text-base font-bold text-white leading-tight">Pengajuan KTA</h2>
              <p className="m-0 mt-0.5 text-[11px] text-gray-500">
                <span className="text-emerald-400 font-semibold">{ktaPagination.total||0}</span> total pengajuan terdaftar
              </p>
            </div>
          </div>

          {/* ── Filter strip ── */}
          <div className="flex items-center gap-2 flex-wrap p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
            {/* Province */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl hover:border-emerald-500/30 focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <i className="fas fa-map-marker-alt text-emerald-400 text-[11px] flex-shrink-0"/>
              <select value={filterProvince} onChange={e=>setFilterProvince(e.target.value)}
                className="text-xs bg-transparent border-none text-gray-300 focus:outline-none cursor-pointer pr-7 min-w-[110px]">
                <option value="">Semua Provinsi</option>
                {provinces.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* City */}
            <div className={`flex items-center gap-2 px-3 py-2 bg-white/[0.05] border rounded-xl transition-all ${filterProvince ? 'border-white/[0.08] hover:border-emerald-500/30 focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/20' : 'border-white/[0.04] opacity-40 pointer-events-none'}`}>
              <i className="fas fa-city text-emerald-400 text-[11px] flex-shrink-0"/>
              <select value={filterCity} onChange={e=>setFilterCity(e.target.value)} disabled={!filterProvince}
                className="text-xs bg-transparent border-none text-gray-300 focus:outline-none cursor-pointer pr-7 min-w-[100px]">
                <option value="">Semua Kota</option>
                {cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl hover:border-emerald-500/30 focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all flex-1 min-w-[160px] max-w-[220px]">
              <i className="fas fa-magnifying-glass text-gray-500 text-[11px] flex-shrink-0"/>
              <input type="text" value={ktaSearch} onChange={e=>setKtaSearch(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&fetchKtaData(1)} placeholder="Cari nama klub…"
                className="text-xs bg-transparent border-none text-gray-200 placeholder-gray-500 focus:outline-none w-full"/>
            </div>
            {/* Divider */}
            <div className="h-7 w-px bg-white/[0.06] hidden sm:block"/>
            {/* Search btn */}
            <button onClick={()=>fetchKtaData(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/20 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-xl active:scale-[0.97] transition-all">
              <i className="fas fa-search text-[10px]"/>Cari
            </button>
            {(ktaSearch||filterProvince||filterCity||activeTab!=='all') && (
              <button onClick={()=>{setKtaSearch('');setFilterProvince('');setFilterCity('');setActiveTab('all');}}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 text-xs font-medium hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 active:scale-[0.97] transition-all">
                <i className="fas fa-xmark text-[10px]"/>Reset
              </button>
            )}
          </div>

          {/* ── Status Tabs ── */}
          <div className="flex gap-2 flex-wrap">
            {KTA_TABS.map(tab => {
              const count = tab.key === 'all' ? ktaPagination.total : (tabCounts[tab.key] || 0);
              const isActive = activeTab === tab.key;
              const isUrgent = tab.key === 'needs_pb_action' && count > 0;
              return (
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                    ${isActive
                      ? `bg-gradient-to-r ${tab.activeBg} text-white shadow-lg ${tab.activeShadow}`
                      : isUrgent
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/15'
                        : 'bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white hover:border-white/[0.1] hover:bg-white/[0.06]'
                    }`}>
                  <i className={`fas ${tab.icon} text-[10px] ${isActive ? 'text-white/80' : ''}`}/>
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                      isActive ? 'bg-white/25 text-white' : isUrgent ? 'bg-amber-500 text-white' : 'bg-white/[0.1] text-gray-400'
                    }`}>{count > 999 ? '999+' : count}</span>
                  )}
                  {isUrgent && !isActive && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"/>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"/>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : applications.length === 0 ? (
          <EmptyState icon="fa-inbox" text="Tidak ada pengajuan ditemukan"/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.02]">Nama Klub</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.02]">Wilayah</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.02]">Pembayaran</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.02]">File KTA</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.02]">Status</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.02]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr key={app.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors duration-100 ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                    {/* Klub */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={app.club_name}/>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white m-0 leading-tight truncate max-w-[200px]">{app.club_name}</p>
                          <p className="text-[10px] text-gray-400 m-0 mt-0.5 font-mono">#{app.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Wilayah */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400 leading-tight">{app.province_name||app.province||'—'}</span>
                        <span className="text-[11px] text-gray-500">{app.city_name||app.regency||'—'}</span>
                      </div>
                    </td>
                    {/* Pembayaran */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1.5">
                        {app.nominal_paid
                          ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-full shadow-sm whitespace-nowrap">
                              <i className="fas fa-circle-dollar-sign text-emerald-500 text-[10px]"/>Rp {Number(app.nominal_paid).toLocaleString('id-ID')}
                            </span>
                          : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] text-gray-500 text-[11px] font-medium rounded-full"><i className="fas fa-clock text-[10px]"/>Belum ada</span>}
                        <FileLink path={app.payment_proof_path} label="Bukti"/>
                      </div>
                    </td>
                    {/* File KTA */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {[
                          { label:'PC', path: app.generated_kta_file_path       },
                          { label:'PD', path: app.generated_kta_file_path_pengda },
                          { label:'PB', path: app.generated_kta_file_path_pb     },
                        ].map(f => f.path
                          ? <a key={f.label} href={fileUrl(f.path)} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500 text-white text-[11px] font-bold shadow-sm hover:bg-blue-600 hover:shadow-md active:scale-[0.97] transition-all">
                              <i className="fas fa-file-pdf text-[9px]"/>{f.label}
                            </a>
                          : <span key={f.label} className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-gray-500 text-[11px] font-bold">{f.label}</span>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={app.status}/>
                    </td>
                    {/* Aksi */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {NEEDS_PB.includes(app.status) || app.status === 'rejected_pb' ? (
                          <>
                            <button onClick={()=>handleUpdateStatus(app.id,'approved_pb')} title="Setujui"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 hover:shadow-md active:scale-[0.97] transition-all">
                              <i className="fas fa-check text-[10px]"/>Setuju
                            </button>
                            <button onClick={()=>setRejectModal({show:true,id:app.id})} title="Tolak"
                              className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 active:scale-[0.97] transition-all">
                              <i className="fas fa-times text-[10px]"/>
                            </button>
                          </>
                        ) : app.status === 'approved_pb' ? (
                          <button onClick={()=>handleUpdateStatus(app.id,'kta_issued')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 ring-1 ring-emerald-700/20 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-lg active:scale-[0.97] transition-all">
                            <i className="fas fa-id-card text-[10px]"/>Terbitkan
                          </button>
                        ) : app.status === 'kta_issued' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm shadow-emerald-500/25">
                            <i className="fas fa-circle-check text-[10px]"/>Terbit
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                        <button type="button" onClick={()=>setDetailModal({show:true,app})} title="Detail"
                          className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white active:scale-[0.97] transition-all">
                          <i className="fas fa-eye text-[10px]"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={ktaPagination.page} totalPages={ktaPagination.totalPages} total={ktaPagination.total} onPageChange={p=>fetchKtaData(p)} itemName="pengajuan"/>
      </Panel>
    </div>
  );

  /* ── KTA Terbit ── */
  const renderKtaTerbitSection = () => (
    <Panel>
      <PanelHeader icon="fa-id-card" title="Daftar KTA Terbit" subtitle={`${issuedKtaPagination.total||0} KTA diterbitkan`}
        actions={<>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"/>
            <input type="text" value={issuedSearch} onChange={e=>setIssuedSearch(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&fetchIssuedKtas(1)} placeholder="Cari klub / barcode…"
              className={`${SELECT} pl-8 w-52`}/>
          </div>
          <BtnPrimary onClick={()=>fetchIssuedKtas(1)} sm><i className="fas fa-search"/>Cari</BtnPrimary>
        </>}
      />
      {issuedKtaLoading ? <div className="py-16 flex justify-center"><LoadingSpinner/></div>
        : issuedKtas.length===0 ? <EmptyState icon="fa-id-card" text="Belum ada KTA yang terbit"/>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/[0.06]">
                <tr>{['#','Klub','Ketua','Barcode','Wilayah','Terbit','PD/PC','Aksi'].map(c=><Th key={c}>{c}</Th>)}</tr>
              </thead>
              <tbody>
                {issuedKtas.map((kta,idx)=>(
                  <tr key={kta.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <Td><span className="text-gray-500 text-xs font-mono">{(issuedKtaPagination.page-1)*20+idx+1}</span></Td>
                    <Td><div className="flex items-center gap-2"><Avatar name={kta.club_name}/><span className="font-semibold text-white">{kta.club_name}</span></div></Td>
                    <Td><span className="text-gray-400">{kta.leader_name||'—'}</span></Td>
                    <Td><code className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-mono rounded-lg">{kta.kta_barcode_unique_id||'—'}</code></Td>
                    <Td><span className="text-gray-500">{[kta.province_name,kta.city_name].filter(Boolean).join(' · ')||'—'}</span></Td>
                    <Td><span className="text-gray-500 text-xs whitespace-nowrap">{kta.kta_issued_at?new Date(kta.kta_issued_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—'}</span></Td>
                    <Td>
                      <div className="flex gap-1">
                        {[{l:'PD',v:kta.amount_pb_to_pengda},{l:'PC',v:kta.amount_pb_to_pengcab}].map(b=>(
                          <span key={b.l} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm ${
                            b.v
                              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                              : 'bg-white/[0.04] border border-white/[0.06] text-gray-500'
                          }`}>{b.l} {b.v ? <i className="fas fa-check text-[8px]"/> : <i className="fas fa-xmark text-[8px]"/>}</span>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Link to={`/pb/kta/${kta.id}`} title="Lihat Detail"
                          className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/25 hover:bg-blue-600 hover:shadow-md active:scale-[0.97] transition-all">
                          <i className="fas fa-eye text-xs"/>
                        </Link>
                        {kta.generated_kta_file_path_pb&&(
                          <a href={fileUrl(kta.generated_kta_file_path_pb)} target="_blank" rel="noreferrer" title="Download KTA"
                            className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 hover:shadow-md active:scale-[0.97] transition-all">
                            <i className="fas fa-file-pdf text-xs"/>
                          </a>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <Pagination page={issuedKtaPagination.page} totalPages={issuedKtaPagination.totalPages} total={issuedKtaPagination.total} onPageChange={p=>fetchIssuedKtas(p)} itemName="KTA"/>
    </Panel>
  );

  /* ── Keuangan ── */
  const renderKeuanganSection = () => {
    const filteredRecipients = recipientList.filter(u=>u._type===recapForm.recipient_type);
    return (
      <div className="space-y-5">
        {/* Filter Periode */}
        <div className="flex items-center gap-3 flex-wrap px-5 py-4 bg-[#141620] border border-white/[0.06] rounded-2xl">
          <span className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest"><i className="fas fa-calendar text-emerald-500"/>Periode</span>
          <select value={saldoFilterMonth} onChange={e=>setSaldoFilterMonth(e.target.value)} className={SELECT}>
            <option value="">Semua Bulan</option>
            {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('id-ID',{month:'long'})}</option>)}
          </select>
          <select value={saldoFilterYear} onChange={e=>setSaldoFilterYear(e.target.value)} className={SELECT}>
            {Array.from({length:5},(_,i)=>{const y=new Date().getFullYear()-2+i;return<option key={y} value={y}>{y}</option>;})}
          </select>
          <BtnGhost onClick={()=>{setSaldoFilterMonth('');setSaldoFilterYear(String(new Date().getFullYear()));}} sm>Reset</BtnGhost>
        </div>

        {/* Saldo Cards */}
        {saldoLoading ? <div className="py-12 flex justify-center"><LoadingSpinner/></div> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon="fa-arrow-down"  grad="from-emerald-500 to-emerald-600" accent="emerald" label="Saldo Masuk"  value={formatRupiah(saldo?.saldo_masuk)}  isText/>
            <StatCard icon="fa-arrow-up"    grad="from-red-500 to-red-600"         accent="red"     label="Saldo Keluar" value={formatRupiah(saldo?.saldo_keluar)} isText/>
            <StatCard icon="fa-wallet"      grad="from-indigo-500 to-indigo-600"   accent="violet"  label="Saldo Bersih" value={formatRupiah(saldo?.saldo_sisa)}   isText/>
          </div>
        )}

        {/* Tagihan */}
        {unpaidAmounts&&!saldoLoading&&(
          <Panel>
            <PanelHeader icon="fa-exclamation-circle" grad="from-red-500 to-red-600" title="Tagihan Belum Dibayar"/>
            <div className="p-5 space-y-3">
              {[
                {label:'ke Pengda', amount:unpaidAmounts.hutang_pengda, count:unpaidAmounts.unpaid_kta_count_pengda, rate:35000, a:'violet'},
                {label:'ke Pengcab',amount:unpaidAmounts.hutang_pengcab,count:unpaidAmounts.unpaid_kta_count_pengcab,rate:50000, a:'blue'},
              ].map((h,i)=>(
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Belum Bayar {h.label}</p>
                    <p className={`text-2xl font-bold ${h.a==='violet'?'text-violet-400':'text-blue-400'}`}>{formatRupiah(h.amount)}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${h.a==='violet'?'bg-violet-500/10 border border-violet-500/20 text-violet-400':'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                    {h.count} KTA × Rp {h.rate.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
              <div className="flex gap-4 flex-wrap px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-gray-400">
                <span><i className="fas fa-file-alt text-emerald-400 mr-1.5"/>Terbit: <strong className="text-white">{unpaidAmounts.total_issued_kta}</strong></span>
                <span><i className="fas fa-code text-amber-400 mr-1.5"/>Developer: <strong className="text-white">{formatRupiah(unpaidAmounts.hutang_developer)}</strong></span>
                <span><i className="fas fa-building text-cyan-400 mr-1.5"/>PB Net: <strong className="text-white">{formatRupiah(unpaidAmounts.pb_net)}</strong></span>
              </div>
            </div>
          </Panel>
        )}

        {/* Rekap */}
        <Panel>
          <PanelHeader icon="fa-money-bill-wave" title="Rekap Pembayaran"
            actions={<>
              <BtnGhost href={`${import.meta.env.VITE_API_URL}/pb-payment/export-full-saldo`} target="_blank" rel="noreferrer" sm><i className="fas fa-file-excel"/>Export</BtnGhost>
              <BtnPrimary onClick={()=>setRecapModal({show:true})} sm><i className="fas fa-plus"/>Proses Pembayaran</BtnPrimary>
            </>}
          />
          <EmptyState icon="fa-hand-holding-usd" text="Klik 'Proses Pembayaran' untuk mencatat rekap"/>
        </Panel>

        {/* Modal */}
        {recapModal.show&&(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={e=>{if(e.target===e.currentTarget)setRecapModal({show:false});}}>
            <div className="bg-[#141620] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white m-0">Proses Rekap Pembayaran</h3>
                  <p className="text-xs text-gray-500 m-0 mt-0.5">Catat pembayaran ke pengda / pengcab</p>
                </div>
                <button onClick={()=>setRecapModal({show:false})}
                  className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 flex items-center justify-center hover:bg-white/[0.08] hover:text-white transition-all text-base">×</button>
              </div>
              <form onSubmit={handleRecapSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipe Penerima</label>
                  <select value={recapForm.recipient_type} onChange={e=>setRecapForm(f=>({...f,recipient_type:e.target.value,recipient_user_id:''}))} className={INPUT_SEL}>
                    <option value="pengda">Pengda</option>
                    <option value="pengcab">Pengcab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Penerima</label>
                  <select value={recapForm.recipient_user_id} onChange={e=>setRecapForm(f=>({...f,recipient_user_id:e.target.value}))} className={INPUT_SEL}>
                    <option value="">— Pilih —</option>
                    {filteredRecipients.map(u=><option key={u.id} value={u.id}>{u.club_name||u.username}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bulan</label>
                    <select value={recapForm.recap_month} onChange={e=>setRecapForm(f=>({...f,recap_month:e.target.value}))} className={INPUT_SEL}>
                      {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('id-ID',{month:'long'})}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tahun</label>
                    <input type="number" value={recapForm.recap_year} min="2024" max="2030" onChange={e=>setRecapForm(f=>({...f,recap_year:e.target.value}))} className={INPUT}/>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nominal (Rp)</label>
                  <input type="number" value={recapForm.amount_paid} min="1" placeholder="350000" onChange={e=>setRecapForm(f=>({...f,amount_paid:e.target.value}))} className={INPUT}/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Catatan</label>
                  <textarea value={recapForm.notes} rows={2} placeholder="Opsional…" onChange={e=>setRecapForm(f=>({...f,notes:e.target.value}))} className={INPUT+' resize-none'}/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bukti Transfer <span className="text-red-400">*</span></label>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e=>setRecapForm(f=>({...f,file:e.target.files[0]||null}))}
                    className={`${INPUT} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-emerald-500/20 file:text-emerald-400`}/>
                </div>
                <div className="flex gap-2 pt-1">
                  <BtnGhost onClick={()=>setRecapModal({show:false})} className="flex-1 justify-center">Batal</BtnGhost>
                  <BtnPrimary type="submit" disabled={recapSubmitting} className="flex-1 justify-center">
                    {recapSubmitting?<><i className="fas fa-spinner fa-spin"/>Menyimpan…</>:<><i className="fas fa-check"/>Proses</>}
                  </BtnPrimary>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Transaksi ── */
  const renderTransaksiSection = () => (
    <Panel>
      <PanelHeader icon="fa-exchange-alt" grad="from-indigo-500 to-indigo-600" title="Riwayat Transaksi"
        actions={<BtnGhost href={`${import.meta.env.VITE_API_URL}/pb-payment/export-full-saldo`} target="_blank" rel="noreferrer" sm><i className="fas fa-file-excel"/>Export</BtnGhost>}
      />
      {txLoading ? <div className="py-16 flex justify-center"><LoadingSpinner/></div>
        : transactions.length===0 ? <EmptyState icon="fa-inbox" text="Belum ada transaksi"/>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/[0.06]">
                <tr>{['#','Tanggal','Tipe','Penerima','Wilayah','Nominal','Catatan'].map(c=><Th key={c}>{c}</Th>)}</tr>
              </thead>
              <tbody>
                {transactions.map((tx,i)=>(
                  <tr key={tx.id||i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <Td><span className="text-gray-500 text-xs font-mono">{i+1}</span></Td>
                    <Td><span className="text-gray-500 text-xs whitespace-nowrap">{tx.paid_at?new Date(tx.paid_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—'}</span></Td>
                    <Td><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full shadow-sm ${
                      tx.recipient_type==='pengda'
                        ? 'bg-violet-500 text-white shadow-violet-500/20'
                        : 'bg-blue-500 text-white shadow-blue-500/20'
                    }`}><i className={`fas ${tx.recipient_type==='pengda'?'fa-building':'fa-landmark'} text-[9px]`}/>{tx.recipient_type==='pengda'?'Pengda':'Pengcab'}</span></Td>
                    <Td><span className="font-semibold text-white">{tx.recipient_name||'—'}</span></Td>
                    <Td><span className="text-gray-500">{[tx.province_name,tx.city_name].filter(Boolean).join(' · ')||'—'}</span></Td>
                    <Td><span className="font-bold text-red-400 whitespace-nowrap">{formatRupiah(tx.amount)}</span></Td>
                    <Td><span className="text-gray-500">{tx.notes||'—'}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Panel>
  );

  /* ── Pengguna ── */
  const renderPenggunaSection = () => (
    <Panel>
      <PanelHeader icon="fa-users" grad="from-blue-500 to-blue-600" title="Manajemen Pengguna" subtitle={`${userPagination.total||0} pengguna terdaftar`}
        actions={<>
          <select value={userRoleFilter} onChange={e=>setUserRoleFilter(e.target.value)} className={SELECT}>
            <option value="">Semua Role</option>
            {Object.entries(ROLE_LABELS).map(([id,lbl])=><option key={id} value={id}>{lbl}</option>)}
          </select>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"/>
            <input type="text" value={userSearch} onChange={e=>setUserSearch(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&fetchUsers(1)} placeholder="Cari…"
              className={`${SELECT} pl-8 w-32`}/>
          </div>
          <BtnPrimary onClick={()=>fetchUsers(1)} sm><i className="fas fa-search"/>Cari</BtnPrimary>
        </>}
      />
      {usersLoading ? <div className="py-16 flex justify-center"><LoadingSpinner/></div>
        : users.length===0 ? <EmptyState icon="fa-users" text="Tidak ada pengguna"/>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/[0.06]">
                <tr>{['#','Nama','Username','Email','Role','Wilayah','Aksi'].map(c=><Th key={c}>{c}</Th>)}</tr>
              </thead>
              <tbody>
                {users.map((u,i)=>{
                  const rC = u.role_id===4?'amber':u.role_id===3?'violet':u.role_id===2?'blue':'teal';
                  const rb = {4:'bg-amber-500/10 border-amber-500/20 text-amber-400',3:'bg-violet-500/10 border-violet-500/20 text-violet-400',2:'bg-blue-500/10 border-blue-500/20 text-blue-400',1:'bg-teal-500/10 border-teal-500/20 text-teal-400'};
                  return (
                    <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <Td><span className="text-gray-500 text-xs font-mono">{(userPagination.page-1)*20+i+1}</span></Td>
                      <Td><div className="flex items-center gap-2"><Avatar name={u.club_name||u.username} color={rC}/><span className="font-semibold text-white">{u.club_name||u.username}</span></div></Td>
                      <Td><span className="text-gray-500 text-xs font-mono">{u.username}</span></Td>
                      <Td><span className="text-gray-500">{u.email||'—'}</span></Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full shadow-sm border ${
                          u.role_id===4 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : u.role_id===3 ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                          : u.role_id===2 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                        }`}>
                          <i className={`fas ${
                            u.role_id===4?'fa-star':u.role_id===3?'fa-shield':u.role_id===2?'fa-flag':'fa-user'
                          } text-[9px]`}/>{ROLE_LABELS[u.role_id]||'—'}
                        </span>
                      </Td>
                      <Td><span className="text-gray-500">{[u.province_name,u.city_name].filter(Boolean).join(' · ')||'—'}</span></Td>
                      <Td>
                        {u.role_id!==4&&(
                          <div className="flex gap-1.5">
                            <button onClick={()=>setResetConfirm({show:true,id:u.id,name:u.club_name||u.username})} title="Reset Password"
                              className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/25 hover:bg-amber-600 hover:shadow-md active:scale-[0.97] transition-all">
                              <i className="fas fa-key text-[11px]"/>
                            </button>
                            <button onClick={()=>setDeleteConfirm({show:true,id:u.id,name:u.club_name||u.username})} title="Hapus"
                              className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-sm shadow-red-500/25 hover:bg-red-600 hover:shadow-md active:scale-[0.97] transition-all">
                              <i className="fas fa-trash text-[11px]"/>
                            </button>
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      <Pagination page={userPagination.page} totalPages={userPagination.totalPages} total={userPagination.total} onPageChange={p=>fetchUsers(p)} itemName="pengguna"/>
    </Panel>
  );

  /* ── Log ── */
  const renderLogSection = () => (
    <Panel>
      <PanelHeader icon="fa-history" grad="from-violet-500 to-violet-600" title="Log Aktivitas PB"/>
      {logLoading ? <div className="py-16 flex justify-center"><LoadingSpinner/></div>
        : activityLog.length===0 ? <EmptyState icon="fa-history" text="Belum ada log aktivitas"/>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/[0.06]">
                <tr>{['#','Waktu','Tipe','Deskripsi'].map(c=><Th key={c}>{c}</Th>)}</tr>
              </thead>
              <tbody>
                {activityLog.map((log,i)=>(
                  <tr key={log.id||i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <Td><span className="text-gray-500 text-xs font-mono">{i+1}</span></Td>
                    <Td><span className="text-gray-500 text-xs whitespace-nowrap">{log.created_at?new Date(log.created_at).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}</span></Td>
                    <Td><span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-sm">{log.activity_type||log.action||'—'}</span></Td>
                    <Td><span className="text-gray-400">{log.description||'—'}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Panel>
  );

  /* ── Profil ── */
  const renderProfilSection = () => (
    <div className="max-w-sm">
      <Panel>
        <PanelHeader icon="fa-lock" title="Ubah Password" subtitle="Ganti password akun PB Anda"/>
        <div className="p-5">
          <form onSubmit={handlePwSubmit} className="space-y-4">
            {[
              {key:'current', label:'Password Saat Ini',   ph:'Masukkan password saat ini'},
              {key:'newPw',   label:'Password Baru',       ph:'Minimal 6 karakter'},
              {key:'confirm', label:'Konfirmasi Password', ph:'Ulangi password baru'},
            ].map(f=>(
              <div key={f.key}>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input type="password" value={pwForm[f.key]} placeholder={f.ph}
                  onChange={e=>setPwForm(p=>({...p,[f.key]:e.target.value}))} className={INPUT}/>
              </div>
            ))}
            <BtnPrimary type="submit" disabled={pwLoading} className="w-full justify-center mt-2">
              {pwLoading?<><i className="fas fa-spinner fa-spin"/>Menyimpan…</>:<><i className="fas fa-save"/>Ubah Password</>}
            </BtnPrimary>
          </form>
        </div>
      </Panel>
    </div>
  );

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MAIN RENDER
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <SidebarLayout menuItems={menuItems} title="Dashboard PB FORBASI">
      <div className="max-w-[1600px] mx-auto space-y-6">

      {/* Active Section */}
      {activeSection==='dashboard'   && renderDashboardSection()}
      {activeSection==='kta'         && renderKtaSection()}
      {activeSection==='kta_terbit'  && renderKtaTerbitSection()}
      {activeSection==='keuangan'   && renderKeuanganSection()}
      {activeSection==='transaksi'  && renderTransaksiSection()}
      {activeSection==='pengguna'   && renderPenggunaSection()}
      {activeSection==='log'        && renderLogSection()}
      {activeSection==='profil'     && renderProfilSection()}
      {activeSection==='lisensi'     && <ManageLicense embedded />}
      {activeSection==='kejurnas'    && <KejurnasManage embedded />}
      {activeSection==='kta_config'  && <KtaConfigPage embedded />}
      {activeSection==='daftar_ulang' && <ManageReregistration embedded />}

      {/* Modals */}
      <ConfirmModal show={rejectModal.show} title="Tolak Pengajuan KTA?" message="Masukkan alasan penolakan."
        onConfirm={handleRejectConfirm} onCancel={()=>{setRejectModal({show:false,id:null});setRejectReason('');}}
        danger confirmText="Tolak" showReason reason={rejectReason} onReasonChange={setRejectReason} reasonLabel="Alasan *"/>

      {/* Detail Modal */}
      {detailModal.show && detailModal.app && (() => {
        const a = detailModal.app;
        const rows = [
          { label:'ID Pengajuan', value: <span className="font-mono text-xs text-gray-400">#{a.id}</span> },
          { label:'Ketua / PIC',  value: a.leader_name || a.username || '—' },
          { label:'Email',        value: a.email || '—' },
          { label:'Telepon',      value: a.phone || '—' },
          { label:'Alamat Klub',  value: a.club_address || '—' },
        ];
        const docs = [
          { label:'Logo',   path: a.logo_path },
          { label:'AD',     path: a.ad_file_path },
          { label:'ART',    path: a.art_file_path },
          { label:'SK',     path: a.sk_file_path },
        ];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={()=>setDetailModal({show:false,app:null})}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <div className="relative w-full max-w-md bg-[#141620] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <i className="fas fa-info text-white text-sm"/>
                  </div>
                  <div>
                    <h3 className="m-0 text-sm font-bold text-white leading-tight">{a.club_name}</h3>
                    <p className="m-0 mt-0.5 text-[11px] text-gray-500">Detail Pengajuan KTA</p>
                  </div>
                </div>
                <button type="button" onClick={()=>setDetailModal({show:false,app:null})}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all">
                  <i className="fas fa-times text-xs"/>
                </button>
              </div>
              {/* Info rows */}
              <div className="p-5 space-y-2.5">
                {rows.map(r=>(
                  <div key={r.label} className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{r.label}</span>
                    <span className="text-sm text-gray-300 text-right">{r.value}</span>
                  </div>
                ))}
                {/* Dokumen */}
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Dokumen</p>
                  <div className="flex flex-wrap gap-2">
                    {docs.map(d=>(
                      <FileLink key={d.label} path={d.path} label={d.label}/>
                    ))}
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-white/[0.06] flex justify-end">
                <BtnGhost sm onClick={()=>setDetailModal({show:false,app:null})}>Tutup</BtnGhost>
              </div>
            </div>
          </div>
        );
      })()}
      <ConfirmModal show={deleteConfirm.show} title="Hapus Pengguna?" message={`Yakin ingin menghapus "${deleteConfirm.name}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={handleDeleteUser} onCancel={()=>setDeleteConfirm({show:false,id:null,name:''})} danger confirmText="Hapus"/>
      <ConfirmModal show={resetConfirm.show} title="Reset Password?" message={`Reset password "${resetConfirm.name}" ke password default?`}
        onConfirm={handleResetPassword} onCancel={()=>setResetConfirm({show:false,id:null,name:''})} confirmText="Reset"/>
      </div>
    </SidebarLayout>
  );
}
