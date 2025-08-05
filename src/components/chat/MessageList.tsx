import React, { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ArrowDown, MessageCircle } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'
import { MessageItem } from './MessageItem'

interface MessageListProps {
  messages: ChatMessage[]
  className?: string
}

export function MessageList({ messages, className }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // 新しいメッセージが追加されたときの自動スクロール
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, shouldAutoScroll])

  // 手動スクロールの検知
  const handleScroll = () => {
    if (!containerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    const isScrolledUp = scrollTop < scrollHeight - clientHeight - 100
    
    setShouldAutoScroll(isAtBottom)
    setShowScrollButton(isScrolledUp)
  }

  // 最新メッセージへスクロール
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setShouldAutoScroll(true)
    }
  }

  if (messages.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full text-center p-8",
        className
      )}>
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          メッセージがありません
        </h3>
        <p className="text-sm text-muted-foreground">
          患者との会話を開始してください
        </p>
      </div>
    )
  }

  return (
    <div className={cn("relative flex-1", className)}>
      <div
        ref={containerRef}
        data-testid="message-list-container"
        role="log"
        aria-live="polite"
        aria-label="会話履歴"
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 最新メッセージへのスクロールボタン */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 right-4 z-10",
            "inline-flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors",
            "shadow-lg hover:shadow-xl",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          aria-label="最新のメッセージに移動"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}