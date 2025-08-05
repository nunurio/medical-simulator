import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

const BASE_CLASSES = 'bg-white rounded-lg shadow-md p-6 w-full' as const

export function Card({ 
  children, 
  className = '', 
  ...props 
}: CardProps) {
  const cardClasses = [BASE_CLASSES, className]
    .filter(Boolean)
    .join(' ')
  
  return (
    <div 
      className={cardClasses}
      data-testid="card"
      {...props}
    >
      {children}
    </div>
  )
}