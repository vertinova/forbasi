import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS_MAP = {
  pending:                 { cls: 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20', label: 'Pending', icon: 'fa-clock', color: 'amber' },
  approved_pengcab:        { cls: 'bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/20',       label: 'Approved Pengcab', icon: 'fa-check', color: 'sky' },
  approved_pengda:         { cls: 'bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/20',       label: 'Approved Pengda', icon: 'fa-check-double', color: 'sky' },
  approved_pb:             { cls: 'bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20', label: 'Approved PB', icon: 'fa-check-circle', color: 'emerald' },
  kta_issued:              { cls: 'bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20', label: 'KTA Terbit', icon: 'fa-id-card', color: 'emerald' },
  rejected_pengcab:        { cls: 'bg-red-400/10 text-red-400 ring-1 ring-red-400/20',       label: 'Ditolak Pengcab', icon: 'fa-times-circle', color: 'red' },
  rejected_pengda:         { cls: 'bg-red-400/10 text-red-400 ring-1 ring-red-400/20',       label: 'Ditolak Pengda', icon: 'fa-times-circle', color: 'red' },
  rejected_pb:             { cls: 'bg-red-400/10 text-red-400 ring-1 ring-red-400/20',       label: 'Ditolak PB', icon: 'fa-times-circle', color: 'red' },
  rejected:                { cls: 'bg-red-400/10 text-red-400 ring-1 ring-red-400/20',       label: 'Ditolak', icon: 'fa-times-circle', color: 'red' },
  resubmit_to_pengda:      { cls: 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20', label: 'Diajukan Ulang', icon: 'fa-redo', color: 'amber' },
  pending_pengda_resubmit: { cls: 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20', label: 'Re-review Pengda', icon: 'fa-sync', color: 'amber' },
};

const SPINNER = <div className="py-20 flex justify-center"><div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

/* ── Progress tracker steps ── */
const PROGRESS_STEPS = [
  { key: 'pending',          label: 'Pengajuan' },
  { key: 'approved_pengcab', label: 'Pengcab' },
  { key: 'approved_pengda',  label: 'Pengda' },
  { key: 'approved_pb',      label: 'PB' },
  { key: 'kta_issued',       label: 'Terbit' },
];
const stepIndex = (status) => {
  const map = { pending: 0, approved_pengcab: 1, approved_pengda: 2, approved_pb: 3, kta_issued: 4, resubmit_to_pengda: 2, pending_pengda_resubmit: 2 };
  return map[status] ?? -1;
};

export default function AnggotaDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    try {
      const { data } = await api.get('/kta/applications');
      setApplications(data.data.applications || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const latest = applications[0];

  const isKtaExpired = latest?.status === 'kta_issued' && latest?.kta_issued_at
    ? new Date() > new Date(`${new Date(latest.kta_issued_at).getFullYear()}-12-31T23:59:59`)
    : false;
  const hasIssued = latest?.status === 'kta_issued' && !isKtaExpired;
  const canSubmitKta = !latest || latest.status === 'rejected_pengcab' || isKtaExpired;
  const isRejected = latest?.status?.startsWith('rejected');
  const currentStep = stepIndex(latest?.status);

  const statusBadge = (status) => {
    const s = STATUS_MAP[status] || { cls: 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20', label: status, icon: 'fa-question' };
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.cls}`}><i className={`fas ${s.icon} text-[9px]`} />{s.label}</span>;
  };

  /* ─────────────────── TAB: HOME ─────────────────── */
  const TabDashboard = () => (
    <div className="space-y-4">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/[0.07] rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <img src="/logo-forbasi.png" alt="FORBASI" className="h-7 object-contain"
                onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<i class="fas fa-shield-alt text-white text-lg"></i>'; }} />
            </div>
            <div className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${hasIssued ? 'bg-white/25 text-white' : 'bg-white/15 text-white/80'}`}>
              {hasIssued ? '● AKTIF' : '○ BELUM AKTIF'}
            </div>
          </div>
          <p className="text-white/70 text-xs mb-0.5">Selamat Datang,</p>
          <h1 className="text-white text-xl font-bold m-0 leading-tight">
            {user?.club_name || user?.full_name || user?.username}
          </h1>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: applications.length, label: 'Pengajuan', icon: 'fa-paper-plane', from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/20' },
          { value: applications.filter(a => a.status === 'kta_issued').length, label: 'KTA Terbit', icon: 'fa-id-card', from: 'from-emerald-500', to: 'to-teal-500', shadow: 'shadow-emerald-500/20' },
        ].map(s => (
          <div key={s.label} className="bg-[#141620] rounded-2xl border border-white/[0.06] p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center shadow-lg ${s.shadow} flex-shrink-0`}>
                <i className={`fas ${s.icon} text-white text-sm`} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white leading-none">{s.value}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress tracker (if active application) */}
      {latest && !isRejected && currentStep >= 0 && (
        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-route text-emerald-400 text-xs" />
            <span className="text-xs font-semibold text-white">Progress KTA</span>
          </div>
          <div className="flex items-center justify-between relative">
            {/* connecting line */}
            <div className="absolute top-[14px] left-[20px] right-[20px] h-[2px] bg-white/[0.06]" />
            <div className="absolute top-[14px] left-[20px] h-[2px] bg-emerald-500 transition-all" style={{ width: `${(currentStep / (PROGRESS_STEPS.length - 1)) * 100}%`, maxWidth: 'calc(100% - 40px)' }} />
            {PROGRESS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                    ${active ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 scale-110' : done ? 'bg-emerald-500 text-white' : 'bg-[#1c1f2e] text-gray-500 ring-1 ring-white/[0.08]'}`}>
                    {done ? <i className="fas fa-check text-[9px]" /> : i + 1}
                  </div>
                  <span className={`text-[9px] mt-1.5 font-medium ${active ? 'text-emerald-400' : done ? 'text-gray-400' : 'text-gray-600'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest status card */}
      {latest && (
        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between p-4 pb-3">
            <span className="text-xs font-semibold text-white">Status Terbaru</span>
            {statusBadge(latest.status)}
          </div>
          <div className="px-4 pb-4">
            <div className="text-sm font-medium text-gray-200">{latest.club_name}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {new Date(latest.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          {latest.rejection_reason && (
            <div className="mx-4 mb-4 bg-red-400/10 ring-1 ring-red-400/20 rounded-xl p-3 text-xs text-red-400">
              <i className="fas fa-exclamation-circle mr-1.5" />{latest.rejection_reason}
            </div>
          )}
          {latest.status === 'kta_issued' && latest.generated_kta_file_path_pb && (
            <a href={`${API_BASE}/uploads/${latest.generated_kta_file_path_pb}`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3 border-t border-white/[0.06] text-xs font-semibold text-emerald-400 hover:bg-white/[0.02] transition-colors no-underline">
              <i className="fas fa-download text-[10px]" />Download KTA
            </a>
          )}
        </div>
      )}

      {/* Quick action cards */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveTab('kta-application')}
          className="group bg-[#141620] rounded-2xl border border-white/[0.06] p-4 text-left transition-all cursor-pointer font-[Poppins] active:scale-[0.97] hover:border-emerald-500/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3 group-hover:bg-emerald-500/25 transition-colors">
            <i className="fas fa-file-signature text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-white">Ajukan KTA</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Buat pengajuan baru</div>
        </button>
        <button onClick={() => setActiveTab('kta-tracking')}
          className="group bg-[#141620] rounded-2xl border border-white/[0.06] p-4 text-left transition-all cursor-pointer font-[Poppins] active:scale-[0.97] hover:border-sky-500/20">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center mb-3 group-hover:bg-sky-500/25 transition-colors">
            <i className="fas fa-location-arrow text-sky-400" />
          </div>
          <div className="text-sm font-semibold text-white">Tracking</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Pantau status KTA</div>
        </button>
      </div>
    </div>
  );

  /* ─────────────────── TAB: AJUKAN KTA ─────────────────── */
  const TabKtaApplication = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => setActiveTab('dashboard')}
          className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer">
          <i className="fas fa-arrow-left text-xs" />
        </button>
        <h2 className="text-lg font-bold text-white m-0">Ajukan KTA</h2>
      </div>

      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="p-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-file-signature text-emerald-400 text-xl" />
          </div>
          <p className="text-sm text-gray-400 text-center mb-5 leading-relaxed">
            {canSubmitKta
              ? (latest?.status === 'rejected_pengcab' ? 'Pengajuan sebelumnya ditolak Pengcab. Silakan ajukan ulang.' : isKtaExpired ? 'KTA Anda telah kedaluwarsa. Silakan perpanjang.' : 'Isi formulir pengajuan Kartu Tanda Anggota FORBASI.')
              : `Pengajuan sedang diproses (${STATUS_MAP[latest?.status]?.label || latest?.status}).`}
          </p>
          {canSubmitKta ? (
            <button
              onClick={() => navigate('/anggota/kta/submit')}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold text-sm transition-all border-none cursor-pointer font-[Poppins] shadow-lg shadow-emerald-500/20">
              <i className="fas fa-plus mr-2" />{latest?.status === 'rejected_pengcab' || isKtaExpired ? 'Ajukan Ulang KTA' : 'Buat Pengajuan Baru'}
            </button>
          ) : (
            <div className="bg-amber-400/10 ring-1 ring-amber-400/20 rounded-xl p-3.5 text-sm text-amber-400 text-center">
              <i className="fas fa-hourglass-half mr-2" />Sedang diproses. Pantau di Tracking.
            </div>
          )}
        </div>
      </div>

      {/* Rejection reasons */}
      {latest?.status === 'rejected_pengcab' && (
        <div className="bg-[#141620] rounded-2xl border border-red-400/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-400/15 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-times-circle text-red-400 text-[10px]" />
            </div>
            <span className="text-xs font-semibold text-red-400">Ditolak Pengcab</span>
          </div>
          <p className="text-sm text-gray-400 m-0 leading-relaxed">{latest.rejection_reason || latest.notes_pengcab || 'Tidak ada alasan spesifik.'}</p>
        </div>
      )}
      {latest?.status === 'rejected_pengda' && (
        <div className="bg-[#141620] rounded-2xl border border-orange-400/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-400/15 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-orange-400 text-[10px]" />
            </div>
            <span className="text-xs font-semibold text-orange-400">Ditolak Pengda</span>
          </div>
          <p className="text-sm text-gray-400 m-0 leading-relaxed">{latest.notes_pengda || latest.rejection_reason || 'Tidak ada alasan spesifik.'}</p>
          <div className="text-[11px] text-amber-400/80 bg-amber-400/5 rounded-lg p-2">
            <i className="fas fa-info-circle mr-1" />Dikembalikan ke Pengcab untuk ditindaklanjuti.
          </div>
        </div>
      )}
      {latest?.status === 'rejected_pb' && (
        <div className="bg-[#141620] rounded-2xl border border-red-400/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-400/15 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-ban text-red-400 text-[10px]" />
            </div>
            <span className="text-xs font-semibold text-red-400">Ditolak PB</span>
          </div>
          <p className="text-sm text-gray-400 m-0 leading-relaxed">{latest.rejection_reason || latest.notes_pb || 'Tidak ada alasan spesifik.'}</p>
        </div>
      )}
    </div>
  );

  /* ─────────────────── TAB: TRACKING ─────────────────── */
  const TabKtaTracking = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('dashboard')}
            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer">
            <i className="fas fa-arrow-left text-xs" />
          </button>
          <h2 className="text-lg font-bold text-white m-0">Tracking KTA</h2>
        </div>
        <span className="text-[11px] text-gray-500 bg-white/[0.05] px-2.5 py-1 rounded-full">{applications.length}</span>
      </div>

      {loading ? SPINNER : applications.length === 0 ? (
        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-inbox text-gray-600 text-2xl" />
          </div>
          <div className="text-sm text-gray-500">Belum ada pengajuan</div>
          <button onClick={() => setActiveTab('kta-application')}
            className="mt-4 px-5 py-2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl cursor-pointer font-[Poppins] transition-all hover:bg-emerald-500/25">
            <i className="fas fa-plus mr-1.5" />Ajukan Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{app.club_name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {app.coach_name && <span className="text-gray-600"> · {app.coach_name}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0">{statusBadge(app.status)}</div>
                </div>
              </div>
              <div className="flex border-t border-white/[0.04]">
                <button
                  onClick={() => navigate(`/anggota/kta/${app.id}`)}
                  className="flex-1 py-2.5 text-[11px] font-semibold text-sky-400 hover:bg-white/[0.02] transition-colors cursor-pointer bg-transparent border-none font-[Poppins]">
                  <i className="fas fa-eye mr-1.5 text-[9px]" />Detail
                </button>
                {app.status === 'kta_issued' && app.generated_kta_file_path_pb && (
                  <a href={`${API_BASE}/uploads/${app.generated_kta_file_path_pb}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 py-2.5 text-[11px] font-semibold text-emerald-400 hover:bg-white/[0.02] transition-colors text-center no-underline border-l border-white/[0.04]">
                    <i className="fas fa-download mr-1.5 text-[9px]" />Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ─────────────────── TAB: PROFIL ─────────────────── */
  const TabProfile = () => (
    <div className="space-y-4">
      {/* Profile hero */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600/20 to-teal-500/20 px-5 pt-6 pb-10 text-center relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
          <div className="w-20 h-20 rounded-2xl bg-[#141620] border-4 border-[#0a0b11] mx-auto flex items-center justify-center relative z-10">
            <i className="fas fa-user text-emerald-400 text-2xl" />
          </div>
        </div>
        <div className="-mt-4 px-5 pb-5 text-center">
          <h3 className="text-white font-bold text-lg m-0">{user?.club_name || user?.username}</h3>
          <span className="inline-flex items-center gap-1 mt-1.5 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-bold ring-1 ring-emerald-400/20">
            <i className="fas fa-shield-alt text-[8px]" />ANGGOTA FORBASI
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
        {[
          { icon: 'fa-envelope', label: 'Email', value: user?.email || '-' },
          { icon: 'fa-phone-alt', label: 'Telepon', value: user?.phone || '-' },
          { icon: 'fa-map-marker-alt', label: 'Alamat', value: user?.address || '-' },
        ].map((f, i) => (
          <div key={f.icon} className={`flex items-center gap-3.5 px-5 py-3.5 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
              <i className={`fas ${f.icon} text-gray-400 text-xs`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{f.label}</div>
              <div className="text-sm text-gray-200 truncate mt-0.5">{f.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3.5 bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 text-gray-400 hover:text-red-400 rounded-2xl font-semibold text-sm transition-all cursor-pointer font-[Poppins]">
        <i className="fas fa-sign-out-alt mr-2" />Keluar
      </button>
    </div>
  );

  const TABS = [
    { id: 'dashboard',        icon: 'fa-home',           label: 'Home' },
    { id: 'kta-application',  icon: 'fa-file-signature', label: 'Ajukan' },
    { id: 'kta-tracking',     icon: 'fa-location-arrow', label: 'Tracking' },
    { id: 'profile',          icon: 'fa-user',           label: 'Profil' },
  ];

  const renderTab = () => {
    if (loading && activeTab !== 'dashboard') return SPINNER;
    switch (activeTab) {
      case 'dashboard': return <TabDashboard />;
      case 'kta-application': return <TabKtaApplication />;
      case 'kta-tracking': return <TabKtaTracking />;
      case 'profile': return <TabProfile />;
      default: return <TabDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b11]">
      {/* Main content with safe bottom padding for nav */}
      <div className="max-w-lg mx-auto px-4 pt-3 pb-28">
        {renderTab()}
      </div>

      {/* ── BOTTOM NAVIGATION ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-[#141620]/95 backdrop-blur-xl border-t border-white/[0.06]"
          style={{ borderTopLeftRadius: '1.25rem', borderTopRightRadius: '1.25rem' }}>
          {/* Safe area spacer for notch phones */}
          <div className="flex justify-around max-w-lg mx-auto pt-2 pb-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center min-w-[4rem] py-1.5 border-none bg-transparent cursor-pointer font-[Poppins] transition-all
                    ${isActive ? 'text-emerald-400' : 'text-gray-600 active:text-gray-400'}`}>
                  <div className={`w-10 h-7 rounded-xl flex items-center justify-center mb-0.5 transition-colors
                    ${isActive ? 'bg-emerald-500/15' : 'bg-transparent'}`}>
                    <i className={`fas ${tab.icon} text-[15px]`} />
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-emerald-400' : 'text-gray-600'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

