import { describe, it, expect } from 'vitest';
import type {
  ChatMessage,
  PatientMessage,
  SimulatorMessage,
  SystemMessage,
  ActionMessage,
  ChatConversation,
  MessageRole,
  SymptomReport,
  PainScale,
  MoodIndicator,
  AvailableAction,
  ActionType
} from '../chat';
import type { EncounterId, ISODateTime } from '../core';
import { createEncounterId, createISODateTime } from '../core';

describe('Chat Types', () => {
  describe('Message Types', () => {
    it('should create patient message', () => {
      const message: PatientMessage = {
        id: 'msg-001',
        messageType: 'patient',
        content: '胸が痛くて息苦しいです',
        timestamp: createISODateTime('2024-03-15T10:00:00Z'),
        encounterId: createEncounterId('encounter-001'),
        symptoms: [
          {
            symptom: '胸痛',
            severity: 4,
            duration: '30分',
            triggers: ['労作時']
          }
        ],
        painLevel: 7,
        mood: 'anxious'
      };

      expect(message.messageType).toBe('patient');
      expect(message.content).toBe('胸が痛くて息苦しいです');
      expect(message.symptoms?.[0].symptom).toBe('胸痛');
      expect(message.painLevel).toBe(7);
    });

    it('should create simulator message', () => {
      const message: SimulatorMessage = {
        id: 'msg-002',
        messageType: 'simulator',
        content: '胸の痛みはいつから始まりましたか？',
        timestamp: createISODateTime('2024-03-15T10:01:00Z'),
        encounterId: createEncounterId('encounter-001'),
        actions: [
          {
            actionType: 'order_test',
            label: '心電図検査をオーダー',
            actionId: 'act-001'
          }
        ],
        clinicalNotes: '急性冠症候群の可能性を考慮'
      };

      expect(message.messageType).toBe('simulator');
      expect(message.actions?.[0].actionType).toBe('order_test');
      expect(message.clinicalNotes).toBe('急性冠症候群の可能性を考慮');
    });

    it('should create system message', () => {
      const message: SystemMessage = {
        id: 'msg-003',
        messageType: 'system',
        content: '心電図検査がオーダーされました',
        timestamp: createISODateTime('2024-03-15T10:02:00Z'),
        encounterId: createEncounterId('encounter-001'),
        metadata: {
          orderId: 'order-001',
          testType: 'ECG'
        }
      };

      expect(message.messageType).toBe('system');
      expect(message.metadata?.orderId).toBe('order-001');
    });

    it('should create action message', () => {
      const message: ActionMessage = {
        id: 'msg-004',
        messageType: 'action',
        content: '心電図検査の結果が出ました',
        timestamp: createISODateTime('2024-03-15T10:15:00Z'),
        encounterId: createEncounterId('encounter-001'),
        action: {
          actionType: 'view_result',
          label: '心電図結果を確認',
          actionId: 'act-002'
        },
        result: {
          status: 'completed',
          data: {
            findings: 'ST上昇あり'
          }
        }
      };

      expect(message.messageType).toBe('action');
      expect(message.action.actionType).toBe('view_result');
      expect(message.result?.status).toBe('completed');
    });
  });

  describe('Symptom Reporting', () => {
    it('should create symptom report', () => {
      const symptom: SymptomReport = {
        symptom: '頭痛',
        severity: 3,
        duration: '2時間',
        triggers: ['ストレス', '睡眠不足'],
        location: '前頭部',
        quality: 'ズキズキする'
      };

      expect(symptom.severity).toBe(3);
      expect(symptom.triggers).toContain('ストレス');
      expect(symptom.quality).toBe('ズキズキする');
    });

    it('should support pain scale values', () => {
      const painLevels: PainScale[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      painLevels.forEach(level => {
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(10);
      });
    });

    it('should support mood indicators', () => {
      const moods: MoodIndicator[] = ['calm', 'anxious', 'distressed', 'confused', 'irritable', 'depressed'];
      moods.forEach(mood => {
        expect(['calm', 'anxious', 'distressed', 'confused', 'irritable', 'depressed']).toContain(mood);
      });
    });
  });

  describe('Actions', () => {
    it('should create available action', () => {
      const action: AvailableAction = {
        actionType: 'order_medication',
        label: 'ニトログリセリン舌下錠を投与',
        actionId: 'act-003',
        category: 'treatment',
        urgency: 'stat'
      };

      expect(action.actionType).toBe('order_medication');
      expect(action.category).toBe('treatment');
      expect(action.urgency).toBe('stat');
    });

    it('should support action types', () => {
      const actionTypes: ActionType[] = [
        'order_test',
        'order_medication',
        'order_imaging',
        'view_result',
        'physical_exam',
        'ask_question',
        'provide_education',
        'consult_specialist'
      ];
      
      actionTypes.forEach(type => {
        expect([
          'order_test',
          'order_medication', 
          'order_imaging',
          'view_result',
          'physical_exam',
          'ask_question',
          'provide_education',
          'consult_specialist'
        ]).toContain(type);
      });
    });
  });

  describe('Chat Conversation', () => {
    it('should create chat conversation', () => {
      const conversation: ChatConversation = {
        id: 'conv-001',
        encounterId: createEncounterId('encounter-001'),
        startedAt: createISODateTime('2024-03-15T10:00:00Z'),
        lastActivityAt: createISODateTime('2024-03-15T10:15:00Z'),
        messages: [],
        status: 'active',
        participants: {
          patient: {
            role: 'patient',
            name: '山田太郎'
          },
          provider: {
            role: 'provider',
            name: 'AI医師'
          }
        }
      };

      expect(conversation.status).toBe('active');
      expect(conversation.participants.patient.role).toBe('patient');
      expect(conversation.participants.provider.role).toBe('provider');
    });

    it('should support message roles', () => {
      const roles: MessageRole[] = ['patient', 'provider', 'system'];
      roles.forEach(role => {
        expect(['patient', 'provider', 'system']).toContain(role);
      });
    });
  });
});