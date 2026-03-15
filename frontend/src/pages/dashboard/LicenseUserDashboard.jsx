import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS = {
  pending:  { label: 'Pending',  bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/20',   dot: 'bg-amber-500' },
  proses:   { label: 'Diproses', bg: 'bg-blue-500/10',    text: 'text-blue-400',    ring: 'ring-blue-500/20',    dot: 'bg-blue-500' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',  bg: 'bg-red-500/10',     text: 'text-red-400',     ring: 'ring-red-500/20',     dot: 'bg-red-500' },
};

const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';

// Pricing will be loaded from config — fallback defaults
const DEFAULT_PRICING = {
  pelatih: { tanpa_kamar: 750000, dengan_kamar: 1000000 },
  juri: { tanpa_kamar: 2000000, dengan_kamar: 2250000 },
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const isPelatih = type?.toLowerCase().includes('pelatih');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ${
      isPelatih 
        ? 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20' 
        : 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20'
    }`}>
      <i className={`fas ${isPelatih ? 'fa-bullhorn' : 'fa-gavel'} text-[9px]`} />
      {type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

// File Upload Field Component
const FileUploadField = ({ label, sublabel, required, icon, file, onChange, activeTab }) => {
  const colorClass = activeTab === 'pelatih' ? 'orange' : 'violet';
  const hasFile = !!file;
  
  return (
    <div className={`relative rounded-xl border transition-all ${
      hasFile 
        ? `bg-${colorClass}-500/5 border-${colorClass}-500/30` 
        : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'
    }`}>
      <div className="p-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          hasFile 
            ? activeTab === 'pelatih' ? 'bg-orange-500/20' : 'bg-violet-500/20'
            : 'bg-white/[0.05]'
        }`}>
          <i className={`fas ${icon} ${
            hasFile 
              ? activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'
              : 'text-gray-500'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-white font-medium">{label}</span>
            {required && <span className="text-red-400 text-xs">*</span>}
          </div>
          {sublabel && <p className="m-0 text-[10px] text-gray-500 truncate">{sublabel}</p>}
          {hasFile && (
            <p className={`m-0 text-[11px] mt-1 font-medium truncate ${
              activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'
            }`}>
              <i className="fas fa-check-circle mr-1" />
              {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasFile && (
            <button 
              type="button"
              onClick={() => onChange(null)}
              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors border-none cursor-pointer"
            >
              <i className="fas fa-trash-alt text-xs" />
            </button>
          )}
          <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium cursor-pointer transition-all ${
            hasFile 
              ? 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08]'
              : activeTab === 'pelatih' 
                ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
          }`}>
            <i className={`fas ${hasFile ? 'fa-sync-alt' : 'fa-upload'} text-[10px]`} />
            {hasFile ? 'Ganti' : 'Upload'}
            <input 
              type="file" 
              accept=".jpg,.jpeg,.png,.pdf" 
              onChange={e => onChange(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default function LicenseUserDashboard() {
  const { user } = useAuth();
  const activeTab = user?.role === 'juri' ? 'juri' : 'pelatih';
  const [activeSection, setActiveSection] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    license_type: '', 
    juri_type: '', // 'muda' or 'madya'
    akomodasi: 'tanpa_kamar', 
    notes: '' 
  });
  // Multiple files for different requirements
  const [files, setFiles] = useState({
    pas_foto: null,
    surat_pengalaman: null,
    sertifikat_tot: null,
    surat_rekomendasi: null,
    bukti_transfer: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [licenseConfigs, setLicenseConfigs] = useState({});

  // Dynamic pricing from config
  const PRICING = {
    pelatih: {
      tanpa_kamar: Number(licenseConfigs.pelatih?.harga_tanpa_kamar) || DEFAULT_PRICING.pelatih.tanpa_kamar,
      dengan_kamar: Number(licenseConfigs.pelatih?.harga_dengan_kamar) || DEFAULT_PRICING.pelatih.dengan_kamar,
    },
    juri: {
      tanpa_kamar: Number(licenseConfigs.juri_muda?.harga_tanpa_kamar) || DEFAULT_PRICING.juri.tanpa_kamar,
      dengan_kamar: Number(licenseConfigs.juri_muda?.harga_dengan_kamar) || DEFAULT_PRICING.juri.dengan_kamar,
    },
  };

  useEffect(() => { fetchApplications(); fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/license/configs');
      const map = {};
      (res.data.data || []).forEach(c => { map[c.jenis_lisensi] = c; });
      setLicenseConfigs(map);
    } catch {}
  };

  // Reset form when section changes
  useEffect(() => {
    setFormData({ license_type: '', juri_type: '', akomodasi: 'tanpa_kamar', notes: '' });
    setFiles({ pas_foto: null, surat_pengalaman: null, sertifikat_tot: null, surat_rekomendasi: null, bukti_transfer: null });
  }, [activeSection]);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/license/my-applications');
      setApplications(res.data.data || []);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleFileChange = (fieldName, file) => {
    setFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const licenseType = activeTab === 'pelatih' ? 'pelatih' : `juri_${formData.juri_type}`;
    
    if (activeTab === 'juri') {
      if (!formData.juri_type) return toast.error('Pilih jenis juri');
      if (!files.pas_foto) return toast.error('Upload Pas Foto 4x6 wajib diisi');
      if (!files.bukti_transfer) return toast.error('Upload Bukti Transfer wajib diisi');
    } else {
      // Pelatih - semua dokumen persyaratan wajib
      if (!files.pas_foto) return toast.error('Upload Pas Foto 4x6 wajib diisi');
      if (!files.surat_pengalaman) return toast.error('Upload Surat Keterangan Pengalaman wajib diisi');
      if (!files.surat_rekomendasi) return toast.error('Upload Surat Rekomendasi Pengda wajib diisi');
      if (!files.bukti_transfer) return toast.error('Upload Bukti Transfer wajib diisi');
    }
    
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('license_type', licenseType);
      fd.append('akomodasi', formData.akomodasi);
      fd.append('notes', formData.notes);
      // Append all files
      if (files.pas_foto) fd.append('pas_foto', files.pas_foto);
      if (files.surat_pengalaman) fd.append('surat_pengalaman', files.surat_pengalaman);
      if (files.sertifikat_tot) fd.append('sertifikat_tot', files.sertifikat_tot);
      if (files.surat_rekomendasi) fd.append('surat_rekomendasi', files.surat_rekomendasi);
      if (files.bukti_transfer) fd.append('bukti_transfer', files.bukti_transfer);
      
      await api.post('/license/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pengajuan lisensi berhasil dikirim');
      setShowForm(false); 
      setFormData({ license_type: '', juri_type: '', akomodasi: 'tanpa_kamar', notes: '' }); 
      setFiles({ pas_foto: null, surat_pengalaman: null, sertifikat_tot: null, surat_rekomendasi: null, bukti_transfer: null });
      fetchApplications();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengirim'); }
    finally { setSubmitting(false); }
  };

  const getCurrentPrice = () => {
    const category = activeTab === 'pelatih' ? 'pelatih' : 'juri';
    return PRICING[category][formData.akomodasi];
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    pelatih: applications.filter(a => a.license_type?.toLowerCase().includes('pelatih')).length,
    juri: applications.filter(a => a.license_type?.toLowerCase().includes('juri')).length,
  };

  const SECTIONS = [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { key: 'ajukan',    label: 'Ajukan Lisensi', icon: 'fa-plus-circle' },
    { key: 'riwayat',   label: 'Riwayat Pengajuan', icon: 'fa-history' },
    { divider: true, dividerLabel: 'Akun' },
    { key: 'profil',    label: 'Profil', icon: 'fa-user-cog' },
  ];

  const menuItems = SECTIONS.map(s => {
    if (s.divider) return s;
    return {
      label: s.label,
      icon: <i className={`fas ${s.icon}`} />,
      onClick: () => { setActiveSection(s.key); if (s.key === 'ajukan') setShowForm(true); },
      active: activeSection === s.key,
      badge: s.key === 'riwayat' && stats.pending > 0 ? stats.pending : null,
    };
  });

  /* ── Role Badge Component ── */
  const RoleBadge = ({ className = '' }) => (
    <div className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl border ${className} ${
      activeTab === 'pelatih'
        ? 'bg-gradient-to-br from-orange-500/10 to-amber-600/5 border-orange-500/30'
        : 'bg-gradient-to-br from-violet-500/10 to-purple-600/5 border-violet-500/30'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        activeTab === 'pelatih' ? 'bg-orange-500/20' : 'bg-violet-500/20'
      }`}>
        <i className={`fas ${activeTab === 'pelatih' ? 'fa-bullhorn' : 'fa-gavel'} text-sm ${
          activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'
        }`} />
      </div>
      <div className="text-left">
        <div className={`text-sm font-semibold ${activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'}`}>
          Lisensi {activeTab === 'pelatih' ? 'Pelatih' : 'Juri'}
        </div>
        <div className="text-[10px] text-gray-500">
          Terdaftar sebagai {activeTab === 'pelatih' ? 'Pelatih' : 'Juri'}
        </div>
      </div>
    </div>
  );

  /* ── Dashboard Section ── */
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl border border-white/[0.06]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/15 to-purple-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <i className="fas fa-id-card-alt text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white m-0">Dashboard Lisensi</h2>
                <p className="text-gray-400 text-sm m-0">
                  Terdaftar sebagai <span className={activeTab === 'pelatih' ? 'text-orange-400 font-semibold' : 'text-violet-400 font-semibold'}>{activeTab === 'pelatih' ? 'Pelatih' : 'Juri'}</span>
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => { setActiveSection('ajukan'); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all border-none cursor-pointer whitespace-nowrap">
            <i className="fas fa-plus" /> Ajukan Lisensi
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pengajuan', value: stats.total, icon: 'fa-file-alt', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
          { label: 'Menunggu Proses', value: stats.pending, icon: 'fa-clock', gradient: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
          { label: 'Disetujui', value: stats.approved, icon: 'fa-check-circle', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
        ].map(c => (
          <div key={c.label} className="group bg-[#141620] rounded-2xl border border-white/[0.06] p-5 hover:bg-[#191c28] hover:border-white/[0.1] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-white m-0 leading-tight">{c.value}</p>
                <p className="text-[11px] text-gray-500 m-0 mt-1 font-medium">{c.label}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg ${c.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <i className={`fas ${c.icon} text-white`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* License Type Info - Single card based on user role */}
      <div className="max-w-lg mx-auto">

      {/* Approved License — Congratulations + QR Code */}
      {(() => {
        const approvedApps = applications.filter(a => a.status === 'approved');
        if (approvedApps.length === 0) return null;
        return approvedApps.map(app => {
          const jenis = app.license_type || app.jenis_lisensi || '';
          const config = licenseConfigs[jenis] || licenseConfigs[jenis === 'pelatih' ? 'pelatih' : jenis];
          const formatJenis = { pelatih: 'Pelatih', juri_muda: 'Juri Muda', juri_madya: 'Juri Madya' }[jenis] || jenis;
          const isPelatih = jenis === 'pelatih';
          return (
            <div key={app.id} className={`mb-5 rounded-2xl border overflow-hidden ${
              isPelatih ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5' : 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-violet-500/5'
            }`}>
              {/* Congrats Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-emerald-500/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <i className="fas fa-trophy text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="m-0 text-base font-bold text-emerald-400">Selamat! 🎉</h3>
                    <p className="m-0 text-[11px] text-gray-500">Pengajuan lisensi Anda telah disetujui</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-sm text-gray-200 m-0 leading-relaxed">
                    Selamat, Anda bisa mengikuti <strong className="text-emerald-400">Lisensi {formatJenis}</strong>
                    {config?.tempat && <> yang bertempat di <strong className="text-white">{config.tempat}</strong></>}
                    {config?.tanggal_mulai && <> pada tanggal <strong className="text-white">{new Date(config.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>}
                    {config?.tanggal_selesai && <> s/d <strong className="text-white">{new Date(config.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>}
                    .
                  </p>
                  {config?.nama_kegiatan && (
                    <p className="text-xs text-gray-400 m-0 mt-2"><i className="fas fa-info-circle mr-1" />{config.nama_kegiatan}</p>
                  )}
                </div>
              </div>
              {/* QR Code Section */}
              {app.qr_code_path && (
                <div className="px-6 py-5">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="flex-shrink-0 p-3 bg-white rounded-2xl shadow-lg">
                      <img src={`${API_BASE}/uploads/${app.qr_code_path}`} alt="QR Code" className="w-36 h-36 object-contain" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h4 className="m-0 text-sm font-bold text-white mb-1">QR Code Tiket Masuk</h4>
                      <p className="text-xs text-gray-400 m-0 mb-4">
                        Download dan tunjukkan QR code ini saat memasuki venue. QR code ini berfungsi sebagai tiket masuk Anda.
                      </p>
                      <a href={`${API_BASE}/uploads/${app.qr_code_path}`} download={`QR_Lisensi_${formatJenis}.png`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] transition-all no-underline cursor-pointer">
                        <i className="fas fa-download" /> Download QR Code
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        });
      })()}

      {/* License Type Info */}
        {activeTab === 'pelatih' ? (
          <div className="bg-gradient-to-br from-[#1a1c2a] to-[#141620] rounded-2xl border border-orange-500/20 overflow-hidden hover:border-orange-500/40 transition-all duration-300">
            <div className="px-5 py-4 bg-gradient-to-r from-orange-500/10 to-transparent border-b border-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <i className="fas fa-bullhorn text-white text-lg" />
                </div>
                <div>
                  <h3 className="m-0 text-base font-bold text-white">Lisensi Pelatih</h3>
                  <p className="m-0 text-[11px] text-orange-400/80">1 Jenis Lisensi Tersedia</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <i className="fas fa-certificate text-orange-400 text-sm" />
                  </div>
                  <span className="text-sm text-white font-medium">Pelatih</span>
                </div>
                <i className="fas fa-check-circle text-orange-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Tanpa Kamar</span>
                  <span className="text-white font-semibold">{formatCurrency(PRICING.pelatih.tanpa_kamar)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Dengan Kamar</span>
                  <span className="text-white font-semibold">{formatCurrency(PRICING.pelatih.dengan_kamar)}</span>
                </div>
              </div>
              <button onClick={() => { setActiveSection('ajukan'); setShowForm(true); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-500 active:scale-[0.98] transition-all border-none cursor-pointer">
                <i className="fas fa-arrow-right" /> Ajukan Lisensi Pelatih
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#1a1c2a] to-[#141620] rounded-2xl border border-violet-500/20 overflow-hidden hover:border-violet-500/40 transition-all duration-300">
            <div className="px-5 py-4 bg-gradient-to-r from-violet-500/10 to-transparent border-b border-violet-500/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <i className="fas fa-gavel text-white text-lg" />
                </div>
                <div>
                  <h3 className="m-0 text-base font-bold text-white">Lisensi Juri</h3>
                  <p className="m-0 text-[11px] text-violet-400/80">2 Jenis Lisensi Tersedia</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <i className="fas fa-star text-violet-400 text-sm" />
                    </div>
                    <span className="text-sm text-white font-medium">Juri Muda</span>
                  </div>
                  <i className="fas fa-check-circle text-violet-400" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <i className="fas fa-crown text-violet-400 text-sm" />
                    </div>
                    <span className="text-sm text-white font-medium">Juri Madya</span>
                  </div>
                  <i className="fas fa-check-circle text-violet-400" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Tanpa Kamar</span>
                  <span className="text-white font-semibold">{formatCurrency(PRICING.juri.tanpa_kamar)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Dengan Kamar</span>
                  <span className="text-white font-semibold">{formatCurrency(PRICING.juri.dengan_kamar)}</span>
                </div>
              </div>
              <button onClick={() => { setActiveSection('ajukan'); setShowForm(true); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-purple-500 active:scale-[0.98] transition-all border-none cursor-pointer">
                <i className="fas fa-arrow-right" /> Ajukan Lisensi Juri
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <i className="fas fa-clock text-white text-sm" />
              </div>
              <div>
                <h3 className="m-0 text-[14px] font-bold text-white">Pengajuan Terbaru</h3>
                <p className="m-0 text-[11px] text-gray-500">{Math.min(5, applications.length)} terakhir</p>
              </div>
            </div>
            <button onClick={() => setActiveSection('riwayat')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-transparent border-none cursor-pointer transition-colors">
              Lihat Semua <i className="fas fa-chevron-right text-[10px] ml-1" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {applications.slice(0, 5).map(app => (
              <div key={app.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    app.license_type?.toLowerCase().includes('pelatih')
                      ? 'bg-orange-500/10'
                      : 'bg-violet-500/10'
                  }`}>
                    <i className={`fas ${app.license_type?.toLowerCase().includes('pelatih') ? 'fa-bullhorn text-orange-400' : 'fa-gavel text-violet-400'} text-sm`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeBadge type={app.license_type} />
                    </div>
                    <p className="text-[11px] text-gray-500 m-0 mt-1">{new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <Badge status={app.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ── Form Section ── */
  const renderForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0 ${
            activeTab === 'pelatih' 
              ? 'from-orange-500 to-amber-600 shadow-orange-500/25' 
              : 'from-violet-500 to-purple-600 shadow-violet-500/25'
          }`}>
            <i className={`fas ${activeTab === 'pelatih' ? 'fa-bullhorn' : 'fa-gavel'} text-white`} />
          </div>
          <div>
            <h2 className="m-0 text-base font-bold text-white">
              Ajukan Lisensi {activeTab === 'pelatih' ? 'Pelatih' : 'Juri'}
            </h2>
            <p className="m-0 text-[11px] text-gray-500">Lengkapi formulir pengajuan lisensi</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(false); setActiveSection('dashboard'); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all cursor-pointer">
          <i className="fas fa-arrow-left" /> Kembali
        </button>
      </div>

      {/* Role Badge */}
      <div className="flex justify-center">
        <RoleBadge />
      </div>

      {/* Form Card */}
      <div className={`bg-gradient-to-br from-[#1a1c2a] to-[#141620] rounded-2xl border overflow-hidden transition-all duration-300 ${
        activeTab === 'pelatih' ? 'border-orange-500/20' : 'border-violet-500/20'
      }`}>
        <div className={`px-5 py-4 border-b transition-all duration-300 ${
          activeTab === 'pelatih' 
            ? 'bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/10' 
            : 'bg-gradient-to-r from-violet-500/10 to-transparent border-violet-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg ${
              activeTab === 'pelatih' 
                ? 'from-orange-500 to-amber-600 shadow-orange-500/25' 
                : 'from-violet-500 to-purple-600 shadow-violet-500/25'
            }`}>
              <i className={`fas ${activeTab === 'pelatih' ? 'fa-bullhorn' : 'fa-gavel'} text-white`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white m-0">
                Form Pengajuan Lisensi {activeTab === 'pelatih' ? 'Pelatih' : 'Juri'}
              </h3>
              <p className="text-[11px] text-gray-500 m-0 mt-0.5">
                {activeTab === 'pelatih' ? '1 jenis lisensi tersedia' : '2 jenis lisensi tersedia (Muda & Madya)'}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
            
            {/* Juri Type Selection (only for Juri) */}
            {activeTab === 'juri' && (
              <>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pilih Jenis Juri *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, juri_type: 'muda' }))}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer ${
                        formData.juri_type === 'muda'
                          ? 'bg-violet-500/10 border-violet-500 shadow-lg shadow-violet-500/10'
                          : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]'
                      }`}
                    >
                      {formData.juri_type === 'muda' && (
                        <div className="absolute top-2 right-2">
                          <i className="fas fa-check-circle text-violet-400" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        formData.juri_type === 'muda' ? 'bg-violet-500/20' : 'bg-white/[0.05]'
                      }`}>
                        <i className={`fas fa-star ${formData.juri_type === 'muda' ? 'text-violet-400' : 'text-gray-500'}`} />
                      </div>
                      <h4 className={`m-0 text-sm font-bold ${formData.juri_type === 'muda' ? 'text-white' : 'text-gray-300'}`}>Juri Muda</h4>
                      <p className="m-0 text-[11px] text-gray-500 mt-1">Tingkat pemula</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, juri_type: 'madya' }))}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer ${
                        formData.juri_type === 'madya'
                          ? 'bg-violet-500/10 border-violet-500 shadow-lg shadow-violet-500/10'
                          : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]'
                      }`}
                    >
                      {formData.juri_type === 'madya' && (
                        <div className="absolute top-2 right-2">
                          <i className="fas fa-check-circle text-violet-400" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        formData.juri_type === 'madya' ? 'bg-violet-500/20' : 'bg-white/[0.05]'
                      }`}>
                        <i className={`fas fa-crown ${formData.juri_type === 'madya' ? 'text-violet-400' : 'text-gray-500'}`} />
                      </div>
                      <h4 className={`m-0 text-sm font-bold ${formData.juri_type === 'madya' ? 'text-white' : 'text-gray-300'}`}>Juri Madya</h4>
                      <p className="m-0 text-[11px] text-gray-500 mt-1">Tingkat menengah</p>
                    </button>
                  </div>
                </div>
              </>
            )}



            {/* Accommodation Selection */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Akomodasi *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, akomodasi: 'tanpa_kamar' }))}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer ${
                    formData.akomodasi === 'tanpa_kamar'
                      ? activeTab === 'pelatih' 
                        ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10'
                        : 'bg-violet-500/10 border-violet-500 shadow-lg shadow-violet-500/10'
                      : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]'
                  }`}
                >
                  {formData.akomodasi === 'tanpa_kamar' && (
                    <div className="absolute top-2 right-2">
                      <i className={`fas fa-check-circle ${activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'}`} />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    formData.akomodasi === 'tanpa_kamar' 
                      ? activeTab === 'pelatih' ? 'bg-orange-500/20' : 'bg-violet-500/20'
                      : 'bg-white/[0.05]'
                  }`}>
                    <i className={`fas fa-walking ${
                      formData.akomodasi === 'tanpa_kamar' 
                        ? activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'
                        : 'text-gray-500'
                    }`} />
                  </div>
                  <h4 className={`m-0 text-sm font-bold ${formData.akomodasi === 'tanpa_kamar' ? 'text-white' : 'text-gray-300'}`}>Tanpa Kamar</h4>
                  <p className={`m-0 text-base font-bold mt-2 ${
                    formData.akomodasi === 'tanpa_kamar' 
                      ? activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'
                      : 'text-gray-400'
                  }`}>
                    {formatCurrency(PRICING[activeTab].tanpa_kamar)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, akomodasi: 'dengan_kamar' }))}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer ${
                    formData.akomodasi === 'dengan_kamar'
                      ? activeTab === 'pelatih' 
                        ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10'
                        : 'bg-violet-500/10 border-violet-500 shadow-lg shadow-violet-500/10'
                      : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]'
                  }`}
                >
                  {formData.akomodasi === 'dengan_kamar' && (
                    <div className="absolute top-2 right-2">
                      <i className={`fas fa-check-circle ${activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'}`} />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    formData.akomodasi === 'dengan_kamar' 
                      ? activeTab === 'pelatih' ? 'bg-orange-500/20' : 'bg-violet-500/20'
                      : 'bg-white/[0.05]'
                  }`}>
                    <i className={`fas fa-bed ${
                      formData.akomodasi === 'dengan_kamar' 
                        ? activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'
                        : 'text-gray-500'
                    }`} />
                  </div>
                  <h4 className={`m-0 text-sm font-bold ${formData.akomodasi === 'dengan_kamar' ? 'text-white' : 'text-gray-300'}`}>Dengan Kamar</h4>
                  <p className={`m-0 text-base font-bold mt-2 ${
                    formData.akomodasi === 'dengan_kamar' 
                      ? activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'
                      : 'text-gray-400'
                  }`}>
                    {formatCurrency(PRICING[activeTab].dengan_kamar)}
                  </p>
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              activeTab === 'pelatih' 
                ? 'bg-orange-500/5 border-orange-500/20' 
                : 'bg-violet-500/5 border-violet-500/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeTab === 'pelatih' ? 'bg-orange-500/20' : 'bg-violet-500/20'
                }`}>
                  <i className={`fas fa-receipt ${activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'}`} />
                </div>
                <div>
                  <p className="m-0 text-[11px] text-gray-500 uppercase font-semibold tracking-wider">Total Biaya</p>
                  <p className="m-0 text-xs text-gray-400 mt-0.5">
                    {activeTab === 'pelatih' ? 'Pelatih' : formData.juri_type ? `Juri ${formData.juri_type.charAt(0).toUpperCase() + formData.juri_type.slice(1)}` : 'Juri'} • {formData.akomodasi === 'dengan_kamar' ? 'Dengan Kamar' : 'Tanpa Kamar'}
                  </p>
                </div>
              </div>
              <p className={`m-0 text-xl font-bold ${activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'}`}>
                {formatCurrency(getCurrentPrice())}
              </p>
            </div>

            {/* Document Uploads Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeTab === 'pelatih' ? 'bg-orange-500/20' : 'bg-violet-500/20'
                }`}>
                  <i className={`fas fa-folder-open text-sm ${activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'}`} />
                </div>
                <div>
                  <h4 className="m-0 text-sm font-bold text-white">Upload Dokumen Persyaratan</h4>
                  <p className="m-0 text-[10px] text-gray-500">Format: JPG, PNG, PDF (Max 5MB per file)</p>
                </div>
              </div>

              {/* File Upload Components */}
              <div className="space-y-3">
                {/* Pas Foto */}
                <FileUploadField
                  label="Pas Foto 4x6"
                  sublabel="Background Merah"
                  required
                  icon="fa-user-circle"
                  file={files.pas_foto}
                  onChange={(f) => handleFileChange('pas_foto', f)}
                  activeTab={activeTab}
                />

                {/* Pelatih specific uploads */}
                {activeTab === 'pelatih' && (
                  <>
                    <FileUploadField
                      label="Surat Keterangan Pengalaman"
                      sublabel="Sertifikat Lisensi Pelatih / Surat Keterangan pengalaman min. 5 tahun"
                      required
                      icon="fa-file-alt"
                      file={files.surat_pengalaman}
                      onChange={(f) => handleFileChange('surat_pengalaman', f)}
                      activeTab={activeTab}
                    />
                    <FileUploadField
                      label="Sertifikat ToT"
                      sublabel="Diutamakan ToT Forbasi (opsional)"
                      icon="fa-certificate"
                      file={files.sertifikat_tot}
                      onChange={(f) => handleFileChange('sertifikat_tot', f)}
                      activeTab={activeTab}
                    />
                    <FileUploadField
                      label="Surat Rekomendasi Pengda"
                      sublabel="Dari Pengda Forbasi setempat"
                      required
                      icon="fa-file-signature"
                      file={files.surat_rekomendasi}
                      onChange={(f) => handleFileChange('surat_rekomendasi', f)}
                      activeTab={activeTab}
                    />
                  </>
                )}

                {/* Bukti Transfer */}
                <FileUploadField
                  label="Bukti Transfer Pembayaran"
                  sublabel={`Transfer ke rekening FORBASI: ${formatCurrency(getCurrentPrice())}`}
                  required
                  icon="fa-money-check-alt"
                  file={files.bukti_transfer}
                  onChange={(f) => handleFileChange('bukti_transfer', f)}
                  activeTab={activeTab}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Catatan (opsional)</label>
              <textarea 
                className={INPUT} 
                value={formData.notes} 
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} 
                rows={3} 
                placeholder="Tambahkan catatan jika diperlukan..." 
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={submitting || (activeTab === 'juri' && !formData.juri_type)}
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm rounded-xl text-white font-semibold shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all border-none cursor-pointer ${
                activeTab === 'pelatih'
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/25 hover:from-orange-400 hover:to-amber-500'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25 hover:from-violet-400 hover:to-purple-500'
              }`}
            >
              {submitting ? (
                <><i className="fas fa-spinner fa-spin" /> Mengirim Pengajuan...</>
              ) : (
                <><i className="fas fa-paper-plane" /> Kirim Pengajuan Lisensi {activeTab === 'pelatih' ? 'Pelatih' : 'Juri'}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ── History Section ── */
  const renderHistory = () => {
    const pelatihApps = applications.filter(a => a.license_type?.toLowerCase().includes('pelatih'));
    const juriApps = applications.filter(a => a.license_type?.toLowerCase().includes('juri'));
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <i className="fas fa-history text-white text-sm" />
            </div>
            <div>
              <h2 className="m-0 text-base font-bold text-white">Riwayat Pengajuan</h2>
              <p className="m-0 text-[11px] text-gray-500">{applications.length} total pengajuan</p>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex justify-center">
          <RoleBadge />
        </div>

        {/* Applications List */}
        <div className={`bg-gradient-to-br from-[#1a1c2a] to-[#141620] rounded-2xl border overflow-hidden ${
          activeTab === 'pelatih' ? 'border-orange-500/20' : 'border-violet-500/20'
        }`}>
          <div className={`px-5 py-4 border-b ${
            activeTab === 'pelatih' 
              ? 'bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/10' 
              : 'bg-gradient-to-r from-violet-500/10 to-transparent border-violet-500/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg ${
                activeTab === 'pelatih' 
                  ? 'from-orange-500 to-amber-600 shadow-orange-500/25' 
                  : 'from-violet-500 to-purple-600 shadow-violet-500/25'
              }`}>
                <i className={`fas ${activeTab === 'pelatih' ? 'fa-bullhorn' : 'fa-gavel'} text-white text-sm`} />
              </div>
              <div>
                <h3 className="m-0 text-[14px] font-bold text-white">
                  Riwayat Lisensi {activeTab === 'pelatih' ? 'Pelatih' : 'Juri'}
                </h3>
                <p className="m-0 text-[11px] text-gray-500">
                  {activeTab === 'pelatih' ? pelatihApps.length : juriApps.length} pengajuan
                </p>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner /></div>
          ) : (activeTab === 'pelatih' ? pelatihApps : juriApps).length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                activeTab === 'pelatih' ? 'bg-orange-500/10' : 'bg-violet-500/10'
              }`}>
                <i className={`fas ${activeTab === 'pelatih' ? 'fa-bullhorn' : 'fa-gavel'} text-2xl ${
                  activeTab === 'pelatih' ? 'text-orange-500/50' : 'text-violet-500/50'
                }`} />
              </div>
              <p className="text-sm text-gray-500 m-0 mb-3">
                Belum ada pengajuan lisensi {activeTab === 'pelatih' ? 'pelatih' : 'juri'}
              </p>
              <button onClick={() => { setActiveSection('ajukan'); setShowForm(true); }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs rounded-xl font-semibold active:scale-[0.97] transition-all border-none cursor-pointer ${
                  activeTab === 'pelatih'
                    ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                    : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                }`}>
                <i className="fas fa-plus" /> Ajukan Sekarang
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(activeTab === 'pelatih' ? pelatihApps : juriApps).map((app, idx) => (
                <div key={app.id} className="px-5 py-4 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        activeTab === 'pelatih' ? 'bg-orange-500/10' : 'bg-violet-500/10'
                      }`}>
                        <span className={`text-xs font-bold ${
                          activeTab === 'pelatih' ? 'text-orange-400' : 'text-violet-400'
                        }`}>{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TypeBadge type={app.license_type} />
                          {app.akomodasi && (
                            <span className="text-[10px] text-gray-500 bg-white/[0.05] px-2 py-0.5 rounded-full">
                              <i className={`fas ${app.akomodasi === 'dengan_kamar' ? 'fa-bed' : 'fa-walking'} mr-1`} />
                              {app.akomodasi === 'dengan_kamar' ? 'Dengan Kamar' : 'Tanpa Kamar'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 m-0 mt-1">
                          {new Date(app.created_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.notes && (
                        <span className="hidden sm:inline text-[11px] text-gray-500 max-w-[150px] truncate" title={app.notes}>
                          <i className="fas fa-sticky-note mr-1" />{app.notes}
                        </span>
                      )}
                      <Badge status={app.status} />
                    </div>
                  </div>
                  {/* QR Code for approved applications */}
                  {app.status === 'approved' && app.qr_code_path && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-white rounded-lg p-1 flex-shrink-0">
                          <img src={`${API_BASE}/uploads/${app.qr_code_path}`} alt="QR" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-emerald-400 font-semibold m-0"><i className="fas fa-check-circle mr-1" />Disetujui — QR Code tersedia</p>
                          <a href={`${API_BASE}/uploads/${app.qr_code_path}`} download
                            className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-emerald-500/10 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all no-underline cursor-pointer">
                            <i className="fas fa-download text-[10px]" /> Download QR Code
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Profile Section ── */
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <i className="fas fa-user-cog text-white text-sm" />
        </div>
        <div>
          <h2 className="m-0 text-base font-bold text-white">Profil</h2>
          <p className="m-0 text-[11px] text-gray-500">Informasi akun lisensi Anda</p>
        </div>
      </div>
      <div className="bg-[#141620] rounded-2xl border border-white/[0.06] p-6">
        <p className="text-sm text-gray-400 m-0">Fitur profil akan segera tersedia.</p>
      </div>
    </div>
  );

  return (
    <SidebarLayout menuItems={menuItems} title="Dashboard Lisensi" subtitle="Lisensi Panel">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'ajukan' && renderForm()}
        {activeSection === 'riwayat' && renderHistory()}
        {activeSection === 'profil' && renderProfile()}
      </div>
    </SidebarLayout>
  );
}
