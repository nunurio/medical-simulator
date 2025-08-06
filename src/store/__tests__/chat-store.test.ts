import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../chat-store';
import type { ChatMessage, PatientMessage, SimulatorMessage } from '@/types/chat';
import { createEncounterId, createISODateTime } from '@/types/core';

describe('ChatStore', () => {
  beforeEach(() => {
    // ストアの状態をリセット
    useChatStore.setState({
      conversations: {},
      activeConversationId: null,
      isTyping: false,
    });
  });

  describe('初期状態', () => {
    it('会話が空の状態で初期化される', () => {
      const store = useChatStore.getState();
      
      expect(store.conversations).toEqual({});
      expect(store.activeConversationId).toBeNull();
      expect(store.isTyping).toBe(false);
    });
  });

  describe('createConversation', () => {
    it('新しい会話を作成する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      
      const conversationId = store.createConversation(encounterId);
      
      expect(conversationId).toBeDefined();
      expect(conversationId).toMatch(/^conv-/);
      
      const updatedStore = useChatStore.getState();
      expect(updatedStore.conversations[conversationId]).toBeDefined();
      expect(updatedStore.conversations[conversationId].id).toBe(conversationId);
      expect(updatedStore.conversations[conversationId].encounterId).toBe(encounterId);
      expect(updatedStore.conversations[conversationId].messages).toEqual([]);
      expect(updatedStore.conversations[conversationId].startedAt).toBeDefined();
      expect(updatedStore.conversations[conversationId].endedAt).toBeNull();
    });

    it('複数の会話を作成する', () => {
      const store = useChatStore.getState();
      const encounterId1 = createEncounterId('encounter-001');
      const encounterId2 = createEncounterId('encounter-002');
      
      const conversationId1 = store.createConversation(encounterId1);
      const conversationId2 = store.createConversation(encounterId2);
      
      expect(conversationId1).not.toBe(conversationId2);
      
      const updatedStore = useChatStore.getState();
      expect(Object.keys(updatedStore.conversations)).toHaveLength(2);
    });
  });

  describe('addMessage', () => {
    it('会話にメッセージを追加する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);
      
      const message: PatientMessage = {
        id: 'msg-001',
        messageType: 'patient',
        encounterId,
        content: 'こんにちは、最近頭痛がひどくて...',
        timestamp: createISODateTime(new Date().toISOString()),
      };
      
      store.addMessage(conversationId, message);
      
      const updatedStore = useChatStore.getState();
      expect(updatedStore.conversations[conversationId].messages).toHaveLength(1);
      expect(updatedStore.conversations[conversationId].messages[0]).toEqual(message);
    });

    it('複数のメッセージを順番に追加する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);
      
      const fixedTimestamp = createISODateTime('2024-01-01T12:00:00Z');
      
      const message1: PatientMessage = {
        id: 'msg-001',
        messageType: 'patient',
        encounterId,
        content: 'こんにちは',
        timestamp: fixedTimestamp,
      };
      
      const message2: SimulatorMessage = {
        id: 'msg-002',
        messageType: 'simulator',
        encounterId,
        content: 'こんにちは。今日はどのような症状でいらっしゃいましたか？',
        timestamp: fixedTimestamp,
      };
      
      store.addMessage(conversationId, message1);
      store.addMessage(conversationId, message2);
      
      const updatedStore = useChatStore.getState();
      expect(updatedStore.conversations[conversationId].messages).toHaveLength(2);
      expect(updatedStore.conversations[conversationId].messages[0]).toEqual(message1);
      expect(updatedStore.conversations[conversationId].messages[1]).toEqual(message2);
    });

    it('存在しない会話にメッセージを追加しようとしてもエラーにならない', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      
      const message: PatientMessage = {
        id: 'msg-001',
        messageType: 'patient',
        encounterId,
        content: 'テスト',
        timestamp: createISODateTime(new Date().toISOString()),
      };
      
      // エラーが発生しないことを確認
      expect(() => {
        store.addMessage('non-existent-conversation', message);
      }).not.toThrow();
    });
  });

  describe('setTyping', () => {
    it('タイピング状態を設定する', () => {
      const store = useChatStore.getState();
      
      expect(store.isTyping).toBe(false);
      
      store.setTyping(true);
      expect(useChatStore.getState().isTyping).toBe(true);
      
      store.setTyping(false);
      expect(useChatStore.getState().isTyping).toBe(false);
    });
  });

  describe('setActiveConversation', () => {
    it('アクティブな会話を設定する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);
      
      expect(store.activeConversationId).toBeNull();
      
      store.setActiveConversation(conversationId);
      expect(useChatStore.getState().activeConversationId).toBe(conversationId);
    });

    it('存在しない会話IDを設定してもエラーにならない', () => {
      const store = useChatStore.getState();
      
      expect(() => {
        store.setActiveConversation('non-existent-conversation');
      }).not.toThrow();
      
      expect(useChatStore.getState().activeConversationId).toBe('non-existent-conversation');
    });
  });

  describe('endConversation', () => {
    it('会話を終了する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);
      
      // 会話が存在することを確認
      expect(useChatStore.getState().conversations[conversationId]).toBeDefined();
      expect(useChatStore.getState().conversations[conversationId].endedAt).toBeNull();
      
      store.endConversation(conversationId);
      
      const updatedStore = useChatStore.getState();
      expect(updatedStore.conversations[conversationId].endedAt).toBeDefined();
      expect(updatedStore.conversations[conversationId].endedAt).not.toBeNull();
    });

    it('アクティブな会話を終了するとactiveConversationIdがnullになる', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);
      
      store.setActiveConversation(conversationId);
      expect(useChatStore.getState().activeConversationId).toBe(conversationId);
      
      store.endConversation(conversationId);
      
      expect(useChatStore.getState().activeConversationId).toBeNull();
    });

    it('存在しない会話を終了しようとしてもエラーにならない', () => {
      const store = useChatStore.getState();
      
      expect(() => {
        store.endConversation('non-existent-conversation');
      }).not.toThrow();
    });
  });
});