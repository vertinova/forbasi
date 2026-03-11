import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function VerifyKta() {
  const { barcodeId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/public/verify-kta/${barcodeId}`);
        setData(res.data.data);
      } catch {
        setError('KTA tidak ditemukan atau tidak valid');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [barcodeId]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#1d3557', marginBottom: '1rem' }}>Verifikasi KTA</h2>

        {loading ? <p>Memverifikasi...</p> : error ? (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#10060;</div>
            <p style={{ color: '#dc3545', fontWeight: 'bold' }}>{error}</p>
          </div>
        ) : data && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#9989;</div>
            <p style={{ color: '#0d9500', fontWeight: 'bold', fontSize: '1.2rem' }}>KTA VALID</p>
            <div style={{ textAlign: 'left', marginTop: '1.5rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
              <p><strong>Nama Klub:</strong> {data.club_name}</p>
              <p><strong>Pelatih:</strong> {data.coach_name || '-'}</p>
              <p><strong>Manajer:</strong> {data.manager_name || '-'}</p>
              <p><strong>Provinsi:</strong> {data.province_name}</p>
              <p><strong>Kota:</strong> {data.city_name}</p>
              <p><strong>No. KTA:</strong> {data.kta_barcode_unique_id}</p>
              <p><strong>Diterbitkan:</strong> {data.kta_issued_at ? new Date(data.kta_issued_at).toLocaleDateString('id-ID') : '-'}</p>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <Link to="/" style={{ color: '#0d9500' }}>Kembali ke Beranda</Link>
        </div>
      </div>
    </div>
  );
}
