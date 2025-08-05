import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendChatMessage } from '../app/actions/send-chat-message';

// 統合テスト: Server Actionの動作確認
vi.mock('../services/llm-service', () => ({
  LLMService: {
    getInstance: vi.fn(() => ({
      generateChatResponse: vi.fn().mockResolvedValue({
        content: 'こんにちは、先生。胸の痛みについて相談させてください。',
        usage: {
          promptTokens: 50,
          completionTokens: 30,
          totalTokens: 80,
        },
      }),
    })),
  },
}));

vi.mock('../store/chat-store', () => ({
  useChatStore: {
    getState: vi.fn(() => ({
      conversations: {
        'test-conv-1': {
          id: 'test-conv-1',
          encounterId: 'encounter-1',
          messages: [],
          participants: {
            patient: { role: 'patient', name: 'Test Patient' },
            provider: { role: 'provider', name: 'Dr. Test' },
          },
        },
      },
    })),
  },
}));

vi.mock('../store/patient-store', () => ({
  usePatientStore: {
    getState: vi.fn(() => ({
      patients: {
        'patient-1': {
          id: 'patient-1',
          demographics: {
            name: '田中太郎',
            age: 45,
            gender: 'male',
            dateOfBirth: '1979-01-01',
          },
          medicalHistory: {
            allergies: [],
            medications: [],
            conditions: [],
          },
          currentConditions: [
            {
              name: '胸痛',
              severity: 'moderate',
              isActive: true,
            },
          ],
          vitalSigns: {
            baseline: {
              bloodPressure: { systolic: 140, diastolic: 90 },
              heartRate: 80,
              respiratoryRate: 18,
              temperature: 36.8,
              oxygenSaturation: 97,
            },
          },
        },
      },
      activePatientId: 'patient-1',
    })),
  },
}));

describe('チャット機能統合テスト', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Server Action統合テスト', () => {
    it('sendChatMessage Server Actionが直接動作する', async () => {
      // FormDataを作成
      const formData = new FormData();
      formData.append('message', 'テスト統合メッセージ');
      formData.append('conversationId', 'test-conv-1');

      // Server Actionを直接呼び出し
      const result = await sendChatMessage(formData);

      expect(result.success).toBe(true);
      expect(result.patientResponse).toBeTruthy();
      expect(typeof result.patientResponse).toBe('string');
      expect(result.usage).toBeTruthy();
    });

    it('正常なレスポンス形式を返す', async () => {
      const formData = new FormData();
      formData.append('message', 'テストメッセージ');
      formData.append('conversationId', 'test-conv-1');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(true);
      expect(result.patientResponse).toBe('こんにちは、先生。胸の痛みについて相談させてください。');
      expect(result.usage).toEqual({
        promptTokens: 50,
        completionTokens: 30,
        totalTokens: 80,
      });
    });

    it('FormDataバリデーションが動作する', async () => {
      // 空のメッセージでテスト
      const formData = new FormData();
      formData.append('message', '');
      formData.append('conversationId', 'test-conv-1');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('メッセージまたは会話IDが不正です');
    });

    it('存在しない会話IDでエラーハンドリングが動作する', async () => {
      const formData = new FormData();
      formData.append('message', 'テスト');
      formData.append('conversationId', 'non-existent-conv');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('会話が見つかりません');
    });
  });

  describe('エラーケース統合テスト', () => {
    it('不正な会話IDのバリデーションが動作する', async () => {
      const formData = new FormData();
      formData.append('message', 'テスト');
      formData.append('conversationId', 'invalid-conversation-id');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('会話が見つかりません');
    });
  });
});