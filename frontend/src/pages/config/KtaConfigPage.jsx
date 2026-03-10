import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function KtaConfigPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState({ ketua_umum_name: '', signature_image_path: null, stamp_image_path: null });
  const [signatureFile, setSignatureFile] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const roleId = user?.role_id;
  const showStamp = [3, 4].includes(roleId);
  const backPath = roleId === 4 ? '/pb' : roleId === 3 ? '/pengda' : '/pengcab';

  useEffect(() => {
    loadConfig();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!config.ketua_umum_name.trim()) {
      return toast.error('Nama Ketua Umum wajib diisi');
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('ketua_umum_name', config.ketua_umum_name);
      if (signatureFile) formData.append('signature', signatureFile);
      if (stampFile && showStamp) formData.append('stamp', stampFile);

      await api.post('/config/kta-config', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Konfigurasi KTA berhasil disimpan');
      setSignatureFile(null);
      setStampFile(null);
      loadConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1faee' }}>
      <Navbar title="Konfigurasi KTA" backTo={backPath} />
      <div className="page-container" style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        {loading ? (
          <div className="loading">Memuat konfigurasi...</div>
        ) : (
          <>
            <div className="page-header">
              <h2>Konfigurasi KTA</h2>
              <p>Atur nama ketua umum dan gambar tanda tangan untuk kartu KTA</p>
            </div>

            <div className="card">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nama Ketua Umum <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={config.ketua_umum_name}
                    onChange={(e) => setConfig(prev => ({ ...prev, ketua_umum_name: e.target.value }))}
                    placeholder="Nama lengkap Ketua Umum"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Gambar Tanda Tangan</label>
                  {config.signature_image_path && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <img
                        src={`${API_BASE}/uploads/config/${config.signature_image_path}`}
                        alt="Tanda Tangan"
                        style={{ maxHeight: '80px', border: '1px solid #ddd', padding: '4px', background: '#fff', display: 'block' }}
                      />
                      <small style={{ color: '#666' }}>Tanda tangan saat ini</small>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => setSignatureFile(e.target.files[0])}
                  />
                  <small style={{ color: '#888', display: 'block', marginTop: '0.25rem' }}>
                    Format: JPG/PNG, maks 2MB.{config.signature_image_path ? ' Kosongkan jika tidak ingin mengubah.' : ''}
                  </small>
                </div>

                {showStamp && (
                  <div className="form-group">
                    <label>Gambar Stempel</label>
                    {config.stamp_image_path && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <img
                          src={`${API_BASE}/uploads/config/${config.stamp_image_path}`}
                          alt="Stempel"
                          style={{ maxHeight: '80px', border: '1px solid #ddd', padding: '4px', background: '#fff', display: 'block' }}
                        />
                        <small style={{ color: '#666' }}>Stempel saat ini</small>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => setStampFile(e.target.files[0])}
                    />
                    <small style={{ color: '#888', display: 'block', marginTop: '0.25rem' }}>
                      Format: JPG/PNG, maks 2MB.{config.stamp_image_path ? ' Kosongkan jika tidak ingin mengubah.' : ''}
                    </small>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => navigate(backPath)}>
                    Kembali
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
