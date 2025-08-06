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

  describe('会話履歴管理とキャッシュ', () => {
    it('会話履歴を最新N件に制限する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);
      
      // 多数のメッセージを追加（例: 100件）
      for (let i = 0; i < 100; i++) {
        const message: PatientMessage = {
          id: `msg-${i.toString().padStart(3, '0')}`,
          messageType: 'patient',
          encounterId,
          content: `メッセージ ${i}`,
          timestamp: createISODateTime(new Date().toISOString()),
        };
        store.addMessage(conversationId, message);
      }

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      
      // 最大メッセージ数は50件に制限されるべき
      expect(conversation.messages).toHaveLength(50);
      expect(conversation.messages[0].content).toBe('メッセージ 50');
      expect(conversation.messages[49].content).toBe('メッセージ 99');
    });

    it('古い会話を自動的にアーカイブする', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      // 会話を終了して一定時間経過をシミュレート
      store.endConversation(conversationId);
      
      // アーカイブ処理を実行（即座にアーカイブ）
      store.archiveOldConversations(0);

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      
      expect(conversation.status).toBe('archived');
    });

    it('アーカイブされた会話から検索できる', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);
      
      const searchMessage: PatientMessage = {
        id: 'msg-search',
        messageType: 'patient',
        encounterId,
        content: '特殊な症状について相談したい',
        timestamp: createISODateTime(new Date().toISOString()),
      };
      
      store.addMessage(conversationId, searchMessage);
      store.endConversation(conversationId);
      store.archiveOldConversations(0);

      const results = store.searchConversations('特殊な症状');
      
      expect(results).toHaveLength(1);
      expect(results[0].conversationId).toBe(conversationId);
      expect(results[0].messages[0].content).toContain('特殊な症状');
    });
  });

  describe('コンテキスト情報管理', () => {
    it('患者コンテキストを会話に保存する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      const patientContext = {
        patientId: 'patient-123',
        sessionId: 'session-456',
        metadata: {
          simulationPhase: 'initial_assessment',
          difficulty: 'intermediate',
          objectives: ['diagnose_condition', 'recommend_treatment']
        }
      };

      store.updateConversationContext(conversationId, patientContext);

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      
      expect(conversation.context).toEqual(patientContext);
    });

    it('コンテキスト情報を部分的に更新できる', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      const initialContext = {
        patientId: 'patient-123',
        sessionId: 'session-456',
        metadata: { simulationPhase: 'initial_assessment' }
      };

      store.updateConversationContext(conversationId, initialContext);

      const updatedContext = {
        metadata: { 
          simulationPhase: 'diagnosis_phase',
          currentSymptoms: ['headache', 'nausea'] 
        }
      };

      store.updateConversationContext(conversationId, updatedContext);

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      
      expect(conversation.context.patientId).toBe('patient-123');
      expect(conversation.context.sessionId).toBe('session-456');
      expect(conversation.context.metadata.simulationPhase).toBe('diagnosis_phase');
      expect(conversation.context.metadata.currentSymptoms).toEqual(['headache', 'nausea']);
    });

    it('無効な会話IDでコンテキスト更新してもエラーにならない', () => {
      const store = useChatStore.getState();

      expect(() => {
        store.updateConversationContext('invalid-id', { patientId: 'test' });
      }).not.toThrow();
    });
  });

  describe('メッセージ永続化とステータス管理', () => {
    it('メッセージ送信ステータスを管理する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      const messageId = 'msg-pending';
      const message: PatientMessage = {
        id: messageId,
        messageType: 'patient',
        encounterId,
        content: 'テストメッセージ',
        timestamp: createISODateTime(new Date().toISOString()),
        status: 'sending'
      };

      store.addMessage(conversationId, message);
      
      // ステータスを更新
      store.updateMessageStatus(conversationId, messageId, 'delivered');

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      const updatedMessage = conversation.messages.find(m => m.id === messageId);
      
      expect(updatedMessage?.status).toBe('delivered');
    });

    it('メッセージ配信確認を処理する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      const messageId = 'msg-confirm';
      const message: PatientMessage = {
        id: messageId,
        messageType: 'patient',
        encounterId,
        content: 'テストメッセージ',
        timestamp: createISODateTime(new Date().toISOString()),
        status: 'sending'
      };

      store.addMessage(conversationId, message);
      
      const deliveryTime = createISODateTime(new Date().toISOString());
      store.confirmMessageDelivery(conversationId, messageId, deliveryTime);

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      const confirmedMessage = conversation.messages.find(m => m.id === messageId);
      
      expect(confirmedMessage?.status).toBe('delivered');
      expect(confirmedMessage?.deliveredAt).toBe(deliveryTime);
    });

    it('失敗したメッセージを再試行できる', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      const messageId = 'msg-retry';
      const message: PatientMessage = {
        id: messageId,
        messageType: 'patient',
        encounterId,
        content: 'リトライメッセージ',
        timestamp: createISODateTime(new Date().toISOString()),
        status: 'failed'
      };

      store.addMessage(conversationId, message);
      
      // メッセージをリトライ
      store.retryMessage(conversationId, messageId);

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      const retriedMessage = conversation.messages.find(m => m.id === messageId);
      
      expect(retriedMessage?.status).toBe('sending');
      expect(retriedMessage?.retryCount).toBe(1);
    });
  });

  describe('リアルタイム通信とタイピング状態', () => {
    it('個別会話のタイピング状態を管理する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      // 患者がタイピング中
      store.setParticipantTyping(conversationId, 'patient', true);

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      
      expect(conversation.typingState?.patientTyping).toBe(true);
      expect(conversation.typingState?.lastTypingUpdate).toBeDefined();
    });

    it('タイピング状態のタイムアウトを処理する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      // タイピング開始
      store.setParticipantTyping(conversationId, 'patient', true);

      // タイムアウト処理（即座にタイムアウト）
      store.cleanupStaleTypingStates(0);

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      
      expect(conversation.typingState?.patientTyping).toBe(false);
    });

    it('複数参加者のタイピング状態を同時に管理する', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      // 患者とプロバイダーが同時にタイピング
      store.setParticipantTyping(conversationId, 'patient', true);
      store.setParticipantTyping(conversationId, 'provider', true);

      const updatedStore = useChatStore.getState();
      const conversation = updatedStore.conversations[conversationId];
      
      expect(conversation.typingState?.patientTyping).toBe(true);
      expect(conversation.typingState?.providerTyping).toBe(true);
    });
  });

  describe('セッション管理と持続化', () => {
    it('会話セッションを保存・復元できる', () => {
      const store = useChatStore.getState();
      const encounterId = createEncounterId('encounter-001');
      const conversationId = store.createConversation(encounterId);

      const message: PatientMessage = {
        id: 'msg-persist',
        messageType: 'patient',
        encounterId,
        content: '保存テストメッセージ',
        timestamp: createISODateTime(new Date().toISOString()),
      };

      store.addMessage(conversationId, message);
      
      // セッションデータを取得
      const sessionData = store.getSessionData();
      
      expect(sessionData.conversations[conversationId]).toBeDefined();
      expect(sessionData.conversations[conversationId].messages).toHaveLength(1);

      // 新しいストア状態でセッションを復元
      useChatStore.setState({
        conversations: {},
        activeConversationId: null,
        isTyping: false,
      });

      store.restoreSessionData(sessionData);

      const restoredStore = useChatStore.getState();
      expect(restoredStore.conversations[conversationId]).toBeDefined();
      expect(restoredStore.conversations[conversationId].messages).toHaveLength(1);
      expect(restoredStore.conversations[conversationId].messages[0].content).toBe('保存テストメッセージ');
    });

    it('無効なセッションデータでも安全に処理する', () => {
      const store = useChatStore.getState();

      expect(() => {
        store.restoreSessionData(null);
      }).not.toThrow();

      expect(() => {
        store.restoreSessionData({});
      }).not.toThrow();

      expect(() => {
        store.restoreSessionData({ conversations: 'invalid' });
      }).not.toThrow();
    });
  });
});