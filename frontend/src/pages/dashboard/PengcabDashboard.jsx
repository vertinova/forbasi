import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SidebarLayout from '../../components/layout/SidebarLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const STATUS_BADGE = {
  pending:                 'bg-yellow-100 text-yellow-800',
  approved_pengcab:        'bg-blue-100 text-blue-800',
  approved_pengda:         'bg-blue-100 text-blue-800',
  approved_pb:             'bg-green-100 text-green-800',
  kta_issued:              'bg-green-100 text-green-800',
  rejected_pengcab:        'bg-red-100 text-red-800',
  rejected_pengda:         'bg-red-100 text-red-800',
  rejected_pb:             'bg-red-100 text-red-800',
  rejected:                'bg-red-100 text-red-800',
  resubmit_to_pengda:      'bg-yellow-100 text-yellow-800',
  pending_pengda_resubmit: 'bg-yellow-100 text-yellow-800',
};
const STATUS_LABEL = {
  pending: 'Pending', approved_pengcab: 'Approved Pengcab',
  approved_pengda: 'Approved Pengda', approved_pb: 'Approved PB',
  kta_issued: 'KTA Terbit', rejected_pengcab: 'Ditolak Pengcab',
  rejected_pengda: 'Ditolak Pengda', rejected_pb: 'Ditolak PB',
  rejected: 'Ditolak', resubmit_to_pengda: 'Ajukan Ulang ke Pengda',
  pending_pengda_resubmit: 'Re-review Pengda',
};

export default function PengcabDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirm, setConfirm] = useState({ show: false, id: null, status: '', title: '', message: '' });
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

  const badge = (status) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );

  const menuItems = [
    { to: '/pengcab', icon: <i className="fas fa-file-invoice" />, label: 'Pengajuan KTA' },
    { to: '/pengcab/kta-config', icon: <i className="fas fa-cogs" />, label: 'Konfigurasi KTA' },
    { to: '/pengcab/reregistrations', icon: <i className="fas fa-trophy" />, label: 'Daftar Ulang' },
  ];

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
            { label: 'Total', value: stats.total || 0, bg: 'bg-blue-50', text: 'text-blue-700', icon: 'fa-file-alt' },
            { label: 'Pending', value: stats.pending || 0, bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'fa-clock' },
            { label: 'Approved', value: stats.approved_pengcab || 0, bg: 'bg-green-50', text: 'text-green-700', icon: 'fa-check-circle' },
            { label: 'Ditolak', value: stats.rejected || 0, bg: 'bg-red-50', text: 'text-red-700', icon: 'fa-times-circle' },
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

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745] bg-white"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Semua</option>
            <option value="pending">Pending</option>
            <option value="approved_pengcab">Approved Pengcab</option>
            <option value="rejected_pengcab">Ditolak Pengcab</option>
            <option value="rejected_pengda">Ditolak Pengda</option>
            <option value="rejected_pb">Ditolak PB</option>
            <option value="resubmit_to_pengda">Diajukan Ulang ke Pengda</option>
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

      {/* KTA Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#1d3557] px-5 py-3 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-white m-0">
            <i className="fas fa-file-invoice mr-2" />Daftar Pengajuan KTA
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
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-800">{app.club_name}</div>
                      <div className="text-xs text-gray-400">@{app.username}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{app.coach_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">{badge(app.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Link to={`/pengcab/kta/${app.id}`}
                          className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs"
                          title="Detail">
                          <i className="fas fa-eye" />
                        </Link>
                        {app.status === 'pending' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border-none cursor-pointer transition-colors"
                              title="Setujui"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'approved_pengcab', title: 'Setujui KTA?', message: `Setujui pengajuan KTA dari ${app.club_name}?` })}>
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border-none cursor-pointer transition-colors"
                              title="Tolak"
                              onClick={() => setConfirm({ show: true, id: app.id, status: 'rejected_pengcab', title: 'Tolak KTA?', message: `Tolak pengajuan KTA dari ${app.club_name}?` })}>
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {(app.status === 'rejected_pengda' || app.status === 'rejected_pb') && (
                          <button
                            className="w-8 h-8 flex items-center justify-center bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border-none cursor-pointer transition-colors"
                            title="Ajukan Ulang ke Pengda"
                            onClick={() => setConfirm({ show: true, id: app.id, status: 'resubmit_to_pengda', title: 'Ajukan Ulang?', message: `Ajukan ulang KTA ${app.club_name} ke Pengda?` })}>
                            <i className="fas fa-redo text-xs" />
                          </button>
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
        showReason={!!confirm.status && confirm.status !== 'approved_pengcab'}
        reason={confirmReason}
        onReasonChange={setConfirmReason}
        reasonLabel={confirm.status === 'rejected_pengcab' ? 'Alasan Penolakan *' : 'Catatan (opsional)'}
      />
    </SidebarLayout>
  );
}

