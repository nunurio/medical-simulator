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
          conversation.messages.push({
            ...message,
            timestamp: createISODateTime(new Date().toISOString()),
          });
          conversation.lastActivityAt = createISODateTime(new Date().toISOString());
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
  }))
);