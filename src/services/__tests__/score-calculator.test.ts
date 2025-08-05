/**
 * Score Calculator Service のテスト
 * t-wada式TDD - Red フェーズ: まず失敗するテストを書く
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  calculateScore, 
  calculateScoreMetrics, 
  convertScoreToRank,
  calculateWeightedScore 
} from '../score-calculator';

// スコア計算に使用するアクション型定義
interface SimulatorAction {
  id: string;
  type: 'diagnosis' | 'test_order' | 'treatment' | 'communication';
  timestamp: number;
  value: unknown;
  expected: unknown;
  isCorrect?: boolean;
  responseTime?: number;
}

interface ScoreMetrics {
  diagnosticAccuracy: number;
  testOrderAppropriate: number; 
  timeEfficiency: number;
  communicationScore: number;
  totalScore: number;
}

interface ScoreWeights {
  diagnosticAccuracy: number;
  testOrderAppropriate: number;
  timeEfficiency: number;
  communicationScore: number;
}

describe('Score Calculator Service', () => {
  describe('calculateScore', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should calculate basic score for single action', async () => {
      // Arrange（準備）
      const actions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'hypertension',
          expected: 'hypertension',
          isCorrect: true,
          responseTime: 2000,
        },
      ];

      // Act（実行）
      const result = await calculateScore(actions);

      // Assert（検証）
      expect(result).toBeDefined();
      expect(result.totalScore).toEqual(expect.any(Number));
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should calculate score metrics correctly', async () => {
      // Arrange
      const actions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'hypertension',
          expected: 'hypertension',
          isCorrect: true,
          responseTime: 1500,
        },
        {
          id: 'action-2',
          type: 'test_order',
          timestamp: Date.now() + 1000,
          value: 'blood_test',
          expected: 'blood_test',
          isCorrect: true,
          responseTime: 3000,
        },
      ];

      // Act
      const result = await calculateScore(actions);

      // Assert - スコアメトリクスの構造をチェック
      expect(result).toMatchObject({
        diagnosticAccuracy: expect.any(Number),
        testOrderAppropriate: expect.any(Number),
        timeEfficiency: expect.any(Number),
        communicationScore: expect.any(Number),
        totalScore: expect.any(Number),
      });
      
      // すべてのメトリクスが0-100の範囲内
      expect(result.diagnosticAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.diagnosticAccuracy).toBeLessThanOrEqual(100);
      expect(result.testOrderAppropriate).toBeGreaterThanOrEqual(0);
      expect(result.testOrderAppropriate).toBeLessThanOrEqual(100);
      expect(result.timeEfficiency).toBeGreaterThanOrEqual(0);
      expect(result.timeEfficiency).toBeLessThanOrEqual(100);
    });

    it('should handle empty actions array', async () => {
      // Arrange
      const actions: SimulatorAction[] = [];

      // Act
      const result = await calculateScore(actions);

      // Assert
      expect(result.totalScore).toBe(0);
      expect(result.diagnosticAccuracy).toBe(0);
      expect(result.testOrderAppropriate).toBe(0);
      expect(result.timeEfficiency).toBe(0);
      expect(result.communicationScore).toBe(0);
    });
  });

  describe('calculateScoreMetrics', () => {
    it('should calculate diagnostic accuracy correctly', () => {
      // Arrange
      const actions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'correct_diagnosis',
          expected: 'correct_diagnosis',
          isCorrect: true,
        },
        {
          id: 'action-2',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'wrong_diagnosis',
          expected: 'correct_diagnosis',
          isCorrect: false,
        },
      ];

      // Act
      const metrics = calculateScoreMetrics(actions);

      // Assert - 2個中1個正解なので50%
      expect(metrics.diagnosticAccuracy).toBe(50);
    });

    it('should calculate time efficiency based on response times', () => {
      // Arrange
      const actions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'diagnosis',
          expected: 'diagnosis',
          responseTime: 1000, // 1秒は高効率
        },
        {
          id: 'action-2',
          type: 'test_order',
          timestamp: Date.now(),
          value: 'test',
          expected: 'test',
          responseTime: 10000, // 10秒は低効率
        },
      ];

      // Act
      const metrics = calculateScoreMetrics(actions);

      // Assert
      expect(metrics.timeEfficiency).toBeGreaterThan(0);
      expect(metrics.timeEfficiency).toBeLessThan(100);
    });
  });

  describe('calculateWeightedScore', () => {
    it('should apply weights correctly to score calculation', async () => {
      // Arrange
      const actions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'correct_diagnosis',
          expected: 'correct_diagnosis',
          isCorrect: true,
          responseTime: 2000,
        }
      ];

      const weights: ScoreWeights = {
        diagnosticAccuracy: 0.4,  // 40% - 最重要
        testOrderAppropriate: 0.3, // 30%
        timeEfficiency: 0.2,      // 20%
        communicationScore: 0.1,  // 10% - 最軽要
      };

      // Act
      const result = await calculateWeightedScore(actions, weights);

      // Assert
      expect(result).toBeDefined();
      expect(result.totalScore).toEqual(expect.any(Number));
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should produce different scores with different weights', async () => {
      // Arrange - より複雑なシナリオで重みの違いが明確になるように
      const actions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'diagnosis',
          expected: 'diagnosis',
          isCorrect: true, // 診断は正解
          responseTime: 8000, // 遅い反応時間（時間効率は低い）
        },
        {
          id: 'action-2',
          type: 'test_order',
          timestamp: Date.now(),
          value: 'test',
          expected: 'test',
          isCorrect: false, // 検査オーダーは不正解
          responseTime: 2000, // 早い反応時間
        }
      ];

      const timeHeavyWeights: ScoreWeights = {
        diagnosticAccuracy: 0.1,
        testOrderAppropriate: 0.1,
        timeEfficiency: 0.7,      // 時間効率を重視
        communicationScore: 0.1,
      };

      const accuracyHeavyWeights: ScoreWeights = {
        diagnosticAccuracy: 0.7,  // 診断精度を重視
        testOrderAppropriate: 0.1,
        timeEfficiency: 0.1,
        communicationScore: 0.1,
      };

      // Act
      const timeHeavyResult = await calculateWeightedScore(actions, timeHeavyWeights);
      const accuracyHeavyResult = await calculateWeightedScore(actions, accuracyHeavyWeights);

      // Assert - 重みの違いによってスコアが変わることを確認
      expect(timeHeavyResult.totalScore).not.toBe(accuracyHeavyResult.totalScore);
      // 時間が遅いので、時間重視の方が低いスコアになるはず
      expect(timeHeavyResult.totalScore).toBeLessThan(accuracyHeavyResult.totalScore);
    });

    it('should handle equal weights correctly', async () => {
      // Arrange
      const actions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'diagnosis',
          expected: 'diagnosis',
          isCorrect: true,
          responseTime: 2000,
        }
      ];

      const equalWeights: ScoreWeights = {
        diagnosticAccuracy: 0.25,
        testOrderAppropriate: 0.25,
        timeEfficiency: 0.25,
        communicationScore: 0.25,
      };

      // Act
      const weightedResult = await calculateWeightedScore(actions, equalWeights);
      const basicResult = await calculateScore(actions);

      // Assert - 等重みの場合は基本スコアと近い値になるはず
      expect(Math.abs(weightedResult.totalScore - basicResult.totalScore)).toBeLessThan(5);
    });
  });

  describe('convertScoreToRank', () => {
    it('should convert scores to correct ranks', () => {
      // Arrange & Act & Assert
      expect(convertScoreToRank(95)).toBe('S');  // 90-100
      expect(convertScoreToRank(90)).toBe('S');  // 境界値
      expect(convertScoreToRank(85)).toBe('A');  // 80-89
      expect(convertScoreToRank(80)).toBe('A');  // 境界値
      expect(convertScoreToRank(75)).toBe('B');  // 70-79
      expect(convertScoreToRank(70)).toBe('B');  // 境界値
      expect(convertScoreToRank(65)).toBe('C');  // 60-69
      expect(convertScoreToRank(60)).toBe('C');  // 境界値
      expect(convertScoreToRank(55)).toBe('D');  // 60未満
      expect(convertScoreToRank(0)).toBe('D');   // 最低値
    });

    it('should handle edge cases', () => {
      // Arrange & Act & Assert
      expect(convertScoreToRank(100)).toBe('S');
      expect(convertScoreToRank(89.9)).toBe('A');
      expect(convertScoreToRank(79.9)).toBe('B');
      expect(convertScoreToRank(69.9)).toBe('C');
      expect(convertScoreToRank(59.9)).toBe('D');
    });
  });

  describe('Integration tests', () => {
    it('should calculate complete workflow from actions to rank', async () => {
      // Arrange - 複雑なシナリオ
      const actions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: Date.now(),
          value: 'hypertension',
          expected: 'hypertension',
          isCorrect: true,
          responseTime: 1500,
        },
        {
          id: 'action-2',
          type: 'test_order',
          timestamp: Date.now() + 1000,
          value: 'blood_pressure_monitoring',
          expected: 'blood_pressure_monitoring',
          isCorrect: true,
          responseTime: 2000,
        },
        {
          id: 'action-3',
          type: 'treatment',
          timestamp: Date.now() + 2000,
          value: 'ace_inhibitor',
          expected: 'ace_inhibitor',
          isCorrect: true,
          responseTime: 3000,
        },
        {
          id: 'action-4',
          type: 'communication',
          timestamp: Date.now() + 3000,
          value: 'patient_education',
          expected: 'patient_education',
          isCorrect: true,
          responseTime: 1000,
        },
      ];

      const weights: ScoreWeights = {
        diagnosticAccuracy: 0.3,
        testOrderAppropriate: 0.3,
        timeEfficiency: 0.2,
        communicationScore: 0.2,
      };

      // Act
      const metrics = await calculateWeightedScore(actions, weights);
      const rank = convertScoreToRank(metrics.totalScore);

      // Assert
      expect(metrics.totalScore).toBeGreaterThan(0);
      expect(metrics.totalScore).toBeLessThanOrEqual(100);
      expect(['S', 'A', 'B', 'C', 'D']).toContain(rank);
      
      // 全て正解なので高いスコアが期待される
      expect(metrics.totalScore).toBeGreaterThan(60);
      expect(rank).not.toBe('D');
    });
  });
});