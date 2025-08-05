/**
 * Score Calculator Service
 * 教育シミュレーターのスコア計算とランク評価
 */

// スコア計算に使用するアクション型定義
export interface SimulatorAction {
  id: string;
  type: 'diagnosis' | 'test_order' | 'treatment' | 'communication';
  timestamp: number;
  value: unknown;
  expected: unknown;
  isCorrect?: boolean;
  responseTime?: number;
}

export interface ScoreMetrics {
  diagnosticAccuracy: number;
  testOrderAppropriate: number; 
  timeEfficiency: number;
  communicationScore: number;
  totalScore: number;
}

export interface ScoreWeights {
  diagnosticAccuracy: number;
  testOrderAppropriate: number;
  timeEfficiency: number;
  communicationScore: number;
}

export type ScoreRank = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * 基本的なスコア計算（同期版メトリクスを非同期でラップ）
 * @param actions - シミュレーターアクション配列
 * @returns Promise<ScoreMetrics> - 計算されたスコアメトリクス
 */
export async function calculateScore(actions: SimulatorAction[]): Promise<ScoreMetrics> {
  return new Promise(resolve => {
    resolve(calculateScoreMetrics(actions));
  });
}

/**
 * スコアメトリクスの計算（同期版）
 * @param actions - シミュレーターアクション配列  
 * @returns ScoreMetrics - 計算されたスコアメトリクス
 */
export function calculateScoreMetrics(actions: SimulatorAction[]): ScoreMetrics {
  if (actions.length === 0) {
    return {
      diagnosticAccuracy: 0,
      testOrderAppropriate: 0,
      timeEfficiency: 0,
      communicationScore: 0,
      totalScore: 0,
    };
  }

  // 診断精度の計算
  const diagnosticActions = actions.filter(action => action.type === 'diagnosis');
  const correctDiagnoses = diagnosticActions.filter(action => action.isCorrect).length;
  const diagnosticAccuracy = diagnosticActions.length > 0 
    ? (correctDiagnoses / diagnosticActions.length) * 100 
    : 0;

  // 検査オーダーの適切性計算（仮実装）
  const testOrderActions = actions.filter(action => action.type === 'test_order');
  const correctTestOrders = testOrderActions.filter(action => action.isCorrect).length;
  const testOrderAppropriate = testOrderActions.length > 0 
    ? (correctTestOrders / testOrderActions.length) * 100 
    : 0;

  // 時間効率の計算
  const actionsWithTime = actions.filter(action => action.responseTime !== undefined && action.responseTime > 0);
  let timeEfficiency = 0;
  if (actionsWithTime.length > 0) {
    const averageTime = actionsWithTime.reduce((sum, action) => sum + (action.responseTime || 0), 0) / actionsWithTime.length;
    // 2秒以下は100点、5秒で70点、10秒で30点、15秒以上は0点
    timeEfficiency = Math.max(0, Math.min(100, 110 - (averageTime / 1000) * 8));
  }

  // コミュニケーションスコア（仮実装）
  const communicationActions = actions.filter(action => action.type === 'communication');
  const correctCommunications = communicationActions.filter(action => action.isCorrect).length;
  const communicationScore = communicationActions.length > 0 
    ? (correctCommunications / communicationActions.length) * 100 
    : 0;

  // 総合スコア計算（等重み）
  const totalScore = (diagnosticAccuracy + testOrderAppropriate + timeEfficiency + communicationScore) / 4;

  return {
    diagnosticAccuracy,
    testOrderAppropriate,
    timeEfficiency,
    communicationScore,
    totalScore,
  };
}

/**
 * 重み付きスコア計算
 * @param actions - シミュレーターアクション配列
 * @param weights - スコア重み設定
 * @returns Promise<ScoreMetrics> - 重み付きスコアメトリクス
 */
export async function calculateWeightedScore(
  actions: SimulatorAction[], 
  weights: ScoreWeights
): Promise<ScoreMetrics> {
  // 基本的なメトリクスを取得
  const metrics = calculateScoreMetrics(actions);
  
  // 重み正規化（重みの合計が1になるように調整）
  const weightSum = weights.diagnosticAccuracy + weights.testOrderAppropriate + 
                   weights.timeEfficiency + weights.communicationScore;
  
  if (weightSum === 0) {
    throw new Error('Weight sum cannot be zero');
  }
  
  const normalizedWeights = {
    diagnosticAccuracy: weights.diagnosticAccuracy / weightSum,
    testOrderAppropriate: weights.testOrderAppropriate / weightSum,
    timeEfficiency: weights.timeEfficiency / weightSum,
    communicationScore: weights.communicationScore / weightSum,
  };
  
  // 重み付き総合スコア計算
  const weightedTotal = 
    metrics.diagnosticAccuracy * normalizedWeights.diagnosticAccuracy +
    metrics.testOrderAppropriate * normalizedWeights.testOrderAppropriate +
    metrics.timeEfficiency * normalizedWeights.timeEfficiency +
    metrics.communicationScore * normalizedWeights.communicationScore;

  return {
    ...metrics,
    totalScore: weightedTotal,
  };
}

/**
 * スコアをS-Dランクに変換（仮実装）
 * @param totalScore - 総合スコア (0-100)
 * @returns ScoreRank - S/A/B/C/Dランク
 */
export function convertScoreToRank(totalScore: number): ScoreRank {
  // 仮実装: 親エージェントの要件に従ったランク分け
  if (totalScore >= 90) return 'S';
  if (totalScore >= 80) return 'A';
  if (totalScore >= 70) return 'B';
  if (totalScore >= 60) return 'C';
  return 'D';
}

/**
 * 非同期スコア計算のサポート（将来の拡張用）
 * @param actions - シミュレーターアクション配列
 * @returns Promise<ScoreMetrics> - 非同期計算結果
 */
export async function calculateScoreAsync(actions: SimulatorAction[]): Promise<ScoreMetrics> {
  // 仮実装: 同期版を非同期でラップ
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(calculateScoreMetrics(actions));
    }, 10); // 10ms遅延でasync動作をシミュレート
  });
}