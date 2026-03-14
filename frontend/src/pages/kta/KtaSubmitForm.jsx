import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CustomSelect from '../../components/common/CustomSelect';

const INP = 'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all';
const SEL = INP + ' pr-8 cursor-pointer';
const LBL = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
const FILE_INP = 'w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white/[0.06] file:text-gray-300 hover:file:bg-white/[0.1] file:cursor-pointer file:transition-colors cursor-pointer';

export default function KtaSubmitForm({ onSuccess }) {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    club_name: '', province_id: '', city_id: '', club_address: '',
    leader_name: '', school_name: '', coach_name: '', manager_name: '',
    phone: '', email: '', nominal_paid: '100000',
  });
  const [files, setFiles] = useState({ sk_file: null, logo: null, payment_proof: null, ad_file: null, art_file: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/users/provinces').then(r => setProvinces(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.province_id) {
      api.get(`/users/cities/${formData.province_id}`).then(r => setCities(r.data.data || [])).catch(() => {});
    } else { setCities([]); }
  }, [formData.province_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/[^0-9]/g, '');
      return setFormData(p => ({ ...p, phone: digits }));
    }
    setFormData(p => ({ ...p, [name]: value }));
  };

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file && file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal 2MB.`);
      e.target.value = '';
      return;
    }
    setFiles(p => ({ ...p, [e.target.name]: file || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Detailed field validation
    const missing = [];
    if (!formData.club_name) missing.push('Nama Klub');
    if (!formData.province_id) missing.push('Provinsi');
    if (!formData.city_id) missing.push('Kota/Kabupaten');
    if (!files.logo) missing.push('Logo Klub');
    if (!files.sk_file) missing.push('SK Pendirian Klub');
    if (!files.payment_proof) missing.push('Bukti Pembayaran');
    if (missing.length > 0) {
      return toast.error(`Field wajib belum diisi: ${missing.join(', ')}`);
    }
    if (formData.phone && !/^[0-9]+$/.test(formData.phone)) {
      return toast.error('No. HP hanya boleh berisi angka');
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      await api.post('/kta/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pengajuan KTA berhasil dikirim!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('=== KTA SUBMIT ERROR ===');
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      console.error('Message:', err.message);
      console.error('Full error:', err);

      const msg = err.response?.data?.message;
      const status = err.response?.status;
      if (msg) {
        toast.error(msg);
      } else if (status) {
        toast.error(`Gagal mengirim pengajuan (error ${status})`);
      } else if (err.request) {
        toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        toast.error('Terjadi kesalahan. Silakan coba lagi.');
      }
    }
    finally { setSubmitting(false); }
  };

  const content = (
    <div className="bg-[#141620] rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold text-white m-0">Form Pengajuan KTA</h3>
        <p className="text-[11px] text-gray-500 mt-0.5 m-0">Lengkapi data klub untuk mengajukan KTA FORBASI</p>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Nama Klub */}
        <div>
          <label className={LBL}>Nama Klub *</label>
          <input className={INP} name="club_name" value={formData.club_name} onChange={handleChange} placeholder="Nama klub Anda" required />
        </div>

        {/* Provinsi + Kota */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Provinsi *</label>
            <CustomSelect
              value={formData.province_id}
              onChange={v => setFormData(p => ({ ...p, province_id: v, city_id: '' }))}
              options={[{value:'',label:'Pilih'},...provinces.map(p => ({value:String(p.id),label:p.name}))]}
              placeholder="Pilih"
            />
          </div>
          <div>
            <label className={LBL}>Kota/Kabupaten *</label>
            <CustomSelect
              value={formData.city_id}
              onChange={v => setFormData(p => ({ ...p, city_id: v }))}
              options={[{value:'',label:'Pilih'},...cities.map(c => ({value:String(c.id),label:c.name}))]}
              placeholder="Pilih"
              disabled={!formData.province_id}
            />
          </div>
        </div>

        {/* Alamat */}
        <div>
          <label className={LBL}>Alamat Sekretariat</label>
          <textarea className={`${INP} resize-none`} name="club_address" value={formData.club_address} onChange={handleChange} rows={2} placeholder="Alamat lengkap" maxLength={45} />
          <p className="text-[11px] text-gray-500 mt-1 text-right">{formData.club_address.length}/45</p>
        </div>

        {/* Ketua + Sekolah */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Nama Ketua</label>
            <input className={INP} name="leader_name" value={formData.leader_name} onChange={handleChange} />
          </div>
          <div>
            <label className={LBL}>Nama Sekolah</label>
            <input className={INP} name="school_name" value={formData.school_name} onChange={handleChange} />
          </div>
        </div>

        {/* Pelatih + Manajer */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Nama Pelatih</label>
            <input className={INP} name="coach_name" value={formData.coach_name} onChange={handleChange} />
          </div>
          <div>
            <label className={LBL}>Nama Manajer</label>
            <input className={INP} name="manager_name" value={formData.manager_name} onChange={handleChange} />
          </div>
        </div>

        {/* HP + Nominal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LBL}>No. HP</label>
            <input className={INP} name="phone" value={formData.phone} onChange={handleChange} type="tel" inputMode="numeric" placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label className={LBL}>Nominal Bayar</label>
            <div className={`${INP} bg-white/[0.03] cursor-not-allowed`}>Rp 100.000</div>
            <input type="hidden" name="nominal_paid" value="100000" />
          </div>
        </div>

        {/* Bank Info */}
        <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-university text-emerald-400 text-[11px]" />
            </div>
            <span className="text-xs font-bold text-emerald-400">Informasi Pembayaran</span>
          </div>
          <p className="text-[11px] text-gray-400 m-0 leading-relaxed">Transfer ke rekening berikut sebelum upload bukti pembayaran:</p>
          <div className="bg-white/[0.04] rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-500">Bank</span>
              <span className="text-xs font-semibold text-white">Bank Mandiri</span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-500">No. Rekening</span>
              <button type="button" onClick={() => { navigator.clipboard.writeText('1320520205205'); toast.success('Nomor rekening disalin!'); }}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-transparent border-none cursor-pointer p-0 font-[Poppins]">
                1320520205205 <i className="fas fa-copy text-[10px]" />
              </button>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-500">Atas Nama</span>
              <span className="text-xs font-semibold text-white">FORUM BARIS INDONESIA</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 m-0"><i className="fas fa-info-circle mr-1" />Klik nomor rekening untuk menyalin.</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upload Dokumen</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Files */}
        <div className="space-y-3">
          {[
            { name: 'sk_file', label: 'SK Pendirian Klub *', accept: '.jpg,.jpeg,.png,.pdf', required: true },
            { name: 'logo', label: 'Logo Klub *', accept: '.jpg,.jpeg,.png', required: true },
            { name: 'ad_file', label: 'AD/ART/SK (opsional)', accept: '.jpg,.jpeg,.png,.pdf', required: false },
            { name: 'payment_proof', label: 'Bukti Pembayaran *', accept: '.jpg,.jpeg,.png,.pdf', required: true },
          ].map(f => (
            <div key={f.name} className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-gray-400">{f.label}</label>
                <span className="text-[10px] text-gray-600">Maks 2MB · JPG, PNG{f.accept.includes('.pdf') ? ', PDF' : ''}</span>
              </div>
              <input type="file" className={FILE_INP} name={f.name} accept={f.accept} onChange={handleFile} required={f.required} />
              {files[f.name] && (
                <p className="text-[10px] text-emerald-400/70 mt-1.5 m-0">
                  <i className="fas fa-check-circle mr-1" />{files[f.name].name} ({(files[f.name].size / 1024 / 1024).toFixed(1)}MB)
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold text-sm transition-all border-none cursor-pointer font-[Poppins] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
          <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'} mr-2`} />
          {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
        </button>
      </form>
    </div>
  );

  return content;
}
