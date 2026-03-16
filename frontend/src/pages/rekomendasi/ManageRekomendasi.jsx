import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

// Jabar's server URL for files
const JABAR_BASE = 'https://jabar.forbasi.or.id';
const fileUrl = (p) => {
  if (!p) return null;
  // If already absolute URL, return as-is
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  // Otherwise, prepend Jabar's base URL
  return `${JABAR_BASE}/uploads/${p.replace(/^\/+/, '')}`;
};

const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
const LABEL = 'block text-xs font-semibold text-gray-400 mb-1.5';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all';
const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all';

const JENIS_OPTIONS = [
  { value: 'event', label: 'Event' },
  { value: 'pelatih', label: 'Pelatih' },
  { value: 'kejurcab', label: 'Kejurcab' },
  { value: 'lainnya', label: 'Lainnya' },
];

// Status badge mapping (handles both lowercase and Jabar API's UPPERCASE)
const STATUS_BADGE = {
  pending:    { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending' },
  PENDING:    { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending' },
  approved:   { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Disetujui' },
  DISETUJUI:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Disetujui' },
  rejected:   { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Ditolak' },
  DITOLAK:    { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Ditolak' },
};

export default function ManageRekomendasi({ embedded }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');

  /* ── Form ── */
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [fileSuratPermohonan, setFileSuratPermohonan] = useState(null);
  const [fileDokumenPendukung, setFileDokumenPendukung] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ── Approve modal ── */
  const [approveModal, setApproveModal] = useState({ show: false, id: null, nama: '' });
  const [approveNote, setApproveNote] = useState('');
  const [fileSuratRekomendasi, setFileSuratRekomendasi] = useState(null);

  /* ── Reject modal ── */
  const [rejectModal, setRejectModal] = useState({ show: false, id: null, nama: '' });
  const [rejectNote, setRejectNote] = useState('');

  /* ── Delete ── */
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  /* ── Detail ── */
  const [detail, setDetail] = useState(null);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterJenis) params.jenis_rekomendasi = filterJenis;
      const { data: res } = await api.get('/regional-rekomendasi', { params });
      if (res.success) setData(res.data);
    } catch { toast.error('Gagal memuat rekomendasi'); }
    setLoading(false);
  }, [filterStatus, filterJenis]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Form helpers ── */
  const resetForm = () => {
    setShowForm(false); setEditId(null); setForm({});
    setFileSuratPermohonan(null); setFileDokumenPendukung(null);
  };
  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ ...item });
    setFileSuratPermohonan(null);
    setFileDokumenPendukung(null);
    setShowForm(true);
    setDetail(null);
  };

  /* ── Save (create / update) ── */
  const handleSave = async () => {
    if (!form.pemohon_nama || !form.jenis_rekomendasi || !form.perihal) {
      return toast.error('Nama pemohon, jenis, dan perihal wajib diisi');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('pemohon_nama', form.pemohon_nama);
      fd.append('jenis_rekomendasi', form.jenis_rekomendasi);
      fd.append('perihal', form.perihal);
      if (form.pemohon_jabatan) fd.append('pemohon_jabatan', form.pemohon_jabatan);
      if (form.pemohon_club) fd.append('pemohon_club', form.pemohon_club);
      if (fileSuratPermohonan) fd.append('surat_permohonan', fileSuratPermohonan);
      if (fileDokumenPendukung) fd.append('dokumen_pendukung', fileDokumenPendukung);

      const url = editId ? `/regional-rekomendasi/${editId}` : '/regional-rekomendasi';
      const res = editId
        ? await api.put(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (res.data.success) {
        toast.success(res.data.message);
        resetForm();
        fetchData();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    setSaving(false);
  };

  /* ── Approve ── */
  const handleApprove = async () => {
    try {
      const fd = new FormData();
      if (approveNote) fd.append('catatan_pengda', approveNote);
      if (fileSuratRekomendasi) fd.append('surat_rekomendasi', fileSuratRekomendasi);
      const res = await api.put(`/regional-rekomendasi/${approveModal.id}/approve`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) { toast.success(res.data.message); fetchData(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyetujui'); }
    setApproveModal({ show: false, id: null, nama: '' }); setApproveNote(''); setFileSuratRekomendasi(null);
  };

  /* ── Reject ── */
  const handleReject = async () => {
    try {
      const res = await api.put(`/regional-rekomendasi/${rejectModal.id}/reject`, { catatan_pengda: rejectNote || 'Ditolak' });
      if (res.data.success) { toast.success(res.data.message); fetchData(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menolak'); }
    setRejectModal({ show: false, id: null, nama: '' }); setRejectNote('');
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    try {
      const { data: res } = await api.delete(`/regional-rekomendasi/${deleteConfirm.id}`);
      if (res.success) { toast.success(res.message); fetchData(); }
    } catch { toast.error('Gagal menghapus'); }
    setDeleteConfirm({ show: false, id: null, name: '' });
  };

  /* ── File link helper ── */
  const FileLink = ({ path: p, label }) => {
    if (!p) return <span className="text-gray-600 text-xs">-</span>;
    const url = fileUrl(p);
    const isPdf = p.endsWith('.pdf');
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
        <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-file-image'} text-[10px]`} />
        {label}
      </a>
    );
  };

  /* ══════════════════════════════════════════
     FORM
  ══════════════════════════════════════════ */
  const renderForm = () => (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 mb-5">
      <h3 className="text-sm font-semibold text-white mb-4">{editId ? 'Edit' : 'Buat'} Rekomendasi</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Nama Pemohon *</label>
          <input className={INPUT} placeholder="Nama lengkap" value={form.pemohon_nama || ''} onChange={e => onChange('pemohon_nama', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Jabatan</label>
          <input className={INPUT} placeholder="Jabatan pemohon" value={form.pemohon_jabatan || ''} onChange={e => onChange('pemohon_jabatan', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Klub / Organisasi</label>
          <input className={INPUT} placeholder="Nama klub" value={form.pemohon_club || ''} onChange={e => onChange('pemohon_club', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Jenis Rekomendasi *</label>
          <select className={INPUT + ' cursor-pointer'} value={form.jenis_rekomendasi || 'event'} onChange={e => onChange('jenis_rekomendasi', e.target.value)}>
            {JENIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={LABEL}>Perihal / Keterangan *</label>
          <textarea className={INPUT + ' min-h-[80px]'} placeholder="Jelaskan keperluan rekomendasi" value={form.perihal || ''} onChange={e => onChange('perihal', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Surat Permohonan (JPG/PNG/PDF)</label>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={e => setFileSuratPermohonan(e.target.files[0] || null)} className="text-xs text-gray-400" />
          {editId && form.surat_permohonan && !fileSuratPermohonan && <FileLink path={form.surat_permohonan} label="File saat ini" />}
        </div>
        <div>
          <label className={LABEL}>Dokumen Pendukung (JPG/PNG/PDF)</label>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={e => setFileDokumenPendukung(e.target.files[0] || null)} className="text-xs text-gray-400" />
          {editId && form.dokumen_pendukung && !fileDokumenPendukung && <FileLink path={form.dokumen_pendukung} label="File saat ini" />}
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
        <button onClick={resetForm} className={BTN_GHOST}>Batal</button>
        <button onClick={handleSave} disabled={saving} className={BTN_PRIMARY}>
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     DETAIL VIEW
  ══════════════════════════════════════════ */
  const renderDetail = () => {
    if (!detail) return null;
    const sb = STATUS_BADGE[detail.status] || STATUS_BADGE.pending;
    return (
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Detail Rekomendasi #{detail.id}</h3>
          <button onClick={() => setDetail(null)} className={BTN_GHOST}><i className="fas fa-times" /> Tutup</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Pemohon:</span> <span className="text-white ml-2">{detail.pemohon_nama}</span></div>
          <div><span className="text-gray-500">Jabatan:</span> <span className="text-gray-300 ml-2">{detail.pemohon_jabatan || '-'}</span></div>
          <div><span className="text-gray-500">Klub:</span> <span className="text-gray-300 ml-2">{detail.pemohon_club || '-'}</span></div>
          <div><span className="text-gray-500">Jenis:</span> <span className="text-gray-300 ml-2 capitalize">{detail.jenis_rekomendasi}</span></div>
          <div className="md:col-span-2"><span className="text-gray-500">Perihal:</span> <p className="text-gray-300 mt-1">{detail.perihal}</p></div>
          <div><span className="text-gray-500">Status:</span> <span className={`ml-2 inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${sb.bg} ${sb.text}`}>{sb.label}</span></div>
          <div><span className="text-gray-500">Tanggal:</span> <span className="text-gray-300 ml-2">{new Date(detail.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          {detail.catatan_pengda && <div className="md:col-span-2"><span className="text-gray-500">Catatan Pengda:</span> <p className="text-gray-300 mt-1">{detail.catatan_pengda}</p></div>}
          <div className="md:col-span-2 flex flex-wrap gap-4">
            <div><span className="text-gray-500 text-xs">Surat Permohonan:</span> <div className="mt-1"><FileLink path={detail.surat_permohonan} label="Lihat file" /></div></div>
            <div><span className="text-gray-500 text-xs">Dokumen Pendukung:</span> <div className="mt-1"><FileLink path={detail.dokumen_pendukung} label="Lihat file" /></div></div>
            {detail.surat_rekomendasi_path && <div><span className="text-gray-500 text-xs">Surat Rekomendasi:</span> <div className="mt-1"><FileLink path={detail.surat_rekomendasi_path} label="Lihat surat" /></div></div>}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════
     TABLE
  ══════════════════════════════════════════ */

  const content = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="fas fa-file-signature text-emerald-400" />
          Surat Rekomendasi
        </h2>
        {!showForm && !detail && (
          <button onClick={() => { resetForm(); setShowForm(true); setDetail(null); }} className={BTN_PRIMARY}>
            <i className="fas fa-plus" /> Buat Rekomendasi
          </button>
        )}
      </div>

      {/* Filters */}
      {!showForm && !detail && (
        <div className="flex flex-wrap gap-3">
          <select className={INPUT + ' !w-auto cursor-pointer'} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
          <select className={INPUT + ' !w-auto cursor-pointer'} value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
            <option value="">Semua Jenis</option>
            {JENIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {/* Form / Detail */}
      {showForm && renderForm()}
      {detail && renderDetail()}

      {/* Table */}
      {!showForm && !detail && (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.02]">
                    {['No', 'Pemohon', 'Jenis', 'Perihal', 'Tanggal', 'Dokumen', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.map((item, idx) => {
                    const sb = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white text-xs">{item.pemohon_nama}</div>
                          {item.pemohon_club && <div className="text-[11px] text-gray-500">{item.pemohon_club}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[11px] bg-blue-500/10 text-blue-400 rounded-full capitalize">{item.jenis_rekomendasi}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs max-w-[180px] truncate">{item.perihal}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <FileLink path={item.surat_permohonan} label="Permohonan" />
                            <FileLink path={item.dokumen_pendukung} label="Pendukung" />
                            {item.surat_rekomendasi_path && <FileLink path={item.surat_rekomendasi_path} label="Surat Rekom" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${sb.bg} ${sb.text}`}>{sb.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => { setDetail(item); setShowForm(false); }} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center" title="Detail">
                              <i className="fas fa-eye text-xs" />
                            </button>
                            {item.status === 'pending' && (
                              <>
                                <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center" title="Edit">
                                  <i className="fas fa-edit text-xs" />
                                </button>
                                <button onClick={() => { setApproveModal({ show: true, id: item.id, nama: item.pemohon_nama }); setApproveNote(''); setFileSuratRekomendasi(null); }} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center" title="Setujui">
                                  <i className="fas fa-check text-xs" />
                                </button>
                                <button onClick={() => { setRejectModal({ show: true, id: item.id, nama: item.pemohon_nama }); setRejectNote(''); }} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center" title="Tolak">
                                  <i className="fas fa-times text-xs" />
                                </button>
                              </>
                            )}
                            <button onClick={() => setDeleteConfirm({ show: true, id: item.id, name: item.pemohon_nama })} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center" title="Hapus">
                              <i className="fas fa-trash text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!data.length && (
                    <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-500 text-sm">
                      <i className="fas fa-file-signature text-2xl mb-2 block text-gray-700" />
                      Belum ada rekomendasi
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Approve Modal ── */}
      {approveModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1c2e] rounded-2xl border border-white/[0.08] p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Setujui Rekomendasi</h3>
            <p className="text-sm text-gray-400 mb-4">Permohonan dari <span className="text-white font-medium">{approveModal.nama}</span></p>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Catatan (opsional)</label>
                <textarea className={INPUT + ' min-h-[60px]'} placeholder="Catatan persetujuan..." value={approveNote} onChange={e => setApproveNote(e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Upload Surat Rekomendasi (opsional)</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={e => setFileSuratRekomendasi(e.target.files[0] || null)} className="text-xs text-gray-400" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setApproveModal({ show: false, id: null, nama: '' })} className={BTN_GHOST}>Batal</button>
              <button onClick={handleApprove} className={BTN_PRIMARY}><i className="fas fa-check" /> Setujui</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1c2e] rounded-2xl border border-white/[0.08] p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Tolak Rekomendasi</h3>
            <p className="text-sm text-gray-400 mb-4">Permohonan dari <span className="text-white font-medium">{rejectModal.nama}</span></p>
            <div>
              <label className={LABEL}>Alasan Penolakan</label>
              <textarea className={INPUT + ' min-h-[60px]'} placeholder="Jelaskan alasan penolakan..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setRejectModal({ show: false, id: null, nama: '' })} className={BTN_GHOST}>Batal</button>
              <button onClick={handleReject} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20 hover:from-red-400 hover:to-red-500 active:scale-[0.97] transition-all">
                <i className="fas fa-times" /> Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteConfirm.show && (
        <ConfirmModal
          title="Hapus Rekomendasi?"
          message={`Rekomendasi dari "${deleteConfirm.name}" akan dihapus beserta semua file terkait.`}
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
