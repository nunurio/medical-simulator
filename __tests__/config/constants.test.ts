import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LLM_CONSTANTS } from '@/config/constants';

describe('LLM_CONSTANTS - o3モデル対応', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('DEFAULT_MODEL', () => {
    it('環境変数なしの場合のデフォルト値は現在の設定を確認', () => {
      // 現在の実装では、デフォルトでo3-2025-04-16が設定されている
      expect(LLM_CONSTANTS.DEFAULT_MODEL).toBe('o3-2025-04-16');
    });
  });

  describe('O3_MODEL', () => {
    it('o3モデルの定数が定義されている', () => {
      expect(LLM_CONSTANTS.O3_MODEL).toBe('o3-2025-04-16');
    });

    it('o3-miniモデルの定数が定義されている', () => {
      expect(LLM_CONSTANTS.O3_MINI_MODEL).toBe('o3-mini-2025-01-31');
    });

    it('o3-proモデルの定数が定義されている', () => {
      expect(LLM_CONSTANTS.O3_PRO_MODEL).toBe('o3-pro-2025-01-31');
    });
  });

  describe('DEFAULT_MAX_COMPLETION_TOKENS', () => {
    it('デフォルト値が4096である', () => {
      expect(LLM_CONSTANTS.DEFAULT_MAX_COMPLETION_TOKENS).toBe(4096);
    });
  });

  describe('後方互換性', () => {
    it('既存のDEFAULT_MAX_TOKENSも残っている', () => {
      expect(LLM_CONSTANTS.DEFAULT_MAX_TOKENS).toBeDefined();
      expect(typeof LLM_CONSTANTS.DEFAULT_MAX_TOKENS).toBe('number');
    });
  });
});