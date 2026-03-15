import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateFileSize(file) {
  if (file && file.size > MAX_FILE_SIZE) {
    toast.error(`File ${file.name} terlalu besar. Maksimal 5MB.`);
    return false;
  }
  return true;
}

export default function EventSubmitForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Detail event
  const [detail, setDetail] = useState({
    nama_event: '', jenis_event: '', tanggal_mulai: '', tanggal_selesai: '',
    lokasi: '', deskripsi: '', penyelenggara: '', kontak_person: ''
  });
  const [files, setFiles] = useState({
    dokumen_surat: null, proposal_kegiatan: null, poster: null
  });

  // Step 2: Mata lomba
  const [mataLomba, setMataLomba] = useState([{ nama: '', tanggal: '', waktu: '' }]);

  // Step 3: Persyaratan
  const [persyaratan, setPersyaratan] = useState({
    // Checkboxes
    jumlahPeserta: false, anggotaForbasi: false,
    // Text inputs
    kategoriKokab: '', kategoriProvinsi: '',
    namaTimRekap: '', namaPanitia: '', rincianHadiah: ''
  });
  const [persyaratanFiles, setPersyaratanFiles] = useState({});
  const [juriList, setJuriList] = useState([{ nama: '', posisi: '', foto: null }]);

  const handleDetailChange = (e) => {
    setDetail(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !validateFileSize(file)) { e.target.value = ''; return; }
    setFiles(prev => ({ ...prev, [e.target.name]: file }));
  };

  const handlePersyaratanFileChange = (fieldName, file) => {
    if (file && !validateFileSize(file)) return;
    setPersyaratanFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  // Mata lomba helpers
  const addMataLomba = () => setMataLomba(prev => [...prev, { nama: '', tanggal: '', waktu: '' }]);
  const removeMataLomba = (idx) => setMataLomba(prev => prev.filter((_, i) => i !== idx));
  const updateMataLomba = (idx, field, value) => {
    setMataLomba(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  // Juri helpers
  const addJuri = () => setJuriList(prev => [...prev, { nama: '', posisi: '', foto: null }]);
  const removeJuri = (idx) => setJuriList(prev => prev.filter((_, i) => i !== idx));
  const updateJuri = (idx, field, value) => {
    setJuriList(prev => prev.map((j, i) => i === idx ? { ...j, [field]: value } : j));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!detail.nama_event || !detail.tanggal_mulai || !detail.tanggal_selesai || !detail.lokasi) {
        return toast.error('Lengkapi semua field wajib');
      }
    }
    if (step === 2) {
      if (mataLomba.some(m => !m.nama)) {
        return toast.error('Nama mata lomba wajib diisi');
      }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Step 1 fields
      Object.entries(detail).forEach(([k, v]) => { if (v) formData.append(k, v); });
      Object.entries(files).forEach(([k, v]) => { if (v) formData.append(k, v); });

      // Step 2
      formData.append('mata_lomba', JSON.stringify(mataLomba));

      // Step 3 persyaratan (non-file data)
      const persyaratanData = { ...persyaratan };
      // Add juri list (without file references)
      persyaratanData.namaJuri = juriList.map(j => ({ nama: j.nama, posisi: j.posisi }));
      formData.append('persyaratan', JSON.stringify(persyaratanData));

      // Step 3 file uploads
      Object.entries(persyaratanFiles).forEach(([k, v]) => { if (v) formData.append(k, v); });

      // Juri photos
      juriList.forEach((j, i) => { if (j.foto) formData.append(`namaJuri_photo_${i}`, j.foto); });

      await api.post('/events/submit-event', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Pengajuan event berhasil disubmit!');
      navigate('/penyelenggara');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal submit pengajuan');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['Detail Event', 'Mata Lomba & Jadwal', 'Persyaratan Event'];

  return (
    <div style={{ minHeight: '100vh', background: '#0c1222', color: '#e2e8f0', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => navigate('/penyelenggara')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.9rem' }}>
          ← Kembali ke Dashboard
        </button>

        <h2 style={{ marginBottom: '0.5rem' }}>Pengajuan Event Penyelenggara</h2>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {stepTitles.map((title, i) => (
            <div key={i} style={{
              flex: 1, padding: '0.75rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem',
              background: step === i + 1 ? '#10b981' : step > i + 1 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)',
              color: step >= i + 1 ? '#fff' : '#666', fontWeight: step === i + 1 ? 700 : 400,
              transition: 'all 0.3s'
            }}>
              {i + 1}. {title}
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '2rem' }}>
          {/* STEP 1: Detail Event */}
          {step === 1 && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#10b981' }}>Detail Event</h3>
              <div className="form-group">
                <label>Nama Event *</label>
                <input type="text" name="nama_event" value={detail.nama_event} onChange={handleDetailChange} required placeholder="Nama event" />
              </div>
              <div className="form-group">
                <label>Jenis Event</label>
                <input type="text" name="jenis_event" value={detail.jenis_event} onChange={handleDetailChange} placeholder="Contoh: Lomba PBB, Festival Baris" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Tanggal Mulai *</label>
                  <input type="date" name="tanggal_mulai" value={detail.tanggal_mulai} onChange={handleDetailChange} required />
                </div>
                <div className="form-group">
                  <label>Tanggal Selesai *</label>
                  <input type="date" name="tanggal_selesai" value={detail.tanggal_selesai} onChange={handleDetailChange} required />
                </div>
              </div>
              <div className="form-group">
                <label>Lokasi *</label>
                <input type="text" name="lokasi" value={detail.lokasi} onChange={handleDetailChange} required placeholder="Lokasi penyelenggaraan" />
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea name="deskripsi" value={detail.deskripsi} onChange={handleDetailChange} rows={3} placeholder="Deskripsi event" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Penyelenggara</label>
                  <input type="text" name="penyelenggara" value={detail.penyelenggara} onChange={handleDetailChange} placeholder="Nama penyelenggara" />
                </div>
                <div className="form-group">
                  <label>Kontak Person</label>
                  <input type="text" name="kontak_person" value={detail.kontak_person} onChange={handleDetailChange} placeholder="No. HP / email" />
                </div>
              </div>
              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#f59e0b' }}>Upload Dokumen</h4>
              <div className="form-group">
                <label>Dokumen Surat</label>
                <input type="file" name="dokumen_surat" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                <small style={{ color: '#888' }}>PDF, JPG, PNG - Maks 5MB</small>
              </div>
              <div className="form-group">
                <label>Proposal Kegiatan</label>
                <input type="file" name="proposal_kegiatan" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
              </div>
              <div className="form-group">
                <label>Poster Event</label>
                <input type="file" name="poster" onChange={handleFileChange} accept=".jpg,.jpeg,.png" />
              </div>
            </div>
          )}

          {/* STEP 2: Mata Lomba & Jadwal */}
          {step === 2 && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#10b981' }}>Mata Lomba & Jadwal</h3>
              <p style={{ color: '#888', marginBottom: '1rem' }}>Tambahkan mata lomba beserta jadwalnya</p>

              {mataLomba.map((ml, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#10b981' }}>Mata Lomba #{idx + 1}</strong>
                    {mataLomba.length > 1 && (
                      <button type="button" onClick={() => removeMataLomba(idx)} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Nama Mata Lomba *</label>
                    <input type="text" value={ml.nama} onChange={(e) => updateMataLomba(idx, 'nama', e.target.value)} placeholder="Contoh: PBB, Varfor, Danton" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Tanggal</label>
                      <input type="date" value={ml.tanggal} onChange={(e) => updateMataLomba(idx, 'tanggal', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Waktu</label>
                      <input type="time" value={ml.waktu} onChange={(e) => updateMataLomba(idx, 'waktu', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addMataLomba} style={{ background: 'rgba(16,185,129,0.2)', border: '1px dashed #10b981', color: '#10b981', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
                + Tambah Mata Lomba
              </button>
            </div>
          )}

          {/* STEP 3: Persyaratan */}
          {step === 3 && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#10b981' }}>Persyaratan Event</h3>

              {/* A. Persyaratan Administratif */}
              <SectionHeader title="A. Persyaratan Administratif" />
              <FileUploadField label="1. Surat pernyataan izin penyelenggaraan dari Sekolah/Instansi" field="suratIzinSekolah" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="2. Surat izin keramaian dari Kepolisian" field="suratIzinKepolisian" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="3. Surat rekomendasi Dinas Pendidikan/KCD" field="suratRekomendasiDinas" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="4. Surat izin penggunaan lokasi/venue" field="suratIzinVenue" accept=".pdf,.jpg,.jpeg,.png" />
              <FileUploadField label="5. Surat rekomendasi PPI setempat" field="suratRekomendasiPPI" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />

              {/* B. Persyaratan Prasarana & Sarana */}
              <SectionHeader title="B. Persyaratan Prasarana & Sarana" />
              <FileUploadField label="6. Foto Lapangan (min 12x18M)" field="fotoLapangan" accept=".jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="7. Foto Tempat Ibadah" field="fotoTempatIbadah" accept=".jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="8. Foto Barak Peserta" field="fotoBarak" accept=".jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="9. Foto Area Parkir" field="fotoAreaParkir" accept=".jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="10. Foto Ruang Kesehatan" field="fotoRuangKesehatan" accept=".jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="11. Foto MCK (WC & Air)" field="fotoMCK" accept=".jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="12. Foto Tempat Sampah" field="fotoTempatSampah" accept=".jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="13. Foto Ruang Komisi Perlombaan, Juri & Rekap" field="fotoRuangKomisi" accept=".jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />

              {/* C. Persyaratan Perangkat Perlombaan */}
              <SectionHeader title="C. Persyaratan Perangkat Perlombaan" />
              <FileUploadField label="14. Fakta Integritas Komisi Perlombaan" field="faktaIntegritasKomisi" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>15. Juri PBB & Varfor</label>
                {juriList.map((juri, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Nama</label>
                        <input type="text" value={juri.nama} onChange={(e) => updateJuri(idx, 'nama', e.target.value)} placeholder="Nama juri" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Posisi</label>
                        <input type="text" value={juri.posisi} onChange={(e) => updateJuri(idx, 'posisi', e.target.value)} placeholder="Juri PBB / Varfor" />
                      </div>
                      {juriList.length > 1 && (
                        <button type="button" onClick={() => removeJuri(idx)} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', height: '36px', width: '36px' }}>✕</button>
                      )}
                    </div>
                    <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Foto Juri</label>
                      <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files[0]; if (f && validateFileSize(f)) updateJuri(idx, 'foto', f); }} />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addJuri} style={{ background: 'rgba(16,185,129,0.15)', border: '1px dashed #10b981', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  + Tambah Juri
                </button>
              </div>

              <div className="form-group">
                <label>16. Tim Rekap</label>
                <textarea value={persyaratan.namaTimRekap} onChange={(e) => setPersyaratan(p => ({ ...p, namaTimRekap: e.target.value }))} rows={2} placeholder="Nama-nama tim rekap" />
              </div>
              <div className="form-group">
                <label>17. Kelengkapan Perangkat Panitia</label>
                <textarea value={persyaratan.namaPanitia} onChange={(e) => setPersyaratan(p => ({ ...p, namaPanitia: e.target.value }))} rows={2} placeholder="Nama-nama panitia" />
              </div>
              <FileUploadField label="18. Fakta Integritas Honor Komper, Juri & Tim Rekap" field="faktaIntegritasHonor" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />
              <FileUploadField label="19. Fakta Integritas Panitia Penyelenggara" field="faktaIntegritasPanitia" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePersyaratanFileChange} />

              {/* D. Persyaratan Peserta */}
              <SectionHeader title="D. Persyaratan Peserta" />
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={persyaratan.jumlahPeserta} onChange={(e) => setPersyaratan(p => ({ ...p, jumlahPeserta: e.target.checked }))} />
                  20. Jumlah peserta minimal 30 & maksimal 50 tiap harinya
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={persyaratan.anggotaForbasi} onChange={(e) => setPersyaratan(p => ({ ...p, anggotaForbasi: e.target.checked }))} />
                  21. Peserta wajib anggota FORBASI
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>22. Kategori Kokab (jumlah tim/peserta)</label>
                  <input type="text" value={persyaratan.kategoriKokab} onChange={(e) => setPersyaratan(p => ({ ...p, kategoriKokab: e.target.value }))} placeholder="Contoh: 20 tim" />
                </div>
                <div className="form-group">
                  <label>23. Kategori Provinsi (jumlah tim/peserta)</label>
                  <input type="text" value={persyaratan.kategoriProvinsi} onChange={(e) => setPersyaratan(p => ({ ...p, kategoriProvinsi: e.target.value }))} placeholder="Contoh: 15 tim" />
                </div>
              </div>

              {/* E. Persyaratan Penghargaan */}
              <SectionHeader title="E. Persyaratan Penghargaan" />
              <div className="form-group">
                <label>24. Rincian Hadiah (min Rp 6.000.000)</label>
                <textarea value={persyaratan.rincianHadiah} onChange={(e) => setPersyaratan(p => ({ ...p, rincianHadiah: e.target.value }))} rows={3} placeholder="Rincian hadiah dan uang pembinaan" />
              </div>
              <FileUploadField label="25. Desain Sertifikat (Utama, PBB, Varfor & Danton Juara 1,2,3)" field="desainSertifikat" accept=".jpg,.jpeg,.png,.pdf" onChange={handlePersyaratanFileChange} />
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
            {step > 1 && (
              <button type="button" onClick={prevStep} style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: '1px solid #555', background: 'transparent', color: '#ccc', cursor: 'pointer' }}>
                ← Sebelumnya
              </button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              {step < 3 ? (
                <button type="button" onClick={nextStep} style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Selanjutnya →
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading} style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#000', cursor: 'pointer', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Mengirim...' : 'Submit Pengajuan'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#f59e0b', borderBottom: '1px solid rgba(245,158,11,0.3)', paddingBottom: '0.5rem' }}>
      {title}
    </h4>
  );
}

function FileUploadField({ label, field, accept, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input type="file" accept={accept} onChange={(e) => {
        const file = e.target.files[0];
        if (onChange) onChange(field, file);
      }} />
      <small style={{ color: '#888' }}>Maks 5MB</small>
    </div>
  );
}
