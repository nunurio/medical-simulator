import React from 'react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat'

interface MessageItemProps {
  message: ChatMessage
  className?: string
}

export function MessageItem({ message, className }: MessageItemProps) {
  const isPatient = message.messageType === 'patient'
  const isSimulator = message.messageType === 'simulator'
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div 
      data-testid="message-item" 
      className={cn(
        "flex w-full mb-4",
        isPatient && "justify-start patient-message",
        isSimulator && "justify-end simulator-message",
        className
      )}
    >
      <div className={cn(
        "max-w-[70%] rounded-lg px-4 py-2 shadow-sm",
        isPatient && "bg-blue-100 text-blue-900 mr-auto",
        isSimulator && "bg-green-100 text-green-900 ml-auto"
      )}>
        <div className="text-sm leading-relaxed">
          {message.content}
        </div>
        <div className="text-xs text-muted-foreground mt-1 opacity-70">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}