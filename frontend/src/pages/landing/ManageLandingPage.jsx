import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Card, CardHeader, CardBody, EmptyState, Badge,
  PageContainer, TabPills, TabPill,
} from '../../components/layout/MainLayout';
import ConfirmModal from '../../components/common/ConfirmModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const fileUrl = p => p ? `${API_BASE}/uploads/landing/${p}` : null;

const TABS = [
  { key: 'events',      label: 'Events',      icon: 'fa-calendar-alt' },
  { key: 'gallery',     label: 'Galeri',       icon: 'fa-images' },
  { key: 'berita',      label: 'Berita',       icon: 'fa-newspaper' },
  { key: 'marketplace', label: 'Marketplace',  icon: 'fa-store' },
  { key: 'banners',     label: 'Info Banner',  icon: 'fa-bullhorn' },
];

const COLOR_OPTIONS = [
  { value: 'emerald', label: 'Hijau' },
  { value: 'blue',    label: 'Biru' },
  { value: 'purple',  label: 'Ungu' },
  { value: 'gold',    label: 'Emas' },
];
const ICON_OPTIONS = [
  'fa-trophy','fa-certificate','fa-graduation-cap','fa-handshake','fa-flag',
  'fa-calendar-alt','fa-star','fa-shield-alt','fa-medal','fa-users',
  'fa-newspaper','fa-bullhorn','fa-gift','fa-tasks','fa-map-marker-alt',
];
const STATUS_OPTIONS = [
  { value: 'upcoming',  label: 'Upcoming' },
  { value: 'ongoing',   label: 'Berlangsung' },
  { value: 'completed', label: 'Selesai' },
];

/* ── Reusable styles ── */
const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
const SELECT = INPUT + ' cursor-pointer';
const LABEL = 'block text-xs font-semibold text-gray-400 mb-1.5';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all';
const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all';
const BTN_DANGER = 'inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-[0.97] transition-all';

