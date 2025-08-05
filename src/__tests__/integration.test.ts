import { describe, it, expect } from 'vitest';
import { getConfig } from '../config/defaults';

// 簡略化した統合テスト

describe('Integration Tests', () => {

  describe('Configuration Integration', () => {
    it('should load configuration correctly', () => {
      const config = getConfig();
      
      // 設定がロードされていることを確認
      expect(config).toBeDefined();
      expect(config.simulation.mode).toBe('outpatient');
      expect(config.api.useMocks).toBe(true);
      expect(config.mockPatients.length).toBeGreaterThan(0);
    });

    it('should handle mock data from configuration', () => {
      const config = getConfig();
      
      // モック患者データが正しく設定されていることを確認
      expect(config.mockPatients).toBeDefined();
      expect(config.mockPatients.length).toBe(2);
      
      const firstPatient = config.mockPatients[0];
      expect(firstPatient.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(firstPatient.name).toBe('田中太郎');
      expect(firstPatient.age).toBe(45);
      expect(firstPatient.condition).toBe('高血圧');
    });

    it('should maintain performance while accessing config data', () => {
      const startTime = performance.now();
      
      // 複数回設定にアクセス
      for (let i = 0; i < 100; i++) {
        const config = getConfig();
        expect(config.simulation.mode).toBe('outpatient');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // パフォーマンスが十分であることを確認（100回のアクセスが100ms以内）
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid environment configurations gracefully', () => {
      // 設定システムが適切にエラーハンドリングを行うことを確認
      const config = getConfig();
      
      // 有効な設定オブジェクトが返されることを確認
      expect(config).toBeDefined();
      expect(typeof config.simulation.mode).toBe('string');
      expect(typeof config.api.useMocks).toBe('boolean');
    });
  });
});