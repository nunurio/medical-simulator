import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, resetConfig } from '../defaults';

describe('Configuration Management System', () => {
  beforeEach(() => {
    // 環境変数をクリーンアップ
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_API_BASE;
    delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCKS;
    resetConfig();
  });

  describe('Default Configuration Schema', () => {
    it('should provide default simulation settings', () => {
      const config = getConfig();
      
      expect(config.simulation.mode).toBe('outpatient');
      expect(config.simulation.difficulty).toBe('beginner');
      expect(config.simulation.department).toBe('general_medicine');
    });

    it('should provide default UI settings', () => {
      const config = getConfig();
      
      expect(config.ui.theme).toBe('light');
      expect(config.ui.sidebar.isOpen).toBe(true);
    });

    it('should provide default API settings', () => {
      const config = getConfig();
      
      expect(config.api.baseUrl).toBe('http://localhost:3000/api');
      expect(config.api.useMocks).toBe(true);
    });
  });

  describe('Environment Variable Override', () => {
    it('should override API base URL from environment variable', () => {
      process.env.NEXT_PUBLIC_API_BASE = 'https://api.example.com';
      resetConfig();
      
      const config = getConfig();
      
      expect(config.api.baseUrl).toBe('https://api.example.com');
    });

    it('should override mock usage from environment variable to false', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      resetConfig();
      
      const config = getConfig();
      
      expect(config.api.useMocks).toBe(false);
    });

    it('should override mock usage from environment variable to true', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
      resetConfig();
      
      const config = getConfig();
      
      expect(config.api.useMocks).toBe(true);
    });

    it('should use default mock usage when environment variable is not set', () => {
      // NEXT_PUBLIC_USE_MOCKSを設定しない
      resetConfig();
      
      const config = getConfig();
      
      expect(config.api.useMocks).toBe(true); // デフォルト値
    });

    it('should handle invalid API base URL environment variable gracefully', () => {
      process.env.NEXT_PUBLIC_API_BASE = 'invalid-url';
      
      expect(() => {
        resetConfig();
        getConfig();
      }).toThrow();
    });

    it('should handle invalid USE_MOCKS environment variable gracefully', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'invalid-value';
      
      expect(() => {
        resetConfig();
        getConfig();
      }).toThrow();
    });

    it('should handle multiple environment variable overrides', () => {
      process.env.NEXT_PUBLIC_API_BASE = 'https://staging.api.example.com';
      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      resetConfig();
      
      const config = getConfig();
      
      expect(config.api.baseUrl).toBe('https://staging.api.example.com');
      expect(config.api.useMocks).toBe(false);
    });
  });

  describe('Mock Patient Data Templates', () => {
    it('should provide mock patient data template', () => {
      const config = getConfig();
      
      expect(config.mockPatients).toBeDefined();
      expect(config.mockPatients.length).toBeGreaterThan(0);
      expect(config.mockPatients[0]).toHaveProperty('id');
      expect(config.mockPatients[0]).toHaveProperty('name');
      expect(config.mockPatients[0]).toHaveProperty('age');
      expect(config.mockPatients[0]).toHaveProperty('condition');
    });
  });

  describe('Type Safety', () => {
    it('should be type-safe configuration', () => {
      const config = getConfig();
      
      // TypeScriptの型チェックが通ることを確認
      expect(typeof config.simulation.mode).toBe('string');
      expect(typeof config.simulation.difficulty).toBe('string');
      expect(typeof config.ui.theme).toBe('string');
      expect(typeof config.ui.sidebar.isOpen).toBe('boolean');
      expect(typeof config.api.useMocks).toBe('boolean');
    });
  });
});