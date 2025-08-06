import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, AlertCircle, MessageSquare } from 'lucide-react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { useChat } from '@/hooks/useChat'
import type { EncounterId, ISODateTime } from '@/types/core'

interface ChatInterfaceProps {
  encounterId: EncounterId
  className?: string
}

export function ChatInterface({ encounterId, className }: ChatInterfaceProps) {
  const { 
    conversation, 
    isLoading, 
    error, 
    isTyping, 
    sendMessage, 
    handleTyping,
    clearError
  } = useChat(encounterId)

  const handleMessageSubmit = (message: string) => {
    sendMessage(message)
  }

  const handleTypingChange = (typing: boolean) => {
    if (typing) {
      handleTyping()
    }
  }

  if (isLoading) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full",
        className
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full text-center p-8",
        className
      )}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium text-destructive mb-2">
          エラーが発生しました
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {typeof error === 'string' ? error : error?.message || 'Unknown error occurred'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          再読み込み
        </button>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full text-center p-8",
        className
      )}>
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          会話を開始してください
        </h3>
        <p className="text-sm text-muted-foreground">
          患者シミュレーションを開始すると、チャットが有効になります
        </p>
      </div>
    )
  }

  return (
    <main 
      role="main" 
      aria-label="チャットインターフェース"
      className={cn(
        "flex flex-col h-full bg-background border rounded-lg overflow-hidden",
        className
      )}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-medium">
              {conversation.participants.patient.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {conversation.status === 'active' ? 'オンライン' : 'オフライン'}
            </p>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 relative">
        <MessageList messages={conversation.messages} />
        
        {/* タイピングインジケーター */}
        {isTyping && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <TypingIndicator isTyping={true} />
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <MessageInput 
        onSubmit={handleMessageSubmit}
        onTypingChange={handleTypingChange}
      />
    </main>
  )
}