import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function SSOCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect') || '/anggota';

    if (!token) {
      setError('Token SSO tidak ditemukan.');
      return;
    }

    api.post('/auth/sso-verify', { token })
      .then(async ({ data }) => {
        if (data.success) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          await fetchUser();
          navigate(data.data.redirectPath || redirect, { replace: true });
        } else {
          setError(data.message || 'SSO gagal.');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'SSO gagal. Silakan login manual.');
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center bg-gray-800 p-8 rounded-lg">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/login" className="text-emerald-400 hover:text-emerald-300 underline">
            Login Manual
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Memproses login...</p>
      </div>
    </div>
  );
}
