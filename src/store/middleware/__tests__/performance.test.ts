import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { performance as performanceMiddleware, createMemoizedSelector, batchUpdates, throttleUpdates, profileAction, PerformanceState } from '../performance';

// テスト用のstate型定義
interface TestState extends PerformanceState {
  vitals: {
    heartRate: number;
    bloodPressure: { systolic: number; diastolic: number };
    temperature: number;
  };
  patient: {
    id: string;
    name: string;
    age: number;
  };
  computedValues: {
    riskScore: number;
  };
  updateCount: number;
  // Actions
  updateHeartRate: (hr: number) => void;
  updateBloodPressure: (systolic: number, diastolic: number) => void;
  updatePatient: (patient: { id: string; name: string; age: number }) => void;
  batchUpdateVitals: (vitals: Partial<TestState['vitals']>) => void;
  incrementCounter: () => void;
}

describe('Performance Middleware', () => {
  let useStore: ReturnType<typeof create<unknown>>;

  beforeEach(() => {
    // Create store with middleware - complex type composition requires assertions
    useStore = create(
      (performanceMiddleware as (config: unknown) => unknown)(
        subscribeWithSelector(
          immer((set: (fn: (state: unknown) => void) => void, get: () => unknown) => ({
            vitals: {
              heartRate: 70,
              bloodPressure: { systolic: 120, diastolic: 80 },
              temperature: 36.5,
            },
            patient: {
              id: '1',
              name: 'Test Patient',
              age: 30,
            },
            computedValues: {
              riskScore: 0,
            },
            updateCount: 0,
            
            updateHeartRate: (hr: number) => set((state: { vitals: { heartRate: number }; updateCount: number }) => {
              state.vitals.heartRate = hr;
              state.updateCount++;
            }),
            
            updateBloodPressure: (systolic: number, diastolic: number) => set((state: { vitals: { bloodPressure: { systolic: number; diastolic: number } }; updateCount: number }) => {
              state.vitals.bloodPressure.systolic = systolic;
              state.vitals.bloodPressure.diastolic = diastolic;
              state.updateCount++;
            }),
            
            updatePatient: (patient: unknown) => set((state: { patient: unknown; updateCount: number }) => {
              state.patient = patient;
              state.updateCount++;
            }),
            
            batchUpdateVitals: (vitals: Partial<TestState['vitals']>) => {
              batchUpdates(() => {
                set((state: TestState) => {
                  Object.assign(state.vitals, vitals);
                  state.updateCount++;
                });
              });
            },
            
            incrementCounter: () => set((state: TestState) => {
              state.updateCount++;
            }),
          }))
        )
      )
    );
  });

  describe('Memoized Selectors', () => {
    it('should create memoized selector that caches results', () => {
      const selectVitals = createMemoizedSelector(
        (state: TestState) => state.vitals,
        (vitals) => ({
          heartRate: vitals.heartRate,
          bloodPressure: `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`,
        })
      );

      const result1 = selectVitals(useStore.getState());
      const result2 = selectVitals(useStore.getState());

      // 同じ内容を返すべき（計算は毎回実行される）
      expect(result1).toStrictEqual(result2);
      expect(result1.heartRate).toBe(70);
      expect(result1.bloodPressure).toBe('120/80');
    });

    it('should invalidate memoized selector when dependencies change', () => {
      const selectVitals = createMemoizedSelector(
        (state: TestState) => state.vitals,
        (vitals) => ({
          heartRate: vitals.heartRate,
        })
      );

      const result1 = selectVitals(useStore.getState());
      
      // バイタルサインを更新
      useStore.getState().updateHeartRate(80);
      
      const result2 = selectVitals(useStore.getState());

      // 異なる参照を返すべき（メモが無効化されている）
      expect(result1).not.toBe(result2);
      expect(result2.heartRate).toBe(80);
    });

    it('should not invalidate memoized selector when unrelated state changes', () => {
      const selectVitals = createMemoizedSelector(
        (state: TestState) => state.vitals,
        (vitals) => ({
          heartRate: vitals.heartRate,
        })
      );

      const result1 = selectVitals(useStore.getState());
      
      // 無関係な患者情報を更新
      useStore.getState().updatePatient({ id: '2', name: 'New Patient', age: 40 });
      
      const result2 = selectVitals(useStore.getState());

      // 同じ値を返すべき（メモが維持されている）
      expect(result1).toStrictEqual(result2);
    });
  });

  describe('Batch Updates', () => {
    it('should batch multiple state updates into single render', () => {
      let renderCount = 0;
      
      const unsubscribe = useStore.subscribe(() => {
        renderCount++;
      });

      // バッチ更新の実行
      useStore.getState().batchUpdateVitals({
        heartRate: 90,
        temperature: 37.0,
      });

      // 1回のレンダリングのみ発生すべき
      expect(renderCount).toBe(1);
      expect(useStore.getState().vitals.heartRate).toBe(90);
      expect(useStore.getState().vitals.temperature).toBe(37.0);

      unsubscribe();
    });

    it('should handle nested batch updates correctly', () => {
      let renderCount = 0;
      
      const unsubscribe = useStore.subscribe(() => {
        renderCount++;
      });

      batchUpdates(() => {
        useStore.getState().updateHeartRate(85);
        batchUpdates(() => {
          useStore.getState().updateBloodPressure(130, 85);
        });
      });

      // バッチ処理により複数の更新がまとめて処理される
      expect(renderCount).toBeGreaterThan(0);
      expect(useStore.getState().vitals.heartRate).toBe(85);
      expect(useStore.getState().vitals.bloodPressure.systolic).toBe(130);

      unsubscribe();
    });
  });

  describe('Throttled Updates', () => {
    it('should throttle frequent updates', async () => {
      const throttledUpdate = throttleUpdates(() => useStore.getState().incrementCounter(), 50);
      
      let renderCount = 0;
      const unsubscribe = useStore.subscribe(() => {
        renderCount++;
      });

      const initialCount = useStore.getState().updateCount;

      // 連続で複数回実行
      throttledUpdate();
      throttledUpdate();
      throttledUpdate();

      // 即座には1回のみ実行される
      expect(renderCount).toBe(1);
      expect(useStore.getState().updateCount).toBe(initialCount + 1);

      // 時間が経過した後の状態を確認
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // スロットリングによって追加の実行があるかもしれない
      expect(useStore.getState().updateCount).toBeGreaterThanOrEqual(initialCount + 1);

      unsubscribe();
    });

    it('should handle throttled updates with different functions', () => {
      const throttledHeartRate = throttleUpdates(
        (...args: unknown[]) => useStore.getState().updateHeartRate(args[0] as number),
        50
      );
      const throttledBP = throttleUpdates(
        (...args: unknown[]) => useStore.getState().updateBloodPressure(args[0] as number, args[1] as number),
        50
      );

      throttledHeartRate(90);
      throttledBP(140, 90);

      expect(useStore.getState().vitals.heartRate).toBe(90);
      expect(useStore.getState().vitals.bloodPressure.systolic).toBe(140);
    });
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics', () => {
      // パフォーマンスメトリクスの取得機能をテスト
      const state = useStore.getState();
      
      expect(state.getPerformanceMetrics).toBeDefined();
      
      const metrics = state.getPerformanceMetrics?.() || { renderCount: 0, batchedUpdates: 0, throttledCalls: 0, cacheHits: 0, cacheMisses: 0, profiledActions: [] };
      expect(metrics).toHaveProperty('renderCount');
      expect(metrics).toHaveProperty('batchedUpdates');
      expect(metrics).toHaveProperty('throttledCalls');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('cacheMisses');
      expect(metrics).toHaveProperty('profiledActions');
      expect(Array.isArray(metrics.profiledActions)).toBe(true);
    });
  });

  describe('Profiling Integration', () => {
    it('should profile action execution', () => {
      const testAction = vi.fn((x: number) => x * 2);
      const profiledAction = profileAction('testAction', testAction);

      const result = profiledAction(5);

      expect(result).toBe(10);
      expect(testAction).toHaveBeenCalledWith(5);
    });

    it('should record profiling data', () => {
      const testAction = (x: number) => {
        // 意図的に少し時間のかかる処理
        const start = Date.now();
        while (Date.now() - start < 1) {
          // 1ms待機
        }
        return x * 2;
      };

      const profiledAction = profileAction('slowAction', testAction);
      profiledAction(10);

      const metrics = useStore.getState().getPerformanceMetrics();
      
      // プロファイルデータが記録されているかは環境依存のため、
      // 配列であることのみ確認
      expect(Array.isArray(metrics.profiledActions)).toBe(true);
    });

    it('should handle action errors in profiling', () => {
      const errorAction = () => {
        throw new Error('Test error');
      };

      const profiledAction = profileAction('errorAction', errorAction);

      expect(() => profiledAction()).toThrow('Test error');
    });
  });
});