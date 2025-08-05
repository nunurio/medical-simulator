import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ChatStore, ChatConversation, ChatMessage, EncounterId } from '@/types/state';

export const useChatStore = create<ChatStore>()(
  immer((set) => ({
    // State
    conversations: {},
    activeConversationId: null,
    isTyping: false,
    
    // Actions
    createConversation: (encounterId) => {
      const conversationId = crypto.randomUUID();
      set((state) => {
        state.conversations[conversationId] = {
          id: conversationId,
          encounterId,
          startTime: new Date().toISOString() as any,
          endTime: null,
          messages: [],
          summary: '',
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
            timestamp: new Date().toISOString() as any,
          });
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
        conversation.endTime = new Date().toISOString() as any;
      }
      if (state.activeConversationId === conversationId) {
        state.activeConversationId = null;
      }
    }),
  }))
);