import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
const TEXTAREA = `${INPUT} resize-none`;
const FILE_INPUT = 'block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer file:transition-all cursor-pointer';

function validateFileSize(file) {
  if (file && file.size > MAX_FILE_SIZE) {
    toast.error(`File ${file.name} terlalu besar. Maksimal 5MB.`);
    return false;
  }
  return true;
}

export default function KejurcabSubmitForm({ embedded = false, onBack, onSuccess }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState({
    nama_event: '', tanggal_mulai: '', tanggal_selesai: '',
    lokasi: '', deskripsi: ''
  });
  const [files, setFiles] = useState({ proposal_kegiatan: null, poster: null });
  const [mataLomba, setMataLomba] = useState([{ nama: '', tanggal: '', waktu: '' }]);
  const [persyaratan, setPersyaratan] = useState({
    jumlahPeserta: false, anggotaForbasi: false,
    kategoriKokab: '', kategoriProvinsi: '',
    namaTimRekap: '', namaPanitia: '', rincianHadiah: ''
  });
  const [persyaratanFiles, setPersyaratanFiles] = useState({});
  const [juriList, setJuriList] = useState([{ nama: '', posisi: '', foto: null }]);

  const handleDetailChange = (e) => setDetail(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !validateFileSize(file)) { e.target.value = ''; return; }
    setFiles(prev => ({ ...prev, [e.target.name]: file }));
  };
  const handlePersyaratanFileChange = (fieldName, file) => {
    if (file && !validateFileSize(file)) return;
    setPersyaratanFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const addMataLomba = () => setMataLomba(prev => [...prev, { nama: '', tanggal: '', waktu: '' }]);
  const removeMataLomba = (idx) => setMataLomba(prev => prev.filter((_, i) => i !== idx));
  const updateMataLomba = (idx, field, value) => setMataLomba(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));

  const addJuri = () => setJuriList(prev => [...prev, { nama: '', posisi: '', foto: null }]);
  const removeJuri = (idx) => setJuriList(prev => prev.filter((_, i) => i !== idx));
  const updateJuri = (idx, field, value) => setJuriList(prev => prev.map((j, i) => i === idx ? { ...j, [field]: value } : j));

  const nextStep = () => {
    if (step === 1) {
      if (!detail.nama_event || !detail.tanggal_mulai || !detail.tanggal_selesai || !detail.lokasi) {
        return toast.error('Lengkapi semua field wajib');
      }
    }
    if (step === 2 && mataLomba.some(m => !m.nama)) {
      return toast.error('Nama mata lomba wajib diisi');
    }
    setStep(s => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const goBack = () => {
    if (onBack) onBack();
    else navigate('/pengcab');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(detail).forEach(([k, v]) => { if (v) formData.append(k, v); });
      Object.entries(files).forEach(([k, v]) => { if (v) formData.append(k, v); });
      formData.append('mata_lomba', JSON.stringify(mataLomba));
      const persyaratanData = { ...persyaratan };
      persyaratanData.namaJuri = juriList.map(j => ({ nama: j.nama, posisi: j.posisi }));
      formData.append('persyaratan', JSON.stringify(persyaratanData));
      Object.entries(persyaratanFiles).forEach(([k, v]) => { if (v) formData.append(k, v); });
      juriList.forEach((j, i) => { if (j.foto) formData.append(`namaJuri_photo_${i}`, j.foto); });

      await api.post('/events/submit-kejurcab', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Pengajuan Kejurcab berhasil disubmit!');
      if (onSuccess) onSuccess();
      else navigate('/pengcab');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal submit pengajuan');
    } finally {
      setLoading(false);
    }
  };

  const stepItems = [
    { num: 1, title: 'Detail Kejurcab', icon: 'fa-info-circle' },
    { num: 2, title: 'Mata Lomba', icon: 'fa-list-ol' },
    { num: 3, title: 'Persyaratan', icon: 'fa-clipboard-list' },
  ];

  const formContent = (
    <>
      {/* Back button */}
      <button onClick={goBack}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors mb-5 bg-transparent border-none cursor-pointer p-0">
        <i className="fas fa-arrow-left text-xs" />
        <span>Kembali ke Kejurcab</span>
      </button>

      {/* Header */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-400/25 flex-shrink-0">
            <i className="fas fa-trophy text-white text-lg" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white m-0">Pengajuan Kejuaraan Cabang</h2>
            <p className="text-xs text-gray-500 m-0 mt-0.5">Maksimal 1 kejurcab per pengcab per tahun</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {stepItems.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => { if (s.num < step) setStep(s.num); }}
              className={`
                flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border transition-all
                ${step === s.num
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5 cursor-default'
                  : step > s.num
                    ? 'bg-white/[0.03] border-emerald-500/20 cursor-pointer hover:bg-white/[0.05]'
                    : 'bg-white/[0.02] border-white/[0.06] cursor-default'}
              `}
            >
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold
                ${step === s.num
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/[0.05] text-gray-500'}
              `}>
                {step > s.num ? <i className="fas fa-check" /> : s.num}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className={`text-[11px] font-semibold m-0 truncate ${step === s.num ? 'text-emerald-400' : step > s.num ? 'text-emerald-400/60' : 'text-gray-500'}`}>
                  {s.title}
                </p>
              </div>
            </button>
            {i < stepItems.length - 1 && (
              <div className={`w-6 h-px mx-1 flex-shrink-0 ${step > s.num ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="p-6">

          {/* ─── STEP 1: Detail Kejurcab ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <i className="fas fa-info-circle text-emerald-400 text-xs" />
                </div>
                <h3 className="text-sm font-bold text-white m-0">Detail Kejurcab</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nama Kejurcab <span className="text-red-400">*</span></label>
                <input type="text" name="nama_event" value={detail.nama_event} onChange={handleDetailChange} className={INPUT} placeholder="Contoh: Kejurcab PBB Kota Bandung" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tanggal Mulai <span className="text-red-400">*</span></label>
                  <input type="date" name="tanggal_mulai" value={detail.tanggal_mulai} onChange={handleDetailChange} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tanggal Selesai <span className="text-red-400">*</span></label>
                  <input type="date" name="tanggal_selesai" value={detail.tanggal_selesai} onChange={handleDetailChange} className={INPUT} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Lokasi <span className="text-red-400">*</span></label>
                <input type="text" name="lokasi" value={detail.lokasi} onChange={handleDetailChange} className={INPUT} placeholder="Lokasi penyelenggaraan" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Deskripsi</label>
                <textarea name="deskripsi" value={detail.deskripsi} onChange={handleDetailChange} rows={3} className={TEXTAREA} placeholder="Deskripsi singkat kejurcab" />
              </div>

              {/* Upload Section */}
              <div className="border-t border-white/[0.06] pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <i className="fas fa-cloud-upload-alt text-amber-400 text-xs" />
                  </div>
                  <h4 className="text-sm font-bold text-white m-0">Upload Dokumen</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08] hover:border-emerald-500/30 transition-colors">
                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                      <i className="fas fa-file-pdf text-blue-400 mr-1.5" />Proposal Kegiatan
                    </label>
                    <input type="file" name="proposal_kegiatan" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className={FILE_INPUT} />
                    {files.proposal_kegiatan && (
                      <p className="text-emerald-400 text-[11px] mt-2 m-0"><i className="fas fa-check-circle mr-1" />{files.proposal_kegiatan.name}</p>
                    )}
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08] hover:border-emerald-500/30 transition-colors">
                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                      <i className="fas fa-image text-purple-400 mr-1.5" />Poster Event
                    </label>
                    <input type="file" name="poster" onChange={handleFileChange} accept=".jpg,.jpeg,.png" className={FILE_INPUT} />
                    {files.poster && (
                      <p className="text-emerald-400 text-[11px] mt-2 m-0"><i className="fas fa-check-circle mr-1" />{files.poster.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Mata Lomba ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <i className="fas fa-list-ol text-emerald-400 text-xs" />
                </div>
                <h3 className="text-sm font-bold text-white m-0">Mata Lomba & Jadwal</h3>
              </div>

              {mataLomba.map((ml, idx) => (
                <div key={idx} className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 hover:border-white/[0.1] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 text-[11px] font-bold flex items-center justify-center">{idx + 1}</span>
                      <span className="text-xs font-semibold text-gray-300">Mata Lomba #{idx + 1}</span>
                    </div>
                    {mataLomba.length > 1 && (
                      <button type="button" onClick={() => removeMataLomba(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border-none cursor-pointer transition-colors text-xs">
                        <i className="fas fa-trash-alt" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nama Mata Lomba <span className="text-red-400">*</span></label>
                      <input type="text" value={ml.nama} onChange={(e) => updateMataLomba(idx, 'nama', e.target.value)} className={INPUT} placeholder="Contoh: PBB, Varfor, Danton" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tanggal</label>
                        <input type="date" value={ml.tanggal} onChange={(e) => updateMataLomba(idx, 'tanggal', e.target.value)} className={INPUT} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Waktu</label>
                        <input type="time" value={ml.waktu} onChange={(e) => updateMataLomba(idx, 'waktu', e.target.value)} className={INPUT} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addMataLomba}
                className="w-full py-3 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all cursor-pointer">
                <i className="fas fa-plus mr-2" />Tambah Mata Lomba
              </button>
            </div>
          )}

          {/* ─── STEP 3: Persyaratan ─── */}
          {step === 3 && (
            <div className="space-y-6">
              {/* A. Administratif */}
              <SectionBlock icon="fa-folder-open" color="blue" title="A. Persyaratan Administratif">
                <div className="space-y-3">
                  <UploadField label="1. Surat izin penyelenggaraan dari Sekolah/Instansi" field="suratIzinSekolah" onChange={handlePersyaratanFileChange} value={persyaratanFiles.suratIzinSekolah} />
                  <UploadField label="2. Surat izin keramaian dari Kepolisian" field="suratIzinKepolisian" onChange={handlePersyaratanFileChange} value={persyaratanFiles.suratIzinKepolisian} />
                  <UploadField label="3. Surat rekomendasi Dinas Pendidikan/KCD" field="suratRekomendasiDinas" onChange={handlePersyaratanFileChange} value={persyaratanFiles.suratRekomendasiDinas} />
                  <UploadField label="4. Surat izin penggunaan lokasi/venue" field="suratIzinVenue" onChange={handlePersyaratanFileChange} value={persyaratanFiles.suratIzinVenue} />
                  <UploadField label="5. Surat rekomendasi PPI setempat" field="suratRekomendasiPPI" onChange={handlePersyaratanFileChange} value={persyaratanFiles.suratRekomendasiPPI} />
                </div>
              </SectionBlock>

              {/* B. Prasarana */}
              <SectionBlock icon="fa-building" color="purple" title="B. Persyaratan Prasarana & Sarana">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <UploadField label="6. Foto Lapangan (min 12x18M)" field="fotoLapangan" onChange={handlePersyaratanFileChange} value={persyaratanFiles.fotoLapangan} accept=".jpg,.jpeg,.png" />
                  <UploadField label="7. Foto Tempat Ibadah" field="fotoTempatIbadah" onChange={handlePersyaratanFileChange} value={persyaratanFiles.fotoTempatIbadah} accept=".jpg,.jpeg,.png" />
                  <UploadField label="8. Foto Barak Peserta" field="fotoBarak" onChange={handlePersyaratanFileChange} value={persyaratanFiles.fotoBarak} accept=".jpg,.jpeg,.png" />
                  <UploadField label="9. Foto Area Parkir" field="fotoAreaParkir" onChange={handlePersyaratanFileChange} value={persyaratanFiles.fotoAreaParkir} accept=".jpg,.jpeg,.png" />
                  <UploadField label="10. Foto Ruang Kesehatan" field="fotoRuangKesehatan" onChange={handlePersyaratanFileChange} value={persyaratanFiles.fotoRuangKesehatan} accept=".jpg,.jpeg,.png" />
                  <UploadField label="11. Foto MCK (WC & Air)" field="fotoMCK" onChange={handlePersyaratanFileChange} value={persyaratanFiles.fotoMCK} accept=".jpg,.jpeg,.png" />
                  <UploadField label="12. Foto Tempat Sampah" field="fotoTempatSampah" onChange={handlePersyaratanFileChange} value={persyaratanFiles.fotoTempatSampah} accept=".jpg,.jpeg,.png" />
                  <UploadField label="13. Foto Ruang Komisi & Juri" field="fotoRuangKomisi" onChange={handlePersyaratanFileChange} value={persyaratanFiles.fotoRuangKomisi} accept=".jpg,.jpeg,.png" />
                </div>
              </SectionBlock>

              {/* C. Perangkat */}
              <SectionBlock icon="fa-gavel" color="amber" title="C. Persyaratan Perangkat Perlombaan">
                <div className="space-y-4">
                  <UploadField label="14. Fakta Integritas Komisi Perlombaan" field="faktaIntegritasKomisi" onChange={handlePersyaratanFileChange} value={persyaratanFiles.faktaIntegritasKomisi} />

                  {/* Juri */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">15. Juri PBB & Varfor</label>
                    <div className="space-y-2">
                      {juriList.map((juri, idx) => (
                        <div key={idx} className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-3">
                          <div className="flex gap-2 items-start">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input type="text" value={juri.nama} onChange={(e) => updateJuri(idx, 'nama', e.target.value)} className={INPUT} placeholder="Nama juri" />
                              <input type="text" value={juri.posisi} onChange={(e) => updateJuri(idx, 'posisi', e.target.value)} className={INPUT} placeholder="Posisi (PBB/Varfor)" />
                            </div>
                            {juriList.length > 1 && (
                              <button type="button" onClick={() => removeJuri(idx)}
                                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border-none cursor-pointer transition-colors text-xs mt-0.5">
                                <i className="fas fa-times" />
                              </button>
                            )}
                          </div>
                          <div className="mt-2">
                            <input type="file" accept=".jpg,.jpeg,.png" className={FILE_INPUT}
                              onChange={(e) => { const f = e.target.files[0]; if (f && validateFileSize(f)) updateJuri(idx, 'foto', f); }} />
                            {juri.foto && <p className="text-emerald-400 text-[11px] mt-1 m-0"><i className="fas fa-check-circle mr-1" />{juri.foto.name}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addJuri}
                      className="mt-2 px-4 py-2 rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/10 transition-all cursor-pointer">
                      <i className="fas fa-plus mr-1.5" />Tambah Juri
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">16. Tim Rekap</label>
                    <textarea value={persyaratan.namaTimRekap} onChange={(e) => setPersyaratan(p => ({ ...p, namaTimRekap: e.target.value }))} rows={2} className={TEXTAREA} placeholder="Nama-nama tim rekap" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">17. Kelengkapan Perangkat Panitia</label>
                    <textarea value={persyaratan.namaPanitia} onChange={(e) => setPersyaratan(p => ({ ...p, namaPanitia: e.target.value }))} rows={2} className={TEXTAREA} placeholder="Nama-nama panitia" />
                  </div>
                  <UploadField label="18. Fakta Integritas Honor" field="faktaIntegritasHonor" onChange={handlePersyaratanFileChange} value={persyaratanFiles.faktaIntegritasHonor} />
                  <UploadField label="19. Fakta Integritas Panitia" field="faktaIntegritasPanitia" onChange={handlePersyaratanFileChange} value={persyaratanFiles.faktaIntegritasPanitia} />
                </div>
              </SectionBlock>

              {/* D. Peserta */}
              <SectionBlock icon="fa-users" color="teal" title="D. Persyaratan Peserta">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors cursor-pointer">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${persyaratan.jumlahPeserta ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-transparent'}`}>
                      {persyaratan.jumlahPeserta && <i className="fas fa-check text-white text-[10px]" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={persyaratan.jumlahPeserta} onChange={(e) => setPersyaratan(p => ({ ...p, jumlahPeserta: e.target.checked }))} />
                    <span className="text-sm text-gray-300">20. Jumlah peserta minimal 30 & maksimal 50 tiap harinya</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors cursor-pointer">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${persyaratan.anggotaForbasi ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-transparent'}`}>
                      {persyaratan.anggotaForbasi && <i className="fas fa-check text-white text-[10px]" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={persyaratan.anggotaForbasi} onChange={(e) => setPersyaratan(p => ({ ...p, anggotaForbasi: e.target.checked }))} />
                    <span className="text-sm text-gray-300">21. Peserta wajib anggota FORBASI</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">22. Kategori Kokab</label>
                      <input type="text" value={persyaratan.kategoriKokab} onChange={(e) => setPersyaratan(p => ({ ...p, kategoriKokab: e.target.value }))} className={INPUT} placeholder="Jumlah tim" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">23. Kategori Provinsi</label>
                      <input type="text" value={persyaratan.kategoriProvinsi} onChange={(e) => setPersyaratan(p => ({ ...p, kategoriProvinsi: e.target.value }))} className={INPUT} placeholder="Jumlah tim" />
                    </div>
                  </div>
                </div>
              </SectionBlock>

              {/* E. Penghargaan */}
              <SectionBlock icon="fa-award" color="rose" title="E. Persyaratan Penghargaan">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">24. Rincian Hadiah (min Rp 6.000.000)</label>
                    <textarea value={persyaratan.rincianHadiah} onChange={(e) => setPersyaratan(p => ({ ...p, rincianHadiah: e.target.value }))} rows={3} className={TEXTAREA} placeholder="Rincian detail hadiah" />
                  </div>
                  <UploadField label="25. Desain Sertifikat" field="desainSertifikat" onChange={handlePersyaratanFileChange} value={persyaratanFiles.desainSertifikat} />
                </div>
              </SectionBlock>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <div>
            {step > 1 && (
              <button type="button" onClick={prevStep}
                className="px-5 py-2.5 rounded-xl border border-white/[0.1] bg-transparent text-gray-300 text-sm font-medium hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer">
                <i className="fas fa-chevron-left mr-2 text-xs" />Sebelumnya
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 mr-2 hidden sm:inline">Step {step} / 3</span>
            {step < 3 ? (
              <button type="button" onClick={nextStep}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-emerald-500 transition-all border-none cursor-pointer">
                Selanjutnya<i className="fas fa-chevron-right ml-2 text-xs" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 text-sm font-bold shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 hover:from-amber-300 hover:to-amber-400 transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <><i className="fas fa-spinner fa-spin mr-2" />Mengirim...</> : <><i className="fas fa-paper-plane mr-2" />Submit Kejurcab</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) return formContent;

  return (
    <div className="min-h-screen bg-[#0a0b11] text-gray-200 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {formContent}
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function SectionBlock({ icon, color, title, children }) {
  const colors = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      <div className={`${c.bg} px-4 py-3 flex items-center gap-2`}>
        <i className={`fas ${icon} ${c.text} text-sm`} />
        <h4 className={`text-sm font-bold ${c.text} m-0`}>{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function UploadField({ label, field, onChange, value, accept = '.pdf,.jpg,.jpeg,.png' }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
      <input type="file" accept={accept} className="block w-full text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer file:transition-all cursor-pointer"
        onChange={(e) => { const file = e.target.files[0]; if (onChange) onChange(field, file); }} />
      {value && <p className="text-emerald-400 text-[11px] mt-1.5 m-0"><i className="fas fa-check-circle mr-1" />{value.name}</p>}
    </div>
  );
}
