import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  draft: { text: 'Draft', color: '#6b7280' },
  submitted: { text: 'Menunggu Review', color: '#f59e0b' },
  approved_pengcab: { text: 'Disetujui Pengcab', color: '#3b82f6' },
  rejected_pengcab: { text: 'Ditolak Pengcab', color: '#ef4444' },
  approved_admin: { text: 'Disetujui', color: '#10b981' },
  rejected_admin: { text: 'Ditolak', color: '#ef4444' }
};

const PERSYARATAN_LABELS = {
  suratIzinSekolah: 'Surat Izin Sekolah/Instansi',
  suratIzinKepolisian: 'Surat Izin Kepolisian',
  suratRekomendasiDinas: 'Surat Rekomendasi Dinas',
  suratIzinVenue: 'Surat Izin Venue',
  suratRekomendasiPPI: 'Surat Rekomendasi PPI',
  fotoLapangan: 'Foto Lapangan',
  fotoTempatIbadah: 'Foto Tempat Ibadah',
  fotoBarak: 'Foto Barak',
  fotoAreaParkir: 'Foto Area Parkir',
  fotoRuangKesehatan: 'Foto Ruang Kesehatan',
  fotoMCK: 'Foto MCK',
  fotoTempatSampah: 'Foto Tempat Sampah',
  fotoRuangKomisi: 'Foto Ruang Komisi',
  faktaIntegritasKomisi: 'Fakta Integritas Komisi',
  faktaIntegritasHonor: 'Fakta Integritas Honor',
  faktaIntegritasPanitia: 'Fakta Integritas Panitia',
  desainSertifikat: 'Desain Sertifikat'
};

