export default function ConfirmModal({
  show, title, message, onConfirm, onCancel,
  confirmText = 'Ya, Lanjutkan', danger = false,
  showReason = false, reasonLabel = 'Catatan / Alasan', reason = '', onReasonChange,
  loading = false,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#141620] border border-white/[0.06] rounded-2xl shadow-2xl w-full max-w-[440px] text-center overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className={`w-16 h-16 rounded-full ${danger ? 'bg-red-500/10' : 'bg-amber-500/10'} flex items-center justify-center mx-auto mb-4 text-3xl ${danger ? 'text-red-400' : 'text-amber-400'}`}>
            <i className={`fas ${danger ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}`} />
          </div>
          <h3 className="text-base font-bold text-white mb-2">{title}</h3>
          <p className={`text-sm text-gray-400 ${showReason ? 'mb-4' : 'mb-6'}`}>{message}</p>
          {showReason && (
            <div className="mb-6 text-left">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {reasonLabel}
              </label>
              <textarea
                value={reason}
                onChange={e => onReasonChange && onReasonChange(e.target.value)}
                rows={3}
                placeholder="Masukkan catatan atau alasan..."
                className="w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all resize-vertical"
              />
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={onCancel} disabled={loading}
              className="px-5 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 font-medium hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Batal
            </button>
            <button onClick={onConfirm} disabled={loading}
              className={`px-5 py-2.5 text-sm rounded-xl text-white font-semibold shadow-md active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                danger
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25 hover:from-red-400 hover:to-red-500'
                  : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500'
              }`}>
              {loading ? <><i className="fas fa-spinner fa-spin mr-2" />{confirmText}</> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
