export default function ConfirmModal({
  show, title, message, onConfirm, onCancel,
  confirmText = 'Ya, Lanjutkan', danger = false,
  showReason = false, reasonLabel = 'Catatan / Alasan', reason = '', onReasonChange,
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 440, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ padding: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: danger ? '#fff5f5' : '#fffbeb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '2rem',
            color: danger ? '#dc3545' : '#d97706'
          }}>
            ⚠
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: '#1d3557' }}>{title}</h3>
          <p style={{ color: '#666', marginBottom: showReason ? '1rem' : '1.5rem' }}>{message}</p>
          {showReason && (
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                {reasonLabel}
              </label>
              <textarea
                value={reason}
                onChange={e => onReasonChange && onReasonChange(e.target.value)}
                rows={3}
                placeholder="Masukkan catatan atau alasan..."
                style={{
                  width: '100%', padding: '0.6rem 0.75rem',
                  border: '1px solid #d1d5db', borderRadius: 8,
                  fontSize: '0.875rem', resize: 'vertical',
                  outline: 'none', fontFamily: 'Poppins, sans-serif',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={onCancel}>Batal</button>
            <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
