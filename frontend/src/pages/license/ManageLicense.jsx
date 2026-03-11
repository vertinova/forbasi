import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS = {
  pending:  { label: 'Pending',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/20',   dot: 'bg-amber-500' },
  proses:   { label: 'Diproses',  bg: 'bg-blue-500/10',    text: 'text-blue-400',    ring: 'ring-blue-500/20',    dot: 'bg-blue-500' },
  approved: { label: 'Approved',  bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',   bg: 'bg-red-500/10',     text: 'text-red-400',     ring: 'ring-red-500/20',     dot: 'bg-red-500' },
};

const STAT_CARDS = [
  { key: 'pending',  label: 'Pending',   iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',   shadow: 'shadow-amber-500/20',  icon: 'fa-clock' },
  { key: 'proses',   label: 'Diproses',  iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',     shadow: 'shadow-blue-500/20',   icon: 'fa-spinner' },
  { key: 'approved', label: 'Approved',  iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',shadow: 'shadow-emerald-500/20',icon: 'fa-check-circle' },
  { key: 'rejected', label: 'Ditolak',   iconBg: 'bg-gradient-to-br from-red-500 to-red-600',       shadow: 'shadow-red-500/20',    icon: 'fa-times-circle' },
];

export default function ManageLicense({ embedded }) {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/license/applications', { params: { status: filterStatus, search } }),
        api.get('/license/stats')
      ]);
      setApplications(appsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/license/applications/${id}/status`, { status });
      toast.success('Status berhasil diperbarui');
      setDetail(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const Badge = ({ status }) => {
    const s = STATUS[status] || STATUS.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ${s.bg} ${s.text} ring-1 ${s.ring}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  };

  const content = (
    <div className="space-y-6">
      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STAT_CARDS.map(c => (
            <div key={c.key} className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 hover:bg-[#191c28] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center shadow-md ${c.shadow} flex-shrink-0`}>
                  <i className={`fas ${c.icon} text-white text-sm`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white m-0 leading-tight">{stats[c.key] || 0}</p>
                  <p className="text-[11px] text-gray-500 m-0 mt-0.5">{c.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4">
        <form onSubmit={e => { e.preventDefault(); setLoading(true); fetchData(); }} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all cursor-pointer">
              <option value="">Semua</option>
              <option value="pending">Pending</option>
              <option value="proses">Diproses</option>
              <option value="approved">Approved</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pencarian</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama..."
              className="w-full px-3.5 py-2 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all" />
          </div>
          <button type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all">
            <i className="fas fa-search text-xs" /> Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <i className="fas fa-id-badge text-white text-sm" />
            </div>
            <div>
              <h2 className="m-0 text-[14px] font-bold text-white">Pengajuan Lisensi</h2>
              <p className="m-0 text-[11px] text-gray-500">{applications.length} pengajuan</p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner /></div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-inbox text-3xl text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 m-0">Belum ada pengajuan lisensi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Jenis</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {applications.map((app, idx) => (
                  <tr key={app.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{app.full_name || app.username}</td>
                    <td className="px-4 py-3 text-gray-400">{app.license_type}</td>
                    <td className="px-4 py-3"><Badge status={app.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(app.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setDetail(app)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-colors" title="Detail">
                          <i className="fas fa-eye text-xs" />
                        </button>
                        {(app.status === 'pending' || app.status === 'proses') && (
                          <>
                            <button onClick={() => handleUpdateStatus(app.id, 'approved')} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors" title="Approve">
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Reject">
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

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-[#141620] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/[0.06]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white m-0">Detail Pengajuan Lisensi</h3>
              <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center transition-colors text-gray-400 hover:text-white">
                <i className="fas fa-times text-sm" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                ['Nama', detail.full_name || detail.username],
                ['Jenis', detail.license_type],
                ['Tanggal', new Date(detail.created_at).toLocaleDateString('id-ID')],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">{l}</span>
                  <span className="text-sm text-white font-medium">{v}</span>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Status</span>
                <Badge status={detail.status} />
              </div>
              {detail.notes && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Catatan</span>
                  <span className="text-sm text-gray-400">{detail.notes}</span>
                </div>
              )}
              {detail.document && (
                <a href={`${API_BASE}/uploads/license/${detail.document}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-xl bg-blue-500 text-white font-semibold shadow-sm hover:bg-blue-600 active:scale-[0.97] transition-all no-underline">
                  <i className="fas fa-file-alt" /> Lihat Dokumen
                </a>
              )}
            </div>
            <div className="px-6 py-4 bg-white/[0.03] border-t border-white/[0.06] flex items-center gap-2 flex-wrap">
              {(detail.status === 'pending' || detail.status === 'proses') && (
                <>
                  <button onClick={() => handleUpdateStatus(detail.id, 'approved')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-emerald-500 text-white font-semibold shadow-sm hover:bg-emerald-600 active:scale-[0.97] transition-all">
                    <i className="fas fa-check" /> Approve
                  </button>
                  <button onClick={() => handleUpdateStatus(detail.id, 'rejected')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 active:scale-[0.97] transition-all">
                    <i className="fas fa-times" /> Reject
                  </button>
                </>
              )}
              <button onClick={() => setDetail(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all ml-auto">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b11' }}>
      <Navbar title="Kelola Lisensi" />
      <div className="page-container">{content}</div>
    </div>
  );
}
