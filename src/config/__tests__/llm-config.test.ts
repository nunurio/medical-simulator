import { describe, it, expect, beforeEach, vi } from 'vitest';

import { llmConfigSchema, getLLMConfig, resetLLMConfig, getDefaultLLMConfig } from '../llm-config';

describe('LLM Config', () => {
  beforeEach(() => {
    // 環境変数をクリア
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('OPENAI_MODEL', '');
    vi.stubEnv('OPENAI_ORG_ID', '');
    vi.stubEnv('OPENAI_RPM_LIMIT', '');
    vi.stubEnv('OPENAI_TPM_LIMIT', '');
    // キャッシュをリセット
    resetLLMConfig();
  });

  describe('llmConfigSchema', () => {
    it('should validate valid LLM configuration', () => {
      expect(() => {
        llmConfigSchema.parse({
          apiKey: 'sk-proj-test123',
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
        });
      }).not.toThrow();
    });

    it('should reject invalid API key', () => {
      expect(() => {
        llmConfigSchema.parse({
          apiKey: '', // 空文字列は無効
          model: 'gpt-4o',
        });
      }).toThrow('Too small: expected string to have >=1 characters');
    });

    it('should reject invalid temperature', () => {
      expect(() => {
        llmConfigSchema.parse({
          apiKey: 'sk-proj-test123',
          model: 'gpt-4o',
          temperature: 3.0, // 2.0を超える値は無効
        });
      }).toThrow('Too big: expected number to be <=2');
    });

    it('should reject negative maxTokens', () => {
      expect(() => {
        llmConfigSchema.parse({
          apiKey: 'sk-proj-test123',
          model: 'gpt-4o',
          maxTokens: -100, // 負の値は無効
        });
      }).toThrow('Too small: expected number to be >0');
    });
  });

  describe('getLLMConfig', () => {
    it('should return config with default values when env vars are not set', () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-proj-test123');
      
      const config = getLLMConfig();
      
      expect(config).toEqual({
        apiKey: 'sk-proj-test123',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000,
        retries: {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 60000, // Updated to match actual default
          backoffFactor: 2,
        },
        rateLimit: {
          requestsPerMinute: 600, // Updated to match actual default (10 * 60)
          tokensPerMinute: 90000,
        },
      });
    });

    it('should throw error when OPENAI_API_KEY is missing', () => {
      expect(() => {
        getLLMConfig();
      }).toThrow();
    });

    it('should override defaults with environment variables', () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-proj-override123');
      vi.stubEnv('OPENAI_MODEL', 'gpt-3.5-turbo');
      vi.stubEnv('OPENAI_RPM_LIMIT', '30');
      vi.stubEnv('OPENAI_TPM_LIMIT', '40000');
      
      const config = getLLMConfig();
      
      expect(config.apiKey).toBe('sk-proj-override123');
      expect(config.model).toBe('gpt-3.5-turbo');
      expect(config.rateLimit.requestsPerMinute).toBe(30);
      expect(config.rateLimit.tokensPerMinute).toBe(40000);
    });
  });

  describe('getDefaultLLMConfig', () => {
    it('should return the same result as getLLMConfig', () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-proj-test123');
      
      const defaultConfig = getDefaultLLMConfig();
      const config = getLLMConfig();
      
      expect(defaultConfig).toEqual(config);
    });
  });
});