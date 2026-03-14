import useVersionCheck from '../../hooks/useVersionCheck';

export default function UpdateBanner() {
  const { updateAvailable, latestVersion, currentVersion, notes, applyUpdate } = useVersionCheck();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-slide-up">
      <div className="bg-blue-600 text-white rounded-xl shadow-2xl px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-lg p-2 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Update Tersedia!</p>
            <p className="text-blue-100 text-xs mt-0.5">
              v{currentVersion} → v{latestVersion}
            </p>
            {notes && <p className="text-blue-100 text-xs mt-1 line-clamp-2">{notes}</p>}
          </div>
          <button
            onClick={applyUpdate}
            className="shrink-0 bg-white text-blue-600 font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
