import { useTheme } from '../../context/ThemeContext.jsx'

function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-500/25 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-slate-800 ${className}`}
    >
      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="size-4.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="size-4.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
          />
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle
