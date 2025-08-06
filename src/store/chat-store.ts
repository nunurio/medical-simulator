import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ChatStore } from '@/types/state';
import type { ChatConversation, ChatMessage } from '@/types/chat';
import type { EncounterId } from '@/types/core';
import { createISODateTime } from '@/types/core';

export const useChatStore = create<ChatStore>()(
  immer((set) => ({
    // State
    conversations: {},
    activeConversationId: null,
    isTyping: false,
    
    // Actions
    createConversation: (encounterId) => {
      const conversationId = `conv-${crypto.randomUUID()}`;
      set((state) => {
        state.conversations[conversationId] = {
          id: conversationId,
          encounterId,
          startedAt: createISODateTime(new Date().toISOString()),
          endedAt: null,
          lastActivityAt: createISODateTime(new Date().toISOString()),
          messages: [],
          status: 'active',
          participants: {
            patient: {
              role: 'patient',
              name: 'Patient',
            },
            provider: {
              role: 'provider',
              name: 'Provider',
            },
          },
        };
        state.activeConversationId = conversationId;
      });
      return conversationId;
    },
    
    addMessage: (conversationId, message) => {
      set((state) => {
        const conversation = state.conversations[conversationId];
        if (conversation) {
          conversation.messages.push(message);
          conversation.lastActivityAt = createISODateTime(new Date().toISOString());
          
          // メッセージ数制限（最新50件のみ保持）
          if (conversation.messages.length > 50) {
            conversation.messages = conversation.messages.slice(-50);
          }
        }
      });
    },
    
    sendMessage: (conversationId, message) => {
      set((state) => {
        const conversation = state.conversations[conversationId];
        if (conversation) {
          conversation.messages.push({
            ...message,
            timestamp: createISODateTime(new Date().toISOString()),
          });
          conversation.lastActivityAt = createISODateTime(new Date().toISOString());
        }
      });
    },
    
    removeMessage: (conversationId, messageId) => {
      set((state) => {
        const conversation = state.conversations[conversationId];
        if (conversation) {
          conversation.messages = conversation.messages.filter(msg => msg.id !== messageId);
          conversation.lastActivityAt = createISODateTime(new Date().toISOString());
        }
      });
    },
    
    setTyping: (isTyping) => set((state) => {
      state.isTyping = isTyping;
    }),
    
    setActiveConversation: (id) => set((state) => {
      state.activeConversationId = id;
    }),
    
    endConversation: (conversationId) => set((state) => {
      const conversation = state.conversations[conversationId];
      if (conversation) {
        conversation.endedAt = createISODateTime(new Date().toISOString());
        conversation.status = 'completed';
        conversation.lastActivityAt = createISODateTime(new Date().toISOString());
      }
      if (state.activeConversationId === conversationId) {
        state.activeConversationId = null;
      }
    }),

    // 会話履歴管理
    archiveOldConversations: (olderThanMs) => set((state) => {
      const now = Date.now();
      Object.values(state.conversations).forEach(conversation => {
        if (conversation.status === 'completed' && conversation.endedAt) {
          const endTime = new Date(conversation.endedAt).getTime();
          if (now - endTime >= olderThanMs) {
            conversation.status = 'archived';
          }
        }
      });
    }),

    searchConversations: (query) => {
      const state = useChatStore.getState();
      const results: Array<{ conversationId: string; messages: ChatMessage[] }> = [];
      
      Object.entries(state.conversations).forEach(([conversationId, conversation]) => {
        const matchingMessages = conversation.messages.filter(message => 
          message.content.includes(query)
        );
        if (matchingMessages.length > 0) {
          results.push({ conversationId, messages: matchingMessages });
        }
      });
      
      return results;
    },

    // コンテキスト管理
    updateConversationContext: (conversationId, context) => set((state) => {
      const conversation = state.conversations[conversationId];
      if (conversation) {
        if (!conversation.context) {
          conversation.context = {};
        }
        // ディープマージ
        conversation.context = {
          ...conversation.context,
          ...context,
          metadata: {
            ...conversation.context.metadata,
            ...context.metadata
          }
        };
      }
    }),

    // メッセージステータス管理
    updateMessageStatus: (conversationId, messageId, status) => set((state) => {
      const conversation = state.conversations[conversationId];
      if (conversation) {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
          message.status = status;
        }
      }
    }),

    confirmMessageDelivery: (conversationId, messageId, deliveryTime) => set((state) => {
      const conversation = state.conversations[conversationId];
      if (conversation) {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
          message.status = 'delivered';
          message.deliveredAt = deliveryTime;
        }
      }
    }),

    retryMessage: (conversationId, messageId) => set((state) => {
      const conversation = state.conversations[conversationId];
      if (conversation) {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
          message.status = 'sending';
          message.retryCount = (message.retryCount || 0) + 1;
        }
      }
    }),

    // リアルタイム通信とタイピング状態
    setParticipantTyping: (conversationId, participant, isTyping) => set((state) => {
      const conversation = state.conversations[conversationId];
      if (conversation) {
        if (!conversation.typingState) {
          conversation.typingState = {};
        }
        
        const typingKey = `${participant}Typing` as keyof typeof conversation.typingState;
        conversation.typingState[typingKey] = isTyping;
        conversation.typingState.lastTypingUpdate = Date.now();
      }
    }),

    cleanupStaleTypingStates: (timeoutMs) => set((state) => {
      const now = Date.now();
      Object.values(state.conversations).forEach(conversation => {
        if (conversation.typingState && conversation.typingState.lastTypingUpdate) {
          if (now - conversation.typingState.lastTypingUpdate >= timeoutMs) {
            conversation.typingState.patientTyping = false;
            conversation.typingState.providerTyping = false;
          }
        }
      });
    }),

    // セッション管理
    getSessionData: () => {
      const state = useChatStore.getState();
      return {
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        isTyping: state.isTyping
      };
    },

    restoreSessionData: (sessionData) => set((state) => {
      try {
        if (sessionData && typeof sessionData === 'object' && sessionData.conversations) {
          if (typeof sessionData.conversations === 'object') {
            state.conversations = sessionData.conversations;
          }
          if (sessionData.activeConversationId !== undefined) {
            state.activeConversationId = sessionData.activeConversationId;
          }
          if (typeof sessionData.isTyping === 'boolean') {
            state.isTyping = sessionData.isTyping;
          }
        }
      } catch (error) {
        console.error('セッションデータの復元に失敗:', error);
      }
    }),
  }))
);