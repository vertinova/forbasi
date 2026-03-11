import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiArrowLeft, FiLogOut, FiUser, FiBell } from 'react-icons/fi';

export default function Navbar({ title, backTo }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1d3557 0%, #122a44 100%)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {backTo && (
          <Link to={backTo} style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            transition: 'background 0.2s'
          }}>
            <FiArrowLeft /> Kembali
          </Link>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff' }}>
          <img src="/logo-forbasi.png" alt="FORBASI" style={{ height: 36 }} onError={e => e.target.style.display = 'none'} />
          <h1 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{title}</h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {user && (
          <span style={{ color: '#a8dadc', fontSize: '0.85rem', marginRight: '0.5rem' }}>
            <FiUser style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {user.username}
          </span>
        )}
        <button onClick={handleLogout} style={{
          background: 'rgba(220,53,69,0.8)',
          color: '#fff',
          border: 'none',
          padding: '0.45rem 1rem',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-primary)',
          transition: 'background 0.2s'
        }}>
          <FiLogOut /> Keluar
        </button>
      </div>
    </nav>
  );
}
