import { StateCreator } from 'zustand';

// パフォーマンスメトリクス
export interface PerformanceMetrics {
  renderCount: number;
  batchedUpdates: number;
  throttledCalls: number;
  cacheHits: number;
  cacheMisses: number;
  profiledActions: Array<{
    type: string;
    timestamp: number;
    duration: number;
  }>;
}

// パフォーマンス統計を持つstate拡張
export interface PerformanceState {
  getPerformanceMetrics: () => PerformanceMetrics;
}

// ミドルウェア用の型
type PerformanceMiddleware = <T>(
  f: StateCreator<T, [], [], T>
) => StateCreator<T & PerformanceState, [], [], T & PerformanceState>;

// バッチ更新の管理
let batchUpdateCount = 0;
let isBatching = false;
const batchQueue: (() => void)[] = [];

// スロットリングの管理
const throttleMap = new Map<(...args: unknown[]) => unknown, { timeout: NodeJS.Timeout | null; lastArgs: unknown[] }>();
let throttledCallCount = 0;

// メモ化キャッシュとメトリクス
const memoCache = new WeakMap<unknown, Map<(...args: unknown[]) => unknown, unknown>>();
let cacheHits = 0;
let cacheMisses = 0;

// プロファイリング関連
const profiledActions: Array<{
  type: string;
  timestamp: number;
  duration: number;
}> = [];

// 開発環境でのみプロファイリングを有効化
const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

// プロファイリング用のアクション実行関数
export function profileAction<T extends unknown[], R>(
  actionName: string,
  action: (...args: T) => R
): (...args: T) => R {
  if (!isDevelopment) {
    return action;
  }

  return (...args: T): R => {
    const startTime = (globalThis as typeof globalThis & { performance?: { now(): number } }).performance?.now() ?? Date.now();
    
    // React DevToolsにプロファイル開始を通知
    if (typeof window !== 'undefined' && (window as typeof window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: { onCommitFiberRoot?: (...args: unknown[]) => void } }).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      (window as typeof window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: { onCommitFiberRoot?: (...args: unknown[]) => void } }).__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot?.(null, null, null, null);
    }
    
    try {
      const result = action(...args);
      const endTime = (globalThis as typeof globalThis & { performance?: { now(): number } }).performance?.now() ?? Date.now();
      const duration = endTime - startTime;
      
      // プロファイルデータを記録
      profiledActions.push({
        type: actionName,
        timestamp: startTime,
        duration,
      });
      
      // 古いデータをクリーンアップ（最新100件のみ保持）
      if (profiledActions.length > 100) {
        profiledActions.splice(0, profiledActions.length - 100);
      }
      
      // 開発環境でのログ出力
      if (duration > 16) { // 16ms以上の場合は警告
        console.warn(`Slow action detected: ${actionName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = (globalThis as typeof globalThis & { performance?: { now(): number } }).performance?.now() ?? Date.now();
      const duration = endTime - startTime;
      
      profiledActions.push({
        type: `${actionName} (ERROR)`,
        timestamp: startTime,
        duration,
      });
      
      throw error;
    }
  };
}

// メモ化セレクター作成関数
export function createMemoizedSelector<T, R>(
  selector: (state: T) => unknown,
  compute: (selected: unknown) => R
): (state: T) => R {
  return (state: T) => {
    const selected = selector(state);
    
    // キャッシュチェック
    if (!memoCache.has(selected)) {
      memoCache.set(selected, new Map());
    }
    
    const cache = memoCache.get(selected)!;
    
    if (cache.has(compute)) {
      cacheHits++;
      return cache.get(compute);
    }
    
    cacheMisses++;
    const result = compute(selected);
    cache.set(compute, result);
    return result;
  };
}

// バッチ更新関数
export function batchUpdates(fn: () => void): void {
  if (isBatching) {
    // 既にバッチ処理中の場合は、キューに追加
    batchQueue.push(fn);
    return;
  }
  
  isBatching = true;
  batchUpdateCount++;
  
  // メイン処理を実行
  fn();
  
  // キューの処理
  while (batchQueue.length > 0) {
    const queuedFn = batchQueue.shift();
    if (queuedFn) {
      queuedFn();
    }
  }
  
  // 非同期でバッチ状態をリセット
  Promise.resolve().then(() => {
    isBatching = false;
  });
}

// スロットリング関数
export function throttleUpdates<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): T {
  return ((...args: Parameters<T>) => {
    const key = fn;
    
    if (!throttleMap.has(key)) {
      // 初回実行
      throttleMap.set(key, { timeout: null, lastArgs: [] });
      throttledCallCount++;
      fn(...args);
      
      // タイムアウト設定
      throttleMap.get(key)!.timeout = setTimeout(() => {
        const data = throttleMap.get(key);
        if (data && data.lastArgs.length > 0) {
          // 最後の引数で再実行
          fn(...data.lastArgs);
        }
        throttleMap.delete(key);
      }, delay);
      
      return;
    }
    
    // スロットリング中の場合、最後の引数を保存
    const data = throttleMap.get(key)!;
    data.lastArgs = args;
  }) as T;
}

// パフォーマンスミドルウェア
export const performance: PerformanceMiddleware = (f) => (set, get, api) => {
  let renderCount = 0;
  
  // setをラップしてレンダリング回数をカウント
  const wrappedSet: typeof set = (...args) => {
    renderCount++;
    return set(...args);
  };
  
  const state = f(wrappedSet, get, api);
  
  return {
    ...state,
    getPerformanceMetrics: () => ({
      renderCount,
      batchedUpdates: batchUpdateCount,
      throttledCalls: throttledCallCount,
      cacheHits,
      cacheMisses,
      profiledActions: [...profiledActions], // コピーを返して不変性を保つ
    }),
  };
};