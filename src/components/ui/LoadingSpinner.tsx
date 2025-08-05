import React from 'react'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface LoadingSpinnerProps {
  size?: SpinnerSize
  className?: string
  'aria-label'?: string
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
} as const

export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  'aria-label': ariaLabel = '読み込み中'
}: LoadingSpinnerProps) {
  const sizeClass = SIZE_CLASSES[size]
  
  return (
    <div 
      className={`animate-spin ${sizeClass} ${className}`.trim()}
      aria-label={ariaLabel}
      role="status"
      data-testid="loading-spinner"
    >
      <svg 
        className="h-full w-full text-current" 
        viewBox="0 0 24 24" 
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
          className="opacity-25"
        />
        <path 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
          fill="currentColor"
        />
      </svg>
    </div>
  )
}