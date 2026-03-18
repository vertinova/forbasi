import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SidebarLayout from '../../components/layout/SidebarLayout';
import CustomSelect from '../../components/common/CustomSelect';
import KtaDetailPanel from '../../components/common/KtaDetailPanel';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import KtaConfigPage from '../config/KtaConfigPage';
import ManageReregistration from '../config/ManageReregistration';
import KejurcabSubmitForm from '../event/KejurcabSubmitForm';
import KejurdaManage from '../kejurda/KejurdaManage';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS_MAP = {
  pending: { label: 'Pending', dot: 'bg-amber-400', ring: 'ring-amber-400/20', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  approved_pengcab: { label: 'Approved Pengcab', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  approved_pengda: { label: 'Approved Pengda', dot: 'bg-teal-500', ring: 'ring-teal-500/20', bg: 'bg-teal-500/10', text: 'text-teal-400' },
  approved_pb: { label: 'Approved PB', dot: 'bg-blue-500', ring: 'ring-blue-500/20', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  kta_issued: { label: 'KTA Terbit', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  rejected_pengcab: { label: 'Ditolak Pengcab', dot: 'bg-red-500', ring: 'ring-red-500/20', bg: 'bg-red-500/10', text: 'text-red-400' },
  rejected_pengda: { label: 'Ditolak Pengda', dot: 'bg-orange-500', ring: 'ring-orange-500/20', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  rejected_pb: { label: 'Ditolak PB', dot: 'bg-rose-500', ring: 'ring-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-400' },
  resubmit_to_pengda: { label: 'Ajukan Ulang', dot: 'bg-violet-500', ring: 'ring-violet-500/20', bg: 'bg-violet-500/10', text: 'text-violet-400' },
};
const badge = (status) => {
  const s = STATUS_MAP[status] || { label: status, dot: 'bg-gray-400', ring: 'ring-gray-400/20', bg: 'bg-white/[0.05]', text: 'text-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ring-1 ${s.ring} ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
};

const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
const SEL = 'w-full pl-3 pr-8 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all cursor-pointer';
const SPINNER = <div className="py-16 flex justify-center"><div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

const EVENT_STATUS_MAP = {
  draft: { label: 'Draft', dot: 'bg-gray-400', ring: 'ring-gray-400/20', bg: 'bg-white/[0.05]', text: 'text-gray-400' },
  submitted: { label: 'Menunggu Review', dot: 'bg-amber-400', ring: 'ring-amber-400/20', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  approved_pengcab: { label: 'Disetujui Pengcab', dot: 'bg-blue-400', ring: 'ring-blue-400/20', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  rejected_pengcab: { label: 'Ditolak Pengcab', dot: 'bg-red-500', ring: 'ring-red-500/20', bg: 'bg-red-500/10', text: 'text-red-400' },
  approved_admin: { label: 'Disetujui', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  rejected_admin: { label: 'Ditolak', dot: 'bg-red-500', ring: 'ring-red-500/20', bg: 'bg-red-500/10', text: 'text-red-400' },
};
const eventBadge = (status) => {
  const s = EVENT_STATUS_MAP[status] || { label: status, dot: 'bg-gray-400', ring: 'ring-gray-400/20', bg: 'bg-white/[0.05]', text: 'text-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ring-1 ${s.ring} ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
};

export default function PengcabDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('kta');

  // KTA Applications state
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirm, setConfirm] = useState({ show: false, id: null, status: '', title: '', message: '' });
  const [confirmReason, setConfirmReason] = useState('');
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [ktaPagination, setKtaPagination] = useState({ page: 1, totalPages: 1 });
  const [docPreview, setDocPreview] = useState({ show: false, url: '', title: '' });

  // Members state
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberKtaFilter, setMemberKtaFilter] = useState('all');
  const [membersPagination, setMembersPagination] = useState({ page: 1, totalPages: 1 });

  // Issued KTA Members state
  const [issuedKtas, setIssuedKtas] = useState([]);
  const [issuedKtasLoading, setIssuedKtasLoading] = useState(false);
  const [issuedKtaSearch, setIssuedKtaSearch] = useState('');
  const [issuedKtasPagination, setIssuedKtasPagination] = useState({ page: 1, totalPages: 1 });

  // Kejurcab state
  const [myKejurcabs, setMyKejurcabs] = useState([]);
  const [kejurcabLoading, setKejurcabLoading] = useState(false);

  // Event Review state
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingEventsLoading, setPendingEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventActionNotes, setEventActionNotes] = useState('');
  const [eventActionLoading, setEventActionLoading] = useState(false);

  // Balance state
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsPagination, setTransactionsPagination] = useState({ page: 1, totalPages: 1 });
  const [pengdaBankInfo, setPengdaBankInfo] = useState(null);

  useEffect(() => { fetchData(); fetchPendingEvents(); }, []);
  useEffect(() => { if (activeTab === 'members') fetchMembers(); }, [activeTab, memberSearch, memberKtaFilter]);
  useEffect(() => { if (activeTab === 'issued') fetchIssuedKtas(); }, [activeTab, issuedKtaSearch]);
  useEffect(() => { if (activeTab === 'balance') { fetchBalance(); fetchTransactions(); fetchPengdaBankInfo(); } }, [activeTab]);
  useEffect(() => { if (activeTab === 'kejurcab') fetchMyKejurcabs(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'review_event') fetchPendingEvents(); }, [activeTab]);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/kta/applications', { params: { search, status: filterStatus, page, limit: 10 } }),
        api.get('/kta/stats')
      ]);
      setApplications(appsRes.data.data.applications || []);
      setKtaPagination(appsRes.data.data.pagination || { page: 1, totalPages: 1 });
      setStats(statsRes.data.data);
    } catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
  };

  const fetchMembers = async (page = 1) => {
    setMembersLoading(true);
    try {
      const res = await api.get('/users/members-with-kta', {
        params: { search: memberSearch, kta_status: memberKtaFilter, page, limit: 10 }
      });
      setMembers(res.data.data.members || []);
      setMembersPagination(res.data.data.pagination || { page: 1, totalPages: 1 });
    } catch { toast.error('Gagal memuat data anggota'); }
    finally { setMembersLoading(false); }
  };

  const fetchIssuedKtas = async (page = 1) => {
    setIssuedKtasLoading(true);
    try {
      const res = await api.get('/users/issued-kta-members', {
        params: { search: issuedKtaSearch, page, limit: 10 }
      });
      setIssuedKtas(res.data.data.members || []);
      setIssuedKtasPagination(res.data.data.pagination || { page: 1, totalPages: 1 });
    } catch { /* ignore */ }
    finally { setIssuedKtasLoading(false); }
  };

  const fetchBalance = async () => {
    try {
      const res = await api.get('/pb-payment/pengcab/balance-summary');
      setBalanceSummary(res.data.data);
    } catch { /* ignore */ }
  };

  const fetchTransactions = async (page = 1) => {
    setTransactionsLoading(true);
    try {
      const res = await api.get('/pb-payment/pengcab/transactions', { params: { page, limit: 10 } });
      setTransactions(res.data.data.transactions || []);
      setTransactionsPagination(res.data.data.pagination || { page: 1, totalPages: 1 });
    } catch { /* ignore */ }
    finally { setTransactionsLoading(false); }
  };

  const fetchPengdaBankInfo = async () => {
    try {
      const res = await api.get('/pb-payment/pengcab/pengda-bank-info');
      setPengdaBankInfo(res.data.data);
    } catch { /* ignore */ }
  };

  const fetchMyKejurcabs = async () => {
    setKejurcabLoading(true);
    try {
      const res = await api.get('/events/my-events', { params: { jenis: 'kejurcab' } });
      setMyKejurcabs(res.data.data || []);
    } catch { toast.error('Gagal memuat data kejurcab'); }
    finally { setKejurcabLoading(false); }
  };

  const fetchPendingEvents = async () => {
    setPendingEventsLoading(true);
    try {
      const res = await api.get('/events/pengcab/pending');
      setPendingEvents(res.data.data || []);
    } catch { toast.error('Gagal memuat pengajuan event'); }
    finally { setPendingEventsLoading(false); }
  };

  const handleEventApprove = async (id) => {
    setEventActionLoading(true);
    try {
      await api.post(`/events/pengcab/${id}/approve`, { notes: eventActionNotes });
      toast.success('Event berhasil disetujui');
      setSelectedEvent(null);
      setEventActionNotes('');
      fetchPendingEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal approve'); }
    finally { setEventActionLoading(false); }
  };

  const handleEventReject = async (id) => {
    if (!eventActionNotes.trim()) return toast.error('Alasan penolakan wajib diisi');
    setEventActionLoading(true);
    try {
      await api.post(`/events/pengcab/${id}/reject`, { reason: eventActionNotes });
      toast.success('Event berhasil ditolak');
      setSelectedEvent(null);
      setEventActionNotes('');
      fetchPendingEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal reject'); }
    finally { setEventActionLoading(false); }
  };

  const viewEventDetail = async (id) => {
    try {
      const res = await api.get(`/events/${id}`);
      setSelectedEvent(res.data.data);
    } catch { toast.error('Gagal memuat detail event'); }
  };

  const handleFilter = (e) => { e.preventDefault(); fetchData(); };

  const handleUpdateStatus = async () => {
    try {
      const payload = { status: confirm.status };
      if (['rejected_pengcab'].includes(confirm.status)) {
        payload.rejection_reason = confirmReason;
        payload.notes = confirmReason;
      } else if (confirmReason) {
        payload.notes = confirmReason;
      }
      await api.patch(`/kta/applications/${confirm.id}/status`, payload);
      toast.success('Status berhasil diperbarui');
      setConfirm({ show: false });
      setConfirmReason('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal memperbarui status'); }
  };

  const menuItems = [
    { icon: <i className="fas fa-file-invoice" />, label: 'Pengajuan KTA', onClick: () => setActiveTab('kta'), active: activeTab === 'kta' },
    { icon: <i className="fas fa-users" />, label: 'Anggota Cabang', onClick: () => setActiveTab('members'), active: activeTab === 'members' },
    { icon: <i className="fas fa-id-card" />, label: 'KTA Terbit', onClick: () => setActiveTab('issued'), active: activeTab === 'issued' },
    { icon: <i className="fas fa-wallet" />, label: 'Saldo dari PB', onClick: () => setActiveTab('balance'), active: activeTab === 'balance' },
    { divider: true, dividerLabel: 'Kejurcab & Event' },
    { icon: <i className="fas fa-trophy" />, label: 'Kejurcab Saya', onClick: () => setActiveTab('kejurcab'), active: activeTab === 'kejurcab' },
    { icon: <i className="fas fa-plus-circle" />, label: 'Ajukan Kejurcab', onClick: () => setActiveTab('submit_kejurcab'), active: activeTab === 'submit_kejurcab' },
    { icon: <i className="fas fa-clipboard-check" />, label: 'Review Event', onClick: () => setActiveTab('review_event'), active: activeTab === 'review_event', badge: pendingEvents.length },
    { icon: <i className="fas fa-medal" />, label: 'Kejurda', onClick: () => setActiveTab('kejurda'), active: activeTab === 'kejurda' },
    { divider: true, dividerLabel: 'Pengaturan' },
    { icon: <i className="fas fa-cogs" />, label: 'Konfigurasi KTA', onClick: () => setActiveTab('kta_config'), active: activeTab === 'kta_config' },
    { icon: <i className="fas fa-redo" />, label: 'Daftar Ulang', onClick: () => setActiveTab('daftar_ulang'), active: activeTab === 'daftar_ulang' },
  ];

  const renderKtaSection = () => (
    <>
      {/* Filters */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 mb-5">
        <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <CustomSelect
              value={filterStatus}
              onChange={v=>setFilterStatus(v)}
              options={[
                {value:'',label:'Semua'},
                {value:'pending',label:'Pending'},
                {value:'approved_pengcab',label:'Approved Pengcab'},
                {value:'rejected_pengcab',label:'Ditolak Pengcab'},
                {value:'rejected_pengda',label:'Ditolak Pengda'},
                {value:'rejected_pb',label:'Ditolak PB'},
                {value:'resubmit_to_pengda',label:'Diajukan Ulang ke Pengda'},
              ]}
              placeholder="Semua"
            />
          </div>
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cari Klub</label>
            <input type="text" placeholder="Nama klub..." className={INPUT}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 transition-all">
              <i className="fas fa-search mr-1.5" />Filter
            </button>
            <button type="button" onClick={() => { setSearch(''); setFilterStatus(''); }}
              className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] text-gray-400 text-xs font-medium rounded-xl hover:bg-white/[0.08] hover:text-white transition-all">
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* KTA Table */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <i className="fas fa-file-invoice text-white text-sm" />
            </div>
            <div>
              <h2 className="m-0 text-[14px] font-bold text-white">Daftar Pengajuan KTA</h2>
              <p className="m-0 text-[11px] text-gray-500">{applications.length} pengajuan</p>
            </div>
          </div>
        </div>
        {loading ? SPINNER : applications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-file-alt text-gray-400 text-xl" />
            </div>
            <p className="text-sm text-gray-500 m-0">Tidak ada pengajuan</p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02]">
                  {['No', 'Klub', 'Pelatih', 'Tanggal', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {applications.map((app, idx) => (
                  <tr key={app.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{(ktaPagination.page - 1) * 10 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-white">{app.club_name}</div>
                      <div className="text-xs text-gray-500">@{app.username}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{app.coach_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">{badge(app.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => { setSelectedAppId(app.id); setActiveTab('kta-detail'); }}
                          className="w-8 h-8 flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg border-none cursor-pointer transition-colors text-xs"
                          title="Detail">
                          <i className="fas fa-eye" />
                        </button>
                        {(app.status === 'pending' || app.status === 'rejected_pengcab') && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Setujui → Kirim ke Pengda"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengcab', title: 'Setujui KTA?', message: `Setujui pengajuan KTA dari ${app.club_name} dan kirim ke Pengda?` })}>
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Tolak"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengcab', title: 'Tolak KTA?', message: `Tolak pengajuan KTA dari ${app.club_name}?` })}>
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {(app.status === 'rejected_pengda' || app.status === 'rejected_pb') && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Ajukan Ulang ke Pengda"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'resubmit_to_pengda', title: 'Ajukan Ulang ke Pengda?', message: `Ajukan ulang KTA ${app.club_name} ke Pengda?` })}>
                              <i className="fas fa-redo text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Tolak ke Anggota"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengcab', title: 'Tolak ke Anggota?', message: `Tolak KTA ${app.club_name} dan kembalikan ke anggota?` })}>
                              <i className="fas fa-times text-xs" />
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
          {ktaPagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
              <span className="text-xs text-gray-500">
                Hal. <span className="text-gray-300 font-semibold">{ktaPagination.page}</span> / <span className="text-gray-300 font-semibold">{ktaPagination.totalPages}</span>
              </span>
              <div className="flex gap-1">
                <button disabled={ktaPagination.page <= 1} onClick={() => fetchData(ktaPagination.page - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                  <i className="fas fa-chevron-left text-[10px]" />
                </button>
                <button disabled={ktaPagination.page >= ktaPagination.totalPages} onClick={() => fetchData(ktaPagination.page + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                  <i className="fas fa-chevron-right text-[10px]" />
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </>
  );

  const renderMembersSection = () => (
    <>
      {/* Members Filters */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status KTA</label>
            <CustomSelect
              value={memberKtaFilter}
              onChange={v=>setMemberKtaFilter(v)}
              options={[
                {value:'all',label:'Semua Status'},
                {value:'issued',label:'KTA Terbit'},
                {value:'not_issued',label:'Belum Diterbitkan'},
                {value:'not_applied',label:'Belum Mengajukan'},
              ]}
              placeholder="Semua Status"
            />
          </div>
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cari</label>
            <input type="text" placeholder="Nama klub/email..." className={INPUT}
              value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
          </div>
          <button onClick={() => { setMemberSearch(''); setMemberKtaFilter('all'); }}
            className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] text-gray-400 text-xs font-medium rounded-xl hover:bg-white/[0.08] hover:text-white transition-all">
            Reset
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
            <i className="fas fa-users text-white text-sm" />
          </div>
          <h2 className="m-0 text-[14px] font-bold text-white">Daftar Anggota Cabang</h2>
        </div>
        {membersLoading ? SPINNER : members.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-users text-gray-400 text-xl" />
            </div>
            <p className="text-sm text-gray-500 m-0">Tidak ada anggota ditemukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.02]">
                    {['No', 'Nama Klub', 'Email', 'Telepon', 'Status KTA'].map(h => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {members.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs">{(membersPagination.page - 1) * 10 + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{m.club_name || m.username}</td>
                      <td className="px-4 py-3 text-gray-400">{m.email}</td>
                      <td className="px-4 py-3 text-gray-400">{m.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ring-1 ${
                          m.kta_status === 'kta_issued'
                            ? 'ring-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                            : m.kta_status
                              ? 'ring-amber-400/20 bg-amber-500/10 text-amber-400'
                              : 'ring-gray-400/20 bg-white/[0.05] text-gray-400'
                        }`}>{m.kta_status_label}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {membersPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
                <span className="text-xs text-gray-500">
                  Hal. <span className="text-gray-300 font-semibold">{membersPagination.page}</span> / <span className="text-gray-300 font-semibold">{membersPagination.totalPages}</span>
                </span>
                <div className="flex gap-1">
                  <button disabled={membersPagination.page <= 1} onClick={() => fetchMembers(membersPagination.page - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                    <i className="fas fa-chevron-left text-[10px]" />
                  </button>
                  <button disabled={membersPagination.page >= membersPagination.totalPages} onClick={() => fetchMembers(membersPagination.page + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                    <i className="fas fa-chevron-right text-[10px]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  const renderIssuedKtaSection = () => (
    <>
      {/* Search */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cari Klub</label>
            <input type="text" placeholder="Nama klub..." className={INPUT}
              value={issuedKtaSearch} onChange={e => setIssuedKtaSearch(e.target.value)} />
          </div>
          <button onClick={() => setIssuedKtaSearch('')}
            className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] text-gray-400 text-xs font-medium rounded-xl hover:bg-white/[0.08] hover:text-white transition-all">
            Reset
          </button>
        </div>
      </div>

      {/* Issued KTAs Table */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
            <i className="fas fa-id-card text-white text-sm" />
          </div>
          <h2 className="m-0 text-[14px] font-bold text-white">KTA Terbit (Approved PB)</h2>
        </div>
        {issuedKtasLoading ? SPINNER : issuedKtas.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-id-card text-gray-400 text-xl" />
            </div>
            <p className="text-sm text-gray-500 m-0">Belum ada KTA terbit</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.02]">
                    {['No', 'Nama Klub', 'Ketua', 'Email', 'Status', 'KTA'].map(h => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {issuedKtas.map((k, idx) => (
                    <tr key={k.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs">{(issuedKtasPagination.page - 1) * 10 + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{k.club_name}</td>
                      <td className="px-4 py-3 text-gray-400">{k.leader_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-400">{k.user_email}</td>
                      <td className="px-4 py-3">{badge(k.status)}</td>
                      <td className="px-4 py-3">
                        {k.generated_kta_file_path_pb && (
                          <button type="button" onClick={() => setDocPreview({ show: true, url: `${API_BASE}/uploads/${k.generated_kta_file_path_pb}`, title: 'KTA PDF' })}
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer bg-transparent border-none">
                            <i className="fas fa-file-pdf text-[10px]" />Lihat
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {issuedKtasPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
                <span className="text-xs text-gray-500">
                  Hal. <span className="text-gray-300 font-semibold">{issuedKtasPagination.page}</span> / <span className="text-gray-300 font-semibold">{issuedKtasPagination.totalPages}</span>
                </span>
                <div className="flex gap-1">
                  <button disabled={issuedKtasPagination.page <= 1} onClick={() => fetchIssuedKtas(issuedKtasPagination.page - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                    <i className="fas fa-chevron-left text-[10px]" />
                  </button>
                  <button disabled={issuedKtasPagination.page >= issuedKtasPagination.totalPages} onClick={() => fetchIssuedKtas(issuedKtasPagination.page + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                    <i className="fas fa-chevron-right text-[10px]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  const renderBalanceSection = () => (
    <>
      {/* Pengda Bank Info Card */}
      {pengdaBankInfo && (
        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <i className="fas fa-building text-white text-sm" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Rekening Pengurus Daerah</div>
              <div className="text-[11px] text-gray-400">{pengdaBankInfo.club_name || 'Pengda'}</div>
              <div className="text-lg font-bold text-white mt-0.5">{pengdaBankInfo.bank_account_number || 'Belum Disetel'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Summary Card */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-6 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
            <i className="fas fa-wallet text-white text-2xl" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Saldo Masuk dari PB</div>
            <div className="text-2xl font-bold text-white mt-0.5">{balanceSummary?.total_balance_formatted || 'Rp 0'}</div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-400/25 flex-shrink-0">
            <i className="fas fa-history text-white text-sm" />
          </div>
          <h2 className="m-0 text-[14px] font-bold text-white">Riwayat Transaksi dari PB</h2>
        </div>
        {transactionsLoading ? SPINNER : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-receipt text-gray-400 text-xl" />
            </div>
            <p className="text-sm text-gray-500 m-0">Belum ada transaksi</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.02]">
                    {['Tanggal', 'Nominal', 'Klub Terkait', 'Catatan', 'Bukti'].map(h => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 text-gray-400">
                        {t.paid_at ? new Date(t.paid_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">
                        + Rp {Number(t.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{t.associated_clubs || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{t.notes || '-'}</td>
                      <td className="px-4 py-3">
                        {t.payment_proof_path && (
                          <button type="button" onClick={() => setDocPreview({ show: true, url: `${API_BASE}/uploads/${t.payment_proof_path}`, title: 'Bukti Pembayaran' })}
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer bg-transparent border-none">
                            <i className="fas fa-image text-[10px]" />Lihat
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactionsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
                <span className="text-xs text-gray-500">
                  Hal. <span className="text-gray-300 font-semibold">{transactionsPagination.page}</span> / <span className="text-gray-300 font-semibold">{transactionsPagination.totalPages}</span>
                </span>
                <div className="flex gap-1">
                  <button disabled={transactionsPagination.page <= 1} onClick={() => fetchTransactions(transactionsPagination.page - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                    <i className="fas fa-chevron-left text-[10px]" />
                  </button>
                  <button disabled={transactionsPagination.page >= transactionsPagination.totalPages} onClick={() => fetchTransactions(transactionsPagination.page + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                    <i className="fas fa-chevron-right text-[10px]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <SidebarLayout
      menuItems={menuItems}
      title="Selamat Datang, Pengurus Cabang"
      subtitle={user?.city_name ? `${user.city_name}, ${user.province_name || ''}` : undefined}
    >
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total || 0, icon: 'fa-file-alt', from: 'from-blue-500', to: 'to-blue-600', shadow: 'shadow-blue-500/25' },
            { label: 'Pending', value: stats.pending || 0, icon: 'fa-clock', from: 'from-amber-400', to: 'to-amber-500', shadow: 'shadow-amber-400/25' },
            { label: 'Approved', value: stats.approved_pengcab || 0, icon: 'fa-check-circle', from: 'from-emerald-500', to: 'to-emerald-600', shadow: 'shadow-emerald-500/25' },
            { label: 'Ditolak', value: stats.rejected || 0, icon: 'fa-times-circle', from: 'from-red-500', to: 'to-red-600', shadow: 'shadow-red-500/25' },
          ].map(s => (
            <div key={s.label} className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3 hover:bg-[#191c28] transition-all">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center shadow-lg ${s.shadow} flex-shrink-0`}>
                <i className={`fas ${s.icon} text-white text-sm`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-none m-0">{s.value}</p>
                <p className="text-[11px] text-gray-500 m-0">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'kta' && renderKtaSection()}
      {activeTab === 'kta-detail' && selectedAppId && (
        <KtaDetailPanel
          appId={selectedAppId}
          onBack={() => { setActiveTab('kta'); setSelectedAppId(null); }}
          onStatusUpdated={fetchData}
        />
      )}
      {activeTab === 'members' && renderMembersSection()}
      {activeTab === 'issued' && renderIssuedKtaSection()}
      {activeTab === 'balance' && renderBalanceSection()}
      {activeTab === 'kta_config' && <KtaConfigPage embedded />}
      {activeTab === 'daftar_ulang' && <ManageReregistration embedded />}
      {activeTab === 'kejurcab' && renderKejurcabSection()}
      {activeTab === 'kejurcab_detail' && selectedEvent && renderKejurcabDetail()}
      {activeTab === 'submit_kejurcab' && (
        <KejurcabSubmitForm
          embedded
          onBack={() => { setActiveTab('kejurcab'); fetchMyKejurcabs(); }}
          onSuccess={() => { setActiveTab('kejurcab'); fetchMyKejurcabs(); }}
        />
      )}
      {activeTab === 'review_event' && renderReviewEventSection()}
      {activeTab === 'review_event_detail' && selectedEvent && renderEventReviewDetail()}
      {activeTab === 'kejurda' && <KejurdaManage embedded />}

      <ConfirmModal show={confirm.show} title={confirm.title} message={confirm.message}
        onConfirm={handleUpdateStatus}
        onCancel={() => { setConfirm({ show: false }); setConfirmReason(''); }}
        danger={confirm.status?.startsWith('rejected')}
        showReason={!!confirm.status && confirm.status !== 'approved_pengcab'}
        reason={confirmReason}
        onReasonChange={setConfirmReason}
        reasonLabel={confirm.status === 'rejected_pengcab' ? 'Alasan Penolakan *' : 'Catatan (opsional)'}
      />
      <DocumentPreviewModal show={docPreview.show} url={docPreview.url} title={docPreview.title} onClose={() => setDocPreview({ show: false, url: '', title: '' })} />
    </SidebarLayout>
  );

  function renderKejurcabSection() {
    return (
      <>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white m-0">Kejurcab Saya</h2>
            <p className="text-sm text-gray-500 m-0">Daftar pengajuan kejuaraan cabang yang telah Anda ajukan</p>
          </div>
          <button onClick={() => setActiveTab('submit_kejurcab')}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all border-none cursor-pointer">
            <i className="fas fa-plus mr-2" />Ajukan Kejurcab
          </button>
        </div>

        {kejurcabLoading ? SPINNER : myKejurcabs.length === 0 ? (
          <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-trophy text-2xl text-amber-400" />
            </div>
            <p className="text-gray-400 mb-4">Belum ada pengajuan kejurcab</p>
            <button onClick={() => setActiveTab('submit_kejurcab')}
              className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-sm font-semibold rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20 cursor-pointer">
              <i className="fas fa-plus mr-2" />Ajukan Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myKejurcabs.map(ev => (
              <div key={ev.id}
                onClick={() => { setSelectedEvent(ev); setActiveTab('kejurcab_detail'); }}
                className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 hover:bg-[#191c28] transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm m-0 truncate">{ev.nama_event}</h3>
                    <p className="text-gray-500 text-xs mt-1 m-0">
                      <i className="fas fa-map-marker-alt mr-1" />{ev.lokasi}
                      <span className="mx-2">•</span>
                      <i className="fas fa-calendar mr-1" />{new Date(ev.tanggal_mulai).toLocaleDateString('id-ID')}
                      {ev.tanggal_selesai && ` - ${new Date(ev.tanggal_selesai).toLocaleDateString('id-ID')}`}
                    </p>
                  </div>
                  {eventBadge(ev.status)}
                </div>
                {ev.rejection_reason && (
                  <div className="mt-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-red-400 text-xs m-0"><i className="fas fa-exclamation-triangle mr-1" />Alasan: {ev.rejection_reason}</p>
                  </div>
                )}
                {ev.surat_rekomendasi_path && (
                  <div className="mt-2">
                    <a href={`${API_BASE}/uploads/${ev.surat_rekomendasi_path}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/20 transition-all no-underline">
                      <i className="fas fa-download" /> Surat Rekomendasi
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderKejurcabDetail() {
    const ev = selectedEvent;
    const uploadsBase = `${API_BASE}/uploads/event_files/`;
    return (
      <>
        <button className="text-emerald-400 text-sm mb-4 bg-transparent border-none cursor-pointer hover:underline"
          onClick={() => { setSelectedEvent(null); setActiveTab('kejurcab'); }}>
          <i className="fas fa-arrow-left mr-2" />Kembali ke Daftar Kejurcab
        </button>

        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white m-0">{ev.nama_event}</h2>
              <p className="text-gray-500 text-sm m-0 mt-1">🏆 Kejuaraan Cabang</p>
            </div>
            {eventBadge(ev.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[{ l: 'Lokasi', v: ev.lokasi }, { l: 'Tanggal', v: `${new Date(ev.tanggal_mulai).toLocaleDateString('id-ID')} - ${new Date(ev.tanggal_selesai).toLocaleDateString('id-ID')}` }].map(r => (
              <div key={r.l}>
                <p className="text-gray-500 text-xs font-semibold uppercase m-0 mb-1">{r.l}</p>
                <p className="text-gray-200 text-sm m-0">{r.v}</p>
              </div>
            ))}
          </div>

          {ev.deskripsi && (
            <div className="mb-6">
              <p className="text-gray-500 text-xs font-semibold uppercase m-0 mb-1">Deskripsi</p>
              <p className="text-gray-300 text-sm m-0 whitespace-pre-wrap">{ev.deskripsi}</p>
            </div>
          )}

          {ev.mata_lomba && (
            <div className="mb-6">
              <p className="text-gray-500 text-xs font-semibold uppercase m-0 mb-2">Mata Lomba</p>
              <div className="space-y-1">
                {(typeof ev.mata_lomba === 'string' ? JSON.parse(ev.mata_lomba) : ev.mata_lomba).map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-lg">
                    <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                    <span className="text-gray-200 text-sm">{m.nama}</span>
                    {m.tanggal && <span className="text-gray-500 text-xs ml-auto">{m.tanggal}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ev.rejection_reason && (
            <div className="px-4 py-3 bg-red-500/10 rounded-xl border border-red-500/20 mb-4">
              <p className="text-red-400 text-sm font-semibold m-0"><i className="fas fa-times-circle mr-2" />Alasan Penolakan</p>
              <p className="text-red-300 text-sm m-0 mt-1">{ev.rejection_reason}</p>
            </div>
          )}

          {ev.surat_rekomendasi_path && (
            <a href={`${API_BASE}/uploads/${ev.surat_rekomendasi_path}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 text-sm font-semibold rounded-xl hover:bg-emerald-500/20 transition-all no-underline border border-emerald-500/20">
              <i className="fas fa-file-pdf" /> Download Surat Rekomendasi
            </a>
          )}
        </div>
      </>
    );
  }

  function renderReviewEventSection() {
    return (
      <>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white m-0">Review Event Penyelenggara</h2>
          <p className="text-sm text-gray-500 m-0">Pengajuan event dari penyelenggara yang menunggu persetujuan Anda</p>
        </div>

        {pendingEventsLoading ? SPINNER : pendingEvents.length === 0 ? (
          <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-check text-2xl text-blue-400" />
            </div>
            <p className="text-gray-400">Tidak ada pengajuan event yang menunggu review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingEvents.map(ev => (
              <div key={ev.id}
                onClick={() => { viewEventDetail(ev.id); setActiveTab('review_event_detail'); }}
                className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 hover:bg-[#191c28] transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm m-0 truncate">{ev.nama_event}</h3>
                    <p className="text-gray-500 text-xs mt-1 m-0">
                      <span className="text-amber-400">{ev.nama_organisasi || ev.username}</span>
                      <span className="mx-2">•</span>
                      <i className="fas fa-map-marker-alt mr-1" />{ev.lokasi}
                      <span className="mx-2">•</span>
                      <i className="fas fa-calendar mr-1" />{new Date(ev.tanggal_mulai).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  {eventBadge(ev.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderEventReviewDetail() {
    const ev = selectedEvent;
    const uploadsBase = `${API_BASE}/uploads/event_files/`;
    const canAction = ev.status === 'submitted';

    const persyaratanLabels = {
      suratIzinSekolah: 'Surat Izin Sekolah/Instansi', suratIzinKepolisian: 'Surat Izin Kepolisian',
      suratRekomendasiDinas: 'Surat Rekomendasi Dinas', suratIzinVenue: 'Surat Izin Venue',
      suratRekomendasiPPI: 'Surat Rekomendasi PPI', fotoLapangan: 'Foto Lapangan',
      fotoTempatIbadah: 'Foto Tempat Ibadah', fotoBarak: 'Foto Barak',
      fotoAreaParkir: 'Foto Area Parkir', fotoRuangKesehatan: 'Foto Ruang Kesehatan',
      fotoMCK: 'Foto MCK', fotoTempatSampah: 'Foto Tempat Sampah',
      fotoRuangKomisi: 'Foto Ruang Komisi', faktaIntegritasKomisi: 'Fakta Integritas Komisi',
      faktaIntegritasHonor: 'Fakta Integritas Honor', faktaIntegritasPanitia: 'Fakta Integritas Panitia',
      desainSertifikat: 'Desain Sertifikat'
    };

    const persyaratan = ev.persyaratan ? (typeof ev.persyaratan === 'string' ? JSON.parse(ev.persyaratan) : ev.persyaratan) : {};
    const mataLomba = ev.mata_lomba ? (typeof ev.mata_lomba === 'string' ? JSON.parse(ev.mata_lomba) : ev.mata_lomba) : [];

    return (
      <>
        <button className="text-emerald-400 text-sm mb-4 bg-transparent border-none cursor-pointer hover:underline"
          onClick={() => { setSelectedEvent(null); setActiveTab('review_event'); }}>
          <i className="fas fa-arrow-left mr-2" />Kembali ke Review Event
        </button>

        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white m-0">{ev.nama_event}</h2>
              <p className="text-gray-500 text-sm m-0 mt-1">
                {ev.jenis_pengajuan === 'kejurcab' ? '🏆 Kejuaraan Cabang' : '🎪 Event Penyelenggara'}
                <span className="mx-2">—</span>
                <span className="text-amber-400">{ev.user?.club_name || ev.nama_organisasi || ''}</span>
              </p>
            </div>
            {eventBadge(ev.status)}
          </div>

          {/* Detail Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { l: 'Lokasi', v: ev.lokasi },
              { l: 'Tanggal', v: `${new Date(ev.tanggal_mulai).toLocaleDateString('id-ID')} - ${new Date(ev.tanggal_selesai).toLocaleDateString('id-ID')}` },
              ev.penyelenggara && { l: 'Penyelenggara', v: ev.penyelenggara },
              ev.kontak_person && { l: 'Kontak Person', v: ev.kontak_person },
            ].filter(Boolean).map(r => (
              <div key={r.l}>
                <p className="text-gray-500 text-xs font-semibold uppercase m-0 mb-1">{r.l}</p>
                <p className="text-gray-200 text-sm m-0">{r.v}</p>
              </div>
            ))}
          </div>

          {ev.deskripsi && (
            <div className="mb-6">
              <p className="text-gray-500 text-xs font-semibold uppercase m-0 mb-1">Deskripsi</p>
              <p className="text-gray-300 text-sm m-0 whitespace-pre-wrap">{ev.deskripsi}</p>
            </div>
          )}

          {/* Mata Lomba */}
          {mataLomba.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-500 text-xs font-semibold uppercase m-0 mb-2">Mata Lomba</p>
              <div className="space-y-1">
                {mataLomba.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-lg">
                    <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                    <span className="text-gray-200 text-sm">{m.nama}</span>
                    {m.tanggal && <span className="text-gray-500 text-xs ml-auto">{m.tanggal}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Persyaratan */}
          {Object.keys(persyaratan).length > 0 && (
            <div className="mb-6">
              <p className="text-gray-500 text-xs font-semibold uppercase m-0 mb-2">Persyaratan</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(persyaratan).map(([key, val]) => {
                  if (!val) return null;
                  const label = persyaratanLabels[key] || key;
                  const isFile = typeof val === 'string' && (val.endsWith('.pdf') || val.endsWith('.jpg') || val.endsWith('.png') || val.endsWith('.jpeg') || val.includes('/'));
                  return (
                    <div key={key} className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg">
                      <i className={`fas ${isFile ? 'fa-file-alt text-blue-400' : 'fa-check-circle text-emerald-400'} text-xs`} />
                      <span className="text-gray-300 text-sm flex-1">{label}</span>
                      {isFile && (
                        <a href={`${uploadsBase}${key}/${val}`} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline no-underline">
                          Lihat
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dokumen Upload */}
          <div className="mb-6">
            <p className="text-gray-500 text-xs font-semibold uppercase m-0 mb-2">Dokumen</p>
            <div className="flex flex-wrap gap-2">
              {['proposal_kegiatan', 'poster', 'surat_izin_tempat'].map(key => {
                const val = ev[key];
                if (!val) return null;
                return (
                  <a key={key} href={`${uploadsBase}${key}/${val}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-500/20 transition-all no-underline">
                    <i className="fas fa-paperclip" /> {key.replace(/_/g, ' ')}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          {canAction && (
            <div className="border-t border-white/[0.06] pt-4 mt-4">
              <div className="mb-3">
                <label className="block text-xs text-gray-500 font-semibold mb-1">Catatan / Alasan Penolakan</label>
                <textarea
                  value={eventActionNotes} onChange={e => setEventActionNotes(e.target.value)}
                  className={`${INPUT} min-h-[80px]`} placeholder="Tulis catatan atau alasan penolakan..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleEventApprove(ev.id)} disabled={eventActionLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all border-none cursor-pointer disabled:opacity-50">
                  {eventActionLoading ? 'Memproses...' : <><i className="fas fa-check mr-2" />Setujui</>}
                </button>
                <button onClick={() => handleEventReject(ev.id)} disabled={eventActionLoading}
                  className="px-5 py-2.5 bg-red-500/10 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 cursor-pointer disabled:opacity-50">
                  {eventActionLoading ? 'Memproses...' : <><i className="fas fa-times mr-2" />Tolak</>}
                </button>
              </div>
            </div>
          )}

          {ev.approved_by_pengcab_at && (
            <div className="mt-4 px-4 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-emerald-400 text-sm font-semibold m-0"><i className="fas fa-check-circle mr-2" />Telah disetujui oleh Pengcab</p>
              <p className="text-emerald-300/70 text-xs m-0 mt-1">{new Date(ev.approved_by_pengcab_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      </>
    );
  }
}