import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { llmConfigSchema, resetLLMConfig, getLLMConfig, isO3Model } from '@/config/llm-config';

describe('LLM Config - o3モデル対応', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    resetLLMConfig();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetLLMConfig();
  });

  describe('llmConfigSchema', () => {
    it('maxCompletionTokensフィールドが定義されている', () => {
      const schema = llmConfigSchema.shape;
      expect(schema.maxCompletionTokens).toBeDefined();
    });

    it('maxCompletionTokensは正の整数を受け入れる', () => {
      const validConfig = {
        apiKey: 'test-key',
        model: 'o3-2025-04-16',
        temperature: 0.7,
        maxTokens: 2000,
        maxCompletionTokens: 4096,
        retries: {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 60000,
          backoffFactor: 2,
        },
        rateLimit: {
          requestsPerMinute: 600,
          tokensPerMinute: 90000,
        },
      };

      const result = llmConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxCompletionTokens).toBe(4096);
      }
    });

    it('maxCompletionTokensのデフォルト値は4096', () => {
      const configWithoutMaxCompletionTokens = {
        apiKey: 'test-key',
        model: 'o3-2025-04-16',
        temperature: 0.7,
        maxTokens: 2000,
        retries: {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 60000,
          backoffFactor: 2,
        },
        rateLimit: {
          requestsPerMinute: 600,
          tokensPerMinute: 90000,
        },
      };

      const result = llmConfigSchema.parse(configWithoutMaxCompletionTokens);
      expect(result.maxCompletionTokens).toBe(4096);
    });
  });

  describe('デフォルト設定', () => {
    it('デフォルトモデルがo3-2025-04-16', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      const config = getLLMConfig();
      expect(config.model).toBe('o3-2025-04-16');
    });

    it('maxCompletionTokensのデフォルト値が4096', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      const config = getLLMConfig();
      expect(config.maxCompletionTokens).toBe(4096);
    });
  });

  describe('isO3Model関数', () => {
    it('o3-2025-04-16でtrueを返す', () => {
      expect(isO3Model('o3-2025-04-16')).toBe(true);
    });

    it('o3-mini-2025-01-31でtrueを返す', () => {
      expect(isO3Model('o3-mini-2025-01-31')).toBe(true);
    });

    it('o3-pro-2025-01-31でtrueを返す', () => {
      expect(isO3Model('o3-pro-2025-01-31')).toBe(true);
    });

    it('gpt-4oでfalseを返す', () => {
      expect(isO3Model('gpt-4o')).toBe(false);
    });

    it('undefined/nullでfalseを返す', () => {
      expect(isO3Model(undefined)).toBe(false);
      expect(isO3Model(null)).toBe(false);
    });
  });

  describe('環境変数による上書き', () => {
    it('後方互換性のためgpt-4oフォールバック可能', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-4o';
      
      const config = getLLMConfig();
      expect(config.model).toBe('gpt-4o');
    });
  });
});