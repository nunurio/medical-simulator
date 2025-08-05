/**
 * Token Bucketアルゴリズムを使用したレート制限実装
 * 医療アプリケーション向けの保守的な制限値を使用
 */
import { RATE_LIMIT_CONSTANTS } from '@/config/constants';
export class TokenBucket {
  private readonly capacity: number;
  private readonly refillRate: number;
  private tokens: number;
  private lastRefillTime: number;

  constructor(capacity: number, refillRate: number) {
    if (capacity <= 0 || refillRate <= 0) {
      throw new Error('Capacity and refillRate must be positive numbers');
    }
    
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity; // 初期状態では満タン
    this.lastRefillTime = Date.now();
  }

  /**
   * トークンを取得する
   * @returns 0: 利用可能, >0: 待機時間（ミリ秒）
   */
  takeToken(): number {
    this.refillTokens();
    
    if (this.tokens >= 1) {
      this.tokens--;
      return 0;
    }
    
    // トークンがない場合、次のトークンが補充されるまでの待機時間を計算
    const timeToNextToken = (1 / this.refillRate) * 1000; // 秒をミリ秒に変換
    return Math.ceil(timeToNextToken);
  }

  /**
   * 時間経過に基づいてトークンを補充する
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;
    
    if (timePassed > 0) {
      // 経過時間に基づいて補充するトークン数を計算
      const tokensToAdd = (timePassed / 1000) * this.refillRate;
      
      // 最大容量を超えないように制限
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      
      this.lastRefillTime = now;
    }
  }
}

/**
 * 医療アプリケーション用のレート制限インスタンス
 * capacity: RATE_LIMIT_CONSTANTS.CAPACITY (バースト対応)
 * refillRate: RATE_LIMIT_CONSTANTS.REQUESTS_PER_MINUTE/60 (1分間にRPMリクエスト)
 */
export const medicalRateLimiter = new TokenBucket(
  RATE_LIMIT_CONSTANTS.CAPACITY,
  RATE_LIMIT_CONSTANTS.REQUESTS_PER_MINUTE / 60
);