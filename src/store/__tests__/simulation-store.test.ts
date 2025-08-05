import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../simulation-store';

describe('SimulationStore', () => {
  beforeEach(() => {
    // ストアの状態をリセット
    useSimulationStore.setState({
      mode: 'outpatient',
      difficulty: 'beginner',
      department: 'general_medicine',
      isRunning: false,
      startTime: null,
      endTime: null,
      score: null
    });
  });

  describe('初期状態', () => {
    it('正しい初期値を持つ', () => {
      const state = useSimulationStore.getState();
      
      expect(state.mode).toBe('outpatient');
      expect(state.difficulty).toBe('beginner');
      expect(state.department).toBe('general_medicine');
      expect(state.isRunning).toBe(false);
      expect(state.startTime).toBeNull();
      expect(state.endTime).toBeNull();
      expect(state.score).toBeNull();
    });
  });

  describe('setMode', () => {
    it('シミュレーションモードを変更できる', () => {
      const { setMode } = useSimulationStore.getState();
      
      setMode('emergency');
      expect(useSimulationStore.getState().mode).toBe('emergency');
      
      setMode('inpatient');
      expect(useSimulationStore.getState().mode).toBe('inpatient');
      
      setMode('outpatient');
      expect(useSimulationStore.getState().mode).toBe('outpatient');
    });
  });

  describe('setDifficulty', () => {
    it('難易度を変更できる', () => {
      const { setDifficulty } = useSimulationStore.getState();
      
      setDifficulty('intermediate');
      expect(useSimulationStore.getState().difficulty).toBe('intermediate');
      
      setDifficulty('advanced');
      expect(useSimulationStore.getState().difficulty).toBe('advanced');
      
      setDifficulty('beginner');
      expect(useSimulationStore.getState().difficulty).toBe('beginner');
    });
  });

  describe('setDepartment', () => {
    it('診療科を変更できる', () => {
      const { setDepartment } = useSimulationStore.getState();
      
      setDepartment('cardiology');
      expect(useSimulationStore.getState().department).toBe('cardiology');
      
      setDepartment('gastroenterology');
      expect(useSimulationStore.getState().department).toBe('gastroenterology');
      
      setDepartment('respiratory');
      expect(useSimulationStore.getState().department).toBe('respiratory');
      
      setDepartment('neurology');
      expect(useSimulationStore.getState().department).toBe('neurology');
      
      setDepartment('emergency');
      expect(useSimulationStore.getState().department).toBe('emergency');
      
      setDepartment('general_medicine');
      expect(useSimulationStore.getState().department).toBe('general_medicine');
    });
  });

  describe('immerミドルウェア', () => {
    it('状態の不変性が保たれる', () => {
      const initialState = useSimulationStore.getState();
      const { setMode } = initialState;
      
      setMode('emergency');
      const newState = useSimulationStore.getState();
      
      // 新しい状態オブジェクトが作成されている
      expect(newState).not.toBe(initialState);
      // 変更されていないプロパティは同じ値を持つ
      expect(newState.difficulty).toBe(initialState.difficulty);
      expect(newState.department).toBe(initialState.department);
    });
  });

  describe('複数の状態更新', () => {
    it('連続して複数の状態を更新できる', () => {
      const { setMode, setDifficulty, setDepartment } = useSimulationStore.getState();
      
      // 連続して状態を更新
      setMode('inpatient');
      setDifficulty('advanced');
      setDepartment('cardiology');
      
      const state = useSimulationStore.getState();
      expect(state.mode).toBe('inpatient');
      expect(state.difficulty).toBe('advanced');
      expect(state.department).toBe('cardiology');
    });
  });

  describe('型安全性', () => {
    it('アクションが正しい型の引数を受け取る', () => {
      const { setMode, setDifficulty, setDepartment } = useSimulationStore.getState();
      
      // TypeScriptの型チェックにより、以下のようなコードはコンパイルエラーになる
      // setMode('invalid-mode');
      // setDifficulty('invalid-difficulty');
      // setDepartment('invalid-department');
      
      // 正しい型の値は受け取れる
      expect(() => setMode('outpatient')).not.toThrow();
      expect(() => setDifficulty('beginner')).not.toThrow();
      expect(() => setDepartment('general_medicine')).not.toThrow();
    });
  });
});