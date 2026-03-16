import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STAT_CARDS_PENGDA = [
  { key: 'total',    label: 'Total Pendaftar', iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',    shadow: 'shadow-blue-500/20',    icon: 'fa-users' },
  { key: 'pending',  label: 'Pending',         iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',  shadow: 'shadow-amber-500/20',   icon: 'fa-clock' },
  { key: 'approved', label: 'Disetujui',       iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',shadow: 'shadow-emerald-500/20',icon: 'fa-check-circle' },
];

const STAT_CARDS_PENGCAB = [
  { key: 'total',    label: 'Total Pendaftar', iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',    shadow: 'shadow-blue-500/20',    icon: 'fa-users' },
  { key: 'approved', label: 'Disetujui',       iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',shadow: 'shadow-emerald-500/20',icon: 'fa-check-circle' },
  { key: 'rejected', label: 'Ditolak',         iconBg: 'bg-gradient-to-br from-red-500 to-red-600',      shadow: 'shadow-red-500/20',     icon: 'fa-times-circle' },
];

const STATUS_BADGE = {
  pending:  { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20', label: 'Pending' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', label: 'Disetujui' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', ring: 'ring-red-500/20', label: 'Ditolak' },
};

export default function KejurdaManage({ embedded }) {
  const { user } = useAuth();
  const isPengda = user?.role_id === 3;
  const isPengcab = user?.role_id === 2;

  const [activeSubTab, setActiveSubTab] = useState(isPengda ? 'registrations' : 'register');
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registration form
  const [clubSearch, setClubSearch] = useState('');
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete/Reject
  const [deleteId, setDeleteId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Events form
  const [eventForm, setEventForm] = useState({ event_name: '', event_date: '', location: '', description: '' });
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // Category form
  const [catForm, setCatForm] = useState({ category_name: '', level: '' });
  const [catSubmitting, setCatSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [catRes, regRes, statsRes, eventsRes] = await Promise.all([
        api.get('/kejurda/categories'),
        api.get('/kejurda/registrations'),
        api.get('/kejurda/stats'),
        api.get('/kejurda/events')
      ]);
      setCategories(catRes.data.data || []);
      setRegistrations(regRes.data.data || []);
      setStats(statsRes.data.data);
      setEvents(eventsRes.data.data || []);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleSearchClub = async () => {
    if (clubSearch.length < 2) return toast.error('Minimal 2 karakter');
    try {
      const res = await api.get('/kejurda/search-clubs', { params: { search: clubSearch } });
      setClubs(res.data.data || []);
      if (res.data.data.length === 0) toast('Tidak ditemukan klub');
    } catch { toast.error('Gagal mencari'); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedClub || !selectedCategory || !teamName.trim()) return toast.error('Lengkapi semua field');
    setSubmitting(true);
    try {
      await api.post('/kejurda/register', {
        club_id: selectedClub.user_id || selectedClub.id,
        category_id: selectedCategory,
        team_name: teamName.trim(),
        club_name: selectedClub.club_name,
        coach_name: selectedClub.coach_name || '',
        manager_name: selectedClub.manager_name || '',
        logo_path: selectedClub.logo_path || null,
        event_id: events.length ? events[0].id : null
      });
      toast.success('Tim berhasil didaftarkan');
      setSelectedClub(null); setSelectedCategory(''); setTeamName(''); setClubs([]);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mendaftar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/kejurda/registrations/${deleteId}`);
      toast.success('Pendaftaran dihapus');
      setDeleteId(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/kejurda/registrations/${id}/approve`);
      toast.success('Pendaftaran disetujui');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleReject = async () => {
    try {
      await api.put(`/kejurda/registrations/${rejectId}/reject`, { reason: rejectReason });
      toast.success('Pendaftaran ditolak');
      setRejectId(null); setRejectReason('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.event_name || !eventForm.event_date) return toast.error('Nama event dan tanggal wajib diisi');
    setEventSubmitting(true);
    try {
      await api.post('/kejurda/events', eventForm);
      toast.success('Event berhasil dibuat');
      setEventForm({ event_name: '', event_date: '', location: '', description: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
    finally { setEventSubmitting(false); }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await api.delete(`/kejurda/events/${id}`);
      toast.success('Event dihapus');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catForm.category_name) return toast.error('Nama kategori wajib diisi');
    setCatSubmitting(true);
    try {
      await api.post('/kejurda/categories', catForm);
      toast.success('Kategori berhasil dibuat');
      setCatForm({ category_name: '', level: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
    finally { setCatSubmitting(false); }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/kejurda/categories/${id}`);
      toast.success('Kategori dihapus');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/kejurda/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kejurda_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Gagal export'); }
  };

  const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
  const SEL   = 'w-full pl-3 pr-8 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all cursor-pointer';
  const BTN_PRIMARY = 'inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all';
  const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all';

  const subTabs = isPengda
    ? [
        { key: 'registrations', label: 'Pendaftaran', icon: 'fa-list' },
        { key: 'events', label: 'Event', icon: 'fa-calendar' },
        { key: 'categories', label: 'Kategori', icon: 'fa-tags' },
      ]
    : [
        { key: 'register', label: 'Daftar Tim', icon: 'fa-plus' },
        { key: 'registrations', label: 'Pendaftaran Saya', icon: 'fa-list' },
      ];

  const STAT_CARDS = isPengda ? STAT_CARDS_PENGDA : STAT_CARDS_PENGCAB;

  const renderRegistrationForm = () => (
    <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <i className="fas fa-plus text-white text-sm" />
        </div>
        <h2 className="m-0 text-[14px] font-bold text-white">Daftarkan Tim Kejurda</h2>
      </div>
      <div className="p-5 space-y-4">
        {/* Club Search */}
        <div className="flex gap-2 flex-wrap">
          <input className={`${INPUT} flex-1 min-w-[200px]`} value={clubSearch} onChange={e => setClubSearch(e.target.value)} placeholder="Cari nama klub..." />
          <button type="button" onClick={handleSearchClub} className={BTN_GHOST}>
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
              {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}{c.level ? ` - ${c.level}` : ''}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Tim *</label>
            <input className={INPUT} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Nama tim..." required />
          </div>
          <button type="submit" disabled={submitting || !selectedClub} className={BTN_PRIMARY}>
            {submitting ? 'Mendaftar...' : 'Daftarkan'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderRegistrationsTable = () => (
    <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-trophy text-white text-sm" />
          </div>
          <div>
            <h2 className="m-0 text-[14px] font-bold text-white">Daftar Pendaftaran Kejurda</h2>
            <p className="m-0 text-[11px] text-gray-500">{registrations.length} tim terdaftar</p>
          </div>
        </div>
        {isPengda && (
          <button onClick={handleExport} className={BTN_GHOST}>
            <i className="fas fa-file-excel text-xs" /> Export
          </button>
        )}
      </div>
      {loading ? (
        <div className="p-8 flex justify-center"><LoadingSpinner /></div>
      ) : registrations.length === 0 ? (
        <div className="p-12 text-center">
          <i className="fas fa-trophy text-3xl text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 m-0">Belum ada pendaftaran</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02]">
                {['No', 'Tim', 'Klub', 'Kategori', isPengda ? 'Kota' : null, isPengda ? 'Pengcab' : null, 'Status', 'Tanggal', 'Aksi'].filter(Boolean).map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {registrations.map((r, idx) => {
                const sb = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                return (
                  <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{r.team_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{r.club_name}</td>
                    <td className="px-4 py-3 text-gray-400">{r.category_name}</td>
                    {isPengda && <td className="px-4 py-3 text-gray-400">{r.city_name || '-'}</td>}
                    {isPengda && <td className="px-4 py-3 text-gray-400">{r.pengcab_name || '-'}</td>}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full ring-1 ${sb.ring} ${sb.bg} ${sb.text}`}>
                        {sb.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {isPengda && r.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(r.id)} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors" title="Setujui">
                              <i className="fas fa-check text-xs" />
                            </button>
                            <button onClick={() => setRejectId(r.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Tolak">
                              <i className="fas fa-times text-xs" />
                            </button>
                          </>
                        )}
                        {(isPengcab && r.status === 'pending') && (
                          <button onClick={() => setDeleteId(r.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Hapus">
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        )}
                        {isPengda && (
                          <button onClick={() => setDeleteId(r.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Hapus">
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderEventsSection = () => (
    <div className="space-y-5">
      {/* Create Event Form */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-calendar-plus text-white text-sm" />
          </div>
          <h2 className="m-0 text-[14px] font-bold text-white">Buat Event Kejurda</h2>
        </div>
        <form onSubmit={handleCreateEvent} className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Event *</label>
              <input className={INPUT} value={eventForm.event_name} onChange={e => setEventForm(p => ({ ...p, event_name: e.target.value }))} placeholder="Nama event..." required />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal *</label>
              <input type="date" className={INPUT} value={eventForm.event_date} onChange={e => setEventForm(p => ({ ...p, event_date: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lokasi</label>
              <input className={INPUT} value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))} placeholder="Lokasi event..." />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deskripsi</label>
              <input className={INPUT} value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi..." />
            </div>
          </div>
          <button type="submit" disabled={eventSubmitting} className={BTN_PRIMARY}>
            {eventSubmitting ? 'Menyimpan...' : 'Buat Event'}
          </button>
        </form>
      </div>

      {/* Events List */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-calendar text-white text-sm" />
          </div>
          <h2 className="m-0 text-[14px] font-bold text-white">Daftar Event</h2>
        </div>
        {events.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-calendar text-3xl text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 m-0">Belum ada event</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {events.map(ev => (
              <div key={ev.id} className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div>
                  <div className="font-semibold text-white text-sm">{ev.event_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {ev.event_date ? new Date(ev.event_date).toLocaleDateString('id-ID') : '-'}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </div>
                </div>
                <button onClick={() => handleDeleteEvent(ev.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Hapus">
                  <i className="fas fa-trash-alt text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCategoriesSection = () => (
    <div className="space-y-5">
      {/* Create Category Form */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-plus text-white text-sm" />
          </div>
          <h2 className="m-0 text-[14px] font-bold text-white">Tambah Kategori</h2>
        </div>
        <form onSubmit={handleCreateCategory} className="p-5">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Kategori *</label>
              <input className={INPUT} value={catForm.category_name} onChange={e => setCatForm(p => ({ ...p, category_name: e.target.value }))} placeholder="Contoh: Tongkat Mayoret" required />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Level</label>
              <input className={INPUT} value={catForm.level} onChange={e => setCatForm(p => ({ ...p, level: e.target.value }))} placeholder="Contoh: SMA, SMP" />
            </div>
            <button type="submit" disabled={catSubmitting} className={BTN_PRIMARY}>
              {catSubmitting ? 'Menyimpan...' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-tags text-white text-sm" />
          </div>
          <h2 className="m-0 text-[14px] font-bold text-white">Daftar Kategori</h2>
        </div>
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-tags text-3xl text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 m-0">Belum ada kategori</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {categories.map(cat => (
              <div key={cat.id} className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div>
                  <div className="font-semibold text-white text-sm">{cat.category_name}</div>
                  {cat.level && <div className="text-xs text-gray-500 mt-0.5">{cat.level}</div>}
                </div>
                <button onClick={() => handleDeleteCategory(cat.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Hapus">
                  <i className="fas fa-trash-alt text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

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

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-all ${activeSubTab === t.key ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08] hover:text-white'}`}>
            <i className={`fas ${t.icon} text-xs`} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeSubTab === 'register' && renderRegistrationForm()}
      {activeSubTab === 'registrations' && renderRegistrationsTable()}
      {activeSubTab === 'events' && isPengda && renderEventsSection()}
      {activeSubTab === 'categories' && isPengda && renderCategoriesSection()}

      {deleteId && (
        <ConfirmModal title="Hapus Pendaftaran?" message="Pendaftaran tim ini akan dihapus." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
      {rejectId && (
        <ConfirmModal
          title="Tolak Pendaftaran?"
          message="Pendaftaran tim ini akan ditolak."
          onConfirm={handleReject}
          onCancel={() => { setRejectId(null); setRejectReason(''); }}
          danger
          showReason
          reason={rejectReason}
          onReasonChange={setRejectReason}
          reasonLabel="Alasan Penolakan"
        />
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b11' }}>
      <Navbar title="Kejurda" />
      <div className="page-container">{content}</div>
    </div>
  );
}
