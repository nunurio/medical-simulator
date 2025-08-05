import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenBucket, medicalRateLimiter } from '../rate-limiter';

describe('TokenBucket', () => {
  let mockDateNow: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    // Date.nowをモックして時間制御
    mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1000000);
  });
  
  afterEach(() => {
    mockDateNow.mockRestore();
  });

  describe('基本的な初期化', () => {
    it('指定されたcapacityとrefillRateで初期化される', () => {
      const bucket = new TokenBucket(10, 5);
      
      // 初期状態ではcapacityまでのトークンが利用可能
      expect(bucket.takeToken()).toBe(0);
    });
  });

  describe('takeTokenメソッド', () => {
    it('トークンが利用可能な場合は0を返す', () => {
      const bucket = new TokenBucket(5, 1);
      
      // 最初のリクエストは即座に処理可能
      expect(bucket.takeToken()).toBe(0);
    });

    it('トークンが枯渇した場合は待機時間（ms）を返す', () => {
      const bucket = new TokenBucket(1, 1); // capacity: 1, refillRate: 1/秒
      
      // 最初のトークンは取得可能
      expect(bucket.takeToken()).toBe(0);
      
      // 2つ目のトークンは待機が必要
      const waitTime = bucket.takeToken();
      expect(waitTime).toBeGreaterThan(0);
    });
  });

  describe('時間ベースの動的補充ロジック', () => {
    it('時間経過によりトークンが補充される', () => {
      const bucket = new TokenBucket(2, 1); // capacity: 2, refillRate: 1/秒
      
      // 初期状態で2つのトークンを消費
      expect(bucket.takeToken()).toBe(0);
      expect(bucket.takeToken()).toBe(0);
      
      // トークンが枯渇
      expect(bucket.takeToken()).toBeGreaterThan(0);
      
      // 1秒経過をシミュレート
      mockDateNow.mockReturnValue(1001000); // 1000ms経過
      
      // トークンが1つ補充されているはず
      expect(bucket.takeToken()).toBe(0);
    });

    it('最大容量を超えてトークンは補充されない', () => {
      const bucket = new TokenBucket(2, 1); // capacity: 2, refillRate: 1/秒
      
      // 10秒経過をシミュレート（10個のトークンが補充されるはずだが、capacity=2なので2個まで）
      mockDateNow.mockReturnValue(1010000); // 10000ms経過
      
      // 2個のトークンのみ取得可能
      expect(bucket.takeToken()).toBe(0);
      expect(bucket.takeToken()).toBe(0);
      
      // 3個目は待機が必要
      expect(bucket.takeToken()).toBeGreaterThan(0);
    });

    it('部分的な時間経過で部分的な補充が行われる', () => {
      const bucket = new TokenBucket(3, 2); // capacity: 3, refillRate: 2/秒
      
      // 3つのトークンを消費
      expect(bucket.takeToken()).toBe(0);
      expect(bucket.takeToken()).toBe(0);
      expect(bucket.takeToken()).toBe(0);
      
      // 0.5秒経過（1つのトークンが補充されるはず）
      mockDateNow.mockReturnValue(1000500);
      
      // 1つのトークンが利用可能
      expect(bucket.takeToken()).toBe(0);
      
      // 2つ目は待機が必要
      expect(bucket.takeToken()).toBeGreaterThan(0);
    });
  });
});

describe('medicalRateLimiter', () => {
  let mockDateNow: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1000000);
  });
  
  afterEach(() => {
    mockDateNow.mockRestore();
  });

  it('医療アプリケーション用の適切な設定で初期化される', () => {
    // capacity: 20, refillRate: 10/60 (1分間に10リクエスト)
    expect(medicalRateLimiter.takeToken()).toBe(0);
  });

  it('バースト容量（20リクエスト）まで即座に処理可能', () => {
    // 新しいインスタンスを作成してテスト
    const testBucket = new TokenBucket(20, 10/60);
    
    // 20リクエストまでは即座に処理可能
    for (let i = 0; i < 20; i++) {
      expect(testBucket.takeToken()).toBe(0);
    }
    
    // 21個目は待機が必要
    expect(testBucket.takeToken()).toBeGreaterThan(0);
  });
});

describe('TokenBucket エラーハンドリング', () => {
  it('不正なcapacityでエラーを投げる', () => {
    expect(() => new TokenBucket(0, 1)).toThrow('Capacity and refillRate must be positive numbers');
    expect(() => new TokenBucket(-1, 1)).toThrow('Capacity and refillRate must be positive numbers');
  });

  it('不正なrefillRateでエラーを投げる', () => {
    expect(() => new TokenBucket(1, 0)).toThrow('Capacity and refillRate must be positive numbers');
    expect(() => new TokenBucket(1, -1)).toThrow('Capacity and refillRate must be positive numbers');
  });
});