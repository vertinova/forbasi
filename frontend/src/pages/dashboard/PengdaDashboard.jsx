import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SidebarLayout from '../../components/layout/SidebarLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { StatusBadge, formatRupiah } from '../../components/common/DashboardUI';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

// Legacy badge function using StatusBadge component
const badge = (status) => <StatusBadge status={status} size="sm" />;

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
    { to: '/pengda', icon: <i className="fas fa-file-invoice" />, label: 'Pengajuan KTA' },
    { to: '/pengda/kejurnas', icon: <i className="fas fa-trophy" />, label: 'Kejurnas' },
    { to: '/pengda/kta-config', icon: <i className="fas fa-cogs" />, label: 'Konfigurasi KTA' },
    { to: '/pengda/reregistrations', icon: <i className="fas fa-redo" />, label: 'Daftar Ulang' },
  ];

  const renderKtaSection = () => (
    <>
      {/* Filters */}
      <form onSubmit={e => { e.preventDefault(); fetchData(); }}
        className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745] bg-white"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Cari Klub</label>
          <input type="text" placeholder="Nama klub..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745]"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-[#0d9500] hover:bg-[#0a7300] text-white text-sm rounded-lg border-none cursor-pointer font-[Poppins] transition-colors">
            <i className="fas fa-search mr-1" />Filter
          </button>
          <button type="button" onClick={() => { setSearch(''); setFilterStatus(''); }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg border-none cursor-pointer font-[Poppins] transition-colors">
            Reset
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#1d3557] px-5 py-3 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-white m-0">
            <i className="fas fa-file-invoice mr-2" />Pengajuan KTA Wilayah
          </h2>
          <span className="text-xs text-white/70">{applications.length} pengajuan</span>
        </div>
        {loading ? <LoadingSpinner /> : applications.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <i className="fas fa-file-alt text-4xl block mb-2" />Tidak ada pengajuan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Klub</th>
                  <th className="px-4 py-3">Kota</th>
                  <th className="px-4 py-3">Pelatih</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app, idx) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-sm text-gray-800">{app.club_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{app.city_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{app.coach_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">{badge(app.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <Link to={`/pengda/kta/${app.id}`}
                          className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs"
                          title="Detail">
                          <i className="fas fa-eye" />
                        </Link>
                        {/* Approved Pengcab: Setujui + Tolak */}
                        {app.status === 'approved_pengcab' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border-none cursor-pointer transition-colors"
                              title="Setujui → Kirim ke PB"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengda', title: 'Setujui & Kirim ke PB?', message: `Setujui KTA ${app.club_name} dan kirim ke PB?` })}>
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border-none cursor-pointer transition-colors"
                              title="Tolak → Kembalikan ke Pengcab"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengda', title: 'Tolak & Kembalikan ke Pengcab?', message: `Tolak KTA ${app.club_name} dan kembalikan ke Pengcab?` })}>
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {/* Resubmit dari Pengcab: Setujui + Tolak */}
                        {app.status === 'resubmit_to_pengda' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border-none cursor-pointer transition-colors"
                              title="Setujui → Kirim ke PB"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengda', title: 'Setujui & Kirim ke PB?', message: `Setujui KTA ${app.club_name} dan kirim ke PB?` })}>
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border-none cursor-pointer transition-colors"
                              title="Tolak → Kembalikan ke Pengcab"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengda', title: 'Tolak & Kembalikan ke Pengcab?', message: `Tolak KTA ${app.club_name} dan kembalikan ke Pengcab?` })}>
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {/* Ditolak PB: Ajukan Kembali (Setujui) + Kembalikan ke Pengcab */}
                        {app.status === 'rejected_pb' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border-none cursor-pointer transition-colors"
                              title="Ajukan Kembali ke PB (Disetujui)"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengda', title: 'Ajukan Kembali ke PB?', message: `Ajukan kembali KTA ${app.club_name} ke PB sebagai disetujui?` })}>
                              <i className="fas fa-redo text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border-none cursor-pointer transition-colors"
                              title="Kembalikan ke Pengcab"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengda', title: 'Kembalikan ke Pengcab?', message: `Kembalikan KTA ${app.club_name} ke Pengcab?` })}>
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {/* Ditolak Pengda sendiri: Re-approve */}
                        {app.status === 'rejected_pengda' && (
                          <button
                            className="w-8 h-8 flex items-center justify-center bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border-none cursor-pointer transition-colors"
                            title="Ubah Menjadi Disetujui"
                            onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengda', title: 'Ubah Menjadi Disetujui?', message: `Ubah status KTA ${app.club_name} menjadi disetujui dan kirim ke PB?` })}>
                            <i className="fas fa-check-double text-xs" />
                          </button>
                        )}
                        {/* Menunggu PB: info saja */}
                        {app.status === 'pending_pengda_resubmit' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-medium">
                            <i className="fas fa-clock mr-1" />Menunggu PB
                          </span>
                        )}
                        {/* Download KTA PB PDF */}
                        {app.status === 'approved_pb' && app.generated_kta_file_path_pb && (
                          <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/generated_kta_pb/${app.generated_kta_file_path_pb}`}
                            target="_blank" rel="noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-xs"
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
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Kota/Kabupaten</label>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745] bg-white"
            value={memberCityFilter} onChange={e => setMemberCityFilter(e.target.value)}>
            <option value="">Semua Kota</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status KTA</label>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745] bg-white"
            value={memberKtaFilter} onChange={e => setMemberKtaFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="issued">KTA Terbit</option>
            <option value="not_issued">Belum Diterbitkan</option>
            <option value="not_applied">Belum Mengajukan</option>
          </select>
        </div>
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
          <input type="text" placeholder="Nama klub/email..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745]"
            value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
        </div>
        <button onClick={() => { setMemberSearch(''); setMemberKtaFilter('all'); setMemberCityFilter(''); }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg border-none cursor-pointer font-[Poppins] transition-colors">
          Reset
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#1d3557] px-5 py-3">
          <h2 className="text-sm font-semibold text-white m-0">
            <i className="fas fa-users mr-2" />Daftar Anggota Wilayah
          </h2>
        </div>
        {membersLoading ? <LoadingSpinner /> : members.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <i className="fas fa-users text-4xl block mb-2" />Tidak ada anggota ditemukan
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Nama Klub</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Kota</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status KTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{(membersPagination.page - 1) * 10 + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-sm text-gray-800">{m.club_name || m.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.city_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.role_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          m.kta_status === 'kta_issued' ? 'bg-green-100 text-green-800' :
                          m.kta_status ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                        }`}>{m.kta_status_label}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {membersPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t">
                <button disabled={membersPagination.page <= 1} onClick={() => fetchMembers(membersPagination.page - 1)}
                  className="px-3 py-1 bg-gray-100 rounded text-sm disabled:opacity-50">Prev</button>
                <span className="px-3 py-1 text-sm">Halaman {membersPagination.page} dari {membersPagination.totalPages}</span>
                <button disabled={membersPagination.page >= membersPagination.totalPages} onClick={() => fetchMembers(membersPagination.page + 1)}
                  className="px-3 py-1 bg-gray-100 rounded text-sm disabled:opacity-50">Next</button>
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
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 mb-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <i className="fas fa-wallet text-3xl" />
          </div>
          <div>
            <div className="text-sm opacity-80">Total Saldo Masuk dari PB</div>
            <div className="text-3xl font-bold">{balanceSummary?.total_balance_formatted || 'Rp 0'}</div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#1d3557] px-5 py-3">
          <h2 className="text-sm font-semibold text-white m-0">
            <i className="fas fa-history mr-2" />Riwayat Transaksi dari PB
          </h2>
        </div>
        {transactionsLoading ? <LoadingSpinner /> : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <i className="fas fa-receipt text-4xl block mb-2" />Belum ada transaksi
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Nominal</th>
                    <th className="px-4 py-3">Klub Terkait</th>
                    <th className="px-4 py-3">Catatan</th>
                    <th className="px-4 py-3">Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {t.paid_at ? new Date(t.paid_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-sm text-green-600">
                        + Rp {Number(t.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.associated_clubs || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.notes || '-'}</td>
                      <td className="px-4 py-3">
                        {t.payment_proof_path && (
                          <a href={`${import.meta.env.VITE_API_URL}/uploads/${t.payment_proof_path}`} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"><i className="fas fa-image mr-1" />Lihat</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactionsPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t">
                <button disabled={transactionsPagination.page <= 1} onClick={() => fetchTransactions(transactionsPagination.page - 1)}
                  className="px-3 py-1 bg-gray-100 rounded text-sm disabled:opacity-50">Prev</button>
                <span className="px-3 py-1 text-sm">Halaman {transactionsPagination.page} dari {transactionsPagination.totalPages}</span>
                <button disabled={transactionsPagination.page >= transactionsPagination.totalPages} onClick={() => fetchTransactions(transactionsPagination.page + 1)}
                  className="px-3 py-1 bg-gray-100 rounded text-sm disabled:opacity-50">Next</button>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total || 0, bg: 'bg-blue-50', text: 'text-blue-700', icon: 'fa-file-alt' },
            { label: 'Menunggu Review', value: stats.approved_pengcab || 0, bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'fa-clock' },
            { label: 'Approved Pengda', value: stats.approved_pengda || 0, bg: 'bg-green-50', text: 'text-green-700', icon: 'fa-check-circle' },
            { label: 'KTA Terbit', value: stats.kta_issued || 0, bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'fa-id-card' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
              <i className={`fas ${s.icon} text-2xl ${s.text}`} />
              <div>
                <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <Link to="/pengda/kejurnas"
          className="px-4 py-2 bg-[#0d9500] hover:bg-[#0a7300] text-white text-sm rounded-lg transition-colors no-underline">
          <i className="fas fa-trophy mr-2" />Kelola Kejurnas
        </Link>
        <a href={`${import.meta.env.VITE_API_URL}/admin/export-members?format=xlsx`}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
          <i className="fas fa-file-excel mr-2" />Export Excel
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-200">
        {[
          { id: 'kta', label: 'Pengajuan KTA', icon: 'fa-file-invoice' },
          { id: 'members', label: 'Daftar Anggota', icon: 'fa-users' },
          { id: 'balance', label: 'Saldo dari PB', icon: 'fa-wallet' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#0d9500] text-[#0d9500]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <i className={`fas ${tab.icon} mr-2`} />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'kta' && renderKtaSection()}
      {activeTab === 'members' && renderMembersSection()}
      {activeTab === 'balance' && renderBalanceSection()}

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
