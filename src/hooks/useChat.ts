import { useCallback, useRef, useEffect, useState } from 'react';
import { useStore } from './use-store';
import type { Patient, ChatConversation } from '../types/state';
import type { EncounterId } from '../types/core';
import { sendChatMessage } from '../app/actions/send-chat-message';

export interface UseChatReturn {
  // State
  conversation: ChatConversation | null;
  isTyping: boolean;
  activeConversationId: string | null;
  currentPatient: Patient | null;
  error: { message: string; type: string; retry?: () => void } | null;
  isLoading: boolean;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  handleTyping: () => void;
  clearError: () => void;
  retryMessage: (messageId: string) => Promise<void>;
}

export function useChat(encounterId?: EncounterId): UseChatReturn {
  // Use selectors to access store state
  const conversations = useStore(state => state.conversations);
  const activeConversationId = useStore(state => state.activeConversationId);
  const isTyping = useStore(state => state.isTyping);
  const patients = useStore(state => state.patients);
  const activePatientId = useStore(state => state.activePatientId);
  
  // Store actions
  const addMessage = useStore(state => state.addMessage);
  const storeSendMessage = useStore(state => state.sendMessage);
  const removeMessage = useStore(state => state.removeMessage);
  const setTyping = useStore(state => state.setTyping);
  const createConversation = useStore(state => state.createConversation);
  const setActiveConversation = useStore(state => state.setActiveConversation);

  // Local state for error and loading
  const [error, setError] = useState<{ message: string; type: string; retry?: () => void } | null>(null);
  const [isLoading, setLoading] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // encounterIdがある場合は会話を初期化
  useEffect(() => {
    if (encounterId && !activeConversationId) {
      const conversationId = createConversation(encounterId);
      setActiveConversation(conversationId);
    }
  }, [encounterId, activeConversationId, createConversation, setActiveConversation]);

  const currentPatient = activePatientId 
    ? patients[activePatientId] 
    : null;

  const conversation = activeConversationId
    ? conversations[activeConversationId]
    : null;

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversationId) {
      throw new Error('アクティブな会話がありません');
    }

    if (!activePatientId) {
      throw new Error('患者が選択されていません');
    }

    // ローディング状態開始
    setLoading(true);
    setError(null);

    // 楽観的更新 - ユーザーメッセージを即座に追加
    const optimisticMessageId = `msg-${Date.now()}`;
    storeSendMessage(activeConversationId, {
      id: optimisticMessageId,
      content,
      messageType: 'simulator',
      timestamp: new Date().toISOString() as import('../types/core').ISODateTime,
      encounterId: encounterId!,
      status: 'sending',
    });

    try {
      // Server Actionを呼び出して患者応答を取得
      const formData = new FormData();
      formData.append('message', content);
      formData.append('conversationId', activeConversationId);
      
      const response = await sendChatMessage(formData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // 患者の応答を追加
      if (response.patientResponse) {
        addMessage(activeConversationId, {
          id: `msg-${Date.now()}-patient`,
          content: response.patientResponse,
          messageType: 'patient',
          timestamp: new Date().toISOString() as import('../types/core').ISODateTime,
          encounterId: encounterId!,
        });
      }
    } catch (error) {
      // エラー時は楽観的更新をロールバック
      removeMessage(activeConversationId, optimisticMessageId);
      
      // エラー状態を設定
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError({
        message: errorMessage,
        type: 'api_error',
        retry: () => sendMessage(content)
      });
      
      console.error('メッセージ送信エラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [storeSendMessage, addMessage, removeMessage, activeConversationId, activePatientId, encounterId]);

  const handleTyping = useCallback(() => {
    setTyping(true);
    
    // 既存のタイマーをクリア
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // デバウンス処理 - 1秒後にタイピング状態をfalseに
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  }, [setTyping]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryMessage = useCallback(async (messageId: string) => {
    if (!activeConversationId) {
      throw new Error('アクティブな会話がありません');
    }

    const conversation = conversations[activeConversationId];
    if (!conversation) {
      throw new Error('会話が見つかりません');
    }

    const message = conversation.messages.find(msg => msg.id === messageId);
    if (!message) {
      throw new Error('メッセージが見つかりません');
    }

    // 元のメッセージ内容で再送信
    await sendMessage(message.content);
  }, [activeConversationId, conversations, sendMessage]);

  return {
    conversation,
    isTyping,
    activeConversationId,
    currentPatient,
    error,
    isLoading,
    sendMessage,
    handleTyping,
    clearError,
    retryMessage,
  };
}