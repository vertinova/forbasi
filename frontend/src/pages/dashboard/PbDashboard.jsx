import { useState, useEffect, useCallback } from 'react';
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
import CustomSelect from '../../components/common/CustomSelect';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ManageLicense from '../license/ManageLicense';
import KejurnasManage from '../kejurnas/KejurnasManage';
import KtaConfigPage from '../config/KtaConfigPage';
import ManageReregistration from '../config/ManageReregistration';
import ManageLandingPage from '../landing/ManageLandingPage';
import KtaDetailPanel from '../../components/common/KtaDetailPanel';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONSTANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const fileUrl = p => p ? `${API_BASE}/uploads/${p}` : null;

const SECTIONS = [
  { key: 'dashboard',  label: 'Dashboard',      icon: 'fa-tachometer-alt' },
  { key: 'kta',        label: 'Pengajuan KTA',  icon: 'fa-file-alt'       },
  { key: 'kta_terbit', label: 'KTA Terbit',     icon: 'fa-id-card'        },

  { key: 'pengguna',   label: 'Pengguna',       icon: 'fa-users'          },
  { key: 'log',        label: 'Log Aktivitas',  icon: 'fa-history'        },
  { key: 'profil',     label: 'Profil',         icon: 'fa-user-cog'       },
  { divider: true, dividerLabel: 'Fitur' },
  { key: 'lisensi',       label: 'Kelola Lisensi',   icon: 'fa-id-badge' },
  { key: 'kejurnas',      label: 'Kejurnas',         icon: 'fa-trophy'   },
  { key: 'kejurcab_review', label: 'Perizinan Kejurcab', icon: 'fa-trophy' },
  { key: 'event_review',    label: 'Perizinan Event',    icon: 'fa-calendar-check' },
  { key: 'kta_config',    label: 'Konfigurasi KTA',  icon: 'fa-cogs'     },
  { key: 'daftar_ulang',  label: 'Daftar Ulang',     icon: 'fa-redo'     },
  { key: 'landing_page',  label: 'Landing Page',      icon: 'fa-palette'  },
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

const FileLink = ({ path, label = 'Lihat', onPreview }) => {
  const url = fileUrl(path);
  if (!url) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <button type="button" onClick={e => { e.stopPropagation(); onPreview && onPreview(url, label); }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 border border-blue-600 text-white text-[11px] font-bold shadow-sm hover:bg-blue-600 hover:shadow-md active:scale-[0.97] transition-all cursor-pointer">
      <i className="fas fa-eye text-[9px]" />{label}
    </button>
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
  const [selectedAppId, setSelectedAppId]     = useState(null);
  const [deleteKtaConfirm, setDeleteKtaConfirm] = useState({ show:false, id:null, name:'' });
  const [deleteKtaLoading, setDeleteKtaLoading] = useState(false);
  const [regeneratingKtaId, setRegeneratingKtaId] = useState(null);
  const [docPreview, setDocPreview] = useState({ show: false, url: '', title: '' });
  const [provinces, setProvinces]             = useState([]);
  const [cities, setCities]                   = useState([]);
  const [filterProvince, setFilterProvince]   = useState('');
  const [filterCity, setFilterCity]           = useState('');



  /* KTA Terbit */
  const [issuedKtas, setIssuedKtas]                   = useState([]);
  const [issuedKtaLoading, setIssuedKtaLoading]       = useState(false);
  const [issuedKtaPagination, setIssuedKtaPagination] = useState({ total:0, page:1, totalPages:1 });
  const [issuedSearch, setIssuedSearch]               = useState('');
  const [issuedFilterMonth, setIssuedFilterMonth]     = useState('');
  const [issuedFilterYear, setIssuedFilterYear]       = useState('');



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

  /* Event Review */
  const [pendingEvents, setPendingEvents]           = useState([]);
  const [allEvents, setAllEvents]                   = useState([]);
  const [pendingEventsLoading, setPendingEventsLoading] = useState(false);
  const [allEventsLoading, setAllEventsLoading]     = useState(false);
  const [selectedEvent, setSelectedEvent]           = useState(null);
  const [eventActionNotes, setEventActionNotes]     = useState('');
  const [eventActionLoading, setEventActionLoading] = useState(false);
  const [eventTab, setEventTab]                     = useState('pending');
  const [eventSearch, setEventSearch]               = useState('');
  const [eventFilterStatus, setEventFilterStatus]   = useState('');

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



  const fetchIssuedKtas = useCallback(async (page = 1) => {
    setIssuedKtaLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterProvince)    params.province_id = filterProvince;
      if (filterCity)        params.city_id     = filterCity;
      if (issuedFilterMonth) params.month       = issuedFilterMonth;
      if (issuedFilterYear)  params.year        = issuedFilterYear;
      if (issuedSearch)      params.search      = issuedSearch;
      const res = await api.get('/pb-payment/issued-kta', { params });
      setIssuedKtas(res.data.data?.issued_ktas || []);
      setIssuedKtaPagination(res.data.data?.pagination || { total:0, page:1, totalPages:1 });
    } catch { toast.error('Gagal memuat data KTA terbit'); }
    finally { setIssuedKtaLoading(false); }
  }, [filterProvince, filterCity, issuedFilterMonth, issuedFilterYear, issuedSearch]);



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

  const fetchPendingEvents = useCallback(async () => {
    setPendingEventsLoading(true);
    try {
      const res = await api.get('/events/admin/pending');
      setPendingEvents(res.data.data || []);
    } catch { toast.error('Gagal memuat pengajuan event'); }
    finally { setPendingEventsLoading(false); }
  }, []);

  const fetchAllEvents = useCallback(async (jenis) => {
    setAllEventsLoading(true);
    try {
      const params = {};
      if (eventSearch) params.search = eventSearch;
      if (eventFilterStatus) params.status = eventFilterStatus;
      if (jenis) params.jenis_pengajuan = jenis;
      const res = await api.get('/events/admin/all', { params });
      setAllEvents(res.data.data || []);
    } catch { toast.error('Gagal memuat data event'); }
    finally { setAllEventsLoading(false); }
  }, [eventSearch, eventFilterStatus]);

  const viewEventDetail = async (id) => {
    try {
      const res = await api.get(`/events/${id}`);
      setSelectedEvent(res.data.data);
    } catch { toast.error('Gagal memuat detail event'); }
  };

  const handleEventApprove = async (id) => {
    setEventActionLoading(true);
    try {
      await api.post(`/events/admin/${id}/approve`, { notes: eventActionNotes });
      toast.success('Event berhasil disetujui & surat rekomendasi digenerate');
      const backSection = selectedEvent?.jenis_pengajuan === 'kejurcab' ? 'kejurcab_review' : 'event_review';
      setSelectedEvent(null);
      setEventActionNotes('');
      setActiveSection(backSection);
      fetchPendingEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal approve event'); }
    finally { setEventActionLoading(false); }
  };

  const handleEventReject = async (id) => {
    if (!eventActionNotes.trim()) return toast.error('Alasan penolakan wajib diisi');
    setEventActionLoading(true);
    try {
      await api.post(`/events/admin/${id}/reject`, { reason: eventActionNotes });
      toast.success('Event berhasil ditolak');
      const backSection = selectedEvent?.jenis_pengajuan === 'kejurcab' ? 'kejurcab_review' : 'event_review';
      setSelectedEvent(null);
      setEventActionNotes('');
      setActiveSection(backSection);
      fetchPendingEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal reject event'); }
    finally { setEventActionLoading(false); }
  };

  /* ━━━━━ Effects ━━━━━ */
  // eslint-disable-next-line
  useEffect(() => { fetchKtaData(1); fetchProvinces(); fetchPendingEvents(); }, []);
  // eslint-disable-next-line
  useEffect(() => {
    if (activeSection === 'kta')        fetchKtaData(1);
    if (activeSection === 'kta_terbit') fetchIssuedKtas(1);

    if (activeSection === 'pengguna')   fetchUsers(1);
    if (activeSection === 'log')        fetchActivityLog();
    if (activeSection === 'kejurcab_review') { setEventTab('pending'); setEventSearch(''); setEventFilterStatus(''); fetchPendingEvents(); fetchAllEvents('kejurcab'); }
    if (activeSection === 'event_review') { setEventTab('pending'); setEventSearch(''); setEventFilterStatus(''); fetchPendingEvents(); fetchAllEvents('event_penyelenggara'); }
  }, [activeSection]); // eslint-disable-line
  // eslint-disable-next-line
  useEffect(() => { fetchCities(filterProvince); setFilterCity(''); }, [filterProvince]);
  // eslint-disable-next-line
  useEffect(() => { if (activeSection === 'kta') fetchKtaData(1); }, [filterProvince, filterCity, activeTab]);
  // eslint-disable-next-line
  useEffect(() => { if (activeSection === 'kta_terbit') fetchIssuedKtas(1); }, [filterProvince, filterCity, issuedFilterMonth, issuedFilterYear]);

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

  const handleDeleteKta = async () => {
    setDeleteKtaLoading(true);
    try {
      await api.delete(`/kta/applications/${deleteKtaConfirm.id}`);
      toast.success('Pengajuan KTA berhasil dihapus');
      setDeleteKtaConfirm({ show:false, id:null, name:'' });
      fetchKtaData(ktaPagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
    finally { setDeleteKtaLoading(false); }
  };

  const handleRegenerateKta = async (appId) => {
    setRegeneratingKtaId(appId);
    try {
      await api.post(`/kta/applications/${appId}/regenerate-all-pdfs`);
      toast.success('KTA PDF berhasil di-generate ulang');
      fetchKtaData(ktaPagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal generate ulang KTA'); }
    finally { setRegeneratingKtaId(null); }
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
    needs_pb_action: stats?.kta?.needs_pb_action || 0,
    approved_pb:     stats?.kta?.approved_pb     || 0,
    kta_issued:      stats?.kta?.kta_issued      || 0,
    rejected_pb:     stats?.kta?.rejected_pb     || 0,
    pending_awal:    stats?.kta?.pending_awal    || 0,
  };

  /* ━━━━━ Sidebar menu ━━━━━ */
  const menuItems = SECTIONS.map(s => {
    if (s.divider) return s;
    return {
      label:  s.label,
      icon:   <i className={`fas ${s.icon}`} />,
      onClick: () => setActiveSection(s.key),
      active:  activeSection === s.key,
      badge:   s.key === 'kta' && tabCounts.needs_pb_action > 0 ? tabCounts.needs_pb_action
             : s.key === 'kejurcab_review' && pendingEvents.filter(e => e.jenis_pengajuan === 'kejurcab').length > 0 ? pendingEvents.filter(e => e.jenis_pengajuan === 'kejurcab').length
             : s.key === 'event_review' && pendingEvents.filter(e => e.jenis_pengajuan === 'event_penyelenggara').length > 0 ? pendingEvents.filter(e => e.jenis_pengajuan === 'event_penyelenggara').length
             : null,
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
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4">
                {[
                  { icon:'fa-hourglass-half',  iconBg:'bg-gradient-to-br from-amber-500 to-amber-600',   shadowColor:'shadow-amber-500/25',   label:'Menunggu',       value:stats.kta?.needs_pb_action||0, highlight:true },
                  { icon:'fa-check-circle',    iconBg:'bg-gradient-to-br from-emerald-500 to-emerald-600',shadowColor:'shadow-emerald-500/25', label:'KTA Terbit',     value:stats.kta?.kta_issued || 0 },
                  { icon:'fa-users',          iconBg:'bg-gradient-to-br from-violet-500 to-violet-600',  shadowColor:'shadow-violet-500/25',  label:'Total Anggota Resmi',  value:stats.users?.total || 0 },
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
            <CustomSelect
              value={filterProvince}
              onChange={v=>setFilterProvince(v)}
              options={[{value:'',label:'Semua Provinsi'},...provinces.map(p=>({value:p.id,label:p.name}))]}
              placeholder="Semua Provinsi"
              icon="map-marker-alt"
              variant="filter"
              className="min-w-[160px]"
            />
            {/* City */}
            <CustomSelect
              value={filterCity}
              onChange={v=>setFilterCity(v)}
              options={[{value:'',label:'Semua Kota'},...cities.map(c=>({value:c.id,label:c.name}))]}
              placeholder="Semua Kota"
              icon="city"
              variant="filter"
              disabled={!filterProvince}
              className="min-w-[150px]"
            />
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
                        <FileLink path={app.payment_proof_path} label="Bukti" onPreview={(url, lbl) => setDocPreview({ show: true, url, title: lbl })}/>
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
                          ? <button key={f.label} type="button" onClick={() => setDocPreview({ show: true, url: fileUrl(f.path), title: `KTA ${f.label}` })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500 text-white text-[11px] font-bold shadow-sm hover:bg-blue-600 hover:shadow-md active:scale-[0.97] transition-all cursor-pointer">
                              <i className="fas fa-file-pdf text-[9px]"/>{f.label}
                            </button>
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
                        <button type="button" onClick={()=>{setSelectedAppId(app.id);setActiveSection('kta_detail');}} title="Detail"
                          className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white active:scale-[0.97] transition-all">
                          <i className="fas fa-eye text-[10px]"/>
                        </button>
                        {['approved_pb','kta_issued'].includes(app.status) && (
                          <button type="button" onClick={()=>handleRegenerateKta(app.id)} title="Generate Ulang KTA"
                            disabled={regeneratingKtaId===app.id}
                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-300 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <i className={`fas fa-rotate text-[10px] ${regeneratingKtaId===app.id ? 'animate-spin' : ''}`}/>
                          </button>
                        )}
                        <button type="button" onClick={()=>setDeleteKtaConfirm({show:true, id:app.id, name:app.club_name||`#${app.id}`})} title="Hapus"
                          className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 active:scale-[0.97] transition-all">
                          <i className="fas fa-trash text-[10px]"/>
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
  const [issuedExporting, setIssuedExporting] = useState(false);

  const handleExportIssuedKta = async () => {
    setIssuedExporting(true);
    try {
      const params = {};
      if (filterProvince)    params.province_id = filterProvince;
      if (filterCity)        params.city_id     = filterCity;
      if (issuedFilterMonth) params.month       = issuedFilterMonth;
      if (issuedFilterYear)  params.year        = issuedFilterYear;
      if (issuedSearch)      params.search      = issuedSearch;
      const res = await api.get('/pb-payment/export-issued-kta', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `KTA_Terbit${issuedFilterYear ? '_' + issuedFilterYear : ''}${issuedFilterMonth ? '_' + issuedFilterMonth : ''}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export berhasil');
    } catch { toast.error('Gagal export data'); }
    finally { setIssuedExporting(false); }
  };

  const renderKtaTerbitSection = () => (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap px-5 py-4 bg-[#141620] border border-white/[0.06] rounded-2xl">
        <span className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest"><i className="fas fa-filter text-emerald-500"/>Filter</span>
        <CustomSelect
          value={filterProvince}
          onChange={v=>{setFilterProvince(v);setFilterCity('');}}
          options={[{value:'',label:'Semua Pengda'},...provinces.map(p=>({value:String(p.id),label:p.name}))]}
          placeholder="Semua Pengda"
          variant="filter"
          className="min-w-[160px]"
        />
        <CustomSelect
          value={filterCity}
          onChange={v=>setFilterCity(v)}
          options={[{value:'',label:'Semua Pengcab'},...cities.map(c=>({value:String(c.id),label:c.name}))]}
          placeholder="Semua Pengcab"
          variant="filter"
          className="min-w-[160px]"
          disabled={!filterProvince}
        />
        <CustomSelect
          value={issuedFilterMonth}
          onChange={v=>setIssuedFilterMonth(v)}
          options={[{value:'',label:'Semua Bulan'},...Array.from({length:12},(_,i)=>({value:String(i+1),label:new Date(0,i).toLocaleString('id-ID',{month:'long'})}))]} 
          placeholder="Semua Bulan"
          variant="filter"
          className="min-w-[140px]"
        />
        <CustomSelect
          value={issuedFilterYear}
          onChange={v=>setIssuedFilterYear(v)}
          options={[{value:'',label:'Semua Tahun'},...Array.from({length:5},(_,i)=>{const y=new Date().getFullYear()-2+i;return{value:String(y),label:String(y)};})]} 
          placeholder="Semua Tahun"
          variant="filter"
          className="min-w-[100px]"
        />
        <BtnGhost onClick={()=>{setFilterProvince('');setFilterCity('');setIssuedFilterMonth('');setIssuedFilterYear('');}} sm>Reset</BtnGhost>
      </div>

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
          <BtnGhost onClick={handleExportIssuedKta} disabled={issuedExporting} sm>
            <i className={`fas ${issuedExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}/>
            {issuedExporting ? 'Exporting...' : 'Export Excel'}
          </BtnGhost>
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
                        <button type="button" onClick={()=>{setSelectedAppId(kta.id);setActiveSection('kta_detail');}} title="Lihat Detail"
                          className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/25 hover:bg-blue-600 hover:shadow-md active:scale-[0.97] transition-all">
                          <i className="fas fa-eye text-xs"/>
                        </button>
                        {kta.generated_kta_file_path_pb&&(
                          <button type="button" onClick={() => setDocPreview({ show: true, url: fileUrl(kta.generated_kta_file_path_pb), title: 'KTA PDF' })} title="Lihat KTA"
                            className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 hover:shadow-md active:scale-[0.97] transition-all cursor-pointer">
                            <i className="fas fa-file-pdf text-xs"/>
                          </button>
                        )}
                        <button type="button" onClick={()=>handleRegenerateKta(kta.id)} title="Generate Ulang KTA"
                          disabled={regeneratingKtaId===kta.id}
                          className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500/20 hover:border-amber-500/30 hover:text-amber-300 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          <i className={`fas fa-rotate text-xs ${regeneratingKtaId===kta.id ? 'animate-spin' : ''}`}/>
                        </button>
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
    </div>
  );

  /* ── Pengguna ── */
  const renderPenggunaSection = () => (
    <Panel>
      <PanelHeader icon="fa-users" grad="from-blue-500 to-blue-600" title="Manajemen Pengguna" subtitle={`${userPagination.total||0} pengguna terdaftar`}
        actions={<>
          <CustomSelect
            value={userRoleFilter}
            onChange={v=>setUserRoleFilter(v)}
            options={[{value:'',label:'Semua Role'},...Object.entries(ROLE_LABELS).map(([id,lbl])=>({value:id,label:lbl}))]}
            placeholder="Semua Role"
            variant="filter"
            className="min-w-[130px]"
          />
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

  /* ══════════════════════════════════════
     EVENT REVIEW — Perizinan & Rekomendasi
  ══════════════════════════════════════ */
  const EVENT_STATUS_MAP = {
    draft:            { label:'Draft',             dot:'bg-gray-400',    ring:'ring-gray-400/20',    bg:'bg-white/[0.05]',      text:'text-gray-400' },
    submitted:        { label:'Menunggu Review',   dot:'bg-amber-400',   ring:'ring-amber-400/20',   bg:'bg-amber-500/10',      text:'text-amber-400' },
    approved_pengcab: { label:'Disetujui Pengcab', dot:'bg-blue-400',    ring:'ring-blue-400/20',    bg:'bg-blue-500/10',       text:'text-blue-400' },
    rejected_pengcab: { label:'Ditolak Pengcab',   dot:'bg-red-500',     ring:'ring-red-500/20',     bg:'bg-red-500/10',        text:'text-red-400' },
    approved_admin:   { label:'Disetujui PB',      dot:'bg-emerald-500', ring:'ring-emerald-500/20', bg:'bg-emerald-500/10',    text:'text-emerald-400' },
    rejected_admin:   { label:'Ditolak PB',        dot:'bg-red-500',     ring:'ring-red-500/20',     bg:'bg-red-500/10',        text:'text-red-400' },
  };
  const eventBadge = (status) => {
    const s = EVENT_STATUS_MAP[status] || { label: status, dot:'bg-gray-400', ring:'ring-gray-400/20', bg:'bg-white/[0.05]', text:'text-gray-400' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ring-1 ${s.ring} ${s.bg} ${s.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{s.label}
      </span>
    );
  };

  const JENIS_MAP = {
    kejurcab:            { label:'Kejurcab',          icon:'fa-trophy',     color:'text-amber-400',  bg:'bg-amber-500/10' },
    event_penyelenggara: { label:'Event Penyelenggara',icon:'fa-calendar-alt',color:'text-blue-400', bg:'bg-blue-500/10' },
  };

  const renderEventSection = (jenisFilter) => {
    const cfg = {
      kejurcab:            { title: 'Perizinan Kejurcab',         subtitle: 'Kelola perizinan event kejurcab',        icon: 'fa-trophy',         gradient: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/25', emptyIcon: 'fa-trophy',         emptyColor: 'bg-amber-500/10 text-amber-400' },
      event_penyelenggara: { title: 'Perizinan Event Reguler',    subtitle: 'Kelola perizinan event penyelenggara',   icon: 'fa-calendar-check', gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/25', emptyIcon: 'fa-calendar-check', emptyColor: 'bg-indigo-500/10 text-indigo-400' },
    }[jenisFilter];

    const isAllTab = eventTab === 'all';
    const filteredPending = pendingEvents.filter(e => e.jenis_pengajuan === jenisFilter);
    const events = isAllTab ? allEvents : filteredPending;
    const isLoading = isAllTab ? allEventsLoading : pendingEventsLoading;

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg ${cfg.shadow} flex-shrink-0`}>
              <i className={`fas ${cfg.icon} text-white text-sm`}/>
            </div>
            <div>
              <h2 className="m-0 text-base font-bold text-white leading-tight">{cfg.title}</h2>
              <p className="m-0 mt-0.5 text-[11px] text-gray-500">{cfg.subtitle}</p>
            </div>
          </div>
          {filteredPending.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 animate-pulse">
              <i className="fas fa-bell"/>{filteredPending.length} menunggu review
            </span>
          )}
        </div>

        {/* Tabs: Pending / Semua */}
        <div className="flex gap-2">
          {[
            { key:'pending', label:'Menunggu Review', icon:'fa-hourglass-half', count: filteredPending.length },
            { key:'all',     label:'Semua',           icon:'fa-list',           count: allEvents.length },
          ].map(t => (
            <button key={t.key} onClick={() => setEventTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border cursor-pointer
                ${eventTab === t.key
                  ? `bg-gradient-to-br ${cfg.gradient} text-white border-transparent shadow-lg ${cfg.shadow.replace('shadow-','shadow-')}/20`
                  : 'bg-white/[0.04] border-white/[0.06] text-gray-400 hover:bg-white/[0.08] hover:text-white'}`}>
              <i className={`fas ${t.icon} text-xs`}/>
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${eventTab === t.key ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-gray-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter bar (only for "all" tab) */}
        {isAllTab && (
          <div className="flex items-center gap-2 flex-wrap p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
            <div className="flex-1 min-w-[140px]">
              <input type="text" placeholder="Cari nama event..." className={INPUT} value={eventSearch}
                onChange={e => setEventSearch(e.target.value)} />
            </div>
            <CustomSelect value={eventFilterStatus} onChange={v => setEventFilterStatus(v)}
              options={[
                {value:'',label:'Semua Status'},
                {value:'submitted',label:'Menunggu Review'},
                ...(jenisFilter === 'event_penyelenggara' ? [{value:'approved_pengcab',label:'Disetujui Pengcab'}] : []),
                {value:'approved_admin',label:'Disetujui PB'},
                {value:'rejected_admin',label:'Ditolak PB'},
                ...(jenisFilter === 'event_penyelenggara' ? [{value:'rejected_pengcab',label:'Ditolak Pengcab'}] : []),
              ]}
              placeholder="Semua Status" icon="tasks" variant="filter" className="min-w-[150px]" />
            <BtnPrimary sm onClick={() => fetchAllEvents(jenisFilter)}>
              <i className="fas fa-search"/>Cari
            </BtnPrimary>
            <BtnGhost sm onClick={() => { setEventSearch(''); setEventFilterStatus(''); }}>
              Reset
            </BtnGhost>
          </div>
        )}

        {/* Event list */}
        <Panel>
          <CardBody>
            {isLoading ? (
              <div className="py-16 flex justify-center"><LoadingSpinner/></div>
            ) : events.length === 0 ? (
              <div className="py-16 text-center">
                <div className={`w-16 h-16 rounded-2xl ${cfg.emptyColor.split(' ')[0]} flex items-center justify-center mx-auto mb-4`}>
                  <i className={`fas ${cfg.emptyIcon} text-2xl ${cfg.emptyColor.split(' ')[1]}`}/>
                </div>
                <p className="text-gray-400 text-sm m-0">
                  {isAllTab ? 'Belum ada data event' : 'Tidak ada event yang menunggu review'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map(ev => {
                  const jenis = JENIS_MAP[ev.jenis_pengajuan] || JENIS_MAP.event_penyelenggara;
                  return (
                    <div key={ev.id}
                      onClick={() => { viewEventDetail(ev.id); setActiveSection('event_review_detail'); }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer group">

                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl ${jenis.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <i className={`fas ${jenis.icon} ${jenis.color} text-sm`}/>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="text-white font-semibold text-sm m-0 truncate">{ev.nama_event}</h3>
                        </div>
                        <p className="text-gray-500 text-xs m-0 truncate">
                          <span className="text-amber-400/80">{ev.nama_organisasi || ev.username}</span>
                          {ev.province_name && <><span className="mx-1.5">•</span>{ev.city_name || ev.province_name}</>}
                          <span className="mx-1.5">•</span>
                          <i className="fas fa-calendar mr-1"/>{new Date(ev.tanggal_mulai).toLocaleDateString('id-ID',{ day:'numeric', month:'short', year:'numeric' })}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        {eventBadge(ev.status)}
                      </div>
                      <i className="fas fa-chevron-right text-gray-600 text-xs flex-shrink-0 group-hover:text-gray-400 transition-colors"/>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Panel>
      </div>
    );
  };

  const renderEventReviewDetail = () => {
    const ev = selectedEvent;
    const uploadsBase = `${API_BASE}/uploads/event_files/`;
    const canAction = (ev.jenis_pengajuan === 'kejurcab' && ev.status === 'submitted')
                   || (ev.jenis_pengajuan === 'event_penyelenggara' && ev.status === 'approved_pengcab');

    const persyaratanLabels = {
      suratIzinSekolah:       'Surat Izin Sekolah/Instansi',
      suratIzinKepolisian:    'Surat Izin Kepolisian',
      suratRekomendasiDinas:  'Surat Rekomendasi Dinas',
      suratIzinVenue:         'Surat Izin Venue',
      suratRekomendasiPPI:    'Surat Rekomendasi PPI',
      fotoLapangan:           'Foto Lapangan',
      fotoTempatIbadah:       'Foto Tempat Ibadah',
      fotoBarak:              'Foto Barak',
      fotoAreaParkir:         'Foto Area Parkir',
      fotoRuangKesehatan:     'Foto Ruang Kesehatan',
      fotoMCK:                'Foto MCK',
      fotoTempatSampah:       'Foto Tempat Sampah',
      fotoRuangKomisi:        'Foto Ruang Komisi',
      faktaIntegritasKomisi:  'Fakta Integritas Komisi',
      faktaIntegritasHonor:   'Fakta Integritas Honor',
      faktaIntegritasPanitia: 'Fakta Integritas Panitia',
      desainSertifikat:       'Desain Sertifikat',
    };

    const persyaratan = ev.persyaratan ? (typeof ev.persyaratan === 'string' ? JSON.parse(ev.persyaratan) : ev.persyaratan) : {};
    const mataLomba = ev.mata_lomba ? (typeof ev.mata_lomba === 'string' ? JSON.parse(ev.mata_lomba) : ev.mata_lomba) : [];
    const jenis = JENIS_MAP[ev.jenis_pengajuan] || JENIS_MAP.event_penyelenggara;

    return (
      <div className="space-y-5">
        {/* Back */}
        <button className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors bg-transparent border-none cursor-pointer p-0"
          onClick={() => { const back = ev.jenis_pengajuan === 'kejurcab' ? 'kejurcab_review' : 'event_review'; setSelectedEvent(null); setActiveSection(back); }}>
          <i className="fas fa-arrow-left text-xs"/>Kembali
        </button>

        {/* Header card */}
        <Panel>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${jenis.bg} flex items-center justify-center flex-shrink-0`}>
                  <i className={`fas ${jenis.icon} ${jenis.color} text-lg`}/>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white m-0">{ev.nama_event}</h2>
                  <p className="text-gray-500 text-sm m-0 mt-1">
                    <span className={`${jenis.color}`}>{jenis.label}</span>
                    <span className="mx-2">—</span>
                    <span className="text-amber-400">{ev.user?.club_name || ev.nama_organisasi || ''}</span>
                  </p>
                </div>
              </div>
              {eventBadge(ev.status)}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {[
                { icon:'fa-map-marker-alt', label:'Lokasi',     value: ev.lokasi },
                { icon:'fa-calendar',       label:'Tanggal',    value: `${new Date(ev.tanggal_mulai).toLocaleDateString('id-ID')} - ${new Date(ev.tanggal_selesai).toLocaleDateString('id-ID')}` },
                ev.penyelenggara && { icon:'fa-building', label:'Penyelenggara', value: ev.penyelenggara },
                ev.kontak_person && { icon:'fa-phone',    label:'Kontak',        value: ev.kontak_person },
                ev.province_name && { icon:'fa-globe',    label:'Wilayah',       value: `${ev.city_name || ''} ${ev.province_name}`.trim() },
              ].filter(Boolean).map(r => (
                <div key={r.label} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <i className={`fas ${r.icon} text-gray-500 text-xs mt-0.5`}/>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider m-0">{r.label}</p>
                    <p className="text-sm text-gray-200 m-0 mt-0.5">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Deskripsi */}
            {ev.deskripsi && (
              <div className="mb-6">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider m-0 mb-1.5">Deskripsi</p>
                <p className="text-gray-300 text-sm m-0 whitespace-pre-wrap leading-relaxed">{ev.deskripsi}</p>
              </div>
            )}

            {/* Mata Lomba */}
            {mataLomba.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider m-0 mb-2">Mata Lomba ({mataLomba.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mataLomba.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-gray-200 text-sm flex-1 truncate">{m.nama}</span>
                      {m.tanggal && <span className="text-gray-500 text-[11px] flex-shrink-0">{m.tanggal}</span>}
                      {m.waktu && <span className="text-gray-600 text-[11px] flex-shrink-0">{m.waktu}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Persyaratan */}
            {Object.keys(persyaratan).length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider m-0 mb-2">Persyaratan & Dokumen</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(persyaratan).map(([key, val]) => {
                    if (!val || key === 'namaJuri') return null;
                    const label = persyaratanLabels[key] || key;
                    const isFile = typeof val === 'string' && (val.endsWith('.pdf') || val.endsWith('.jpg') || val.endsWith('.png') || val.endsWith('.jpeg') || val.includes('/'));
                    const isBool = typeof val === 'boolean';
                    return (
                      <div key={key} className="flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                        <i className={`fas ${isFile ? 'fa-file-alt text-blue-400' : isBool ? 'fa-check-circle text-emerald-400' : 'fa-info-circle text-gray-500'} text-xs flex-shrink-0`}/>
                        <span className="text-gray-300 text-sm flex-1 truncate">{label}</span>
                        {isFile ? (
                          <a href={`${uploadsBase}${key}/${val}`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-semibold hover:bg-blue-500/20 transition-all no-underline flex-shrink-0">
                            <i className="fas fa-eye text-[9px]"/>Lihat
                          </a>
                        ) : !isBool ? (
                          <span className="text-gray-400 text-xs flex-shrink-0 max-w-[120px] truncate" title={String(val)}>{String(val)}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Juri list if present */}
                {persyaratan.namaJuri && persyaratan.namaJuri.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider m-0 mb-2">Daftar Juri</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {persyaratan.namaJuri.map((j, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                          <div className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                          <div className="min-w-0">
                            <p className="text-gray-200 text-sm m-0 truncate">{j.nama || '-'}</p>
                            <p className="text-gray-500 text-[11px] m-0">{j.posisi || '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dokumen Upload (proposal, poster, etc) */}
            {(ev.proposal_kegiatan || ev.poster || ev.surat_izin_tempat) && (
              <div className="mb-6">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider m-0 mb-2">Dokumen Upload</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key:'proposal_kegiatan', icon:'fa-file-pdf',   label:'Proposal' },
                    { key:'poster',            icon:'fa-image',      label:'Poster' },
                    { key:'surat_izin_tempat', icon:'fa-file-alt',   label:'Surat Izin Tempat' },
                  ].map(d => {
                    if (!ev[d.key]) return null;
                    return (
                      <a key={d.key} href={`${uploadsBase}${d.key}/${ev[d.key]}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-xl hover:bg-blue-500/20 transition-all no-underline border border-blue-500/20">
                        <i className={`fas ${d.icon}`}/>{d.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {ev.rejection_reason && (
              <div className="px-4 py-3 bg-red-500/10 rounded-xl border border-red-500/20 mb-5">
                <p className="text-red-400 text-sm font-semibold m-0"><i className="fas fa-times-circle mr-2"/>Alasan Penolakan</p>
                <p className="text-red-300 text-sm m-0 mt-1">{ev.rejection_reason}</p>
              </div>
            )}

            {/* Pengcab approval info */}
            {ev.approved_by_pengcab_at && (
              <div className="px-4 py-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-5">
                <p className="text-blue-400 text-sm font-semibold m-0"><i className="fas fa-check-circle mr-2"/>Disetujui oleh Pengcab</p>
                <p className="text-blue-300/70 text-xs m-0 mt-1">{new Date(ev.approved_by_pengcab_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</p>
              </div>
            )}

            {/* Surat rekomendasi download (if already approved) */}
            {ev.surat_rekomendasi_path && (
              <div className="px-4 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-emerald-400 text-sm font-semibold m-0"><i className="fas fa-file-pdf mr-2"/>Surat Rekomendasi</p>
                    <p className="text-emerald-300/70 text-xs m-0 mt-1">Surat rekomendasi telah digenerate</p>
                  </div>
                  <a href={`${API_BASE}/uploads/${ev.surat_rekomendasi_path}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all no-underline">
                    <i className="fas fa-download"/>Download PDF
                  </a>
                </div>
              </div>
            )}

            {/* Action area */}
            {canAction && (
              <div className="border-t border-white/[0.06] pt-5 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <i className="fas fa-gavel text-indigo-400 text-xs"/>
                  </div>
                  <h4 className="text-sm font-bold text-white m-0">Tindakan</h4>
                </div>
                <div className="mb-4">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Catatan / Alasan Penolakan</label>
                  <textarea value={eventActionNotes} onChange={e => setEventActionNotes(e.target.value)}
                    className={`${INPUT} min-h-[80px] resize-none`} placeholder="Tulis catatan persetujuan atau alasan penolakan..." />
                </div>
                <div className="flex gap-3">
                  <BtnPrimary onClick={() => handleEventApprove(ev.id)} disabled={eventActionLoading}>
                    {eventActionLoading
                      ? <><i className="fas fa-spinner fa-spin"/>Memproses...</>
                      : <><i className="fas fa-check-circle"/>Setujui & Generate Surat</>}
                  </BtnPrimary>
                  <BtnDanger onClick={() => handleEventReject(ev.id)} disabled={eventActionLoading}>
                    {eventActionLoading
                      ? <><i className="fas fa-spinner fa-spin"/>Memproses...</>
                      : <><i className="fas fa-times-circle"/>Tolak Pengajuan</>}
                  </BtnDanger>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    );
  };

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

      {activeSection==='pengguna'   && renderPenggunaSection()}
      {activeSection==='log'        && renderLogSection()}
      {activeSection==='profil'     && renderProfilSection()}
      {activeSection==='lisensi'     && <ManageLicense embedded />}
      {activeSection==='kejurnas'    && <KejurnasManage embedded />}
      {activeSection==='kejurcab_review' && renderEventSection('kejurcab')}
      {activeSection==='event_review' && renderEventSection('event_penyelenggara')}
      {activeSection==='event_review_detail' && selectedEvent && renderEventReviewDetail()}
      {activeSection==='kta_config'  && <KtaConfigPage embedded />}
      {activeSection==='daftar_ulang' && <ManageReregistration embedded />}
      {activeSection==='landing_page'  && <ManageLandingPage embedded />}
      {activeSection==='kta_detail' && selectedAppId && (
        <KtaDetailPanel
          appId={selectedAppId}
          onBack={()=>{setActiveSection('kta');setSelectedAppId(null);}}
          onStatusUpdated={()=>fetchKtaData(ktaPagination.page)}
        />
      )}

      {/* Modals */}
      <ConfirmModal show={rejectModal.show} title="Tolak Pengajuan KTA?" message="Masukkan alasan penolakan."
        onConfirm={handleRejectConfirm} onCancel={()=>{setRejectModal({show:false,id:null});setRejectReason('');}}
        danger confirmText="Tolak" showReason reason={rejectReason} onReasonChange={setRejectReason} reasonLabel="Alasan *"/>
      <ConfirmModal show={deleteKtaConfirm.show} title="Hapus Pengajuan KTA?" message={`Yakin ingin menghapus pengajuan KTA "${deleteKtaConfirm.name}"? Semua data dan file terkait akan dihapus permanen.`}
        onConfirm={handleDeleteKta} onCancel={()=>setDeleteKtaConfirm({show:false,id:null,name:''})} danger confirmText="Hapus" loading={deleteKtaLoading}/>


      <ConfirmModal show={deleteConfirm.show} title="Hapus Pengguna?" message={`Yakin ingin menghapus "${deleteConfirm.name}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={handleDeleteUser} onCancel={()=>setDeleteConfirm({show:false,id:null,name:''})} danger confirmText="Hapus"/>
      <ConfirmModal show={resetConfirm.show} title="Reset Password?" message={`Reset password "${resetConfirm.name}" ke password default?`}
        onConfirm={handleResetPassword} onCancel={()=>setResetConfirm({show:false,id:null,name:''})} confirmText="Reset"/>
      <DocumentPreviewModal show={docPreview.show} url={docPreview.url} title={docPreview.title} onClose={() => setDocPreview({ show: false, url: '', title: '' })} />
      </div>
    </SidebarLayout>
  );
}
