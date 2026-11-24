import { useState } from 'react'

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.584 10.587a3 3 0 0 0 4.243 4.242M9.88 5.09A10.94 10.94 0 0 1 12 4.875c6 0 9.75 6.75 9.75 6.75a17.6 17.6 0 0 1-2.664 3.599M6.228 6.23A17.4 17.4 0 0 0 2.25 11.625s3.75 6.75 9.75 6.75c1.45 0 2.79-.394 3.98-1.03"
      />
    </svg>
  )
}

function PasswordInput({ inputClassName = '', className = '', ...props }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? 'text' : 'password'}
        className={`${inputClassName} pr-12 ${className}`.trim()}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
        className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition-colors hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300"
      >
        {isVisible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

export default PasswordInput
