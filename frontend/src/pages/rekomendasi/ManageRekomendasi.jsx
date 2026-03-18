import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import { Pagination } from '../../components/layout/MainLayout';

const JABAR_BASE = 'https://jabar.forbasi.or.id';
const fileUrl = (p) => {
  if (!p) return null;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return `${JABAR_BASE}${p.startsWith('/') ? '' : '/'}${p}`;
};

const PER_PAGE = 10;
const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
const LABEL = 'block text-xs font-semibold text-gray-400 mb-1.5';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all';
const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all';

const STATUS_BADGE = {
  pending:          { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending' },
  PENDING:          { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending' },
  approved:         { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Disetujui' },
  DISETUJUI:        { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Disetujui' },
  APPROVED_PENGCAB: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Approved Pengcab' },
  DRAFT:            { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Draft' },
  rejected:         { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Ditolak' },
  DITOLAK:          { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Ditolak' },
};

export default function ManageRekomendasi({ embedded }) {
  const [activeTab, setActiveTab] = useState('list');

  /* ── List state ── */
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Approve modal ── */
  const [approveModal, setApproveModal] = useState({ show: false, id: null, nama: '' });
  const [approveNote, setApproveNote] = useState('');
  const [approveNomorSurat, setApproveNomorSurat] = useState('');

  /* ── Reject modal ── */
  const [rejectModal, setRejectModal] = useState({ show: false, id: null, nama: '' });
  const [rejectNote, setRejectNote] = useState('');

  /* ── Delete ── */
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  /* ── Detail ── */
  const [detail, setDetail] = useState(null);

  /* ── Document Preview ── */
  const [docPreview, setDocPreview] = useState({ show: false, url: '', title: '' });

  /* ── Surat Config state ── */
  const [suratConfig, setSuratConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('ketua');
  const [savingSignature, setSavingSignature] = useState(false);
  const [savingStamp, setSavingStamp] = useState(false);
  const [showSignatureForm, setShowSignatureForm] = useState(false);
  const [showStampForm, setShowStampForm] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  /* ══════════════════════════════════════════
     REKOMENDASI LIST
  ══════════════════════════════════════════ */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const { data: res } = await api.get('/regional-rekomendasi', { params });
      if (res.success) setData(res.data);
    } catch { toast.error('Gagal memuat rekomendasi'); }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  const pagedData = data.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  /* ── Approve ── */
  const handleApprove = async () => {
    try {
      const payload = { catatan_pengda: approveNote || '' };
      if (approveNomorSurat.trim()) payload.nomorSurat = approveNomorSurat.trim();
      const res = await api.put(`/regional-rekomendasi/${approveModal.id}/approve`, payload);
      if (res.data.success) { toast.success(res.data.message || 'Rekomendasi disetujui, surat otomatis digenerate'); fetchData(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyetujui'); }
    setApproveModal({ show: false, id: null, nama: '' }); setApproveNote(''); setApproveNomorSurat('');
  };

  /* ── Reject ── */
  const handleReject = async () => {
    try {
      const res = await api.put(`/regional-rekomendasi/${rejectModal.id}/reject`, { catatan_pengda: rejectNote || 'Ditolak' });
      if (res.data.success) { toast.success(res.data.message); fetchData(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menolak'); }
    setRejectModal({ show: false, id: null, nama: '' }); setRejectNote('');
  };

  /* ── Regenerate Surat ── */
  const [regenModal, setRegenModal] = useState({ show: false, id: null, nama: '' });
  const [regenNomorSurat, setRegenNomorSurat] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const payload = {};
      if (regenNomorSurat.trim()) payload.nomorSurat = regenNomorSurat.trim();
      const res = await api.post(`/regional-rekomendasi/${regenModal.id}/regenerate-surat`, payload);
      if (res.data.success) { toast.success(res.data.message || 'Surat berhasil di-generate ulang'); fetchData(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal generate ulang surat'); }
    setRegenerating(false);
    setRegenModal({ show: false, id: null, nama: '' }); setRegenNomorSurat('');
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    try {
      const { data: res } = await api.delete(`/regional-rekomendasi/${deleteConfirm.id}`);
      if (res.success) { toast.success(res.message); fetchData(); }
    } catch { toast.error('Gagal menghapus'); }
    setDeleteConfirm({ show: false, id: null, name: '' });
  };

  /* ── File preview helper ── */
  const FileBtn = ({ path: p, label }) => {
    if (!p) return <span className="text-gray-600 text-xs">-</span>;
    const url = fileUrl(p);
    const isPdf = p.endsWith('.pdf');
    return (
      <button type="button" onClick={() => setDocPreview({ show: true, url, title: label })}
        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
        <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-file-image'} text-[10px]`} />
        {label}
      </button>
    );
  };

  /* ══════════════════════════════════════════
     SURAT CONFIG
  ══════════════════════════════════════════ */
  const fetchSuratConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const { data: res } = await api.get('/regional-rekomendasi/surat-config');
      if (res.success) setSuratConfig(res.data);
    } catch { toast.error('Gagal memuat konfigurasi surat'); }
    setConfigLoading(false);
  }, []);

  useEffect(() => { if (activeTab === 'config') fetchSuratConfig(); }, [activeTab, fetchSuratConfig]);

  /* ── Canvas drawing ── */
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => { if (showSignatureForm) setTimeout(initCanvas, 100); }, [showSignatureForm, initCanvas]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => initCanvas();

  const handleSaveSignature = async () => {
    if (!signerName.trim()) return toast.error('Nama penandatangan wajib diisi');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL('image/png');
    setSavingSignature(true);
    try {
      const { data: res } = await api.post('/regional-rekomendasi/surat-config/signature', {
        signatureData,
        signerName: signerName.trim(),
        role: signerRole,
      });
      if (res.success) { toast.success(res.message); fetchSuratConfig(); clearCanvas(); setSignerName(''); setShowSignatureForm(false); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan tanda tangan'); }
    setSavingSignature(false);
  };

  const handleSaveStamp = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingStamp(true);
    try {
      const fd = new FormData();
      fd.append('stamp', file);
      const { data: res } = await api.post('/regional-rekomendasi/surat-config/stamp', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.success) { toast.success(res.message); fetchSuratConfig(); setShowStampForm(false); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan stempel'); }
    setSavingStamp(false);
    e.target.value = '';
  };

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
            <div><span className="text-gray-500 text-xs">Surat Permohonan:</span> <div className="mt-1"><FileBtn path={detail.surat_permohonan} label="Lihat file" /></div></div>
            <div><span className="text-gray-500 text-xs">Dokumen Pendukung:</span> <div className="mt-1"><FileBtn path={detail.dokumen_pendukung} label="Lihat file" /></div></div>
            {detail.surat_rekomendasi_path && <div><span className="text-gray-500 text-xs">Surat Rekomendasi:</span> <div className="mt-1"><FileBtn path={detail.surat_rekomendasi_path} label="Lihat surat" /></div></div>}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════
     SURAT CONFIG TAB
  ══════════════════════════════════════════ */
  const renderSuratConfig = () => {
    if (configLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    const ketua = suratConfig?.tanda_tangan_ketua;
    const sekretaris = suratConfig?.tanda_tangan_sekretaris;
    const stempel = suratConfig?.stempel;

    const allSignaturesExist = ketua?.signaturePath && sekretaris?.signaturePath;
    const stampExists = !!stempel?.stampPath;

    return (
      <div className="space-y-6">
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
          <h3 className="text-sm font-bold text-white mb-1">Konfigurasi Surat Rekomendasi</h3>
          <p className="text-xs text-gray-500 mb-6">Atur tanda tangan dan stempel yang digunakan untuk auto-generate surat rekomendasi saat permohonan disetujui.</p>

          {/* Current Config Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Ketua */}
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Tanda Tangan Ketua</h4>
              {ketua?.signaturePath ? (
                <>
                  <img src={fileUrl(ketua.signaturePath)} alt="TTD Ketua" className="w-full h-24 object-contain bg-white rounded-lg mb-2" />
                  <p className="text-xs text-white font-medium">{ketua.signerName}</p>
                  <p className="text-[10px] text-gray-500">Diperbarui: {ketua.updatedAt ? new Date(ketua.updatedAt).toLocaleDateString('id-ID') : '-'}</p>
                </>
              ) : (
                <div className="w-full h-24 bg-white/[0.02] rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-600">Belum diatur</span>
                </div>
              )}
            </div>

            {/* Sekretaris */}
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Tanda Tangan Sekretaris</h4>
              {sekretaris?.signaturePath ? (
                <>
                  <img src={fileUrl(sekretaris.signaturePath)} alt="TTD Sekretaris" className="w-full h-24 object-contain bg-white rounded-lg mb-2" />
                  <p className="text-xs text-white font-medium">{sekretaris.signerName}</p>
                  <p className="text-[10px] text-gray-500">Diperbarui: {sekretaris.updatedAt ? new Date(sekretaris.updatedAt).toLocaleDateString('id-ID') : '-'}</p>
                </>
              ) : (
                <div className="w-full h-24 bg-white/[0.02] rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-600">Belum diatur</span>
                </div>
              )}
            </div>

            {/* Stempel */}
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Stempel</h4>
              {stempel?.stampPath ? (
                <>
                  <img src={fileUrl(stempel.stampPath)} alt="Stempel" className="w-full h-24 object-contain bg-white rounded-lg mb-2" />
                  <p className="text-[10px] text-gray-500">Diperbarui: {stempel.updatedAt ? new Date(stempel.updatedAt).toLocaleDateString('id-ID') : '-'}</p>
                </>
              ) : (
                <div className="w-full h-24 bg-white/[0.02] rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-600">Belum diatur</span>
                </div>
              )}
            </div>
          </div>

          {/* Signature Input – only show form if not all signatures exist, or user clicks "Ganti" */}
          {(!allSignaturesExist || showSignatureForm) && (
            <div className="border-t border-white/[0.06] pt-6">
              <h4 className="text-sm font-semibold text-white mb-4">
                <i className="fas fa-signature text-emerald-400 mr-2" />
                {allSignaturesExist ? 'Ganti Tanda Tangan' : 'Buat Tanda Tangan'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL}>Nama Penandatangan *</label>
                  <input className={INPUT} placeholder="Nama lengkap" value={signerName} onChange={e => setSignerName(e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Jabatan *</label>
                  <select className={INPUT + ' cursor-pointer'} value={signerRole} onChange={e => setSignerRole(e.target.value)}>
                    <option value="ketua">Ketua</option>
                    <option value="sekretaris">Sekretaris</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className={LABEL}>Gambar Tanda Tangan (gunakan mouse / touch untuk menggambar)</label>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full max-w-[500px] h-[200px] bg-white rounded-xl border-2 border-dashed border-gray-600 cursor-crosshair touch-none"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                </div>
                <div className="flex gap-3 mt-3">
                  <button onClick={clearCanvas} className={BTN_GHOST}>
                    <i className="fas fa-eraser" /> Hapus Gambar
                  </button>
                  <button onClick={handleSaveSignature} disabled={savingSignature} className={BTN_PRIMARY}>
                    <i className={`fas ${savingSignature ? 'fa-spinner fa-spin' : 'fa-save'}`} />
                    {savingSignature ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
                  </button>
                  {allSignaturesExist && (
                    <button onClick={() => setShowSignatureForm(false)} className={BTN_GHOST}>
                      <i className="fas fa-times" /> Batal
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show "Ganti Tanda Tangan" button when both signatures exist and form is hidden */}
          {allSignaturesExist && !showSignatureForm && (
            <div className="border-t border-white/[0.06] pt-6">
              <button onClick={() => setShowSignatureForm(true)} className={BTN_GHOST}>
                <i className="fas fa-signature" /> Ganti Tanda Tangan
              </button>
            </div>
          )}

          {/* Stamp Upload – only show form if stamp doesn't exist, or user clicks "Ganti" */}
          {(!stampExists || showStampForm) && (
            <div className="border-t border-white/[0.06] pt-6 mt-6">
              <h4 className="text-sm font-semibold text-white mb-4">
                <i className="fas fa-stamp text-emerald-400 mr-2" />
                {stampExists ? 'Ganti Stempel' : 'Upload Stempel'}
              </h4>
              <p className="text-xs text-gray-500 mb-3">Upload gambar stempel organisasi (PNG/JPG, disarankan transparan).</p>
              <div className="flex gap-3">
                <label className={`${BTN_GHOST} cursor-pointer ${savingStamp ? 'opacity-50 pointer-events-none' : ''}`}>
                  <i className={`fas ${savingStamp ? 'fa-spinner fa-spin' : 'fa-upload'}`} />
                  {savingStamp ? 'Mengupload...' : 'Pilih File Stempel'}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleSaveStamp} className="hidden" />
                </label>
                {stampExists && (
                  <button onClick={() => setShowStampForm(false)} className={BTN_GHOST}>
                    <i className="fas fa-times" /> Batal
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Show "Ganti Stempel" button when stamp exists and form is hidden */}
          {stampExists && !showStampForm && (
            <div className="border-t border-white/[0.06] pt-6 mt-6">
              <button onClick={() => setShowStampForm(true)} className={BTN_GHOST}>
                <i className="fas fa-stamp" /> Ganti Stempel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════
     MAIN CONTENT
  ══════════════════════════════════════════ */
  const content = (
    <div className="space-y-5">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="fas fa-file-signature text-emerald-400" />
          Surat Rekomendasi
        </h2>
        <div className="flex gap-1 bg-white/[0.03] rounded-xl border border-white/[0.06] p-1">
          <button
            onClick={() => { setActiveTab('list'); setDetail(null); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <i className="fas fa-list mr-1.5" />Daftar
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'config' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <i className="fas fa-cog mr-1.5" />Konfigurasi Surat
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' ? renderSuratConfig() : (
        <>
          {/* Filters */}
          {!detail && (
            <div className="flex flex-wrap gap-3">
              <select className={INPUT + ' !w-auto cursor-pointer'} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED_PENGCAB">Approved Pengcab</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>
          )}

          {/* Detail View */}
          {detail && renderDetail()}

          {/* Table */}
          {!detail && (
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
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
                        {pagedData.map((item, idx) => {
                          const sb = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
                          return (
                            <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                              <td className="px-4 py-3 text-gray-500 text-xs">{(currentPage - 1) * PER_PAGE + idx + 1}</td>
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
                                  <FileBtn path={item.surat_permohonan} label="Permohonan" />
                                  <FileBtn path={item.dokumen_pendukung} label="Pendukung" />
                                  {item.surat_rekomendasi_path && <FileBtn path={item.surat_rekomendasi_path} label="Surat Rekom" />}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${sb.bg} ${sb.text}`}>{sb.label}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1.5 flex-wrap">
                                  <button onClick={() => setDetail(item)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center" title="Detail">
                                    <i className="fas fa-eye text-xs" />
                                  </button>
                                  {['pending', 'PENDING', 'APPROVED_PENGCAB'].includes(item.status) && (
                                    <>
                                      <button onClick={() => { setApproveModal({ show: true, id: item.id, nama: item.pemohon_nama }); setApproveNote(''); setApproveNomorSurat(''); }} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center" title="Setujui">
                                        <i className="fas fa-check text-xs" />
                                      </button>
                                      <button onClick={() => { setRejectModal({ show: true, id: item.id, nama: item.pemohon_nama }); setRejectNote(''); }} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center" title="Tolak">
                                        <i className="fas fa-times text-xs" />
                                      </button>
                                    </>
                                  )}
                                  {['DISETUJUI', 'approved'].includes(item.status) && (
                                    <button onClick={() => { setRegenModal({ show: true, id: item.id, nama: item.pemohon_nama }); setRegenNomorSurat(''); }} className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 flex items-center justify-center" title="Generate Ulang Surat">
                                      <i className="fas fa-redo text-xs" />
                                    </button>
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
                            Belum ada permohonan rekomendasi
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {data.length > PER_PAGE && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={data.length}
                      itemLabel="rekomendasi"
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Approve Modal ── */}
      {approveModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1c2e] rounded-2xl border border-white/[0.08] p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Setujui Rekomendasi</h3>
            <p className="text-sm text-gray-400 mb-4">Permohonan dari <span className="text-white font-medium">{approveModal.nama}</span></p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-emerald-400"><i className="fas fa-info-circle mr-1.5" />Surat rekomendasi akan di-generate secara otomatis berdasarkan konfigurasi surat yang telah diatur.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Nomor Surat (opsional, kosongkan untuk auto-generate)</label>
                <input className={INPUT} placeholder="Contoh: UM.001/FORBASI-JABAR/III/2026" value={approveNomorSurat} onChange={e => setApproveNomorSurat(e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Catatan (opsional)</label>
                <textarea className={INPUT + ' min-h-[60px]'} placeholder="Catatan persetujuan..." value={approveNote} onChange={e => setApproveNote(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setApproveModal({ show: false, id: null, nama: '' }); setApproveNomorSurat(''); }} className={BTN_GHOST}>Batal</button>
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

      {/* ── Regenerate Surat Modal ── */}
      {regenModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1c2e] rounded-2xl border border-white/[0.08] p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Generate Ulang Surat</h3>
            <p className="text-sm text-gray-400 mb-4">Rekomendasi dari <span className="text-white font-medium">{regenModal.nama}</span></p>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-violet-400"><i className="fas fa-info-circle mr-1.5" />Surat PDF akan di-generate ulang dengan konfigurasi tanda tangan dan stempel terbaru.</p>
            </div>
            <div>
              <label className={LABEL}>Nomor Surat (opsional, kosongkan untuk tetap menggunakan nomor yang ada)</label>
              <input className={INPUT} placeholder="Contoh: UM.001/FORBASI-JABAR/III/2026" value={regenNomorSurat} onChange={e => setRegenNomorSurat(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setRegenModal({ show: false, id: null, nama: '' }); setRegenNomorSurat(''); }} className={BTN_GHOST}>Batal</button>
              <button onClick={handleRegenerate} disabled={regenerating} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white font-semibold shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-violet-500 active:scale-[0.97] transition-all">
                <i className={`fas ${regenerating ? 'fa-spinner fa-spin' : 'fa-redo'}`} /> {regenerating ? 'Generating...' : 'Generate Ulang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteConfirm.show && (
        <ConfirmModal
          show={deleteConfirm.show}
          title="Hapus Rekomendasi?"
          message={`Rekomendasi dari "${deleteConfirm.name}" akan dihapus beserta semua file terkait.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: null, name: '' })}
          danger
        />
      )}

      {/* ── Document Preview Modal ── */}
      <DocumentPreviewModal show={docPreview.show} url={docPreview.url} title={docPreview.title}
        onClose={() => setDocPreview({ show: false, url: '', title: '' })} />
    </div>
  );

  if (embedded) return content;
  return (
    <div style={{ minHeight: '100vh', background: '#0a0b11' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">{content}</div>
    </div>
  );
}
