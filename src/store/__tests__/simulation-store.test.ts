import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../simulation-store';

describe('SimulationStore', () => {
  beforeEach(() => {
    // ストアの状態をリセット
    useSimulationStore.setState({
      mode: 'practice',
      difficulty: 'beginner',
      specialty: 'internal'
    });
  });

  describe('初期状態', () => {
    it('正しい初期値を持つ', () => {
      const state = useSimulationStore.getState();
      
      expect(state.mode).toBe('practice');
      expect(state.difficulty).toBe('beginner');
      expect(state.specialty).toBe('internal');
    });
  });

  describe('setMode', () => {
    it('シミュレーションモードを変更できる', () => {
      const { setMode } = useSimulationStore.getState();
      
      setMode('evaluation');
      expect(useSimulationStore.getState().mode).toBe('evaluation');
      
      setMode('exam');
      expect(useSimulationStore.getState().mode).toBe('exam');
      
      setMode('practice');
      expect(useSimulationStore.getState().mode).toBe('practice');
    });
  });

  describe('setDifficulty', () => {
    it('難易度を変更できる', () => {
      const { setDifficulty } = useSimulationStore.getState();
      
      setDifficulty('intermediate');
      expect(useSimulationStore.getState().difficulty).toBe('intermediate');
      
      setDifficulty('advanced');
      expect(useSimulationStore.getState().difficulty).toBe('advanced');
      
      setDifficulty('expert');
      expect(useSimulationStore.getState().difficulty).toBe('expert');
      
      setDifficulty('beginner');
      expect(useSimulationStore.getState().difficulty).toBe('beginner');
    });
  });

  describe('setSpecialty', () => {
    it('診療科を変更できる', () => {
      const { setSpecialty } = useSimulationStore.getState();
      
      setSpecialty('surgery');
      expect(useSimulationStore.getState().specialty).toBe('surgery');
      
      setSpecialty('pediatrics');
      expect(useSimulationStore.getState().specialty).toBe('pediatrics');
      
      setSpecialty('internal');
      expect(useSimulationStore.getState().specialty).toBe('internal');
    });
  });

  describe('immerミドルウェア', () => {
    it('状態の不変性が保たれる', () => {
      const initialState = useSimulationStore.getState();
      const { setMode } = initialState;
      
      setMode('evaluation');
      const newState = useSimulationStore.getState();
      
      // 新しい状態オブジェクトが作成されている
      expect(newState).not.toBe(initialState);
      // 変更されていないプロパティは同じ値を持つ
      expect(newState.difficulty).toBe(initialState.difficulty);
      expect(newState.specialty).toBe(initialState.specialty);
    });
  });

  describe('複数の状態更新', () => {
    it('連続して複数の状態を更新できる', () => {
      const { setMode, setDifficulty, setSpecialty } = useSimulationStore.getState();
      
      // 連続して状態を更新
      setMode('exam');
      setDifficulty('expert');
      setSpecialty('surgery');
      
      const state = useSimulationStore.getState();
      expect(state.mode).toBe('exam');
      expect(state.difficulty).toBe('expert');
      expect(state.specialty).toBe('surgery');
    });
  });

  describe('型安全性', () => {
    it('アクションが正しい型の引数を受け取る', () => {
      const { setMode, setDifficulty, setSpecialty } = useSimulationStore.getState();
      
      // TypeScriptの型チェックにより、以下のようなコードはコンパイルエラーになる
      // setMode('invalid-mode');
      // setDifficulty('invalid-difficulty');
      // setSpecialty('invalid-specialty');
      
      // 正しい型の値は受け取れる
      expect(() => setMode('practice')).not.toThrow();
      expect(() => setDifficulty('beginner')).not.toThrow();
      expect(() => setSpecialty('internal')).not.toThrow();
    });
  });
});