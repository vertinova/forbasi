export default function LoadingSpinner({ text = 'Memuat...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
      <div className="spinner" />
      <p style={{ marginTop: '1rem', color: '#6c757d', fontSize: '0.9rem' }}>{text}</p>
    </div>
  );
}
