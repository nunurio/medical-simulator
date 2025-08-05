import { POST } from '../route';
import { NextRequest } from 'next/server';
import { LLMService } from '@/services/llm-service';
import type { LLMResponse } from '@/types/llm';

// LLMServiceをモック
vi.mock('@/services/llm-service');

describe('POST /api/llm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系テスト', () => {
    it('有効なリクエストでLLMサービスを正常に呼び出し、disclaimerを含むレスポンスを返す', async () => {
      // Arrange: テストデータの準備
      const mockLLMResponse: LLMResponse = {
        content: 'これは医療シミュレーションの応答です。',
        model: 'gpt-4',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      };

      const mockLLMService = {
        generateCompletion: vi.fn().mockResolvedValue(mockLLMResponse),
        generatePatientPersona: vi.fn(),
        generateChatResponse: vi.fn(),
        generateExaminationFinding: vi.fn(),
        generateTestResult: vi.fn(),
      } as unknown as LLMService;
      vi.mocked(LLMService.getInstance).mockReturnValue(mockLLMService);

      const requestBody = {
        type: 'patient_generation',
        context: { age: '45', gender: 'female' },
        userPrompt: '45歳女性の患者を生成してください',
        temperature: 0.7,
        maxTokens: 1000,
      };

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Act: API Routeの実行
      const response = await POST(request);
      const result = await response.json();

      // Assert: レスポンスの検証
      expect(response.status).toBe(200);
      expect(result.content).toBe(mockLLMResponse.content);
      expect(result.disclaimer).toBe(
        '⚠️ この情報は医療シミュレーション教育目的のみです。実際の医療相談は必ず医師にお問い合わせください。'
      );
      expect(result.timestamp).toBeDefined();
      expect(result.requestType).toBe('patient_generation');
      expect(mockLLMService.generateCompletion).toHaveBeenCalledWith(requestBody);
    });
  });

  describe('バリデーションエラーテスト', () => {
    it('無効なリクエストボディで400エラーを返す', async () => {
      // Arrange
      const invalidRequestBody = {
        type: 'invalid_type', // 無効なtype
        userPrompt: '', // 空のuserPrompt
        temperature: 3, // 範囲外の値
      };

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.correlationId).toBeDefined();
    });

    it('JSONパースエラーで400エラーを返す', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('LLMサービスエラーテスト', () => {
    it('LLMサービスでエラーが発生した時に適切にハンドリングされる', async () => {
      // Arrange
      const mockLLMService = {
        generateCompletion: vi.fn().mockRejectedValue(new Error('LLM API error')),
        generatePatientPersona: vi.fn(),
        generateChatResponse: vi.fn(),
        generateExaminationFinding: vi.fn(),
        generateTestResult: vi.fn(),
      } as unknown as LLMService;
      vi.mocked(LLMService.getInstance).mockReturnValue(mockLLMService);

      const requestBody = {
        type: 'patient_generation',
        context: { age: '45', gender: 'female' },
        userPrompt: '45歳女性の患者を生成してください',
      };

      const request = new NextRequest('http://localhost:3000/api/llm', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.correlationId).toBeDefined();
    });
  });
});