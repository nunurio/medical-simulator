import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'

interface MessageInputProps {
  onSubmit: (message: string) => void
  onTypingChange?: (isTyping: boolean) => void
  disabled?: boolean
  className?: string
}

export function MessageInput({ 
  onSubmit, 
  onTypingChange, 
  disabled = false,
  className 
}: MessageInputProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (onTypingChange) {
      onTypingChange(message.length > 0)
    }
  }, [message, onTypingChange])

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSubmit(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn(
      "flex items-center gap-2 p-4 border-t bg-background",
      className
    )}>
      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力してください..."
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-md border border-input bg-background",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-colors"
        )}
      >
        <Send className="h-4 w-4" />
        <span className="ml-2">送信</span>
      </button>
    </div>
  )
}