import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  draft: { text: 'Draft', color: '#6b7280', bg: '#6b728022' },
  submitted: { text: 'Menunggu Review Pengcab', color: '#f59e0b', bg: '#f59e0b22' },
  approved_pengcab: { text: 'Disetujui Pengcab, Menunggu Admin', color: '#3b82f6', bg: '#3b82f622' },
  rejected_pengcab: { text: 'Ditolak Pengcab', color: '#ef4444', bg: '#ef444422' },
  approved_admin: { text: 'Disetujui', color: '#10b981', bg: '#10b98122' },
  rejected_admin: { text: 'Ditolak', color: '#ef4444', bg: '#ef444422' }
};

const PERSYARATAN_FILE_LABELS = {
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

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(res => setEvent(res.data.data))
      .catch(() => toast.error('Gagal memuat detail event'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0c1222', color: '#888' }}>Memuat...</div>;
  if (!event) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0c1222', color: '#888' }}>Event tidak ditemukan</div>;

  const status = STATUS_LABELS[event.status] || { text: event.status, color: '#666', bg: '#66666622' };
  const uploadsBase = (api.defaults.baseURL || '').replace('/api', '') + '/uploads/event_files/';

  return (
    <div style={{ minHeight: '100vh', background: '#0c1222', color: '#e2e8f0', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => navigate('/penyelenggara')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', marginBottom: '1rem' }}>← Kembali</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{event.nama_event}</h2>
          <span style={{ background: status.bg, color: status.color, padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{status.text}</span>
        </div>

        {/* Detail */}
        <Section title="Detail Event">
          <InfoRow label="Jenis" value={event.jenis_pengajuan === 'kejurcab' ? 'Kejuaraan Cabang' : 'Event Penyelenggara'} />
          <InfoRow label="Lokasi" value={event.lokasi} />
          <InfoRow label="Tanggal" value={`${fmtDate(event.tanggal_mulai)} - ${fmtDate(event.tanggal_selesai)}`} />
          {event.jenis_event && <InfoRow label="Jenis Event" value={event.jenis_event} />}
          {event.penyelenggara && <InfoRow label="Penyelenggara" value={event.penyelenggara} />}
          {event.kontak_person && <InfoRow label="Kontak" value={event.kontak_person} />}
          {event.deskripsi && <InfoRow label="Deskripsi" value={event.deskripsi} />}
        </Section>

        {/* Documents */}
        <Section title="Dokumen">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {event.dokumen_surat && <FileLink href={`${uploadsBase}dokumen_surat/${event.dokumen_surat}`} label="Dokumen Surat" />}
            {event.proposal_kegiatan && <FileLink href={`${uploadsBase}proposal_kegiatan/${event.proposal_kegiatan}`} label="Proposal Kegiatan" />}
            {event.poster && <FileLink href={`${uploadsBase}poster/${event.poster}`} label="Poster" />}
            {!event.dokumen_surat && !event.proposal_kegiatan && !event.poster && <span style={{ color: '#888' }}>Tidak ada dokumen</span>}
          </div>
        </Section>

        {/* Mata Lomba */}
        {event.mata_lomba && Array.isArray(event.mata_lomba) && (
          <Section title="Mata Lomba & Jadwal">
            {event.mata_lomba.map((ml, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#10b981' }}>{ml.nama}</strong>
                {(ml.tanggal || ml.waktu) && <div style={{ color: '#888', fontSize: '0.85rem' }}>{ml.tanggal} {ml.waktu}</div>}
              </div>
            ))}
          </Section>
        )}

        {/* Persyaratan */}
        {event.persyaratan && typeof event.persyaratan === 'object' && (
          <Section title="Persyaratan">
            {Object.entries(event.persyaratan).map(([key, value]) => {
              if (PERSYARATAN_FILE_LABELS[key] && typeof value === 'string') {
                return <FileLink key={key} href={`${uploadsBase}${key}/${value}`} label={PERSYARATAN_FILE_LABELS[key]} />;
              }
              if (key.startsWith('namaJuri_photo_')) {
                return <FileLink key={key} href={`${uploadsBase}${key}/${value}`} label={`Foto Juri #${parseInt(key.split('_').pop()) + 1}`} />;
              }
              return null;
            })}

            {event.persyaratan.namaJuri && Array.isArray(event.persyaratan.namaJuri) && (
              <div style={{ marginTop: '0.75rem' }}>
                <strong style={{ fontSize: '0.9rem' }}>Daftar Juri:</strong>
                {event.persyaratan.namaJuri.map((j, i) => (
                  <div key={i} style={{ paddingLeft: '1rem', fontSize: '0.9rem' }}>• {j.nama} - {j.posisi}</div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '0.75rem' }}>
              {event.persyaratan.jumlahPeserta !== undefined && <div>Peserta 30-50/hari: {event.persyaratan.jumlahPeserta ? '✅ Ya' : '❌ Tidak'}</div>}
              {event.persyaratan.anggotaForbasi !== undefined && <div>Wajib anggota FORBASI: {event.persyaratan.anggotaForbasi ? '✅ Ya' : '❌ Tidak'}</div>}
              {event.persyaratan.kategoriKokab && <div>Kategori Kokab: {event.persyaratan.kategoriKokab}</div>}
              {event.persyaratan.kategoriProvinsi && <div>Kategori Provinsi: {event.persyaratan.kategoriProvinsi}</div>}
              {event.persyaratan.namaTimRekap && <div>Tim Rekap: {event.persyaratan.namaTimRekap}</div>}
              {event.persyaratan.namaPanitia && <div>Panitia: {event.persyaratan.namaPanitia}</div>}
              {event.persyaratan.rincianHadiah && <div>Rincian Hadiah: {event.persyaratan.rincianHadiah}</div>}
            </div>
          </Section>
        )}

        {/* Approval info */}
        {event.pengcab_approved_at && (
          <Section title="Approval Pengcab">
            <InfoRow label="Tanggal" value={fmtDate(event.pengcab_approved_at)} />
            {event.pengcab_notes && <InfoRow label="Catatan" value={event.pengcab_notes} />}
          </Section>
        )}
        {event.admin_approved_at && (
          <Section title="Approval Admin">
            <InfoRow label="Tanggal" value={fmtDate(event.admin_approved_at)} />
            {event.admin_notes && <InfoRow label="Catatan" value={event.admin_notes} />}
          </Section>
        )}

        {/* Rejection */}
        {event.rejection_reason && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <strong style={{ color: '#ef4444' }}>Alasan Penolakan:</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#fca5a5' }}>{event.rejection_reason}</p>
          </div>
        )}

        {/* Surat Rekomendasi */}
        {event.surat_rekomendasi_path && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontWeight: 600, marginBottom: '0.75rem' }}>🎉 Surat Rekomendasi Tersedia</p>
            <a href={`${uploadsBase.replace('event_files/', '')}${event.surat_rekomendasi_path}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-block', background: '#10b981', color: '#fff', padding: '0.75rem 2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              📄 Download Surat Rekomendasi
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
      <h4 style={{ color: '#f59e0b', marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem' }}>{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
      <span style={{ color: '#888', minWidth: '130px' }}>{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function FileLink({ href, label }) {
  return <a href={href} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.9rem', display: 'block' }}>📎 {label}</a>;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