export default function EventManage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isPengcab = user?.role_id === 2;
  const isAdmin = [3, 4].includes(user?.role_id) || user?.user_type === 'super_admin';

  useEffect(() => { fetchEvents(); }, [tab]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'pending') {
        if (isPengcab) {
          res = await api.get('/events/pengcab/pending');
        } else {
          res = await api.get('/events/admin/pending');
        }
      } else {
        res = await api.get('/events/admin/all', { params: { status: tab !== 'all' ? tab : undefined } });
      }
      setEvents(res.data.data || []);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const endpoint = isPengcab ? `/events/pengcab/${id}/approve` : `/events/admin/${id}/approve`;
      await api.post(endpoint, { notes: actionNotes });
      toast.success('Event berhasil disetujui');
      setSelectedEvent(null);
      setActionNotes('');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    } finally { setActionLoading(false); }
  };

  const handleReject = async (id) => {
    if (!actionNotes.trim()) return toast.error('Alasan penolakan wajib diisi');
    setActionLoading(true);
    try {
      const endpoint = isPengcab ? `/events/pengcab/${id}/reject` : `/events/admin/${id}/reject`;
      await api.post(endpoint, { reason: actionNotes });
      toast.success('Event ditolak');
      setSelectedEvent(null);
      setActionNotes('');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal reject');
    } finally { setActionLoading(false); }
  };

  const viewDetail = async (id) => {
    try {
      const res = await api.get(`/events/${id}`);
      setSelectedEvent(res.data.data);
    } catch { toast.error('Gagal memuat detail'); }
  };

  const statusBadge = (status) => {
    const s = STATUS_LABELS[status] || { text: status, color: '#666' };
    return <span style={{ background: `${s.color}22`, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{s.text}</span>;
  };

  const uploadsBase = (api.defaults.baseURL || '').replace('/api', '') + '/uploads/event_files/';

  const renderFileLink = (filename, label) => {
    if (!filename) return null;
    return (
      <a href={`${uploadsBase}${filename.includes('/') ? filename : `${label}/${filename}`}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>
        📎 {PERSYARATAN_LABELS[label] || label}
      </a>
    );
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ color: '#10b981', marginBottom: '0.25rem' }}>
        {isPengcab ? 'Review Event Penyelenggara' : 'Manajemen Event & Kejurcab'}
      </h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>
        {isPengcab ? 'Review dan approve/tolak pengajuan event dari penyelenggara' : 'Review semua pengajuan event dan kejurcab'}
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: 'Menunggu Review' },
          { key: 'all', label: 'Semua' },
          { key: 'approved_admin', label: 'Disetujui' },
          { key: 'rejected_admin', label: 'Ditolak' }
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedEvent(null); }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: tab === t.key ? '#10b981' : 'rgba(255,255,255,0.08)',
              color: tab === t.key ? '#fff' : '#888', fontWeight: tab === t.key ? 600 : 400
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedEvent ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Event list */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Memuat...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', color: '#888' }}>
              Tidak ada pengajuan
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {events.map(ev => (
                <div key={ev.id} onClick={() => viewDetail(ev.id)}
                  style={{
                    background: selectedEvent?.id === ev.id ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '10px', padding: '1rem', cursor: 'pointer',
                    border: selectedEvent?.id === ev.id ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>{ev.nama_event}</strong>
                      <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {ev.nama_organisasi || ev.username} • {ev.jenis_pengajuan === 'kejurcab' ? '🏆 Kejurcab' : '🎪 Event'}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.8rem' }}>
                        {ev.lokasi} • {new Date(ev.tanggal_mulai).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    {statusBadge(ev.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedEvent && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{selectedEvent.nama_event}</h3>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {statusBadge(selectedEvent.status)}

            <div style={{ marginTop: '1rem' }}>
              <InfoRow label="Jenis" value={selectedEvent.jenis_pengajuan === 'kejurcab' ? 'Kejuaraan Cabang' : 'Event Penyelenggara'} />
              <InfoRow label="Organisasi" value={selectedEvent.nama_organisasi || '-'} />
              <InfoRow label="Lokasi" value={selectedEvent.lokasi} />
              <InfoRow label="Tanggal" value={`${fmtDate(selectedEvent.tanggal_mulai)} - ${fmtDate(selectedEvent.tanggal_selesai)}`} />
              {selectedEvent.penyelenggara && <InfoRow label="Penyelenggara" value={selectedEvent.penyelenggara} />}
              {selectedEvent.kontak_person && <InfoRow label="Kontak" value={selectedEvent.kontak_person} />}
              {selectedEvent.deskripsi && <InfoRow label="Deskripsi" value={selectedEvent.deskripsi} />}
            </div>

            {/* Uploaded docs */}
            <div style={{ marginTop: '1rem' }}>
              <strong style={{ color: '#f59e0b', fontSize: '0.9rem' }}>Dokumen</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                {selectedEvent.dokumen_surat && <a href={`${uploadsBase}dokumen_surat/${selectedEvent.dokumen_surat}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>📎 Dokumen Surat</a>}
                {selectedEvent.proposal_kegiatan && <a href={`${uploadsBase}proposal_kegiatan/${selectedEvent.proposal_kegiatan}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>📎 Proposal Kegiatan</a>}
                {selectedEvent.poster && <a href={`${uploadsBase}poster/${selectedEvent.poster}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>📎 Poster</a>}
              </div>
            </div>

            {/* Mata Lomba */}
            {selectedEvent.mata_lomba && Array.isArray(selectedEvent.mata_lomba) && (
              <div style={{ marginTop: '1rem' }}>
                <strong style={{ color: '#f59e0b', fontSize: '0.9rem' }}>Mata Lomba</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {selectedEvent.mata_lomba.map((ml, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      <strong>{ml.nama}</strong> {ml.tanggal && `- ${ml.tanggal}`} {ml.waktu && `${ml.waktu}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Persyaratan */}
            {selectedEvent.persyaratan && typeof selectedEvent.persyaratan === 'object' && (
              <div style={{ marginTop: '1rem' }}>
                <strong style={{ color: '#f59e0b', fontSize: '0.9rem' }}>Persyaratan</strong>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  {/* File persyaratan */}
                  {Object.entries(selectedEvent.persyaratan).map(([key, value]) => {
                    if (PERSYARATAN_LABELS[key] && typeof value === 'string') {
                      return <div key={key}>{renderFileLink(value, key)}</div>;
                    }
                    return null;
                  })}

                  {/* Non-file persyaratan */}
                  {selectedEvent.persyaratan.jumlahPeserta !== undefined && (
                    <div style={{ marginTop: '0.5rem' }}>✅ Jumlah peserta 30-50/hari: {selectedEvent.persyaratan.jumlahPeserta ? 'Ya' : 'Tidak'}</div>
                  )}
                  {selectedEvent.persyaratan.anggotaForbasi !== undefined && (
                    <div>✅ Peserta anggota FORBASI: {selectedEvent.persyaratan.anggotaForbasi ? 'Ya' : 'Tidak'}</div>
                  )}
                  {selectedEvent.persyaratan.kategoriKokab && <div>Kategori Kokab: {selectedEvent.persyaratan.kategoriKokab}</div>}
                  {selectedEvent.persyaratan.kategoriProvinsi && <div>Kategori Provinsi: {selectedEvent.persyaratan.kategoriProvinsi}</div>}
                  {selectedEvent.persyaratan.namaTimRekap && <div>Tim Rekap: {selectedEvent.persyaratan.namaTimRekap}</div>}
                  {selectedEvent.persyaratan.namaPanitia && <div>Panitia: {selectedEvent.persyaratan.namaPanitia}</div>}
                  {selectedEvent.persyaratan.rincianHadiah && <div>Rincian Hadiah: {selectedEvent.persyaratan.rincianHadiah}</div>}

                  {/* Juri */}
                  {selectedEvent.persyaratan.namaJuri && Array.isArray(selectedEvent.persyaratan.namaJuri) && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Juri:</strong>
                      {selectedEvent.persyaratan.namaJuri.map((j, i) => (
                        <div key={i} style={{ paddingLeft: '1rem' }}>• {j.nama} ({j.posisi})</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Surat Rekomendasi */}
            {selectedEvent.surat_rekomendasi_path && (
              <div style={{ marginTop: '1rem', background: 'rgba(16,185,129,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                <a href={`${uploadsBase.replace('event_files/', '')}${selectedEvent.surat_rekomendasi_path}`} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: 600 }}>
                  📄 Download Surat Rekomendasi
                </a>
              </div>
            )}

            {/* Rejection reason */}
            {selectedEvent.rejection_reason && (
              <div style={{ marginTop: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', color: '#ef4444' }}>
                <strong>Alasan Penolakan:</strong> {selectedEvent.rejection_reason}
              </div>
            )}

            {/* Action buttons */}
            {((isPengcab && selectedEvent.status === 'submitted' && selectedEvent.jenis_pengajuan === 'event_penyelenggara') ||
              (isAdmin && (selectedEvent.status === 'approved_pengcab' || (selectedEvent.jenis_pengajuan === 'kejurcab' && selectedEvent.status === 'submitted')))) && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} rows={2} placeholder="Catatan approve/tolak (alasan wajib jika menolak)" />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => handleApprove(selectedEvent.id)} disabled={actionLoading}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: actionLoading ? 0.7 : 1 }}>
                    {actionLoading ? 'Memproses...' : '✓ Approve'}
                  </button>
                  <button onClick={() => handleReject(selectedEvent.id)} disabled={actionLoading}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: actionLoading ? 0.7 : 1 }}>
                    ✕ Tolak
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
      <span style={{ color: '#888', minWidth: '120px' }}>{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
