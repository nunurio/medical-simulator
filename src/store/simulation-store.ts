import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SimulationStore } from '@/types/state';

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
    
    // Actions
    startSimulation: () => set((state) => {
      state.isRunning = true;
      state.startTime = new Date().toISOString() as any;
      state.endTime = null;
      state.score = null;
    }),
    
    endSimulation: () => set((state) => {
      state.isRunning = false;
      state.endTime = new Date().toISOString() as any;
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
      
      // TODO: 実際のスコア計算ロジックを実装
      // 現在は仮のスコアを返す
      return Math.floor(Math.random() * 100);
    },
    
    resetSimulation: () => set((state) => {
      state.isRunning = false;
      state.startTime = null;
      state.endTime = null;
      state.score = null;
    }),
  }))
);