export default function ManageLandingPage({ embedded }) {
  const [tab, setTab] = useState('events');
  const [loading, setLoading] = useState(false);

  /* ── Data ── */
  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [berita, setBerita] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [banners, setBanners] = useState([]);

  /* ── Forms ── */
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [filePreview, setFilePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ── Delete ── */
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  /* ── Fetch ── */
  const fetchData = useCallback(async (t) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/landing/${t}`);
      if (data.success) {
        const map = { events: setEvents, gallery: setGallery, berita: setBerita, marketplace: setMarketplace, banners: setBanners };
        map[t]?.(data.data);
      }
    } catch { toast.error('Gagal memuat data'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(tab); }, [tab, fetchData]);

  /* ── Helpers ── */
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
    setFilePreview(item.banner ? fileUrl(item.banner) : item.src ? fileUrl(item.src) : item.img ? fileUrl(item.img) : null);
    setShowForm(true);
  };

  /* ── Save (create/update) ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      let endpoint = `/landing/${tab}`;
      const isEdit = editId != null;
      if (isEdit) endpoint += `/${editId}`;

      const needsFile = ['events', 'gallery', 'marketplace', 'banners'].includes(tab);
      let res;

      if (needsFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (k === '_file' || k === 'banner' || k === 'src' || k === 'img') return;
          if (v != null) fd.append(k, v);
        });
        if (form._file) {
          const fieldName = tab === 'events' ? 'banner' : 'image';
          fd.append(fieldName, form._file);
        }
        res = isEdit
          ? await api.put(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          : await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const { _file, ...body } = form;
        res = isEdit ? await api.put(endpoint, body) : await api.post(endpoint, body);
      }

      if (res.data.success) {
        toast.success(res.data.message);
        resetForm();
        fetchData(tab);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
    setSaving(false);
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/landing/${tab}/${deleteConfirm.id}`);
      if (data.success) { toast.success(data.message); fetchData(tab); }
    } catch { toast.error('Gagal menghapus'); }
    setDeleteConfirm({ show: false, id: null, name: '' });
  };

  /* ══════════════════════════════════════════
     FORM RENDERERS
  ══════════════════════════════════════════ */
  const renderEventForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={LABEL}>Nama Event *</label>
        <input className={INPUT} placeholder="Nama event" value={form.nama || ''} onChange={e => onChange('nama', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Tanggal</label>
        <input className={INPUT} placeholder="15 - 18 April 2026" value={form.tanggal || ''} onChange={e => onChange('tanggal', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Lokasi</label>
        <input className={INPUT} placeholder="Lokasi event" value={form.lokasi || ''} onChange={e => onChange('lokasi', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Status</label>
        <select className={SELECT} value={form.status || 'upcoming'} onChange={e => onChange('status', e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Warna</label>
        <select className={SELECT} value={form.color || 'emerald'} onChange={e => onChange('color', e.target.value)}>
          {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Icon</label>
        <select className={SELECT} value={form.icon || 'fa-calendar-alt'} onChange={e => onChange('icon', e.target.value)}>
          {ICON_OPTIONS.map(i => <option key={i} value={i}>{i.replace('fa-', '')}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Link (opsional)</label>
        <input className={INPUT} placeholder="/register-license" value={form.link || ''} onChange={e => onChange('link', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className={LABEL}>Deskripsi</label>
        <textarea className={INPUT + ' min-h-[80px]'} placeholder="Deskripsi event" value={form.deskripsi || ''} onChange={e => onChange('deskripsi', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Banner</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-gray-400" />
        {filePreview && <img src={filePreview} alt="" className="mt-2 h-24 rounded-lg object-cover" />}
      </div>
      <div className="flex items-end gap-4">
        <div>
          <label className={LABEL}>Urutan</label>
          <input type="number" className={INPUT + ' w-20'} value={form.urutan ?? 0} onChange={e => onChange('urutan', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="accent-emerald-500" />
          Aktif
        </label>
      </div>
    </div>
  );

  const renderGalleryForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={LABEL}>Caption *</label>
        <input className={INPUT} placeholder="Judul foto" value={form.caption || ''} onChange={e => onChange('caption', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Kategori</label>
        <input className={INPUT} placeholder="Kompetisi, Pelatihan, dll" value={form.kategori || ''} onChange={e => onChange('kategori', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Gambar *</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-gray-400" />
        {filePreview && <img src={filePreview} alt="" className="mt-2 h-24 rounded-lg object-cover" />}
      </div>
      <div className="flex items-end gap-4">
        <div>
          <label className={LABEL}>Urutan</label>
          <input type="number" className={INPUT + ' w-20'} value={form.urutan ?? 0} onChange={e => onChange('urutan', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="accent-emerald-500" />
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
      <div>
        <label className={LABEL}>Tanggal</label>
        <input className={INPUT} placeholder="10 Mar 2026" value={form.tanggal || ''} onChange={e => onChange('tanggal', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Kategori</label>
        <input className={INPUT} placeholder="Kompetisi, Pelatihan, dll" value={form.kategori || ''} onChange={e => onChange('kategori', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Icon</label>
        <select className={SELECT} value={form.icon || 'fa-newspaper'} onChange={e => onChange('icon', e.target.value)}>
          {ICON_OPTIONS.map(i => <option key={i} value={i}>{i.replace('fa-', '')}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Link (opsional)</label>
        <input className={INPUT} placeholder="/register-license" value={form.link || ''} onChange={e => onChange('link', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className={LABEL}>Ringkasan *</label>
        <textarea className={INPUT + ' min-h-[80px]'} placeholder="Isi ringkasan berita" value={form.ringkasan || ''} onChange={e => onChange('ringkasan', e.target.value)} />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="accent-emerald-500" />
          Aktif
        </label>
      </div>
    </div>
  );

  const renderMarketplaceForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={LABEL}>Nama Produk *</label>
        <input className={INPUT} placeholder="Nama produk" value={form.nama || ''} onChange={e => onChange('nama', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Harga *</label>
        <input className={INPUT} placeholder="Rp 150.000" value={form.harga || ''} onChange={e => onChange('harga', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Warna</label>
        <select className={SELECT} value={form.warna || 'emerald'} onChange={e => onChange('warna', e.target.value)}>
          {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Link (opsional)</label>
        <input className={INPUT} placeholder="https://..." value={form.link || ''} onChange={e => onChange('link', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Gambar Produk</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-gray-400" />
        {filePreview && <img src={filePreview} alt="" className="mt-2 h-24 rounded-lg object-cover" />}
      </div>
      <div className="flex items-end gap-4">
        <div>
          <label className={LABEL}>Urutan</label>
          <input type="number" className={INPUT + ' w-20'} value={form.urutan ?? 0} onChange={e => onChange('urutan', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="accent-emerald-500" />
          Aktif
        </label>
      </div>
    </div>
  );

  const renderBannerForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={LABEL}>Teks Pengumuman *</label>
        <input className={INPUT} placeholder="Teks yang tampil di navbar" value={form.text || ''} onChange={e => onChange('text', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Link (opsional)</label>
        <input className={INPUT} placeholder="/register-license atau https://..." value={form.link || ''} onChange={e => onChange('link', e.target.value)} />
      </div>
      <div>
        <label className={LABEL}>Section Index (opsional)</label>
        <input type="number" className={INPUT} placeholder="Indeks section homepage (0-9)" value={form.section_index ?? ''} onChange={e => onChange('section_index', e.target.value || null)} />
      </div>
      <div>
        <label className={LABEL}>Gambar Kecil</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-gray-400" />
        {filePreview && <img src={filePreview} alt="" className="mt-2 h-10 rounded object-cover" />}
      </div>
      <div className="flex items-end gap-4">
        <div>
          <label className={LABEL}>Urutan</label>
          <input type="number" className={INPUT + ' w-20'} value={form.urutan ?? 0} onChange={e => onChange('urutan', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.aktif !== 0 && form.aktif !== '0'} onChange={e => onChange('aktif', e.target.checked ? 1 : 0)} className="accent-emerald-500" />
          Aktif
        </label>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TABLE RENDERERS
  ══════════════════════════════════════════ */
  const renderEventTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-white/[0.06] text-gray-500 text-xs uppercase">
          <th className="text-left py-3 px-3">Banner</th>
          <th className="text-left py-3 px-3">Nama</th>
          <th className="text-left py-3 px-3">Tanggal</th>
          <th className="text-left py-3 px-3">Lokasi</th>
          <th className="text-center py-3 px-3">Status</th>
          <th className="text-center py-3 px-3">Aktif</th>
          <th className="text-center py-3 px-3">Aksi</th>
        </tr></thead>
        <tbody>
          {events.map(ev => (
            <tr key={ev.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
              <td className="py-2 px-3">{ev.banner ? <img src={fileUrl(ev.banner)} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="text-gray-600">—</span>}</td>
              <td className="py-2 px-3 text-gray-200 font-medium">{ev.nama}</td>
              <td className="py-2 px-3 text-gray-400">{ev.tanggal}</td>
              <td className="py-2 px-3 text-gray-400">{ev.lokasi}</td>
              <td className="py-2 px-3 text-center"><Badge color={ev.status === 'upcoming' ? 'emerald' : ev.status === 'ongoing' ? 'blue' : 'gray'}>{ev.status}</Badge></td>
              <td className="py-2 px-3 text-center">{ev.aktif ? <i className="fas fa-check-circle text-emerald-400" /> : <i className="fas fa-times-circle text-red-400" />}</td>
              <td className="py-2 px-3 text-center"><div className="flex justify-center gap-2">
                <button onClick={() => openEdit(ev)} className="text-blue-400 hover:text-blue-300 text-xs"><i className="fas fa-edit" /></button>
                <button onClick={() => setDeleteConfirm({ show: true, id: ev.id, name: ev.nama })} className="text-red-400 hover:text-red-300 text-xs"><i className="fas fa-trash" /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGalleryTable = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {gallery.map(g => (
        <div key={g.id} className="relative group rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
          <img src={fileUrl(g.src)} alt={g.caption} className="w-full h-32 object-cover" />
          <div className="p-2.5">
            <p className="text-xs text-gray-200 font-medium truncate">{g.caption}</p>
            <p className="text-[10px] text-gray-500">{g.kategori}</p>
          </div>
          {!g.aktif && <div className="absolute top-1.5 left-1.5"><Badge color="red">Nonaktif</Badge></div>}
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEdit(g)} className="w-6 h-6 rounded bg-blue-500/80 text-white text-[10px] flex items-center justify-center"><i className="fas fa-edit" /></button>
            <button onClick={() => setDeleteConfirm({ show: true, id: g.id, name: g.caption })} className="w-6 h-6 rounded bg-red-500/80 text-white text-[10px] flex items-center justify-center"><i className="fas fa-trash" /></button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBeritaTable = () => (
    <div className="space-y-2">
      {berita.map(b => (
        <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <i className={`fas ${b.icon} text-emerald-400 text-sm`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm text-gray-200 font-medium">{b.judul}</span>
              {!b.aktif && <Badge color="red">Nonaktif</Badge>}
            </div>
            <p className="text-xs text-gray-500 line-clamp-1">{b.ringkasan}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
              <span>{b.kategori}</span>
              <span>{b.tanggal}</span>
              {b.link && <span className="text-blue-400">{b.link}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => openEdit(b)} className="text-blue-400 hover:text-blue-300 text-xs"><i className="fas fa-edit" /></button>
            <button onClick={() => setDeleteConfirm({ show: true, id: b.id, name: b.judul })} className="text-red-400 hover:text-red-300 text-xs"><i className="fas fa-trash" /></button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMarketplaceTable = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {marketplace.map(m => (
        <div key={m.id} className="relative group rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <div className="h-24 rounded-lg overflow-hidden bg-white/[0.02] mb-2">
            {m.img ? <img src={fileUrl(m.img)} alt={m.nama} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><i className="fas fa-box text-2xl" /></div>}
          </div>
          <p className="text-xs text-gray-200 font-medium truncate">{m.nama}</p>
          <p className="text-sm text-emerald-400 font-bold">{m.harga}</p>
          {!m.aktif && <div className="absolute top-1.5 left-1.5"><Badge color="red">Nonaktif</Badge></div>}
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEdit(m)} className="w-6 h-6 rounded bg-blue-500/80 text-white text-[10px] flex items-center justify-center"><i className="fas fa-edit" /></button>
            <button onClick={() => setDeleteConfirm({ show: true, id: m.id, name: m.nama })} className="w-6 h-6 rounded bg-red-500/80 text-white text-[10px] flex items-center justify-center"><i className="fas fa-trash" /></button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBannerTable = () => (
    <div className="space-y-2">
      {banners.map(b => (
        <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          {b.img ? <img src={fileUrl(b.img)} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded bg-white/[0.05] flex items-center justify-center flex-shrink-0"><i className="fas fa-image text-gray-600 text-xs" /></div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200 truncate">{b.text}</p>
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              {b.link && <span className="text-blue-400">{b.link}</span>}
              {b.section_index != null && <span>Section: {b.section_index}</span>}
            </div>
          </div>
          {!b.aktif && <Badge color="red">Nonaktif</Badge>}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => openEdit(b)} className="text-blue-400 hover:text-blue-300 text-xs"><i className="fas fa-edit" /></button>
            <button onClick={() => setDeleteConfirm({ show: true, id: b.id, name: b.text })} className="text-red-400 hover:text-red-300 text-xs"><i className="fas fa-trash" /></button>
          </div>
        </div>
      ))}
    </div>
  );

  /* ── Form renderer map ── */
  const formMap  = { events: renderEventForm, gallery: renderGalleryForm, berita: renderBeritaForm, marketplace: renderMarketplaceForm, banners: renderBannerForm };
  const tableMap = { events: renderEventTable, gallery: renderGalleryTable, berita: renderBeritaTable, marketplace: renderMarketplaceTable, banners: renderBannerTable };
  const labelMap = { events: 'Event', gallery: 'Galeri', berita: 'Berita', marketplace: 'Produk', banners: 'Banner' };

  const currentData = { events, gallery, berita, marketplace, banners }[tab] || [];

  /* ══════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════ */
  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <i className="fas fa-palette text-white text-sm" />
          </div>
          <div>
            <h2 className="m-0 text-base font-bold text-white">Kelola Landing Page</h2>
            <p className="m-0 text-[11px] text-gray-500">Kelola konten halaman utama website FORBASI</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabPills>
        {TABS.map(t => (
          <TabPill key={t.key} active={tab === t.key} onClick={() => { setTab(t.key); resetForm(); }}>
            <i className={`fas ${t.icon} mr-1.5`} /> {t.label}
          </TabPill>
        ))}
      </TabPills>

      {/* Content */}
      <Card noPadding>
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200 m-0">
            <i className={`fas ${TABS.find(t => t.key === tab)?.icon} mr-2 text-emerald-400`} />
            {TABS.find(t => t.key === tab)?.label} ({currentData.length})
          </h3>
          <button className={BTN_PRIMARY} onClick={() => { resetForm(); setShowForm(true); setForm({ aktif: 1, urutan: 0 }); }}>
            <i className="fas fa-plus" /> Tambah {labelMap[tab]}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">
              {editId ? `Edit ${labelMap[tab]}` : `Tambah ${labelMap[tab]} Baru`}
            </h4>
            {formMap[tab]?.()}
            <div className="flex gap-2 mt-4">
              <button className={BTN_PRIMARY} onClick={handleSave} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan</>}
              </button>
              <button className={BTN_GHOST} onClick={resetForm}><i className="fas fa-times" /> Batal</button>
            </div>
          </div>
        )}

        {/* Table / List */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12"><i className="fas fa-spinner fa-spin text-2xl text-emerald-400" /></div>
          ) : currentData.length === 0 ? (
            <EmptyState icon="inbox" message={`Belum ada ${labelMap[tab].toLowerCase()}`} />
          ) : (
            tableMap[tab]?.()
          )}
        </div>
      </Card>

      {/* Delete confirm */}
      <ConfirmModal
        show={deleteConfirm.show}
        title={`Hapus ${labelMap[tab]}?`}
        message={`Yakin ingin menghapus "${deleteConfirm.name}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null, name: '' })}
        danger
        confirmText="Hapus"
      />
    </PageContainer>
  );
}
