import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendChatMessage } from '../send-chat-message';

// モックの設定
vi.mock('../../../services/llm-service', () => ({
  LLMService: {
    getInstance: vi.fn(() => ({
      generateChatResponse: vi.fn(),
    })),
  },
}));

vi.mock('../../../store/chat-store', () => ({
  useChatStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../../../store/patient-store', () => ({
  usePatientStore: {
    getState: vi.fn(),
  },
}));

describe('sendChatMessage Server Action', () => {
  const mockLLMService = {
    generateChatResponse: vi.fn(),
  };

  const mockChatState = {
    conversations: {
      'test-conv-1': {
        id: 'test-conv-1',
        encounterId: 'encounter-1',
        messages: [
          {
            id: 'msg-1',
            content: 'こんにちは',
            sender: 'provider',
            timestamp: '2024-01-01T00:00:00Z',
            type: 'text',
          },
        ],
        participants: {
          patient: { role: 'patient', name: 'Test Patient' },
          provider: { role: 'provider', name: 'Dr. Test' },
        },
      },
    },
  };

  const mockPatientState = {
    patients: {
      'patient-1': {
        id: 'patient-1',
        demographics: {
          name: 'Test Patient',
          age: 30,
          gender: 'male' as const,
          dateOfBirth: '1994-01-01',
        },
        medicalHistory: {
          allergies: [],
          medications: [],
          conditions: [],
        },
        currentConditions: [
          {
            name: '胸痛',
            severity: 'moderate' as const,
            isActive: true,
          },
        ],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 120, diastolic: 80 },
            heartRate: 75,
            respiratoryRate: 16,
            temperature: 36.5,
            oxygenSaturation: 98,
          },
        },
      },
    },
    activePatientId: 'patient-1',
  };

  beforeEach(async () => {
    // LLMServiceのモック設定
    const { LLMService } = await import('../../../services/llm-service');
    vi.mocked(LLMService.getInstance).mockReturnValue(mockLLMService as any);

    // ストアのモック設定
    const { useChatStore } = await import('../../../store/chat-store');
    const { usePatientStore } = await import('../../../store/patient-store');
    
    vi.mocked(useChatStore.getState).mockReturnValue(mockChatState as any);
    vi.mocked(usePatientStore.getState).mockReturnValue(mockPatientState as any);

    // LLMServiceのレスポンスモック
    mockLLMService.generateChatResponse.mockResolvedValue({
      content: 'ありがとうございます、先生。胸の痛みが続いています。',
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なFormData処理', () => {
    it('正常なFormDataを処理して患者応答を返す', async () => {
      const formData = new FormData();
      formData.append('message', 'どのような症状がありますか？');
      formData.append('conversationId', 'test-conv-1');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(true);
      expect(result.patientResponse).toBe('ありがとうございます、先生。胸の痛みが続いています。');
      expect(result.error).toBeUndefined();
    });

    it('メッセージが空の場合はエラーを返す', async () => {
      const formData = new FormData();
      formData.append('message', '');
      formData.append('conversationId', 'test-conv-1');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('メッセージまたは会話IDが不正です');
    });

    it('会話IDが空の場合はエラーを返す', async () => {
      const formData = new FormData();
      formData.append('message', 'テストメッセージ');
      formData.append('conversationId', '');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('メッセージまたは会話IDが不正です');
    });

    it('存在しない会話IDの場合はエラーを返す', async () => {
      const formData = new FormData();
      formData.append('message', 'テストメッセージ');
      formData.append('conversationId', 'non-existent-conv');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('会話が見つかりません');
    });
  });

  describe('LLMService統合', () => {
    it('適切な患者コンテキストでLLMServiceを呼び出す', async () => {
      const formData = new FormData();
      formData.append('message', 'どのような症状がありますか？');
      formData.append('conversationId', 'test-conv-1');

      await sendChatMessage(formData);

      expect(mockLLMService.generateChatResponse).toHaveBeenCalledWith(
        'どのような症状がありますか？',
        expect.objectContaining({
          patient: expect.objectContaining({
            demographics: expect.objectContaining({
              name: 'Test Patient',
              age: 30,
              gender: 'male',
            }),
            currentConditions: expect.arrayContaining([
              expect.objectContaining({
                name: '胸痛',
              }),
            ]),
          }),
          conversationHistory: expect.arrayContaining([
            expect.objectContaining({
              content: 'こんにちは',
              sender: 'provider',
            }),
          ]),
        })
      );
    });

    it('LLMServiceエラー時に適切にハンドリングする', async () => {
      mockLLMService.generateChatResponse.mockRejectedValue(new Error('API呼び出しエラー'));

      const formData = new FormData();
      formData.append('message', 'テストメッセージ');
      formData.append('conversationId', 'test-conv-1');

      const result = await sendChatMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('患者応答の生成に失敗しました');
    });
  });

  describe('患者コンテキストの構築', () => {
    it('患者の基本情報を含むコンテキストを構築する', async () => {
      const formData = new FormData();
      formData.append('message', 'テストメッセージ');
      formData.append('conversationId', 'test-conv-1');

      await sendChatMessage(formData);

      const contextArg = mockLLMService.generateChatResponse.mock.calls[0][1];
      
      expect(contextArg.patient.demographics.name).toBe('Test Patient');
      expect(contextArg.patient.demographics.age).toBe(30);
      expect(contextArg.patient.demographics.gender).toBe('male');
    });

    it('患者の症状・既往歴を含むコンテキストを構築する', async () => {
      const formData = new FormData();
      formData.append('message', 'テストメッセージ');
      formData.append('conversationId', 'test-conv-1');

      await sendChatMessage(formData);

      const contextArg = mockLLMService.generateChatResponse.mock.calls[0][1];
      
      expect(contextArg.patient.currentConditions).toHaveLength(1);
      expect(contextArg.patient.currentConditions[0].name).toBe('胸痛');
      expect(contextArg.patient.vitalSigns.baseline.heartRate).toBe(75);
    });

    it('会話履歴を含むコンテキストを構築する', async () => {
      const formData = new FormData();
      formData.append('message', 'テストメッセージ');
      formData.append('conversationId', 'test-conv-1');

      await sendChatMessage(formData);

      const contextArg = mockLLMService.generateChatResponse.mock.calls[0][1];
      
      expect(contextArg.conversationHistory).toHaveLength(1);
      expect(contextArg.conversationHistory[0].content).toBe('こんにちは');
      expect(contextArg.conversationHistory[0].sender).toBe('provider');
    });
  });
});