import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DocumentPreviewModal from './DocumentPreviewModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS_MAP = {
  pending:                 { label: 'Pending',               cls: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-400/20',   icon: 'fa-clock',         color: 'amber' },
  approved_pengcab:        { label: 'Approved Pengcab',      cls: 'bg-sky-500/10 text-sky-400 ring-1 ring-sky-400/20',         icon: 'fa-check',         color: 'sky' },
  approved_pengda:         { label: 'Approved Pengda',       cls: 'bg-teal-500/10 text-teal-400 ring-1 ring-teal-400/20',      icon: 'fa-check-double',  color: 'teal' },
  approved_pb:             { label: 'Approved PB',           cls: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/20', icon: 'fa-check-circle', color: 'emerald' },
  kta_issued:              { label: 'KTA Terbit',            cls: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/20', icon: 'fa-id-card',      color: 'emerald' },
  rejected_pengcab:        { label: 'Ditolak Pengcab',       cls: 'bg-red-500/10 text-red-400 ring-1 ring-red-400/20',         icon: 'fa-times-circle',  color: 'red' },
  rejected_pengda:         { label: 'Ditolak Pengda',        cls: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-400/20',icon: 'fa-times-circle',  color: 'orange' },
  rejected_pb:             { label: 'Ditolak PB',            cls: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-400/20',      icon: 'fa-times-circle',  color: 'rose' },
  rejected:                { label: 'Ditolak',               cls: 'bg-red-500/10 text-red-400 ring-1 ring-red-400/20',         icon: 'fa-times-circle',  color: 'red' },
  resubmit_to_pengda:      { label: 'Diajukan Ulang',       cls: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-400/20',icon: 'fa-redo',          color: 'violet' },
  pending_pengda_resubmit: { label: 'Re-review Pengda',     cls: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-400/20',   icon: 'fa-sync',          color: 'amber' },
};

const PROGRESS_STEPS = [
  { key: 'pending',          label: 'Pengajuan Dikirim',   desc: 'Menunggu verifikasi Pengcab',     icon: 'fa-paper-plane' },
  { key: 'approved_pengcab', label: 'Disetujui Pengcab',   desc: 'Diteruskan ke Pengda',            icon: 'fa-building' },
  { key: 'approved_pengda',  label: 'Disetujui Pengda',    desc: 'Diteruskan ke PB',                icon: 'fa-landmark' },
  { key: 'approved_pb',      label: 'Disetujui PB',        desc: 'Dalam proses penerbitan',         icon: 'fa-stamp' },
  { key: 'kta_issued',       label: 'KTA Diterbitkan',     desc: 'KTA resmi telah aktif',           icon: 'fa-id-card' },
];

const stepIndex = (status) => {
  const map = { pending: 0, approved_pengcab: 1, approved_pengda: 2, approved_pb: 3, kta_issued: 4, resubmit_to_pengda: 2, pending_pengda_resubmit: 2 };
  return map[status] ?? -1;
};

const SPINNER = <div className="py-16 flex justify-center"><div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

/**
 * Inline KTA detail panel for Pengcab/Pengda/PB dashboards.
 * Props:
 *  - appId: the KTA application ID to display
 *  - onBack: callback to return to the list
 *  - onStatusUpdated: callback after status change (to refresh list)
 */
export default function KtaDetailPanel({ appId, onBack, onStatusUpdated }) {
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [modal, setModal] = useState({ open: false, action: '', status: '' });
  const [processing, setProcessing] = useState(false);
  const [docPreview, setDocPreview] = useState({ show: false, url: '', title: '' });

  useEffect(() => {
    if (!appId) return;
    setLoading(true);
    api.get(`/kta/applications/${appId}`)
      .then(r => setApp(r.data.data))
      .catch(() => toast.error('Data tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [appId]);

  const handleUpdateStatus = async (status) => {
    setProcessing(true);
    try {
      const payload = { status };
      if (['rejected_pengcab', 'rejected_pengda', 'rejected_pb'].includes(status)) {
        payload.rejection_reason = rejectReason;
      }
      await api.patch(`/kta/applications/${appId}/status`, payload);
      toast.success('Status berhasil diperbarui');
      setModal({ open: false, action: '', status: '' });
      setRejectReason('');
      const res = await api.get(`/kta/applications/${appId}`);
      setApp(res.data.data);
      onStatusUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status');
    } finally {
      setProcessing(false);
    }
  };

  /* Role-aware helpers */
  const roleId = user?.role_id;

  const canApprove = () => {
    if (!app) return false;
    if (roleId === 2 && ['pending', 'rejected_pengcab', 'rejected_pengda', 'rejected_pb'].includes(app.status)) return true;
    if (roleId === 3 && ['approved_pengcab', 'resubmit_to_pengda', 'rejected_pb', 'pending_pengda_resubmit'].includes(app.status)) return true;
    if (roleId === 4 && ['approved_pengda', 'pending_pengda_resubmit', 'rejected_pb'].includes(app.status)) return true;
    return false;
  };

  const canResubmitToPengda = () => roleId === 2 && (app?.status === 'rejected_pengda' || app?.status === 'rejected_pb');
  const canIssueKta = () => roleId === 4 && app?.status === 'approved_pb';

  const getApproveStatus = () => {
    if (roleId === 2) return 'approved_pengcab';
    if (roleId === 3) return 'approved_pengda';
    if (roleId === 4) return 'approved_pb';
    return '';
  };

  const getRejectStatus = () => {
    if (roleId === 2) return 'rejected_pengcab';
    if (roleId === 3) return 'rejected_pengda';
    if (roleId === 4) return 'rejected_pb';
    return 'rejected';
  };

  if (loading) return SPINNER;
  if (!app) return (
    <div className="bg-[#141620] rounded-2xl border border-white/[0.06] py-16 text-center">
      <i className="fas fa-exclamation-triangle text-gray-600 text-3xl mb-3" />
      <p className="text-sm text-gray-500 m-0">Data tidak ditemukan</p>
      <button onClick={onBack} className="mt-4 px-5 py-2 bg-white/[0.05] border border-white/[0.08] text-gray-400 text-xs font-semibold rounded-xl cursor-pointer hover:bg-white/[0.08] hover:text-white transition-all">
        <i className="fas fa-arrow-left mr-1.5" />Kembali
      </button>
    </div>
  );

  const s = STATUS_MAP[app.status] || { label: app.status, cls: 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20', icon: 'fa-question', color: 'gray' };
  const step = stepIndex(app.status);
  const isRej = app.status?.startsWith('rejected');

  return (
    <>
      {/* Back Button */}
      <button onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 mb-5 bg-white/[0.04] border border-white/[0.08] text-gray-400 text-xs font-semibold rounded-xl cursor-pointer hover:bg-white/[0.06] hover:text-white transition-all">
        <i className="fas fa-arrow-left text-[10px]" />Kembali ke Daftar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT COLUMN (2/3 width on large) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header Card */}
          <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className={`h-1.5 ${isRej ? 'bg-gradient-to-r from-red-500 to-rose-400' : app.status === 'kta_issued' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-500 to-sky-400'}`} />
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-white m-0 leading-tight">{app.club_name}</h2>
                  <div className="flex items-center gap-2 mt-1.5 text-[12px] text-gray-500">
                    <i className="fas fa-calendar-alt text-[10px]" />
                    {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {app.username && <span className="text-gray-600">· @{app.username}</span>}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 ${s.cls}`}>
                  <i className={`fas ${s.icon} text-[9px]`} />{s.label}
                </span>
              </div>

              {/* Vertical Progress Stepper */}
              {!isRej && (
                <div className="mt-5 pt-5 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <i className="fas fa-route text-emerald-400 text-[10px]" />
                    </div>
                    <span className="text-xs font-bold text-white">Tahapan Verifikasi</span>
                    <span className="ml-auto text-[10px] text-gray-500 font-semibold tabular-nums bg-white/[0.04] px-2 py-0.5 rounded-md">{Math.min(step + 1, 5)} / 5</span>
                  </div>
                  <div className="pl-1">
                    {PROGRESS_STEPS.map((ps, i) => {
                      const done = step >= i;
                      const isCurrent = step === i;
                      const isLast = i === PROGRESS_STEPS.length - 1;
                      return (
                        <div key={ps.key} className="flex gap-3.5 relative">
                          {!isLast && (
                            <div className="absolute left-[13px] top-[30px] bottom-0 w-[2px]">
                              <div className={`w-full h-full rounded-full ${done && step > i ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
                            </div>
                          )}
                          <div className="relative z-10 flex-shrink-0 pt-0.5">
                            <div className={`w-[28px] h-[28px] rounded-lg flex items-center justify-center transition-all
                              ${isCurrent ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-400/20' : done ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-[#1a1d2e] text-gray-600 ring-1 ring-white/[0.08]'}`}>
                              {done ? <i className={`fas ${isCurrent && app.status !== 'kta_issued' ? ps.icon : 'fa-check'} text-[10px]`} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                            </div>
                          </div>
                          <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
                            <div className={`text-[13px] font-bold leading-tight ${isCurrent ? 'text-white' : done ? 'text-gray-300' : 'text-gray-600'}`}>{ps.label}</div>
                            <div className={`text-[11px] mt-0.5 ${isCurrent ? 'text-emerald-400' : done ? 'text-gray-500' : 'text-gray-700'}`}>{ps.desc}</div>
                            {isCurrent && app.status !== 'kta_issued' && (
                              <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">Sedang diproses</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Alert */}
          {isRej && app.rejection_reason && (
            <div className="bg-[#141620] rounded-2xl border border-red-500/10 overflow-hidden">
              <div className="bg-red-500/[0.06] px-5 py-3.5 flex items-center gap-2.5 border-b border-red-500/10">
                <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-red-400 text-[10px]" />
                </div>
                <span className="text-xs font-bold text-red-400">Alasan Penolakan</span>
              </div>
              <div className="px-5 py-4">
                <p className="text-[13px] text-gray-300 m-0 leading-relaxed">{app.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* Info Detail */}
          <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <i className="fas fa-clipboard-list text-sky-400 text-[10px]" />
              </div>
              <span className="text-xs font-bold text-white">Informasi Klub</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {[
                { icon: 'fa-map-marker-alt', label: 'Provinsi',  value: app.province_name },
                { icon: 'fa-city',           label: 'Kota/Kab',  value: app.city_name },
                { icon: 'fa-user-tie',       label: 'Ketua',     value: app.leader_name },
                { icon: 'fa-futbol',         label: 'Pelatih',   value: app.coach_name },
                { icon: 'fa-user-shield',    label: 'Manajer',   value: app.manager_name },
                { icon: 'fa-school',         label: 'Sekolah',   value: app.school_name },
                { icon: 'fa-coins',          label: 'Nominal',   value: app.nominal_paid ? `Rp ${Number(app.nominal_paid).toLocaleString('id-ID')}` : null },
                { icon: 'fa-barcode',        label: 'Barcode ID', value: app.kta_barcode_unique_id },
              ].filter(f => f.value).map((f, i) => (
                <div key={f.label} className={`flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] ${i % 2 === 0 ? 'sm:border-r' : ''}`}>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <i className={`fas ${f.icon} text-gray-500 text-[11px]`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider leading-none">{f.label}</div>
                    <div className="text-[13px] text-gray-200 mt-0.5 truncate">{f.value}</div>
                  </div>
                </div>
              ))}
              {/* Full-width address */}
              {app.club_address && (
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] sm:col-span-2">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-home text-gray-500 text-[11px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider leading-none">Alamat</div>
                    <div className="text-[13px] text-gray-200 mt-0.5">{app.club_address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Logs */}
          {app.activity_logs?.length > 0 && (
            <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <i className="fas fa-history text-violet-400 text-[10px]" />
                </div>
                <span className="text-xs font-bold text-white">Riwayat Aktivitas</span>
              </div>
              <div className="p-4 space-y-3">
                {app.activity_logs.map((log, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {i < app.activity_logs.length - 1 && <div className="absolute left-[11px] top-[26px] bottom-0 w-[2px] bg-white/[0.04] rounded-full" />}
                    <div className="w-[24px] h-[24px] rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 relative z-10">
                      <i className="fas fa-circle text-gray-600 text-[5px]" />
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="text-[12px] font-semibold text-gray-300">{log.action}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {log.performed_by && <span className="text-gray-400">{log.performed_by}</span>}
                        {log.performed_by && ' · '}
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </div>
                      {log.notes && <div className="text-[11px] text-gray-500 mt-1 bg-white/[0.03] rounded-lg px-2.5 py-1.5 inline-block">{log.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (1/3 width on large) ── */}
        <div className="space-y-5">

          {/* Documents */}
          <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <i className="fas fa-folder-open text-amber-400 text-[10px]" />
              </div>
              <span className="text-xs font-bold text-white">Dokumen</span>
            </div>
            <div className="p-3 space-y-2">
              {[
                { path: app.sk_file_path,        label: 'SK Pendirian', icon: 'fa-file-alt',      bg: 'bg-blue-500/[0.08]',     border: 'border-blue-500/15',   text: 'text-blue-400',   hover: 'hover:bg-blue-500/[0.12]' },
                { path: app.logo_path,           label: 'Logo Klub',    icon: 'fa-image',         bg: 'bg-violet-500/[0.08]',   border: 'border-violet-500/15', text: 'text-violet-400', hover: 'hover:bg-violet-500/[0.12]' },
                { path: app.payment_proof_path,  label: 'Bukti Bayar',  icon: 'fa-receipt',       bg: 'bg-emerald-500/[0.08]',  border: 'border-emerald-500/15',text: 'text-emerald-400',hover: 'hover:bg-emerald-500/[0.12]' },
                { path: app.ad_file_path,        label: 'AD/ART',       icon: 'fa-file-contract', bg: 'bg-amber-500/[0.08]',    border: 'border-amber-500/15',  text: 'text-amber-400',  hover: 'hover:bg-amber-500/[0.12]' },
              ].filter(d => d.path).map(d => (
                <button key={d.label} type="button" onClick={() => setDocPreview({ show: true, url: `${API_BASE}/uploads/${d.path}`, title: d.label })}
                  className={`flex items-center gap-3 p-3 rounded-xl ${d.bg} border ${d.border} ${d.text} ${d.hover} transition-all group w-full text-left cursor-pointer`}>
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <i className={`fas ${d.icon} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate">{d.label}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">Klik untuk melihat</div>
                  </div>
                  <i className="fas fa-eye text-[9px] opacity-0 group-hover:opacity-60 transition-opacity" />
                </button>
              ))}
              {!app.sk_file_path && !app.logo_path && !app.payment_proof_path && !app.ad_file_path && (
                <div className="py-8 text-center text-gray-600 text-xs">Tidak ada dokumen</div>
              )}
            </div>
          </div>

          {/* KTA PDF Download */}
          {app.status === 'kta_issued' && app.generated_kta_file_path_pb && (
            <button type="button" onClick={() => setDocPreview({ show: true, url: `${API_BASE}/uploads/${app.generated_kta_file_path_pb}`, title: 'KTA PDF' })}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/[0.08] to-teal-500/[0.05] rounded-2xl border border-emerald-500/15 group hover:from-emerald-500/[0.12] hover:to-teal-500/[0.08] transition-all w-full text-left cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0 group-hover:scale-105 transition-transform">
                <i className="fas fa-eye text-white text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">Lihat KTA PDF</div>
                <div className="text-[11px] text-emerald-400/70 mt-0.5">Klik untuk preview kartu tanda anggota</div>
              </div>
              <i className="fas fa-chevron-right text-emerald-400/40 text-xs" />
            </button>
          )}

          {/* Action Buttons */}
          {(canApprove() || canIssueKta() || canResubmitToPengda()) && (
            <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <i className="fas fa-gavel text-blue-400 text-[10px]" />
                </div>
                <span className="text-xs font-bold text-white">Tindakan</span>
              </div>
              <div className="p-4 space-y-2.5">
                {canApprove() && (
                  <>
                    <button onClick={() => setModal({ open: true, action: 'approve', status: getApproveStatus() })}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl cursor-pointer font-semibold text-[13px] hover:bg-emerald-500/15 transition-all">
                      <i className="fas fa-check-circle" />
                      <span>Approve</span>
                    </button>
                    <button onClick={() => setModal({ open: true, action: 'reject', status: getRejectStatus() })}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl cursor-pointer font-semibold text-[13px] hover:bg-red-500/15 transition-all">
                      <i className="fas fa-times-circle" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
                {canResubmitToPengda() && (
                  <button onClick={() => setModal({ open: true, action: 'approve', status: 'resubmit_to_pengda' })}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl cursor-pointer font-semibold text-[13px] hover:bg-amber-500/15 transition-all">
                    <i className="fas fa-redo" />
                    <span>Ajukan Ulang ke Pengda</span>
                  </button>
                )}
                {canIssueKta() && (
                  <button onClick={() => setModal({ open: true, action: 'issue', status: 'kta_issued' })}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl cursor-pointer font-bold text-[13px] shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all border-none">
                    <i className="fas fa-id-card" />
                    <span>Terbitkan KTA</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reject Modal ── */}
      {modal.open && modal.action === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false, action: '', status: '' })}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[#1a1d2e] rounded-2xl border border-white/[0.08] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base m-0">Tolak Pengajuan</h3>
                  <p className="text-xs text-gray-500 m-0 mt-0.5">Pengajuan akan dikembalikan</p>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Alasan Penolakan *</label>
                <textarea
                  className="w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all resize-none"
                  rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleUpdateStatus(modal.status)} disabled={processing}
                  className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-red-400 transition-all disabled:opacity-50 border-none">
                  {processing ? <i className="fas fa-spinner fa-spin" /> : 'Tolak'}
                </button>
                <button onClick={() => { setModal({ open: false, action: '', status: '' }); setRejectReason(''); }}
                  className="flex-1 py-2.5 bg-white/[0.05] border border-white/[0.08] text-gray-400 text-sm font-semibold rounded-xl cursor-pointer hover:bg-white/[0.08] hover:text-white transition-all">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve / Issue Confirm Modal ── */}
      {modal.open && modal.action !== 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false, action: '', status: '' })}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[#1a1d2e] rounded-2xl border border-white/[0.08] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <i className={`fas ${modal.action === 'issue' ? 'fa-id-card' : 'fa-check-circle'} text-emerald-400 text-xl`} />
              </div>
              <h3 className="text-white font-bold text-base m-0">
                {modal.action === 'issue' ? 'Terbitkan KTA?' : modal.status === 'resubmit_to_pengda' ? 'Ajukan Ulang ke Pengda?' : 'Approve Pengajuan?'}
              </h3>
              <p className="text-sm text-gray-400 mt-2 mb-5">
                {modal.action === 'issue'
                  ? `KTA akan diterbitkan untuk ${app.club_name}.`
                  : modal.status === 'resubmit_to_pengda'
                    ? `Pengajuan ${app.club_name} akan diajukan ulang ke Pengda.`
                    : `Pengajuan dari ${app.club_name} akan di-approve.`}
              </p>
              <div className="flex gap-3">
                <button onClick={() => handleUpdateStatus(modal.status)} disabled={processing}
                  className="flex-1 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-emerald-400 transition-all disabled:opacity-50 border-none shadow-lg shadow-emerald-500/25">
                  {processing ? <i className="fas fa-spinner fa-spin" /> : 'Ya, Lanjutkan'}
                </button>
                <button onClick={() => setModal({ open: false, action: '', status: '' })}
                  className="flex-1 py-2.5 bg-white/[0.05] border border-white/[0.08] text-gray-400 text-sm font-semibold rounded-xl cursor-pointer hover:bg-white/[0.08] hover:text-white transition-all">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DocumentPreviewModal show={docPreview.show} url={docPreview.url} title={docPreview.title} onClose={() => setDocPreview({ show: false, url: '', title: '' })} />
    </>
  );
}
