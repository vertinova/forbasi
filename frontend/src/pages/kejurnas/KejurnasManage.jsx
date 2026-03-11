import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STAT_CARDS = [
  { key: 'total',    label: 'Total Pendaftar', iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',    shadow: 'shadow-blue-500/20',    icon: 'fa-users' },
  { key: 'jawa',     label: 'Region Jawa',     iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',shadow: 'shadow-emerald-500/20',icon: 'fa-chart-bar' },
  { key: 'luarJawa', label: 'Luar Jawa',       iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',  shadow: 'shadow-amber-500/20',  icon: 'fa-chart-bar' },
];

export default function KejurnasManage({ embedded }) {
  const [categories, setCategories] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clubSearch, setClubSearch] = useState('');
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [catRes, regRes, statsRes] = await Promise.all([
        api.get('/kejurnas/categories'),
        api.get('/kejurnas/registrations'),
        api.get('/kejurnas/stats')
      ]);
      setCategories(catRes.data.data || []);
      setRegistrations(regRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleSearchClub = async () => {
    if (clubSearch.length < 2) return toast.error('Minimal 2 karakter');
    try {
      const res = await api.get('/kejurnas/search-clubs', { params: { q: clubSearch } });
      setClubs(res.data.data || []);
      if (res.data.data.length === 0) toast('Tidak ditemukan klub');
    } catch { toast.error('Gagal mencari'); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedClub || !selectedCategory || !teamName.trim()) return toast.error('Lengkapi semua field');
    setSubmitting(true);
    try {
      await api.post('/kejurnas/registrations', {
        club_id: selectedClub.id,
        category_id: selectedCategory,
        team_name: teamName.trim()
      });
      toast.success('Tim berhasil didaftarkan');
      setSelectedClub(null); setSelectedCategory(''); setTeamName(''); setClubs([]);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mendaftar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/kejurnas/registrations/${deleteId}`);
      toast.success('Pendaftaran dihapus');
      setDeleteId(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
  const SEL   = 'w-full px-3 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all cursor-pointer';

  const content = (
    <div className="space-y-6">
      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Registration Form */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-plus text-white text-sm" />
          </div>
          <h2 className="m-0 text-[14px] font-bold text-white">Daftarkan Tim</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Club Search */}
          <div className="flex gap-2 flex-wrap">
            <input className={`${INPUT} flex-1 min-w-[200px]`} value={clubSearch} onChange={e => setClubSearch(e.target.value)} placeholder="Cari nama klub..." />
            <button type="button" onClick={handleSearchClub}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all">
              <i className="fas fa-search text-xs" /> Cari
            </button>
          </div>

          {/* Search Results */}
          {clubs.length > 0 && !selectedClub && (
            <div className="rounded-xl border border-white/[0.08] overflow-hidden max-h-48 overflow-y-auto">
              {clubs.map(c => (
                <button key={c.id} type="button" onClick={() => { setSelectedClub(c); setClubs([]); }}
                  className="w-full px-4 py-3 text-left hover:bg-white/[0.05] border-b border-white/[0.04] last:border-0 transition-colors cursor-pointer bg-transparent">
                  <span className="font-semibold text-sm text-white">{c.club_name}</span>
                  <span className="text-xs text-gray-500 ml-2">— {c.city_name}, {c.province_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected Club */}
          {selectedClub && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-sm">
                <span className="font-semibold text-emerald-400">{selectedClub.club_name}</span>
                <span className="text-emerald-400/60 text-xs ml-2">— {selectedClub.city_name}, {selectedClub.province_name}</span>
              </span>
              <button type="button" onClick={() => setSelectedClub(null)} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors border border-red-500/20">
                <i className="fas fa-times text-xs" />
              </button>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleRegister} className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kategori *</label>
              <select className={SEL} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} required>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Tim *</label>
              <input className={INPUT} value={teamName} onChange={e => setTeamName(e.target.value)} required />
            </div>
            <button type="submit" disabled={submitting || !selectedClub}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {submitting ? 'Mendaftar...' : 'Daftarkan'}
            </button>
          </form>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <i className="fas fa-trophy text-white text-sm" />
            </div>
            <div>
              <h2 className="m-0 text-[14px] font-bold text-white">Daftar Pendaftaran</h2>
              <p className="m-0 text-[11px] text-gray-500">{registrations.length} tim terdaftar</p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner /></div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-trophy text-3xl text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 m-0">Belum ada pendaftaran</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02]">
                  {['No', 'Tim', 'Klub', 'Kategori', 'Region', 'Tanggal', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {registrations.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{r.team_name}</td>
                    <td className="px-4 py-3 text-gray-400">{r.club_name}</td>
                    <td className="px-4 py-3 text-gray-400">{r.category_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full ${r.region === 'Jawa' ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20' : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'}`}>
                        {r.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteId(r.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Hapus">
                        <i className="fas fa-trash-alt text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteId && (
        <ConfirmModal title="Hapus Pendaftaran?" message="Pendaftaran tim ini akan dihapus." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b11' }}>
      <Navbar title="Kejurnas" />
      <div className="page-container">{content}</div>
    </div>
  );
}
