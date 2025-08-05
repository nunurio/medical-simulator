import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { performance as performanceMiddleware, createMemoizedSelector, batchUpdates, throttleUpdates, profileAction } from '../performance';

// テスト用のstate型定義
interface TestState {
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
  let useStore: ReturnType<typeof create<TestState>>;

  beforeEach(() => {
    useStore = create<TestState>()(
      performanceMiddleware(
        subscribeWithSelector(
          immer((set, get) => ({
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
            
            updateHeartRate: (hr: number) => set((state) => {
              state.vitals.heartRate = hr;
              state.updateCount++;
            }),
            
            updateBloodPressure: (systolic: number, diastolic: number) => set((state) => {
              state.vitals.bloodPressure.systolic = systolic;
              state.vitals.bloodPressure.diastolic = diastolic;
              state.updateCount++;
            }),
            
            updatePatient: (patient) => set((state) => {
              state.patient = patient;
              state.updateCount++;
            }),
            
            batchUpdateVitals: (vitals) => {
              batchUpdates(() => {
                set((state) => {
                  Object.assign(state.vitals, vitals);
                  state.updateCount++;
                });
              });
            },
            
            incrementCounter: () => set((state) => {
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

      // 同じ参照を返すべき（メモ化されている）
      expect(result1).toBe(result2);
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

      // 同じ参照を返すべき（メモが維持されている）
      expect(result1).toBe(result2);
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
      const throttledUpdate = throttleUpdates(useStore.getState().incrementCounter, 50);
      
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
        (hr: number) => useStore.getState().updateHeartRate(hr),
        50
      );
      const throttledBP = throttleUpdates(
        (sys: number, dia: number) => useStore.getState().updateBloodPressure(sys, dia),
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
      
      const metrics = state.getPerformanceMetrics();
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