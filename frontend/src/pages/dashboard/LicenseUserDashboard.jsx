import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS = {
  pending:  { label: 'Pending',  bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/20',   dot: 'bg-amber-500' },
  proses:   { label: 'Diproses', bg: 'bg-blue-500/10',    text: 'text-blue-400',    ring: 'ring-blue-500/20',    dot: 'bg-blue-500' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',  bg: 'bg-red-500/10',     text: 'text-red-400',     ring: 'ring-red-500/20',     dot: 'bg-red-500' },
};

const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
const SELECT = INPUT + ' pr-8 cursor-pointer';

const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

export default function LicenseUserDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ license_type: '', akomodasi: 'tanpa_kamar', notes: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/license/my-applications');
      setApplications(res.data.data || []);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.license_type || !file) return toast.error('Lengkapi semua field wajib');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('license_type', formData.license_type);
      fd.append('akomodasi', formData.akomodasi);
      fd.append('notes', formData.notes);
      fd.append('document', file);
      await api.post('/license/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pengajuan lisensi berhasil dikirim');
      setShowForm(false); setFormData({ license_type: '', akomodasi: 'tanpa_kamar', notes: '' }); setFile(null);
      fetchApplications();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengirim'); }
    finally { setSubmitting(false); }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const SECTIONS = [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { key: 'ajukan',    label: 'Ajukan Lisensi', icon: 'fa-plus-circle' },
    { key: 'riwayat',   label: 'Riwayat Pengajuan', icon: 'fa-history' },
    { divider: true, dividerLabel: 'Akun' },
    { key: 'profil',    label: 'Profil', icon: 'fa-user-cog' },
  ];

  const menuItems = SECTIONS.map(s => {
    if (s.divider) return s;
    return {
      label: s.label,
      icon: <i className={`fas ${s.icon}`} />,
      onClick: () => { setActiveSection(s.key); if (s.key === 'ajukan') setShowForm(true); },
      active: activeSection === s.key,
      badge: s.key === 'riwayat' && stats.pending > 0 ? stats.pending : null,
    };
  });

  /* ── Dashboard Section ── */
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 shadow-2xl shadow-emerald-500/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white m-0">Dashboard Lisensi</h2>
          <p className="text-emerald-100 text-sm mt-1 m-0">Kelola pengajuan lisensi pelatih & juri Anda</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: 'fa-file-alt', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
          { label: 'Pending', value: stats.pending, icon: 'fa-clock', gradient: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
          { label: 'Approved', value: stats.approved, icon: 'fa-check-circle', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
          { label: 'Ditolak', value: stats.rejected, icon: 'fa-times-circle', gradient: 'from-red-500 to-red-600', shadow: 'shadow-red-500/20' },
        ].map(c => (
          <div key={c.label} className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4 hover:bg-[#191c28] transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-md ${c.shadow} flex-shrink-0`}>
                <i className={`fas ${c.icon} text-white text-sm`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white m-0 leading-tight">{c.value}</p>
                <p className="text-[11px] text-gray-500 m-0 mt-0.5">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-5">
        <h3 className="text-sm font-bold text-white m-0 mb-4">Aksi Cepat</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setActiveSection('ajukan'); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all border-none cursor-pointer">
            <i className="fas fa-plus" /> Ajukan Lisensi Baru
          </button>
          <button onClick={() => setActiveSection('riwayat')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all cursor-pointer">
            <i className="fas fa-history" /> Lihat Riwayat
          </button>
        </div>
      </div>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <i className="fas fa-clock text-white text-sm" />
              </div>
              <div>
                <h3 className="m-0 text-[14px] font-bold text-white">Pengajuan Terbaru</h3>
                <p className="m-0 text-[11px] text-gray-500">{Math.min(3, applications.length)} terakhir</p>
              </div>
            </div>
            <button onClick={() => setActiveSection('riwayat')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-transparent border-none cursor-pointer transition-colors">
              Lihat Semua <i className="fas fa-chevron-right text-[10px] ml-1" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {applications.slice(0, 3).map(app => (
              <div key={app.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-id-badge text-emerald-400 text-xs" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium m-0 truncate">{app.license_type?.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-[11px] text-gray-500 m-0">{new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <Badge status={app.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ── Form Section ── */
  const renderForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-plus-circle text-white text-sm" />
          </div>
          <div>
            <h2 className="m-0 text-base font-bold text-white">Ajukan Lisensi Baru</h2>
            <p className="m-0 text-[11px] text-gray-500">Isi formulir pengajuan lisensi</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(false); setActiveSection('dashboard'); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all cursor-pointer">
          <i className="fas fa-arrow-left" /> Kembali
        </button>
      </div>

      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white m-0">Form Pengajuan Lisensi</h3>
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Jenis Lisensi *</label>
              <select className={SELECT} value={formData.license_type} onChange={e => setFormData(p => ({ ...p, license_type: e.target.value }))} required>
                <option value="">Pilih jenis lisensi...</option>
                <option value="pelatih_c">Pelatih C</option>
                <option value="pelatih_b">Pelatih B</option>
                <option value="pelatih_a">Pelatih A</option>
                <option value="juri_c">Juri C</option>
                <option value="juri_b">Juri B</option>
                <option value="juri_a">Juri A</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Akomodasi *</label>
              <select className={SELECT} value={formData.akomodasi} onChange={e => setFormData(p => ({ ...p, akomodasi: e.target.value }))} required>
                <option value="tanpa_kamar">Tanpa Kamar</option>
                <option value="dengan_kamar">Dengan Kamar</option>
              </select>
            </div>
            {formData.license_type && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <i className="fas fa-info-circle text-emerald-400" />
                <span className="text-sm text-emerald-300 font-medium">
                  Biaya Lisensi:{' '}
                  <strong className="text-emerald-400">
                    {formData.license_type.startsWith('pelatih')
                      ? (formData.akomodasi === 'dengan_kamar' ? 'Rp 1.000.000' : 'Rp 750.000')
                      : (formData.akomodasi === 'dengan_kamar' ? 'Rp 2.250.000' : 'Rp 2.000.000')}
                  </strong>
                  {' '}({formData.akomodasi === 'dengan_kamar' ? 'dengan kamar' : 'tanpa kamar'})
                </span>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Dokumen Pendukung *</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setFile(e.target.files[0])} required
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer file:transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Catatan (opsional)</label>
              <textarea className={INPUT} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Tambahkan catatan..." />
            </div>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all border-none cursor-pointer">
              {submitting ? <><i className="fas fa-spinner fa-spin" /> Mengirim...</> : <><i className="fas fa-paper-plane" /> Kirim Pengajuan</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ── History Section ── */
  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <i className="fas fa-history text-white text-sm" />
        </div>
        <div>
          <h2 className="m-0 text-base font-bold text-white">Riwayat Pengajuan</h2>
          <p className="m-0 text-[11px] text-gray-500">{applications.length} pengajuan</p>
        </div>
      </div>

      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner /></div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-inbox text-2xl text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 m-0 mb-3">Belum ada pengajuan lisensi</p>
            <button onClick={() => { setActiveSection('ajukan'); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold hover:bg-emerald-500/20 active:scale-[0.97] transition-all border-none cursor-pointer">
              <i className="fas fa-plus" /> Ajukan Sekarang
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {applications.map((app, idx) => (
              <div key={app.id} className="px-5 py-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-semibold m-0">{app.license_type?.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-[11px] text-gray-500 m-0 mt-0.5">
                        {new Date(app.created_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.notes && (
                      <span className="hidden sm:inline text-[11px] text-gray-500 max-w-[150px] truncate" title={app.notes}>
                        <i className="fas fa-sticky-note mr-1" />{app.notes}
                      </span>
                    )}
                    <Badge status={app.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ── Profile Section ── */
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <i className="fas fa-user-cog text-white text-sm" />
        </div>
        <div>
          <h2 className="m-0 text-base font-bold text-white">Profil</h2>
          <p className="m-0 text-[11px] text-gray-500">Informasi akun lisensi Anda</p>
        </div>
      </div>
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-6">
        <p className="text-sm text-gray-400 m-0">Fitur profil akan segera tersedia.</p>
      </div>
    </div>
  );

  return (
    <SidebarLayout menuItems={menuItems} title="Dashboard Lisensi" subtitle="Lisensi Panel">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'ajukan' && renderForm()}
        {activeSection === 'riwayat' && renderHistory()}
        {activeSection === 'profil' && renderProfile()}
      </div>
    </SidebarLayout>
  );
}
