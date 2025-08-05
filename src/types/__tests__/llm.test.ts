import {
  LLMPromptTypeSchema,
  LLMRequestSchema,
  LLMResponseSchema,
  LLMError,
  type LLMPromptType,
  type LLMRequest,
  type LLMResponse,
} from '../llm';

describe('LLM Type Definitions', () => {
  describe('LLMPromptTypeSchema', () => {
    it('should validate correct prompt types', () => {
      const validTypes = [
        'patient_generation',
        'chat_response',
        'examination_finding',
        'test_result_generation',
        'clinical_update',
      ];

      validTypes.forEach((type) => {
        expect(LLMPromptTypeSchema.parse(type)).toBe(type);
      });
    });

    it('should reject invalid prompt types', () => {
      const invalidTypes = ['invalid_type', '', 'PATIENT_GENERATION', 123];

      invalidTypes.forEach((type) => {
        expect(() => LLMPromptTypeSchema.parse(type)).toThrow();
      });
    });
  });

  describe('LLMRequestSchema', () => {
    it('should validate a valid LLM request', () => {
      const validRequest = {
        type: 'patient_generation' as const,
        context: { age: 45, gender: 'male' },
        userPrompt: 'Generate a patient with hypertension',
        temperature: 0.7,
        maxTokens: 1000,
      };

      const result = LLMRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should require type and userPrompt', () => {
      const invalidRequest = {
        context: {},
      };

      expect(() => LLMRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should validate temperature range (0-2)', () => {
      const requestWithInvalidTemp = {
        type: 'chat_response',
        context: {},
        userPrompt: 'Test prompt',
        temperature: 3, // Invalid: > 2
      };

      expect(() => LLMRequestSchema.parse(requestWithInvalidTemp)).toThrow('温度パラメータが高すぎます');
    });

    it('should validate maxTokens as positive integer', () => {
      const requestWithInvalidTokens = {
        type: 'chat_response',
        context: {},
        userPrompt: 'Test prompt',
        maxTokens: -100, // Invalid: negative
      };

      expect(() => LLMRequestSchema.parse(requestWithInvalidTokens)).toThrow('最大トークン数が低すぎます');
    });
  });

  describe('LLMResponseSchema', () => {
    it('should validate a valid LLM response', () => {
      const validResponse = {
        content: 'Generated content',
        model: 'gpt-4',
        usage: {
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
        },
        finishReason: 'stop',
      };

      const result = LLMResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should require content and model', () => {
      const invalidResponse = {
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      expect(() => LLMResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('LLMError', () => {
    it('should create an error with required properties', () => {
      const error = new LLMError('API request failed', 'API_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('API request failed');
      expect(error.code).toBe('API_ERROR');
      expect(error.name).toBe('LLMError');
    });

    it('should include optional properties', () => {
      const error = new LLMError(
        'Rate limit exceeded',
        'RATE_LIMIT',
        429,
        60
      );

      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
    });

    it('should validate error codes', () => {
      const validCodes = ['RATE_LIMIT', 'API_ERROR', 'NETWORK_ERROR', 'VALIDATION_ERROR'];
      
      validCodes.forEach(code => {
        const error = new LLMError('Test error', code as 'RATE_LIMIT' | 'API_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR');
        expect(error.code).toBe(code);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with TypeScript types correctly', () => {
      // TypeScript コンパイルテスト - 型エラーなく実行できることを確認
      const request: LLMRequest = {
        type: 'patient_generation',
        context: { patientAge: 65 },
        userPrompt: 'Generate elderly patient',
        temperature: 1.0,
        maxTokens: 500,
      };

      const response: LLMResponse = {
        content: 'Generated patient data',
        model: 'gpt-4',
        usage: {
          promptTokens: 50,
          completionTokens: 100,
          totalTokens: 150,
        },
      };

      expect(LLMRequestSchema.parse(request)).toEqual(request);
      expect(LLMResponseSchema.parse(response)).toEqual(response);
    });

    it('should validate complete medical scenario workflow', () => {
      const patientGenerationRequest = {
        type: 'patient_generation' as const,
        context: {
          scenario: 'emergency',
          chiefComplaint: 'chest pain',
          age: 55,
          severity: 'high',
        },
        systemPrompt: 'You are a medical simulator generating realistic patient personas.',
        userPrompt: 'Create a patient with acute chest pain presenting to the emergency department.',
        temperature: 0.8,
        maxTokens: 800,
      };

      const result = LLMRequestSchema.parse(patientGenerationRequest);
      expect(result.type).toBe('patient_generation');
      expect(result.context.scenario).toBe('emergency');
      expect(result.temperature).toBe(0.8);
    });

    it('should handle error scenarios in medical context', () => {
      const validationError = new LLMError(
        'Invalid patient data format',
        'VALIDATION_ERROR'
      );

      const apiError = new LLMError(
        'Medical API unavailable',
        'API_ERROR',
        503,
        300
      );

      expect(validationError.code).toBe('VALIDATION_ERROR');
      expect(apiError.statusCode).toBe(503);
      expect(apiError.retryAfter).toBe(300);
    });
  });
});