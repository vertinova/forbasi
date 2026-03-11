import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SidebarLayout from '../../components/layout/SidebarLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import KejurnasManage from '../kejurnas/KejurnasManage';
import KtaConfigPage from '../config/KtaConfigPage';
import ManageReregistration from '../config/ManageReregistration';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS_MAP = {
  pending: { label: 'Pending', dot: 'bg-amber-400', ring: 'ring-amber-400/20', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  approved_pengcab: { label: 'Menunggu Review', dot: 'bg-amber-400', ring: 'ring-amber-400/20', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  approved_pengda: { label: 'Approved Pengda', dot: 'bg-teal-500', ring: 'ring-teal-500/20', bg: 'bg-teal-500/10', text: 'text-teal-400' },
  approved_pb: { label: 'Approved PB', dot: 'bg-blue-500', ring: 'ring-blue-500/20', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  kta_issued: { label: 'KTA Terbit', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  rejected_pengcab: { label: 'Ditolak Pengcab', dot: 'bg-red-500', ring: 'ring-red-500/20', bg: 'bg-red-500/10', text: 'text-red-400' },
  rejected_pengda: { label: 'Ditolak Pengda', dot: 'bg-orange-500', ring: 'ring-orange-500/20', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  rejected_pb: { label: 'Ditolak PB', dot: 'bg-rose-500', ring: 'ring-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-400' },
  resubmit_to_pengda: { label: 'Ajukan Ulang', dot: 'bg-violet-500', ring: 'ring-violet-500/20', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  pending_pengda_resubmit: { label: 'Menunggu PB', dot: 'bg-gray-400', ring: 'ring-gray-400/20', bg: 'bg-white/[0.05]', text: 'text-gray-400' },
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

export default function PengdaDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('kta');
  
  // KTA Applications state
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmReason, setConfirmReason] = useState('');

  // Members state
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberKtaFilter, setMemberKtaFilter] = useState('all');
  const [memberCityFilter, setMemberCityFilter] = useState('');
  const [cities, setCities] = useState([]);
  const [membersPagination, setMembersPagination] = useState({ page: 1, totalPages: 1 });

  // Balance state
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsPagination, setTransactionsPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => { fetchData(); fetchCities(); }, []);
  useEffect(() => { if (activeTab === 'members') fetchMembers(); }, [activeTab, memberSearch, memberKtaFilter, memberCityFilter]);
  useEffect(() => { if (activeTab === 'balance') { fetchBalance(); fetchTransactions(); } }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/kta/applications', { params: { search, status: filterStatus } }),
        api.get('/kta/stats')
      ]);
      setApplications(appsRes.data.data.applications || []);
      setStats(statsRes.data.data);
    } catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
  };

  const fetchCities = async () => {
    try {
      const res = await api.get('/users/my-province-cities');
      setCities(res.data.data || []);
    } catch { /* ignore */ }
  };

  const fetchMembers = async (page = 1) => {
    setMembersLoading(true);
    try {
      const res = await api.get('/users/members-with-kta', {
        params: { search: memberSearch, kta_status: memberKtaFilter, city_id: memberCityFilter, page, limit: 10 }
      });
      setMembers(res.data.data.members || []);
      setMembersPagination(res.data.data.pagination || { page: 1, totalPages: 1 });
    } catch { toast.error('Gagal memuat data anggota'); }
    finally { setMembersLoading(false); }
  };

  const fetchBalance = async () => {
    try {
      const res = await api.get('/pb-payment/pengda/balance-summary');
      setBalanceSummary(res.data.data);
    } catch { /* ignore */ }
  };

  const fetchTransactions = async (page = 1) => {
    setTransactionsLoading(true);
    try {
      const res = await api.get('/pb-payment/pengda/transactions', { params: { page, limit: 10 } });
      setTransactions(res.data.data.transactions || []);
      setTransactionsPagination(res.data.data.pagination || { page: 1, totalPages: 1 });
    } catch { /* ignore */ }
    finally { setTransactionsLoading(false); }
  };

  const handleUpdateStatus = async () => {
    try {
      const payload = { status: confirm.status };
      if (confirm.status === 'rejected_pengda') {
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
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const menuItems = [
    { icon: <i className="fas fa-file-invoice" />, label: 'Pengajuan KTA', onClick: () => setActiveTab('kta'), active: activeTab === 'kta' },
    { icon: <i className="fas fa-users" />, label: 'Daftar Anggota', onClick: () => setActiveTab('members'), active: activeTab === 'members' },
    { icon: <i className="fas fa-wallet" />, label: 'Saldo dari PB', onClick: () => setActiveTab('balance'), active: activeTab === 'balance' },
    { divider: true, dividerLabel: 'Pengaturan' },
    { icon: <i className="fas fa-trophy" />, label: 'Kejurnas', onClick: () => setActiveTab('kejurnas'), active: activeTab === 'kejurnas' },
    { icon: <i className="fas fa-cogs" />, label: 'Konfigurasi KTA', onClick: () => setActiveTab('kta_config'), active: activeTab === 'kta_config' },
    { icon: <i className="fas fa-redo" />, label: 'Daftar Ulang', onClick: () => setActiveTab('daftar_ulang'), active: activeTab === 'daftar_ulang' },
  ];

  const renderKtaSection = () => (
    <>
      {/* Filters */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 mb-5">
        <form onSubmit={e => { e.preventDefault(); fetchData(); }} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select className={SEL} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua</option>
              <option value="approved_pengcab">Menunggu Review</option>
              <option value="resubmit_to_pengda">Diajukan Ulang dari Pengcab</option>
              <option value="approved_pengda">Approved Pengda</option>
              <option value="kta_issued">KTA Terbit</option>
              <option value="rejected_pengda">Ditolak Pengda</option>
              <option value="rejected_pb">Ditolak PB</option>
            </select>
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

      {/* Table */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <i className="fas fa-file-invoice text-white text-sm" />
            </div>
            <div>
              <h2 className="m-0 text-[14px] font-bold text-white">Pengajuan KTA Wilayah</h2>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02]">
                  {['No', 'Klub', 'Kota', 'Pelatih', 'Tanggal', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {applications.map((app, idx) => (
                  <tr key={app.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{app.club_name}</td>
                    <td className="px-4 py-3 text-gray-400">{app.city_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{app.coach_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">{badge(app.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <Link to={`/pengda/kta/${app.id}`}
                          className="w-8 h-8 flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors text-xs"
                          title="Detail">
                          <i className="fas fa-eye" />
                        </Link>
                        {app.status === 'approved_pengcab' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Setujui → Kirim ke PB"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengda', title: 'Setujui & Kirim ke PB?', message: `Setujui KTA ${app.club_name} dan kirim ke PB?` })}>
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Tolak → Kembalikan ke Pengcab"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengda', title: 'Tolak & Kembalikan ke Pengcab?', message: `Tolak KTA ${app.club_name} dan kembalikan ke Pengcab?` })}>
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {app.status === 'resubmit_to_pengda' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Setujui → Kirim ke PB"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengda', title: 'Setujui & Kirim ke PB?', message: `Setujui KTA ${app.club_name} dan kirim ke PB?` })}>
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Tolak → Kembalikan ke Pengcab"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengda', title: 'Tolak & Kembalikan ke Pengcab?', message: `Tolak KTA ${app.club_name} dan kembalikan ke Pengcab?` })}>
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {app.status === 'rejected_pb' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Ajukan Kembali ke PB (Disetujui)"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengda', title: 'Ajukan Kembali ke PB?', message: `Ajukan kembali KTA ${app.club_name} ke PB sebagai disetujui?` })}>
                              <i className="fas fa-redo text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border-none cursor-pointer transition-colors"
                              title="Kembalikan ke Pengcab"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengda', title: 'Kembalikan ke Pengcab?', message: `Kembalikan KTA ${app.club_name} ke Pengcab?` })}>
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {app.status === 'rejected_pengda' && (
                          <button
                            className="w-8 h-8 flex items-center justify-center bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg border-none cursor-pointer transition-colors"
                            title="Ubah Menjadi Disetujui"
                            onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengda', title: 'Ubah Menjadi Disetujui?', message: `Ubah status KTA ${app.club_name} menjadi disetujui dan kirim ke PB?` })}>
                            <i className="fas fa-check-double text-xs" />
                          </button>
                        )}
                        {app.status === 'pending_pengda_resubmit' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.05] text-gray-500 text-[10px] font-medium">
                            <i className="fas fa-clock" />Menunggu PB
                          </span>
                        )}
                        {app.status === 'approved_pb' && app.generated_kta_file_path_pb && (
                          <a href={`${API_BASE}/uploads/generated_kta_pb/${app.generated_kta_file_path_pb}`}
                            target="_blank" rel="noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors text-xs"
                            title="Download KTA PB">
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
      </div>
    </>
  );

  const renderMembersSection = () => (
    <>
      {/* Members Filters */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kota/Kabupaten</label>
            <select className={SEL} value={memberCityFilter} onChange={e => setMemberCityFilter(e.target.value)}>
              <option value="">Semua Kota</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status KTA</label>
            <select className={SEL} value={memberKtaFilter} onChange={e => setMemberKtaFilter(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="issued">KTA Terbit</option>
              <option value="not_issued">Belum Diterbitkan</option>
              <option value="not_applied">Belum Mengajukan</option>
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cari</label>
            <input type="text" placeholder="Nama klub/email..." className={INPUT}
              value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
          </div>
          <button onClick={() => { setMemberSearch(''); setMemberKtaFilter('all'); setMemberCityFilter(''); }}
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
          <h2 className="m-0 text-[14px] font-bold text-white">Daftar Anggota Wilayah</h2>
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
                    {['No', 'Nama Klub', 'Email', 'Kota', 'Role', 'Status KTA'].map(h => (
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
                      <td className="px-4 py-3 text-gray-400">{m.city_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-400">{m.role_name}</td>
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

  const renderBalanceSection = () => (
    <>
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
                          <a href={`${API_BASE}/uploads/${t.payment_proof_path}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                            <i className="fas fa-image text-[10px]" />Lihat
                          </a>
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
      title="Selamat Datang, Pengurus Daerah"
      subtitle={user?.province_name || undefined}
    >
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total || 0, from: 'from-blue-500', to: 'to-blue-600', shadow: 'shadow-blue-500/25', icon: 'fa-file-alt' },
            { label: 'Menunggu Review', value: stats.approved_pengcab || 0, from: 'from-amber-400', to: 'to-amber-500', shadow: 'shadow-amber-400/25', icon: 'fa-clock' },
            { label: 'Approved Pengda', value: stats.approved_pengda || 0, from: 'from-emerald-500', to: 'to-emerald-600', shadow: 'shadow-emerald-500/25', icon: 'fa-check-circle' },
            { label: 'KTA Terbit', value: stats.kta_issued || 0, from: 'from-violet-500', to: 'to-violet-600', shadow: 'shadow-violet-500/25', icon: 'fa-id-card' },
          ].map(s => (
            <div key={s.label} className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center shadow-lg ${s.shadow} flex-shrink-0`}>
                <i className={`fas ${s.icon} text-white text-sm`} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'kta' && renderKtaSection()}
      {activeTab === 'members' && renderMembersSection()}
      {activeTab === 'balance' && renderBalanceSection()}
      {activeTab === 'kejurnas' && <KejurnasManage embedded />}
      {activeTab === 'kta_config' && <KtaConfigPage embedded />}
      {activeTab === 'daftar_ulang' && <ManageReregistration embedded />}

      <ConfirmModal show={confirm.show} title={confirm.title} message={confirm.message}
        onConfirm={handleUpdateStatus}
        onCancel={() => { setConfirm({ show: false }); setConfirmReason(''); }}
        danger={confirm.status?.startsWith('rejected')}
        showReason={!!confirm.status && confirm.status !== 'approved_pengda'}
        reason={confirmReason}
        onReasonChange={setConfirmReason}
        reasonLabel={confirm.status === 'rejected_pengda' ? 'Alasan Penolakan *' : 'Catatan (opsional)'}
      />
    </SidebarLayout>
  );
}
