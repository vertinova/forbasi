import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SidebarLayout from '../../components/layout/SidebarLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved_pengcab: 'bg-blue-100 text-blue-800',
  approved_pengda: 'bg-blue-100 text-blue-800',
  approved_pb: 'bg-green-100 text-green-800',
  kta_issued: 'bg-green-100 text-green-800',
  rejected_pengcab: 'bg-red-100 text-red-800',
  rejected_pengda: 'bg-red-100 text-red-800',
  rejected_pb: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  resubmit_to_pengda: 'bg-yellow-100 text-yellow-800',
  pending_pengda_resubmit: 'bg-yellow-100 text-yellow-800',
};
const STATUS_LABEL = {
  pending: 'Pending', approved_pengcab: 'Approved Pengcab',
  approved_pengda: 'Approved Pengda', approved_pb: 'Approved PB',
  kta_issued: 'KTA Terbit', rejected_pengcab: 'Ditolak Pengcab',
  rejected_pengda: 'Ditolak Pengda', rejected_pb: 'Ditolak PB',
  rejected: 'Ditolak', resubmit_to_pengda: 'Ajukan Ulang',
  pending_pengda_resubmit: 'Re-review Pengda',
};

export default function PengdaDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmReason, setConfirmReason] = useState('');

  useEffect(() => { fetchData(); }, []);

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

  const badge = (status) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );

  const menuItems = [
    { to: '/pengda', icon: <i className="fas fa-file-invoice" />, label: 'Pengajuan KTA' },
    { to: '/pengda/kejurnas', icon: <i className="fas fa-trophy" />, label: 'Kejurnas' },
    { to: '/pengda/kta-config', icon: <i className="fas fa-cogs" />, label: 'Konfigurasi KTA' },
    { to: '/pengda/reregistrations', icon: <i className="fas fa-redo" />, label: 'Daftar Ulang' },
  ];

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
                      <div className="flex gap-1.5">
                        <Link to={`/pengda/kta/${app.id}`}
                          className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs"
                          title="Detail">
                          <i className="fas fa-eye" />
                        </Link>
                        {['approved_pengcab', 'resubmit_to_pengda', 'rejected_pb', 'pending_pengda_resubmit'].includes(app.status) && (
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
