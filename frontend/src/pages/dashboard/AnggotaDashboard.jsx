import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  pending:                 { cls: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  approved_pengcab:        { cls: 'bg-blue-100 text-blue-800',   label: 'Approved Pengcab' },
  approved_pengda:         { cls: 'bg-blue-100 text-blue-800',   label: 'Approved Pengda' },
  approved_pb:             { cls: 'bg-green-100 text-green-800', label: 'Approved PB' },
  kta_issued:              { cls: 'bg-green-100 text-green-800', label: 'KTA Terbit' },
  rejected_pengcab:        { cls: 'bg-red-100 text-red-800',    label: 'Ditolak Pengcab' },
  rejected_pengda:         { cls: 'bg-red-100 text-red-800',    label: 'Ditolak Pengda' },
  rejected_pb:             { cls: 'bg-red-100 text-red-800',    label: 'Ditolak PB' },
  rejected:                { cls: 'bg-red-100 text-red-800',    label: 'Ditolak' },
  resubmit_to_pengda:      { cls: 'bg-yellow-100 text-yellow-800', label: 'Diajukan Ulang' },
  pending_pengda_resubmit: { cls: 'bg-yellow-100 text-yellow-800', label: 'Re-review Pengda' },
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

  // Determine if user can submit/resubmit KTA (mirrors PHP can_submit_kta logic)
  const ACTIVE_STATUSES = ['pending', 'approved_pengcab', 'approved_pengda', 'approved_pb', 'rejected_pengda', 'rejected_pb', 'resubmit_to_pengda', 'pending_pengda_resubmit'];
  const isKtaExpired = latest?.status === 'kta_issued' && latest?.kta_issued_at
    ? new Date() > new Date(`${new Date(latest.kta_issued_at).getFullYear()}-12-31T23:59:59`)
    : false;
  // PHP: hasIssued = latest is 'kta_issued' AND not yet past 31 Dec of issued year
  const hasIssued = latest?.status === 'kta_issued' && !isKtaExpired;
  const canSubmitKta = !latest || latest.status === 'rejected_pengcab' || isKtaExpired;

  const statusBadge = (status) => {
    const s = STATUS_MAP[status] || { cls: 'bg-gray-100 text-gray-700', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  /* ── TAB: DASHBOARD ── */
  const TabDashboard = () => (
    <div>
      {/* Welcome header */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 flex justify-between items-center gap-3">
        <div>
          <div className="text-gray-400 text-sm">Selamat Datang,</div>
          <div className="text-xl font-semibold text-gray-800 mt-0.5">
            {user?.club_name || user?.full_name || user?.username}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Status Keanggotaan:{' '}
            <span className={hasIssued ? 'text-[#28a745] font-medium' : 'text-yellow-600 font-medium'}>
              {hasIssued ? 'Aktif' : 'Belum Aktif'}
            </span>
          </div>
        </div>
        <img src="/logo-forbasi.png" alt="FORBASI" className="h-14 object-contain"
          onError={e => e.target.style.display = 'none'} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-[#1d3557]">{applications.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Pengajuan</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-[#28a745]">
            {applications.filter(a => a.status === 'kta_issued').length}
          </div>
          <div className="text-xs text-gray-500 mt-1">KTA Terbit</div>
        </div>
      </div>

      {/* Latest KTA status */}
      {latest && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            <i className="fas fa-id-card mr-2 text-[#28a745]" />Status KTA Terbaru
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-800">{latest.club_name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(latest.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            {statusBadge(latest.status)}
          </div>
          {latest.rejection_reason && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
              <i className="fas fa-exclamation-triangle mr-1" />
              Alasan: {latest.rejection_reason}
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveTab('kta-application')}
          className="bg-[#28a745] hover:bg-[#1e7e34] text-white rounded-xl p-4 text-center transition-all border-none cursor-pointer font-[Poppins] active:scale-95">
          <i className="fas fa-file-signature text-xl mb-2 block" />
          <div className="text-sm font-medium">Ajukan KTA</div>
        </button>
        <button onClick={() => setActiveTab('kta-tracking')}
          className="bg-[#1d3557] hover:bg-[#122a44] text-white rounded-xl p-4 text-center transition-all border-none cursor-pointer font-[Poppins] active:scale-95">
          <i className="fas fa-location-arrow text-xl mb-2 block" />
          <div className="text-sm font-medium">Tracking KTA</div>
        </button>
      </div>
    </div>
  );

  /* ── TAB: AJUKAN KTA ── */
  const TabKtaApplication = () => (
    <div>
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-1">
          <i className="fas fa-file-signature mr-2 text-[#28a745]" />Ajukan KTA
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {canSubmitKta
            ? (latest?.status === 'rejected_pengcab' ? 'Pengajuan Anda sebelumnya ditolak Pengcab. Silakan ajukan ulang.' : isKtaExpired ? 'KTA Anda telah kedaluwarsa. Silakan ajukan perpanjangan.' : 'Isi formulir pengajuan Kartu Tanda Anggota FORBASI.')
            : `Pengajuan KTA Anda sedang dalam proses (${STATUS_MAP[latest?.status]?.label || latest?.status}). Tidak dapat mengajukan baru.`}
        </p>
        {canSubmitKta ? (
          <button
            onClick={() => navigate('/anggota/kta/submit')}
            className="w-full py-3 bg-[#28a745] hover:bg-[#1e7e34] text-white rounded-xl font-semibold text-sm transition-all border-none cursor-pointer font-[Poppins]">
            <i className="fas fa-plus mr-2" />{latest?.status === 'rejected_pengcab' || isKtaExpired ? 'Ajukan Ulang KTA' : 'Buat Pengajuan Baru'}
          </button>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
            <i className="fas fa-info-circle mr-2" />
            Pengajuan Anda sedang diproses. Silakan pantau di tab <strong>Tracking</strong>.
          </div>
        )}
      </div>
      {latest?.status === 'rejected_pengcab' && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm font-semibold text-red-700 mb-2">
            <i className="fas fa-exclamation-triangle mr-2" />Alasan Penolakan Pengcab
          </div>
          <p className="text-sm text-gray-600">{latest.rejection_reason || latest.notes_pengcab || 'Tidak ada alasan spesifik dari Pengurus Cabang.'}</p>
        </div>
      )}
      {latest?.status === 'rejected_pengda' && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm font-semibold text-orange-700 mb-2">
            <i className="fas fa-exclamation-triangle mr-2" />Ditolak Pengurus Daerah
          </div>
          <p className="text-sm text-gray-600">{latest.notes_pengda || latest.rejection_reason || 'Tidak ada alasan spesifik dari Pengurus Daerah.'}</p>
          <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2">
            <i className="fas fa-info-circle mr-1" />Pengajuan Anda dikembalikan ke Pengurus Cabang untuk ditindaklanjuti.
          </div>
        </div>
      )}
      {latest?.status === 'rejected_pb' && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm font-semibold text-red-700 mb-2">
            <i className="fas fa-exclamation-triangle mr-2" />Ditolak Pengurus Besar
          </div>
          <p className="text-sm text-gray-600">{latest.rejection_reason || latest.notes_pb || 'Tidak ada alasan spesifik. Pengajuan Anda sedang dievaluasi ulang oleh Pengda.'}</p>
        </div>
      )}
    </div>
  );

  /* ── TAB: TRACKING ── */
  const TabKtaTracking = () => (
    <div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#1d3557] px-5 py-4 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-white m-0">
            <i className="fas fa-location-arrow mr-2" />Tracking KTA
          </h2>
          <span className="text-xs text-white/70">{applications.length} pengajuan</span>
        </div>
        {loading ? <LoadingSpinner /> : applications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-file-alt text-4xl mb-3 block" />
            <div className="text-sm">Belum ada pengajuan</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((app) => (
              <div key={app.id} className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm truncate">{app.club_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(app.created_at).toLocaleDateString('id-ID')}
                      {app.coach_name && ` · ${app.coach_name}`}
                    </div>
                  </div>
                  <div className="flex-shrink-0">{statusBadge(app.status)}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/anggota/kta/${app.id}`)}
                    className="flex-1 py-1.5 text-xs bg-[#17a2b8] hover:bg-[#138496] text-white rounded-lg border-none cursor-pointer font-[Poppins] transition-colors">
                    <i className="fas fa-eye mr-1" />Detail
                  </button>
                  {app.status === 'kta_issued' && app.generated_kta_file_path_pb && (
                    <a href={`${import.meta.env.VITE_API_URL?.replace('/api','')}/uploads/${app.generated_kta_file_path_pb}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 py-1.5 text-xs bg-[#28a745] hover:bg-[#1e7e34] text-white rounded-lg text-center transition-colors">
                      <i className="fas fa-download mr-1" />Download KTA
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ── TAB: PROFIL ── */
  const TabProfile = () => (
    <div>
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center text-[#28a745] text-2xl flex-shrink-0">
            <i className="fas fa-user-circle" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">{user?.club_name || user?.username}</div>
            <div className="text-sm text-gray-500">{user?.email || '-'}</div>
            <div className="text-xs text-[#28a745] font-medium mt-0.5">Anggota FORBASI</div>
          </div>
        </div>
        <div className="divide-y divide-gray-100 text-sm">
          {[
            { icon: 'fa-envelope', label: 'Email', value: user?.email || '-' },
            { icon: 'fa-phone', label: 'Telepon', value: user?.phone || '-' },
            { icon: 'fa-map-marker-alt', label: 'Alamat', value: user?.address || '-' },
          ].map(f => (
            <div key={f.icon} className="flex gap-3 py-2.5">
              <i className={`fas ${f.icon} text-[#28a745] mt-0.5 w-4`} />
              <div>
                <div className="text-xs text-gray-400">{f.label}</div>
                <div className="text-gray-700">{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleLogout}
        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all border-none cursor-pointer font-[Poppins]">
        <i className="fas fa-sign-out-alt mr-2" />Keluar
      </button>
    </div>
  );

  const TABS = [
    { id: 'dashboard',        icon: 'fa-home',         label: 'Home',     content: <TabDashboard /> },
    { id: 'kta-application',  icon: 'fa-file-signature', label: 'Ajukan KTA', content: <TabKtaApplication /> },
    { id: 'kta-tracking',     icon: 'fa-location-arrow', label: 'Tracking', content: <TabKtaTracking /> },
    { id: 'profile',          icon: 'fa-user-circle',  label: 'Profil',   content: <TabProfile /> },
  ];

  const activeContent = TABS.find(t => t.id === activeTab)?.content;

  return (
    <div className="min-h-screen bg-[#f1faee] pb-24">
      {/* Main content */}
      <div className="max-w-xl mx-auto px-4 pt-4">
        {loading && activeTab !== 'dashboard' ? <LoadingSpinner /> : activeContent}
      </div>

      {/* ── BOTTOM NAVIGATION ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-90"
        style={{
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          boxShadow: '0 -5px 25px rgba(0,0,0,0.08)'
        }}>
        <div className="flex justify-around max-w-xl mx-auto py-3">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center text-xs font-medium transition-all py-1 px-3 border-none bg-transparent cursor-pointer font-[Poppins] relative
                ${activeTab === tab.id ? 'text-[#28a745]' : 'text-gray-400 hover:text-gray-600'}`}>
              {activeTab === tab.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-[#28a745] rounded-full" />
              )}
              <i className={`fas ${tab.icon} text-xl mb-1 transition-transform ${activeTab === tab.id ? '-translate-y-1' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

