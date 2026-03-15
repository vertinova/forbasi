import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';

const TABS = [
  { key: 'pelatih',    label: 'Pelatih',    icon: 'fa-bullhorn', color: 'orange' },
  { key: 'juri_muda',  label: 'Juri Muda',  icon: 'fa-star',     color: 'violet' },
  { key: 'juri_madya', label: 'Juri Madya',  icon: 'fa-crown',    color: 'purple' },
];

const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

export default function LicenseConfigPage() {
  const [configs, setConfigs] = useState({});
  const [activeTab, setActiveTab] = useState('pelatih');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama_kegiatan: '', tempat: '', tanggal_mulai: '', tanggal_selesai: '',
    harga_tanpa_kamar: '', harga_dengan_kamar: '', deskripsi: ''
  });

  useEffect(() => { fetchConfigs(); }, []);

  useEffect(() => {
    const c = configs[activeTab];
    if (c) {
      setForm({
        nama_kegiatan: c.nama_kegiatan || '',
        tempat: c.tempat || '',
        tanggal_mulai: c.tanggal_mulai ? c.tanggal_mulai.slice(0, 10) : '',
        tanggal_selesai: c.tanggal_selesai ? c.tanggal_selesai.slice(0, 10) : '',
        harga_tanpa_kamar: c.harga_tanpa_kamar || '',
        harga_dengan_kamar: c.harga_dengan_kamar || '',
        deskripsi: c.deskripsi || '',
      });
    } else {
      setForm({ nama_kegiatan: '', tempat: '', tanggal_mulai: '', tanggal_selesai: '', harga_tanpa_kamar: '', harga_dengan_kamar: '', deskripsi: '' });
    }
  }, [activeTab, configs]);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/license/configs');
      const map = {};
      (res.data.data || []).forEach(c => { map[c.jenis_lisensi] = c; });
      setConfigs(map);
    } catch { toast.error('Gagal memuat konfigurasi'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/license/configs', { jenis_lisensi: activeTab, ...form });
      toast.success('Konfigurasi berhasil disimpan');
      fetchConfigs();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const currentTab = TABS.find(t => t.key === activeTab);
  const colorMap = { orange: 'from-orange-500 to-amber-600', violet: 'from-violet-500 to-purple-600', purple: 'from-purple-500 to-fuchsia-600' };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0b11' }}>
      <Navbar title="Konfigurasi Lisensi" />
      <div className="page-container flex justify-center py-20"><LoadingSpinner /></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b11' }}>
      <Navbar title="Konfigurasi Lisensi" />
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl border border-white/[0.06]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <i className="fas fa-cog text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white m-0">Konfigurasi Lisensi</h1>
              <p className="text-sm text-gray-400 m-0">Atur tempat, tanggal, dan harga untuk setiap jenis lisensi</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0d0f17] border border-white/[0.06] w-fit">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-none cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-br ${colorMap[tab.color]} text-white shadow-lg`
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}>
                <i className={`fas ${tab.icon} text-xs`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Config Form */}
        <div className={`bg-gradient-to-br from-[#1a1c2a] to-[#141620] rounded-2xl border overflow-hidden ${
          currentTab.color === 'orange' ? 'border-orange-500/20' : currentTab.color === 'violet' ? 'border-violet-500/20' : 'border-purple-500/20'
        }`}>
          <div className={`px-6 py-4 border-b ${
            currentTab.color === 'orange' ? 'bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/10' :
            currentTab.color === 'violet' ? 'bg-gradient-to-r from-violet-500/10 to-transparent border-violet-500/10' :
            'bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[currentTab.color]} flex items-center justify-center shadow-lg`}>
                <i className={`fas ${currentTab.icon} text-white text-sm`} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white m-0">Konfigurasi {currentTab.label}</h2>
                <p className="text-[11px] text-gray-500 m-0 mt-0.5">Atur detail kegiatan lisensi {currentTab.label.toLowerCase()}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5 max-w-2xl">
            {/* Nama Kegiatan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Kegiatan *</label>
              <input className={INPUT} value={form.nama_kegiatan} onChange={e => setForm(p => ({ ...p, nama_kegiatan: e.target.value }))}
                placeholder={`Contoh: Lisensi ${currentTab.label} Forbasi 2026`} required />
            </div>

            {/* Tempat */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tempat / Venue *</label>
              <input className={INPUT} value={form.tempat} onChange={e => setForm(p => ({ ...p, tempat: e.target.value }))}
                placeholder="Contoh: Hotel Grand Mercure, Jakarta" required />
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tanggal Mulai *</label>
                <input type="date" className={INPUT} value={form.tanggal_mulai} onChange={e => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tanggal Selesai</label>
                <input type="date" className={INPUT} value={form.tanggal_selesai} onChange={e => setForm(p => ({ ...p, tanggal_selesai: e.target.value }))} />
              </div>
            </div>

            {/* Harga */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Harga Tanpa Kamar *</label>
                <input type="number" className={INPUT} value={form.harga_tanpa_kamar} onChange={e => setForm(p => ({ ...p, harga_tanpa_kamar: e.target.value }))}
                  placeholder="750000" required min="0" />
                {form.harga_tanpa_kamar && <p className="text-[11px] text-emerald-400 mt-1 m-0">{formatCurrency(form.harga_tanpa_kamar)}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Harga Dengan Kamar *</label>
                <input type="number" className={INPUT} value={form.harga_dengan_kamar} onChange={e => setForm(p => ({ ...p, harga_dengan_kamar: e.target.value }))}
                  placeholder="1000000" required min="0" />
                {form.harga_dengan_kamar && <p className="text-[11px] text-emerald-400 mt-1 m-0">{formatCurrency(form.harga_dengan_kamar)}</p>}
              </div>
            </div>

            {/* Preview Harga */}
            <div className={`p-4 rounded-xl border ${
              currentTab.color === 'orange' ? 'bg-orange-500/5 border-orange-500/20' :
              currentTab.color === 'violet' ? 'bg-violet-500/5 border-violet-500/20' :
              'bg-purple-500/5 border-purple-500/20'
            }`}>
              <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider m-0 mb-2">Preview Harga</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  <i className="fas fa-walking mr-2" />Tanpa Kamar
                </div>
                <span className="text-sm font-bold text-white">{formatCurrency(form.harga_tanpa_kamar)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-400">
                  <i className="fas fa-bed mr-2" />Dengan Kamar
                </div>
                <span className="text-sm font-bold text-white">{formatCurrency(form.harga_dengan_kamar)}</span>
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi (opsional)</label>
              <textarea className={INPUT} rows={3} value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))}
                placeholder="Deskripsi tambahan tentang kegiatan lisensi..." />
            </div>

            {/* Submit */}
            <button type="submit" disabled={saving}
              className={`inline-flex items-center gap-2 px-6 py-3 text-sm rounded-xl text-white font-semibold shadow-lg active:scale-[0.97] disabled:opacity-50 transition-all border-none cursor-pointer bg-gradient-to-br ${colorMap[currentTab.color]}`}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan Konfigurasi {currentTab.label}</>}
            </button>
          </form>
        </div>

        {/* All Configs Overview */}
        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <i className="fas fa-list text-white text-sm" />
              </div>
              <div>
                <h3 className="m-0 text-[14px] font-bold text-white">Ringkasan Konfigurasi</h3>
                <p className="m-0 text-[11px] text-gray-500">Semua jenis lisensi</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {TABS.map(tab => {
              const c = configs[tab.key];
              return (
                <div key={tab.key} className="px-5 py-4 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[tab.color]} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <i className={`fas ${tab.icon} text-white text-sm`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="m-0 text-sm font-bold text-white">{tab.label}</h4>
                        {c?.tempat ? (
                          <p className="m-0 text-[11px] text-gray-500 truncate">
                            <i className="fas fa-map-marker-alt mr-1" />{c.tempat}
                            {c.tanggal_mulai && <> • <i className="fas fa-calendar ml-1 mr-1" />{new Date(c.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                          </p>
                        ) : (
                          <p className="m-0 text-[11px] text-amber-400"><i className="fas fa-exclamation-triangle mr-1" />Belum dikonfigurasi</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="m-0 text-xs text-gray-500">Tanpa Kamar</p>
                      <p className="m-0 text-sm font-bold text-white">{formatCurrency(c?.harga_tanpa_kamar)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
