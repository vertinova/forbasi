import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const fileUrl = (p) => p ? `${API_BASE}/uploads/regional/${p}` : null;

const TABS = [
  { key: 'hero',     label: 'Hero Slides',  icon: 'fa-image' },
  { key: 'berita',   label: 'Berita',        icon: 'fa-newspaper' },
  { key: 'struktur', label: 'Struktur',      icon: 'fa-sitemap' },
  { key: 'feedback', label: 'Testimoni',     icon: 'fa-comments' },
  { key: 'config',   label: 'Konfigurasi',   icon: 'fa-cog' },
];

/* ── Reusable styles ── */
const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
const LABEL = 'block text-xs font-semibold text-gray-400 mb-1.5';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all';
const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all';
const BTN_DANGER = 'inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-[0.97] transition-all';

const KATEGORI_BERITA = ['Umum', 'Pengumuman', 'Kegiatan', 'Prestasi', 'Pelatihan'];

export default function ManageRegionalLanding({ embedded }) {
  const [tab, setTab] = useState('hero');
  const [loading, setLoading] = useState(false);
  const [regionInfo, setRegionInfo] = useState(null);

  /* ── Data ── */
  const [heroSlides, setHeroSlides] = useState([]);
  const [berita, setBerita] = useState([]);
  const [struktur, setStruktur] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [siteConfig, setSiteConfig] = useState({});

  /* ── Form ── */
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [filePreview, setFilePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ── Delete ── */
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  /* ── Fetch region info ── */
  useEffect(() => {
    api.get('/regional-landing/region-info')
      .then(r => { if (r.data.success) setRegionInfo(r.data.data); })
      .catch(() => {});
  }, []);

  /* ── Fetch data helpers ── */
  const fetchHero = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/regional-landing/hero-slides');
      if (data.success) setHeroSlides(data.data);
    } catch { toast.error('Gagal memuat hero slides'); }
    setLoading(false);
  }, []);

  const fetchBerita = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/regional-landing/berita');
      if (data.success) setBerita(data.data);
    } catch { toast.error('Gagal memuat berita'); }
    setLoading(false);
  }, []);

  const fetchStruktur = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/regional-landing/struktur');
      if (data.success) setStruktur(data.data);
    } catch { toast.error('Gagal memuat struktur'); }
    setLoading(false);
  }, []);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/regional-landing/feedback');
      if (data.success) setFeedback(data.data);
    } catch { toast.error('Gagal memuat testimoni'); }
    setLoading(false);
  }, []);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/regional-landing/site-config');
      if (data.success) setSiteConfig(data.data);
    } catch { toast.error('Gagal memuat konfigurasi'); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchers = { hero: fetchHero, berita: fetchBerita, struktur: fetchStruktur, feedback: fetchFeedback, config: fetchConfig };
    fetchers[tab]?.();
  }, [tab, fetchHero, fetchBerita, fetchStruktur, fetchFeedback, fetchConfig]);

  /* ── Form helpers ── */
  const resetForm = () => { setShowForm(false); setEditId(null); setForm({}); setFilePreview(null); };
  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setForm(prev => ({ ...prev, _file: f }));
    setFilePreview(URL.createObjectURL(f));
  };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ ...item });
    const imgField = tab === 'hero' ? item.image_path : tab === 'berita' ? item.gambar : item.foto;
    setFilePreview(imgField ? fileUrl(imgField) : null);
    setShowForm(true);
  };

  /* ── ENDPOINT MAP ── */
  const endpointMap = { hero: 'hero-slides', berita: 'berita', struktur: 'struktur', feedback: 'feedback' };
  const fileFieldMap = { hero: 'image', berita: 'gambar', struktur: 'foto', feedback: 'foto' };

  /* ── Save (create / update) ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = `/regional-landing/${endpointMap[tab]}`;
      const isEdit = editId != null;
      const url = isEdit ? `${endpoint}/${editId}` : endpoint;

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === '_file' || k === 'id' || k === 'region' || k === 'created_at' || k === 'updated_at' || k === 'image_path' || k === 'gambar' || k === 'foto') return;
        if (v != null) fd.append(k, v);
      });
      if (form._file) fd.append(fileFieldMap[tab], form._file);

      const res = isEdit
        ? await api.put(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (res.data.success) {
        toast.success(res.data.message);
        resetForm();
        const fetchers = { hero: fetchHero, berita: fetchBerita, struktur: fetchStruktur, feedback: fetchFeedback };
        fetchers[tab]?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
    setSaving(false);
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/regional-landing/${endpointMap[tab]}/${deleteConfirm.id}`);
      if (data.success) {
        toast.success(data.message);
        const fetchers = { hero: fetchHero, berita: fetchBerita, struktur: fetchStruktur, feedback: fetchFeedback };
        fetchers[tab]?.();
      }
    } catch { toast.error('Gagal menghapus'); }
    setDeleteConfirm({ show: false, id: null, name: '' });
  };

  /* ── Save config ── */
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await api.put('/regional-landing/site-config', siteConfig);
      if (res.data.success) toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan konfigurasi');
    }
    setSaving(false);
  };

  /* ══════════════════════════════════════════
     FORM RENDERERS
  ══════════════════════════════════════════ */

  const renderHeroForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={LABEL}>Judul</label>
        <input className={INPUT} placeholder="Judul slide" value={form.title || ''} onChange={e => onChange('title', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className={LABEL}>Subtitle</label>
        <input className={INPUT} placeholder="Subtitle" value={form.subtitle || ''} onChange={e => onChange('subtitle', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Link (opsional)</label>
        <input className={INPUT} placeholder="https://..." value={form.link || ''} onChange={e => onChange('link', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Urutan</label>
        <input type="number" className={INPUT + ' w-24'} value={form.urutan ?? 0} onChange={e => onChange('urutan', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Gambar</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-gray-400" />
        {filePreview && <img src={filePreview} alt="" className="mt-2 h-24 rounded-lg object-cover" />}
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="rounded" />
          Aktif
        </label>
      </div>
    </div>
  );

  const renderBeritaForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={LABEL}>Judul *</label>
        <input className={INPUT} placeholder="Judul berita" value={form.judul || ''} onChange={e => onChange('judul', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className={LABEL}>Ringkasan</label>
        <textarea className={INPUT + ' min-h-[60px]'} placeholder="Ringkasan singkat" value={form.ringkasan || ''} onChange={e => onChange('ringkasan', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className={LABEL}>Konten</label>
        <textarea className={INPUT + ' min-h-[120px]'} placeholder="Konten lengkap berita" value={form.konten || ''} onChange={e => onChange('konten', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Kategori</label>
        <select className={INPUT + ' cursor-pointer'} value={form.kategori || 'Umum'} onChange={e => onChange('kategori', e.target.value)}>
          {KATEGORI_BERITA.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Tanggal</label>
        <input type="date" className={INPUT} value={form.tanggal ? form.tanggal.substring(0, 10) : ''} onChange={e => onChange('tanggal', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Link Eksternal (opsional)</label>
        <input className={INPUT} placeholder="https://..." value={form.link || ''} onChange={e => onChange('link', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Gambar</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-gray-400" />
        {filePreview && <img src={filePreview} alt="" className="mt-2 h-24 rounded-lg object-cover" />}
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="rounded" />
          Aktif
        </label>
      </div>
    </div>
  );

  const renderStrukturForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={LABEL}>Nama *</label>
        <input className={INPUT} placeholder="Nama pengurus" value={form.nama || ''} onChange={e => onChange('nama', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Jabatan *</label>
        <input className={INPUT} placeholder="Jabatan" value={form.jabatan || ''} onChange={e => onChange('jabatan', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Urutan</label>
        <input type="number" className={INPUT + ' w-24'} value={form.urutan ?? 0} onChange={e => onChange('urutan', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Foto</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-gray-400" />
        {filePreview && <img src={filePreview} alt="" className="mt-2 h-16 w-16 rounded-full object-cover" />}
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="rounded" />
          Aktif
        </label>
      </div>
    </div>
  );

  const renderFeedbackForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={LABEL}>Nama *</label>
        <input className={INPUT} placeholder="Nama" value={form.nama || ''} onChange={e => onChange('nama', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Rating (1-5)</label>
        <input type="number" min="1" max="5" className={INPUT + ' w-24'} value={form.rating ?? 5} onChange={e => onChange('rating', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className={LABEL}>Pesan *</label>
        <textarea className={INPUT + ' min-h-[80px]'} placeholder="Pesan / testimoni" value={form.pesan || ''} onChange={e => onChange('pesan', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Foto</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-gray-400" />
        {filePreview && <img src={filePreview} alt="" className="mt-2 h-16 w-16 rounded-full object-cover" />}
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="rounded" />
          Aktif
        </label>
      </div>
    </div>
  );

  /* ── Config section ── */
  const renderConfigSection = () => {
    const configKeys = [
      { key: 'site_name',    label: 'Nama Situs',     placeholder: 'FORBASI Jawa Barat' },
      { key: 'site_tagline', label: 'Tagline',         placeholder: 'Federasi Olahraga Binaraga ...' },
      { key: 'contact_email', label: 'Email Kontak',   placeholder: 'jabar@forbasi.or.id' },
      { key: 'contact_phone', label: 'Telepon Kontak', placeholder: '08xx-xxxx-xxxx' },
      { key: 'contact_address', label: 'Alamat',       placeholder: 'Jl. ...' },
      { key: 'instagram_url', label: 'Instagram URL',  placeholder: 'https://instagram.com/...' },
      { key: 'facebook_url',  label: 'Facebook URL',   placeholder: 'https://facebook.com/...' },
      { key: 'youtube_url',   label: 'YouTube URL',    placeholder: 'https://youtube.com/...' },
      { key: 'whatsapp_number', label: 'WhatsApp',     placeholder: '628xxx' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Konfigurasi Situs</h3>
          <button onClick={handleSaveConfig} disabled={saving} className={BTN_PRIMARY}>
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configKeys.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={LABEL}>{label}</label>
              <input
                className={INPUT}
                placeholder={placeholder}
                value={siteConfig[key] || ''}
                onChange={e => setSiteConfig(prev => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════
     TABLE RENDERERS
  ══════════════════════════════════════════ */

  const renderHeroTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/[0.02]">
            {['No', 'Gambar', 'Judul', 'Subtitle', 'Urutan', 'Status', 'Aksi'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {heroSlides.map((item, idx) => (
            <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
              <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
              <td className="px-4 py-3">
                {item.image_path ? <img src={fileUrl(item.image_path)} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="text-gray-600 text-xs">-</span>}
              </td>
              <td className="px-4 py-3 font-medium text-white">{item.title || '-'}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">{item.subtitle || '-'}</td>
              <td className="px-4 py-3 text-gray-400">{item.urutan}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${item.aktif ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {item.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center"><i className="fas fa-edit text-xs" /></button>
                  <button onClick={() => setDeleteConfirm({ show: true, id: item.id, name: item.title || 'Slide' })} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"><i className="fas fa-trash text-xs" /></button>
                </div>
              </td>
            </tr>
          ))}
          {!heroSlides.length && (
            <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-sm">Belum ada hero slide</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderBeritaTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/[0.02]">
            {['No', 'Gambar', 'Judul', 'Kategori', 'Tanggal', 'Status', 'Aksi'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {berita.map((item, idx) => (
            <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
              <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
              <td className="px-4 py-3">
                {item.gambar ? <img src={fileUrl(item.gambar)} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="text-gray-600 text-xs">-</span>}
              </td>
              <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">{item.judul}</td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 text-[11px] bg-blue-500/10 text-blue-400 rounded-full">{item.kategori}</span></td>
              <td className="px-4 py-3 text-gray-400 text-xs">{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${item.aktif ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {item.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center"><i className="fas fa-edit text-xs" /></button>
                  <button onClick={() => setDeleteConfirm({ show: true, id: item.id, name: item.judul })} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"><i className="fas fa-trash text-xs" /></button>
                </div>
              </td>
            </tr>
          ))}
          {!berita.length && (
            <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-sm">Belum ada berita</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderStrukturTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/[0.02]">
            {['No', 'Foto', 'Nama', 'Jabatan', 'Urutan', 'Status', 'Aksi'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {struktur.map((item, idx) => (
            <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
              <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
              <td className="px-4 py-3">
                {item.foto ? <img src={fileUrl(item.foto)} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-white/[0.05] flex items-center justify-center"><i className="fas fa-user text-gray-600 text-xs" /></div>}
              </td>
              <td className="px-4 py-3 font-medium text-white">{item.nama}</td>
              <td className="px-4 py-3 text-gray-400">{item.jabatan}</td>
              <td className="px-4 py-3 text-gray-400">{item.urutan}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${item.aktif ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {item.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center"><i className="fas fa-edit text-xs" /></button>
                  <button onClick={() => setDeleteConfirm({ show: true, id: item.id, name: item.nama })} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"><i className="fas fa-trash text-xs" /></button>
                </div>
              </td>
            </tr>
          ))}
          {!struktur.length && (
            <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-sm">Belum ada data struktur</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderFeedbackTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/[0.02]">
            {['No', 'Foto', 'Nama', 'Pesan', 'Rating', 'Status', 'Aksi'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {feedback.map((item, idx) => (
            <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
              <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
              <td className="px-4 py-3">
                {item.foto ? <img src={fileUrl(item.foto)} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-white/[0.05] flex items-center justify-center"><i className="fas fa-user text-gray-600 text-xs" /></div>}
              </td>
              <td className="px-4 py-3 font-medium text-white">{item.nama}</td>
              <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{item.pesan}</td>
              <td className="px-4 py-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <i key={s} className={`fas fa-star text-xs ${s <= item.rating ? 'text-yellow-400' : 'text-gray-700'}`} />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${item.aktif ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {item.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center"><i className="fas fa-edit text-xs" /></button>
                  <button onClick={() => setDeleteConfirm({ show: true, id: item.id, name: item.nama })} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"><i className="fas fa-trash text-xs" /></button>
                </div>
              </td>
            </tr>
          ))}
          {!feedback.length && (
            <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-sm">Belum ada testimoni</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  /* ══════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════ */

  const formRenderers = { hero: renderHeroForm, berita: renderBeritaForm, struktur: renderStrukturForm, feedback: renderFeedbackForm };
  const tableRenderers = { hero: renderHeroTable, berita: renderBeritaTable, struktur: renderStrukturTable, feedback: renderFeedbackTable };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="fas fa-globe text-emerald-400" />
            Landing Page {regionInfo?.name || ''}
          </h2>
          {regionInfo && <p className="text-xs text-gray-500 mt-1">Kelola konten website {regionInfo.code}.forbasi.or.id</p>}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); resetForm(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
            }`}
          >
            <i className={`fas ${t.icon} text-xs`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Add button (not for config tab) */}
      {tab !== 'config' && (
        <div className="flex justify-end">
          {!showForm ? (
            <button onClick={() => { resetForm(); setShowForm(true); }} className={BTN_PRIMARY}>
              <i className="fas fa-plus" /> Tambah {TABS.find(t => t.key === tab)?.label}
            </button>
          ) : (
            <button onClick={resetForm} className={BTN_GHOST}>
              <i className="fas fa-times" /> Batal
            </button>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && tab !== 'config' && (
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">{editId ? 'Edit' : 'Tambah'} {TABS.find(t => t.key === tab)?.label}</h3>
          {formRenderers[tab]?.()}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
            <button onClick={resetForm} className={BTN_GHOST}>Batal</button>
            <button onClick={handleSave} disabled={saving} className={BTN_PRIMARY}>
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'config' ? (
          <div className="p-6">{renderConfigSection()}</div>
        ) : (
          tableRenderers[tab]?.()
        )}
      </div>

      {/* Delete modal */}
      {deleteConfirm.show && (
        <ConfirmModal
          title="Hapus Data?"
          message={`"${deleteConfirm.name}" akan dihapus permanen.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: null, name: '' })}
          danger
        />
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b11' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">{content}</div>
    </div>
  );
}
