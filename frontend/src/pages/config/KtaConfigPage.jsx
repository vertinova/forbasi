import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

/* ── Signature Pad (canvas drawing) ── */
function SignaturePad({ onSave, initialImage }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showCanvas, setShowCanvas] = useState(!initialImage);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, rect.width, rect.height);
  }, []);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0];
    return {
      x: (touch ? touch.clientX : e.clientX) - rect.left,
      y: (touch ? touch.clientY : e.clientY) - rect.top,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const ctx = getCtx();
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = getCtx();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = (e) => {
    if (!drawing) return;
    e?.preventDefault();
    setDrawing(false);
  };

  const clearCanvas = () => {
    initCanvas();
    setHasDrawn(false);
    onSave?.(null);
  };

  const saveCanvas = () => {
    if (!hasDrawn) return toast.error('Gambar tanda tangan terlebih dahulu');
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave?.(dataUrl);
    toast.success('Tanda tangan tersimpan');
  };

  return (
    <div className="space-y-3">
      {initialImage && !showCanvas && (
        <div>
          <div className="p-3 bg-white/[0.04] rounded-xl border border-white/[0.06] inline-block">
            <img src={initialImage} alt="Tanda Tangan" className="max-h-20 block brightness-0 invert" />
            <p className="text-[10px] text-gray-500 mt-1.5 m-0">Tanda tangan saat ini</p>
          </div>
          <div className="mt-2">
            <button type="button" onClick={() => { setShowCanvas(true); setTimeout(initCanvas, 50); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all">
              <i className="fas fa-pen text-[10px]" /> Ganti Tanda Tangan
            </button>
          </div>
        </div>
      )}
      {showCanvas && (
        <>
          <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.03]">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: 160 }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <div className="flex gap-2">
            {initialImage && (
              <button type="button" onClick={() => { setShowCanvas(false); setHasDrawn(false); onSave?.(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all">
                <i className="fas fa-arrow-left text-[10px]" /> Batal
              </button>
            )}
            <button type="button" onClick={clearCanvas}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all">
              <i className="fas fa-eraser text-[10px]" /> Hapus
            </button>
            <button type="button" onClick={saveCanvas}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all">
              <i className="fas fa-check text-[10px]" /> Simpan Tanda Tangan
            </button>
          </div>
          <p className="text-[10px] text-gray-500 m-0">Gambar tanda tangan di area di atas dengan mouse atau sentuhan.</p>
        </>
      )}
    </div>
  );
}

export default function KtaConfigPage({ embedded }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState({ ketua_umum_name: '', signature_image_path: null, stamp_image_path: null });
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const roleId = user?.role_id;
  const showStamp = [3, 4].includes(roleId);
  const backPath = roleId === 4 ? '/pb' : roleId === 3 ? '/pengda' : '/pengcab';
  const configDir = roleId === 2 ? 'pengcab_kta_configs' : roleId === 3 ? 'pengda_kta_configs' : 'pb_kta_configs';

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/config/kta-config');
      if (res.data.data) {
        const d = res.data.data;
        setConfig({
          ketua_umum_name: d.ketua_umum_name || '',
          signature_image_path: d.signature_image_path || null,
          stamp_image_path: d.stamp_image_path || null,
        });
      }
    } catch {
      // First time - no config yet
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!config.ketua_umum_name.trim()) return toast.error('Nama Ketua Umum wajib diisi');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('ketua_umum_name', config.ketua_umum_name);
      if (signatureDataUrl) formData.append('signature_data_url', signatureDataUrl);
      if (stampFile && showStamp) formData.append('stamp', stampFile);
      await api.post('/config/kta-config', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Konfigurasi KTA berhasil disimpan');
      setSignatureDataUrl(null);
      setStampFile(null);
      loadConfig();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan konfigurasi'); }
    finally { setSaving(false); }
  };

  const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';

  const content = (
    <div className="max-w-xl space-y-6">
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <i className="fas fa-cogs text-white text-sm" />
              </div>
              <div>
                <h2 className="m-0 text-[14px] font-bold text-white">Konfigurasi KTA</h2>
                <p className="m-0 text-[11px] text-gray-500">Atur nama ketua umum, tanda tangan & stempel</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Nama Ketua Umum */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Nama Ketua Umum <span className="text-red-500">*</span>
                </label>
                <input type="text" value={config.ketua_umum_name}
                  onChange={e => setConfig(prev => ({ ...prev, ketua_umum_name: e.target.value }))}
                  placeholder="Nama lengkap Ketua Umum" required className={INPUT} />
              </div>

              {/* Tanda Tangan (Canvas) */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tanda Tangan</label>
                <SignaturePad
                  onSave={setSignatureDataUrl}
                  initialImage={config.signature_image_path ? `${API_BASE}/uploads/${configDir}/${config.signature_image_path}` : null}
                />
              </div>

              {/* Stempel */}
              {showStamp && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Gambar Stempel</label>
                  {config.stamp_image_path && (
                    <div className="mb-3 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06] inline-block">
                      <img src={`${API_BASE}/uploads/${configDir}/${config.stamp_image_path}`} alt="Stempel"
                        className="max-h-20 block" />
                      <p className="text-[10px] text-gray-500 mt-1.5 m-0">Stempel saat ini</p>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png" onChange={e => setStampFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 cursor-pointer" />
                  <p className="text-[10px] text-gray-400 mt-1.5 m-0">
                    Format: JPG/PNG, maks 2MB.{config.stamp_image_path ? ' Kosongkan jika tidak ingin mengubah.' : ''}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'} text-xs`} />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                {!embedded && (
                  <button type="button" onClick={() => navigate(backPath)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all">
                    Kembali
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b11' }}>
      <Navbar title="Konfigurasi KTA" backTo={backPath} />
      <div className="page-container" style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>{content}</div>
    </div>
  );
}
