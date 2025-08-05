import React from 'react'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  isTyping: boolean
  className?: string
}

export function TypingIndicator({ isTyping, className }: TypingIndicatorProps) {
  if (!isTyping) {
    return null
  }

  return (
    <div 
      data-testid="typing-indicator"
      className={cn(
        "flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="相手が入力中です"
    >
      <span>入力中</span>
      <div className="flex gap-1 ml-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            data-testid="typing-dot"
            className={cn(
              "w-1 h-1 bg-muted-foreground rounded-full animate-pulse",
              "animation-delay-[var(--delay)]"
            )}
            style={{ 
              '--delay': `${index * 200}ms`,
              animationDelay: `${index * 200}ms`
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}