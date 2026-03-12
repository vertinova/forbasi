import { useState, useEffect } from 'react';

const isImage = (url) => /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
const isPdf   = (url) => /\.pdf(\?|$)/i.test(url);

export default function DocumentPreviewModal({ show, url, title = 'Dokumen', onClose }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (show) setLoading(true); }, [show, url]);

  if (!show || !url) return null;

  const image = isImage(url);
  const pdf   = isPdf(url);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#141620] border border-white/[0.06] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <i className={`fas ${pdf ? 'fa-file-pdf text-red-400' : image ? 'fa-image text-violet-400' : 'fa-file text-blue-400'} text-sm`} />
            </div>
            <span className="text-sm font-bold text-white truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={url}
              download
              className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all no-underline"
              title="Download"
              onClick={e => e.stopPropagation()}
            >
              <i className="fas fa-download text-xs" />
            </a>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all no-underline"
              title="Buka di tab baru"
              onClick={e => e.stopPropagation()}
            >
              <i className="fas fa-external-link-alt text-xs" />
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all"
            >
              <i className="fas fa-times text-xs" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#141620]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Memuat dokumen...</span>
              </div>
            </div>
          )}

          {image && (
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          )}

          {pdf && (
            <iframe
              src={url}
              title={title}
              className="w-full h-[75vh] rounded-lg border border-white/[0.06] bg-white"
              onLoad={() => setLoading(false)}
            />
          )}

          {!image && !pdf && (
            <div className="text-center py-12" onLoad={() => setLoading(false)}>
              <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-file text-2xl text-gray-500" />
              </div>
              <p className="text-sm text-gray-400 mb-4">Preview tidak tersedia untuk tipe file ini</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all no-underline"
              >
                <i className="fas fa-external-link-alt text-xs" /> Buka di Tab Baru
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
