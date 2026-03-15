import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS = {
  pending:  { label: 'Pending',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/20',   dot: 'bg-amber-500' },
  proses:   { label: 'Diproses',  bg: 'bg-blue-500/10',    text: 'text-blue-400',    ring: 'ring-blue-500/20',    dot: 'bg-blue-500' },
  approved: { label: 'Approved',  bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',   bg: 'bg-red-500/10',     text: 'text-red-400',     ring: 'ring-red-500/20',     dot: 'bg-red-500' },
};

const TABS = [
  { key: 'pelatih',   label: 'Pelatih',    icon: 'fa-bullhorn', color: 'orange', filter: v => v === 'pelatih' },
  { key: 'juri_muda', label: 'Juri Muda',  icon: 'fa-star',     color: 'violet', filter: v => v === 'juri_muda' },
  { key: 'juri_madya',label: 'Juri Madya',  icon: 'fa-crown',    color: 'purple', filter: v => v === 'juri_madya' },
];

const DOC_FIELDS = [
  { key: 'pas_foto',           label: 'Pas Foto 4x6',              icon: 'fa-user-circle' },
  { key: 'bukti_transfer',     label: 'Bukti Transfer',             icon: 'fa-receipt' },
  { key: 'surat_pengalaman',   label: 'Surat Keterangan Pengalaman',icon: 'fa-file-alt' },
  { key: 'sertifikat_tot',     label: 'Sertifikat ToT',             icon: 'fa-certificate' },
  { key: 'surat_rekomendasi',  label: 'Surat Rekomendasi Pengda',   icon: 'fa-file-signature' },
];

const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
const formatJenis = (v) => ({ pelatih: 'Pelatih', juri_muda: 'Juri Muda', juri_madya: 'Juri Madya' }[v] || v);

export default function ManageLicense({ embedded }) {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pelatih');
  const [detail, setDetail] = useState(null);
  const [docPreview, setDocPreview] = useState({ show: false, url: '', title: '' });

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

  const currentTab = TABS.find(t => t.key === activeTab);
  const filteredApps = applications.filter(app => {
    const jenis = app.license_type || app.jenis_lisensi || '';
    return currentTab.filter(jenis);
  });

  const Badge = ({ status }) => {
    const s = STATUS[status] || STATUS.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ${s.bg} ${s.text} ring-1 ${s.ring}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  };

  const FileButton = ({ file, label }) => {
    if (!file) return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <i className="fas fa-times-circle text-gray-600 text-xs" />
        <span className="text-xs text-gray-600">{label} — tidak diupload</span>
      </div>
    );
    return (
      <button
        type="button"
        onClick={() => setDocPreview({ show: true, url: `${API_BASE}/uploads/${file}`, title: label })}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer w-full text-left border-none"
        style={{ border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <i className="fas fa-eye text-xs" />
        <span className="text-xs font-medium truncate">{label}</span>
        <i className="fas fa-external-link-alt text-[10px] ml-auto opacity-50" />
      </button>
    );
  };

  const tabCounts = {
    pelatih: applications.filter(a => (a.license_type || a.jenis_lisensi) === 'pelatih').length,
    juri_muda: applications.filter(a => (a.license_type || a.jenis_lisensi) === 'juri_muda').length,
    juri_madya: applications.filter(a => (a.license_type || a.jenis_lisensi) === 'juri_madya').length,
  };

  const content = (
    <div className="space-y-6">
      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: 'pending',  label: 'Pending',   iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',   shadow: 'shadow-amber-500/20',  icon: 'fa-clock' },
            { key: 'proses',   label: 'Diproses',  iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',     shadow: 'shadow-blue-500/20',   icon: 'fa-spinner' },
            { key: 'approved', label: 'Approved',  iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',shadow: 'shadow-emerald-500/20',icon: 'fa-check-circle' },
            { key: 'rejected', label: 'Ditolak',   iconBg: 'bg-gradient-to-br from-red-500 to-red-600',       shadow: 'shadow-red-500/20',    icon: 'fa-times-circle' },
          ].map(c => (
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

      {/* Category Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0d0f17] border border-white/[0.06] w-fit">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const colorMap = { orange: 'from-orange-500 to-amber-600', violet: 'from-violet-500 to-purple-600', purple: 'from-purple-500 to-fuchsia-600' };
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-none cursor-pointer ${
                isActive
                  ? `bg-gradient-to-br ${colorMap[tab.color]} text-white shadow-lg`
                  : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`} />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-white/[0.05] text-gray-500'
              }`}>{tabCounts[tab.key]}</span>
            </button>
          );
        })}
      </div>

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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / username..."
              className="w-full px-3.5 py-2 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all" />
          </div>
          <button type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all border-none cursor-pointer">
            <i className="fas fa-search text-xs" /> Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
              activeTab === 'pelatih' ? 'from-orange-500 to-amber-600' : activeTab === 'juri_muda' ? 'from-violet-500 to-purple-600' : 'from-purple-500 to-fuchsia-600'
            } flex items-center justify-center shadow-lg flex-shrink-0`}>
              <i className={`fas ${currentTab.icon} text-white text-sm`} />
            </div>
            <div>
              <h2 className="m-0 text-[14px] font-bold text-white">Pengajuan {currentTab.label}</h2>
              <p className="m-0 text-[11px] text-gray-500">{filteredApps.length} pengajuan</p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner /></div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              activeTab === 'pelatih' ? 'bg-orange-500/10' : 'bg-violet-500/10'
            }`}>
              <i className={`fas ${currentTab.icon} text-2xl ${
                activeTab === 'pelatih' ? 'text-orange-500/50' : 'text-violet-500/50'
              }`} />
            </div>
            <p className="text-sm text-gray-500 m-0">Belum ada pengajuan lisensi {currentTab.label}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Akomodasi</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Biaya</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredApps.map((app, idx) => (
                  <tr key={app.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white m-0 text-sm">{app.full_name || app.username}</p>
                      {app.email && <p className="text-[11px] text-gray-500 m-0">{app.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs capitalize">{(app.akomodasi || '').replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs font-medium">{formatCurrency(app.biaya_lisensi)}</td>
                    <td className="px-4 py-3"><Badge status={app.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setDetail(app)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-colors border-none cursor-pointer" title="Detail">
                          <i className="fas fa-eye text-xs" />
                        </button>
                        {(app.status === 'pending' || app.status === 'proses') && (
                          <>
                            <button onClick={() => handleUpdateStatus(app.id, 'approved')} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors border-none cursor-pointer" title="Approve">
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors border-none cursor-pointer" title="Reject">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-[#141620] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/[0.06] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`px-6 py-4 border-b border-white/[0.06] flex items-center justify-between ${
              activeTab === 'pelatih' ? 'bg-gradient-to-r from-orange-500/10 to-transparent' : 'bg-gradient-to-r from-violet-500/10 to-transparent'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                  activeTab === 'pelatih' ? 'from-orange-500 to-amber-600' : activeTab === 'juri_muda' ? 'from-violet-500 to-purple-600' : 'from-purple-500 to-fuchsia-600'
                } flex items-center justify-center shadow-lg`}>
                  <i className={`fas ${currentTab.icon} text-white text-sm`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white m-0">Detail Pengajuan</h3>
                  <p className="text-[11px] text-gray-500 m-0">{formatJenis(detail.license_type || detail.jenis_lisensi)}</p>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center transition-colors text-gray-400 hover:text-white border-none cursor-pointer bg-transparent">
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              {/* Info Section */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider m-0">Informasi Pengaju</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Nama', value: detail.full_name || detail.username, full: true },
                    { label: 'Email', value: detail.email || '-' },
                    { label: 'No. Telepon', value: detail.phone || detail.no_telepon || '-' },
                    { label: 'Jenis Lisensi', value: formatJenis(detail.license_type || detail.jenis_lisensi) },
                    { label: 'Akomodasi', value: (detail.akomodasi || '').replace('_', ' ') },
                    { label: 'Biaya', value: formatCurrency(detail.biaya_lisensi) },
                    { label: 'Tanggal Pengajuan', value: detail.submitted_at ? new Date(detail.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
                  ].map(item => (
                    <div key={item.label} className={`p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] ${item.full ? 'col-span-2' : ''}`}>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold m-0 tracking-wider">{item.label}</p>
                      <p className="text-sm text-white font-medium m-0 mt-1 capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold m-0 tracking-wider">Status</p>
                  <div className="mt-1.5"><Badge status={detail.status} /></div>
                </div>
                {detail.notes && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold m-0 tracking-wider">Catatan</p>
                    <p className="text-sm text-gray-300 m-0 mt-1">{detail.notes}</p>
                  </div>
                )}
                {detail.alasan_penolakan && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <p className="text-[10px] text-red-400 uppercase font-semibold m-0 tracking-wider">Alasan Penolakan</p>
                    <p className="text-sm text-red-300 m-0 mt-1">{detail.alasan_penolakan}</p>
                  </div>
                )}
              </div>

              {/* Documents Section */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider m-0">Dokumen yang Diupload</h4>
                <div className="space-y-2">
                  {DOC_FIELDS.map(doc => (
                    <FileButton key={doc.key} file={detail[doc.key]} label={doc.label} />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-white/[0.03] border-t border-white/[0.06] flex items-center gap-2 flex-wrap">
              {(detail.status === 'pending' || detail.status === 'proses') && (
                <>
                  <button onClick={() => handleUpdateStatus(detail.id, 'approved')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-emerald-500 text-white font-semibold shadow-sm hover:bg-emerald-600 active:scale-[0.97] transition-all border-none cursor-pointer">
                    <i className="fas fa-check" /> Approve
                  </button>
                  <button onClick={() => handleUpdateStatus(detail.id, 'rejected')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 active:scale-[0.97] transition-all cursor-pointer">
                    <i className="fas fa-times" /> Reject
                  </button>
                </>
              )}
              <button onClick={() => setDetail(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all ml-auto cursor-pointer">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      <DocumentPreviewModal show={docPreview.show} url={docPreview.url} title={docPreview.title} onClose={() => setDocPreview({ show: false, url: '', title: '' })} />
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
