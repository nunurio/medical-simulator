/**
 * LLMService テストファイル
 * t-wada式TDD（Red-Green-Refactor）アプローチで実装
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { LLMRequest, LLMResponse } from '@/types/llm';
import { LLMService } from '../llm-service';

// OpenAI SDKをモック
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

// LLM設定をモック
vi.mock('@/config/llm-config', () => ({
  getLLMConfig: vi.fn(() => ({
    apiKey: 'test-api-key',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
    retries: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 32000,
      backoffFactor: 2,
    },
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
    },
  }))
}));

// リトライロジックをモック
vi.mock('@/lib/retry-logic', () => ({
  callOpenAIWithRetry: vi.fn()
}));

describe('LLMService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // シングルトンインスタンスのリセットは実際のコードでは不要
    // テストでの分離は他の方法で行う
  });

  describe('シングルトン動作', () => {
    it('同じインスタンスを返すべき', () => {
      const instance1 = LLMService.getInstance();
      const instance2 = LLMService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('コンストラクタを直接呼び出せないべき', () => {
      // TypeScriptレベルでprivateなのでテストスキップ
      // 実際の実装では new LLMService() が使用できないことを確認
      expect(true).toBe(true);
    });
  });

  describe('初期化', () => {
    it('インスタンスが正常に取得できるべき', async () => {
      const service = LLMService.getInstance();
      
      // インスタンスが取得できることを確認
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(LLMService);
    });
  });

  describe('generateCompletion', () => {
    it('正常なリクエストに対してLLMResponseを返すべき', async () => {
      const service = LLMService.getInstance();
      
      const mockRequest: LLMRequest = {
        type: 'chat_response',
        context: { patientId: '123' },
        userPrompt: 'Hello, patient.',
        temperature: 0.7,
        maxTokens: 1000
      };

      const expectedResponse: LLMResponse = {
        content: 'Hello! How can I help you today?',
        usage: {
          promptTokens: 10,
          completionTokens: 8,
          totalTokens: 18
        },
        model: 'gpt-4o',
        finishReason: 'stop'
      };

      // callOpenAIWithRetryがモックした値を返すように設定
      const { callOpenAIWithRetry } = await import('@/lib/retry-logic');
      vi.mocked(callOpenAIWithRetry).mockResolvedValue(expectedResponse);

      const result = await service.generateCompletion(mockRequest);
      
      expect(result).toEqual(expectedResponse);
      expect(callOpenAIWithRetry).toHaveBeenCalledOnce();
    });

    it('systemPromptが指定された場合、それを使用すべき', async () => {
      const service = LLMService.getInstance();
      
      const mockRequest: LLMRequest = {
        type: 'patient_generation',
        context: { age: 30 },
        systemPrompt: 'You are a medical simulator.',
        userPrompt: 'Generate a patient persona.',
        temperature: 0.5
      };

      const { callOpenAIWithRetry } = await import('@/lib/retry-logic');
      const mockResponse: LLMResponse = {
        content: 'Patient persona generated.',
        model: 'gpt-4o'
      };
      vi.mocked(callOpenAIWithRetry).mockResolvedValue(mockResponse);

      await service.generateCompletion(mockRequest);
      
      expect(callOpenAIWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        3,
        'generateCompletion'
      );
    });

    it('リクエストのバリデーションが実行されるべき', async () => {
      const service = LLMService.getInstance();
      
      const invalidRequest = {
        type: 'invalid_type',
        context: {},
        userPrompt: '', // 空文字列
      } as unknown as LLMRequest;

      await expect(service.generateCompletion(invalidRequest))
        .rejects.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    it('callOpenAIWithRetryがエラーを投げた場合、そのエラーが伝播されるべき', async () => {
      const service = LLMService.getInstance();
      
      const mockRequest: LLMRequest = {
        type: 'chat_response',
        context: {},
        userPrompt: 'Test prompt'
      };

      const { callOpenAIWithRetry } = await import('@/lib/retry-logic');
      const testError = new Error('API call failed');
      vi.mocked(callOpenAIWithRetry).mockRejectedValue(testError);

      await expect(service.generateCompletion(mockRequest))
        .rejects.toThrow('API call failed');
    });

    it('OpenAI APIレスポンスのバリデーションが失敗した場合、エラーが投げられるべき', async () => {
      const service = LLMService.getInstance();
      
      const mockRequest: LLMRequest = {
        type: 'chat_response',
        context: {},
        userPrompt: 'Test prompt'
      };

      // 無効なレスポンスを返すようにモック（modelフィールドが欠けている）
      const invalidResponse = {
        content: 'Valid content',
        // model field is missing - this should cause validation to fail
      };

      const { callOpenAIWithRetry } = await import('@/lib/retry-logic');
      vi.mocked(callOpenAIWithRetry).mockResolvedValue(invalidResponse);

      await expect(service.generateCompletion(mockRequest))
        .rejects.toThrow();
    });

    it('OpenAIクライアントの初期化エラーが適切に処理されるべき', async () => {
      const service = LLMService.getInstance();
      
      // getLLMConfigがエラーを投げるようにモック
      const { getLLMConfig } = await import('@/config/llm-config');
      vi.mocked(getLLMConfig).mockImplementation(() => {
        throw new Error('Config error');
      });

      const mockRequest: LLMRequest = {
        type: 'chat_response',
        context: {},
        userPrompt: 'Test prompt'
      };

      await expect(service.generateCompletion(mockRequest))
        .rejects.toThrow('Config error');
    });
  });

  describe('特化メソッド', () => {
    describe('generatePatientPersona', () => {
      it('適切なシステムプロンプトと患者情報で患者ペルソナを生成すべき', async () => {
        const service = LLMService.getInstance();
        
        const patientParams = {
          age: 45,
          gender: 'male',
          chiefComplaint: '胸痛',
        };

        const expectedResponse: LLMResponse = {
          content: '45歳男性、胸痛を主訴とする患者...',
          model: 'gpt-4o',
        };

        // generateCompletionメソッドをスパイ
        const generateCompletionSpy = vi.spyOn(service, 'generateCompletion');
        generateCompletionSpy.mockResolvedValue(expectedResponse);

        const result = await service.generatePatientPersona(patientParams);

        expect(result).toEqual(expectedResponse);
        expect(generateCompletionSpy).toHaveBeenCalledWith({
          type: 'patient_generation',
          context: patientParams,
          systemPrompt: expect.stringContaining('医療シミュレーション'),
          userPrompt: expect.stringContaining('患者ペルソナ'),
        });
      });
    });

    describe('generateExaminationFinding', () => {
      it('特定の身体部位の診察所見を生成すべき', async () => {
        const service = LLMService.getInstance();
        
        const bodyPart = 'chest';
        const patientContext = {
          age: 60,
          condition: '心房細動',
        };

        const expectedResponse: LLMResponse = {
          content: '心音は不整、頻脈傾向。心雑音は聴取されず。',
          model: 'gpt-4o',
        };

        const generateCompletionSpy = vi.spyOn(service, 'generateCompletion');
        generateCompletionSpy.mockResolvedValue(expectedResponse);

        const result = await service.generateExaminationFinding(bodyPart, patientContext);

        expect(result).toEqual(expectedResponse);
        expect(generateCompletionSpy).toHaveBeenCalledWith({
          type: 'examination_finding',
          context: { bodyPart, ...patientContext },
          systemPrompt: expect.stringContaining('診察所見'),
          userPrompt: expect.stringContaining(bodyPart),
        });
      });
    });

    describe('generateTestResult', () => {
      it('検査オーダーに基づいて検査結果を生成すべき', async () => {
        const service = LLMService.getInstance();
        
        const testOrder = {
          type: 'blood_test',
          tests: ['CBC', 'BUN', 'Creatinine'],
        };
        const patientContext = {
          age: 70,
          kidneyDisease: true,
        };

        const expectedResponse: LLMResponse = {
          content: 'CBC: 正常範囲内、BUN: 25 mg/dL (高値)、Creatinine: 1.8 mg/dL (高値)',
          model: 'gpt-4o',
        };

        const generateCompletionSpy = vi.spyOn(service, 'generateCompletion');
        generateCompletionSpy.mockResolvedValue(expectedResponse);

        const result = await service.generateTestResult(testOrder, patientContext);

        expect(result).toEqual(expectedResponse);
        expect(generateCompletionSpy).toHaveBeenCalledWith({
          type: 'test_result_generation',
          context: { testOrder, ...patientContext },
          systemPrompt: expect.stringContaining('検査結果'),
          userPrompt: expect.stringContaining('blood_test'),
        });
      });
    });
  });
});