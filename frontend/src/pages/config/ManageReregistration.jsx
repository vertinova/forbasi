import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Pagination } from '../../components/layout/MainLayout';
import toast from 'react-hot-toast';

const PER_PAGE = 10;

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS = {
  pending:  { label: 'Pending',   dot: 'bg-amber-400',  ring: 'ring-amber-400/20',  bg: 'bg-amber-500/10',  text: 'text-amber-400' },
  approved: { label: 'Disetujui', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  rejected: { label: 'Ditolak',   dot: 'bg-red-500',    ring: 'ring-red-500/20',    bg: 'bg-red-500/10',    text: 'text-red-400' },
};

const Badge = ({ status }) => {
  const s = STATUS[status] || { label: status, dot: 'bg-gray-400', ring: 'ring-gray-400/20', bg: 'bg-white/[0.05]', text: 'text-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ring-1 ${s.ring} ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const SELECT = 'pl-3 pr-8 py-2 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all cursor-pointer';

export default function ManageReregistration({ embedded }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState({ show: false, id: null, action: '' });
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); loadData(); }, [filter]);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const paginatedItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/config/reregistrations${params}`);
      setItems(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleAction = async () => {
    setProcessing(true);
    try {
      await api.put(`/config/reregistrations/${modal.id}/status`, { status: modal.action });
      toast.success(`Pendaftaran ${modal.action === 'approved' ? 'disetujui' : 'ditolak'}`);
      setModal({ show: false, id: null, action: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses');
    } finally { setProcessing(false); }
  };

  const counts = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  };

  const STAT_CARDS = [
    { label: 'Total', value: counts.total, icon: 'fa-list-alt', from: 'from-blue-500', to: 'to-blue-600', shadow: 'shadow-blue-500/25' },
    { label: 'Pending', value: counts.pending, icon: 'fa-clock', from: 'from-amber-400', to: 'to-amber-500', shadow: 'shadow-amber-400/25' },
    { label: 'Disetujui', value: counts.approved, icon: 'fa-check-circle', from: 'from-emerald-500', to: 'to-emerald-600', shadow: 'shadow-emerald-500/25' },
    { label: 'Ditolak', value: counts.rejected, icon: 'fa-times-circle', from: 'from-red-500', to: 'to-red-600', shadow: 'shadow-red-500/25' },
  ];

  const content = (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3 hover:bg-[#191c28] transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center shadow-lg ${c.shadow} flex-shrink-0`}>
              <i className={`fas ${c.icon} text-white text-sm`} />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none m-0">{c.value}</p>
              <p className="text-[11px] text-gray-500 m-0">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
              <i className="fas fa-sync-alt text-white text-sm" />
            </div>
            <div>
              <h2 className="m-0 text-[14px] font-bold text-white">Pendaftaran Ulang</h2>
              <p className="m-0 text-[11px] text-gray-500">{items.length} data ditemukan</p>
            </div>
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className={SELECT}>
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-inbox text-gray-400 text-xl" />
            </div>
            <p className="text-sm text-gray-500 m-0">Tidak ada data daftar ulang</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02]">
                  {['No', 'Klub', 'Kompetisi', 'Tahun', 'Status', 'Dokumen', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paginatedItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{(page - 1) * PER_PAGE + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{item.club_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{item.competition_name}</td>
                    <td className="px-4 py-3 text-gray-400">{item.year}</td>
                    <td className="px-4 py-3"><Badge status={item.status} /></td>
                    <td className="px-4 py-3">
                      {item.document_path ? (
                        <a href={`${API_BASE}/uploads/${item.document_path}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                          <i className="fas fa-file-alt text-[10px]" /> Lihat
                        </a>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setModal({ show: true, id: item.id, action: 'approved' })}
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors" title="Setujui">
                            <i className="fas fa-check text-xs" />
                          </button>
                          <button onClick={() => setModal({ show: true, id: item.id, action: 'rejected' })}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Tolak">
                            <i className="fas fa-times text-xs" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && items.length > PER_PAGE && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={items.length}
            itemLabel="data"
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Confirm Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !processing && setModal({ show: false, id: null, action: '' })} />
          <div className="relative bg-[#141620] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/[0.06]">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-[15px] font-bold text-white m-0">
                {modal.action === 'approved' ? 'Setujui Pendaftaran?' : 'Tolak Pendaftaran?'}
              </h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-400 m-0">
                Yakin ingin {modal.action === 'approved' ? 'menyetujui' : 'menolak'} pendaftaran ini?
              </p>
            </div>
            <div className="px-5 py-3 border-t border-white/[0.06] flex justify-end gap-2">
              <button onClick={() => setModal({ show: false, id: null, action: '' })} disabled={processing}
                className="px-4 py-2 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white transition-all">
                Batal
              </button>
              <button onClick={handleAction} disabled={processing}
                className={`px-4 py-2 text-sm rounded-xl text-white font-semibold shadow-md transition-all disabled:opacity-40 ${
                  modal.action === 'approved'
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500'
                    : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25 hover:from-red-400 hover:to-red-500'
                }`}>
                {processing ? <i className="fas fa-spinner fa-spin text-xs" /> : modal.action === 'approved' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <DashboardLayout>{content}</DashboardLayout>
  );
}
