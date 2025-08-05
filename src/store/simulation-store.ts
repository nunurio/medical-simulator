import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SimulationStore } from '@/types/state';
import { createISODateTime } from '@/types/core';
import { calculateScoreAsync } from '@/services/score-calculator';
import type { SimulatorAction } from '@/services/score-calculator';

export const useSimulationStore = create<SimulationStore>()(
  immer((set, get) => ({
    // State
    mode: 'outpatient',
    difficulty: 'beginner',
    department: 'general_medicine',
    isRunning: false,
    startTime: null,
    endTime: null,
    score: null,
    // 診療アクションを記録するための内部状態
    _actions: [] as SimulatorAction[],
    
    // Actions
    startSimulation: () => set((state) => {
      state.isRunning = true;
      state.startTime = createISODateTime(new Date().toISOString());
      state.endTime = null;
      state.score = null;
    }),
    
    endSimulation: () => set((state) => {
      state.isRunning = false;
      state.endTime = createISODateTime(new Date().toISOString());
    }),
    
    setMode: (mode) => set((state) => {
      state.mode = mode;
    }),
    
    setDifficulty: (level) => set((state) => {
      state.difficulty = level;
    }),
    
    setDepartment: (dept) => set((state) => {
      state.department = dept;
    }),
    
    calculateScore: () => {
      const state = get();
      if (!state.startTime || !state.endTime) return 0;
      
      // score-calculatorサービスを使用してスコアを計算
      // 診療アクションのサンプルデータを使用（実際の実装では、診療履歴から収集）
      const sampleActions: SimulatorAction[] = [
        {
          id: 'action-1',
          type: 'diagnosis',
          timestamp: new Date(state.startTime).getTime(),
          value: { diagnosis: '高血圧症' },
          expected: { diagnosis: '高血圧症' },
          isCorrect: true,
          responseTime: 280
        },
        {
          id: 'action-2',
          type: 'communication',
          timestamp: new Date(state.startTime).getTime(),
          value: { message: '患者への説明' },
          expected: { message: '適切な説明' },
          isCorrect: true,
          responseTime: 120
        },
        {
          id: 'action-3',
          type: 'test_order',
          timestamp: new Date(state.startTime).getTime(),
          value: { tests: ['血液検査', '心電図'] },
          expected: { tests: ['血液検査'] },
          isCorrect: false,
          responseTime: 180
        },
        {
          id: 'action-4',
          type: 'treatment',
          timestamp: new Date(state.endTime).getTime(),
          value: { treatment: 'ACE阻害薬処方' },
          expected: { treatment: 'ACE阻害薬処方' },
          isCorrect: true,
          responseTime: 200
        }
      ];
      
      // 同期的にスコアを計算するために、即座に解決されるPromiseとして処理
      // 実際の実装では、診療中にアクションを記録し、終了時に計算
      let calculatedScore = 0;
      calculateScoreAsync(sampleActions).then((result) => {
        calculatedScore = result.totalScore;
        // スコアを状態に保存
        set((state) => {
          state.score = calculatedScore;
        });
      });
      
      // 現時点では仮の値を返す（非同期処理が完了するまで）
      return state.score || 0;
    },
    
    resetSimulation: () => set((state) => {
      state.isRunning = false;
      state.startTime = null;
      state.endTime = null;
      state.score = null;
    }),
  }))
);