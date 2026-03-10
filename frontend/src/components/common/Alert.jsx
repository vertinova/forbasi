import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const icons = {
  success: <FiCheckCircle />,
  error: <FiAlertCircle />,
  warning: <FiAlertTriangle />,
  info: <FiInfo />
};

const colors = {
  success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
  error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
  warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
  info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
};

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;
  const style = colors[type];

  return (
    <div style={{
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
      fontSize: '0.9rem'
    }}>
      {icons[type]}
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: style.color, fontSize: '1.2rem', padding: '0 0.25rem'
        }}>×</button>
      )}
    </div>
  );
}
