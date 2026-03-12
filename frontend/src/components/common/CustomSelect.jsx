import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  icon,
  className = '',
  disabled = false,
  variant = 'default',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  const variants = {
    default:
      'w-full px-3.5 py-2.5 text-sm bg-white/[0.05] border border-white/[0.08] text-gray-300 rounded-xl focus:outline-none transition-all',
    filter:
      'flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl transition-all',
  };

  const base = variants[variant] || variants.default;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`${base} ${
          disabled
            ? 'opacity-40 pointer-events-none border-white/[0.04]'
            : 'cursor-pointer hover:border-emerald-500/30'
        } ${
          open ? 'ring-2 ring-emerald-500/30 border-emerald-500/50' : ''
        } flex items-center justify-between gap-2 text-left w-full`}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && (
            <i
              className={`fas fa-${icon} text-emerald-400 text-[11px] flex-shrink-0`}
            />
          )}
          <span
            className={`truncate ${
              variant === 'filter' ? 'text-xs' : 'text-sm'
            } ${selected ? 'text-gray-200' : 'text-gray-500'}`}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M6 8l4 4 4-4"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[60] mt-1.5 w-full min-w-[160px] bg-[#1a1b2e] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <ul className="max-h-40 overflow-y-auto custom-scroll py-1 m-0 list-none p-0">
            {options.map((opt) => {
              const isActive = String(opt.value) === String(value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-sm border-none cursor-pointer transition-all duration-100
                      ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                          : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {isActive && (
                        <i className="fas fa-check text-[10px] text-emerald-400" />
                      )}
                      <span className={isActive ? '' : 'pl-[18px]'}>
                        {opt.label}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
