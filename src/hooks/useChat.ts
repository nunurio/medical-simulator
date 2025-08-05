import { useCallback, useRef } from 'react';
import { useStore } from './use-store';
import type { Patient } from '../types/state';
import { sendChatMessage } from '../app/actions/send-chat-message';

export interface UseChatReturn {
  // State
  isTyping: boolean;
  activeConversationId: string | null;
  currentPatient: Patient | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  handleTyping: () => void;
}

export function useChat(): UseChatReturn {
  const store = useStore();
  const { 
    // Chat store properties
    conversations,
    activeConversationId,
    isTyping,
    addMessage,
    sendMessage: storeSendMessage,
    removeMessage,
    setTyping,
    // Patient store properties
    patients,
    activePatientId
  } = store;
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentPatient = activePatientId 
    ? patients[activePatientId] 
    : null;

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversationId) {
      throw new Error('アクティブな会話がありません');
    }

    if (!activePatientId) {
      throw new Error('患者が選択されていません');
    }

    // 楽観的更新 - ユーザーメッセージを即座に追加
    const optimisticMessageId = `msg-${Date.now()}`;
    storeSendMessage(activeConversationId, {
      id: optimisticMessageId,
      content,
      sender: 'provider',
      timestamp: new Date().toISOString(),
      type: 'text',
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
          sender: 'patient',
          timestamp: new Date().toISOString(),
          type: 'text',
        });
      }
    } catch (error) {
      // エラー時は楽観的更新をロールバック
      removeMessage(activeConversationId, optimisticMessageId);
      console.error('メッセージ送信エラー:', error);
      throw error;
    }
  }, [storeSendMessage, addMessage, removeMessage, activeConversationId, activePatientId]);

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

  return {
    isTyping,
    activeConversationId,
    currentPatient,
    sendMessage,
    handleTyping,
  };
}