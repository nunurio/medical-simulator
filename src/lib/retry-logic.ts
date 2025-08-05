/**
 * 指数バックオフによるリトライロジック
 * 医療アプリケーション向けの保守的な制限値を使用
 */
import { medicalRateLimiter } from './rate-limiter';
import { RETRY_CONSTANTS } from '@/config/constants';

/**
 * OpenAI APIコール用のリトライ関数
 * @param fn 実行する関数
 * @param maxRetries 最大リトライ回数（デフォルト: 3）
 * @param functionName デバッグ用の関数名（オプション）
 * @returns 関数の実行結果
 */
export async function callOpenAIWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONSTANTS.DEFAULT_MAX_RETRIES,
  functionName: string = 'unknown'
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // レート制限チェック
      const waitTime = medicalRateLimiter.takeToken();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // 実際の関数を実行
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // 最後の試行で失敗した場合はエラーを投げる
      if (attempt === maxRetries) {
        console.error(`${functionName}: All ${maxRetries} attempts failed. Last error:`, lastError.message);
        throw lastError;
      }
      
      // リトライ可能なエラーかチェック
      if (!isRetryableError(lastError)) {
        console.error(`${functionName}: Non-retryable error encountered:`, lastError.message);
        throw lastError;
      }
      
      console.log(`${functionName}: Attempt ${attempt} failed, preparing to retry. Error:`, lastError.message);
      
      // 指数バックオフで待機
      await exponentialBackoff(attempt);
    }
  }

  // TypeScriptの型安全性のため（実際にはここに到達しない）
  throw lastError!;
}

/**
 * Full-jitter exponential backoff実装
 * 最大遅延: 60秒、Full-jitterでサンダリングハード問題を回避
 * @param attempt リトライ試行回数
 */
export async function exponentialBackoff(attempt: number): Promise<void> {
  if (attempt <= 0) {
    throw new Error('Attempt number must be positive');
  }
  
  // baseDelay: Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt - 1))
  const baseDelay = Math.min(
    RETRY_CONSTANTS.MAX_DELAY_MS, 
    RETRY_CONSTANTS.BASE_DELAY_MS * Math.pow(RETRY_CONSTANTS.BACKOFF_FACTOR, attempt - 1)
  );
  
  // jitteredDelay: Math.random() * baseDelay (Full-jitter)
  const jitteredDelay = Math.random() * baseDelay;
  
  console.log(
    `Retrying attempt ${attempt}, waiting ${Math.round(jitteredDelay)}ms`
  );
  
  await new Promise(resolve => setTimeout(resolve, jitteredDelay));
}

/**
 * リトライ可能なエラーかどうかを判定する
 * @param error エラーオブジェクト
 * @returns リトライ可能な場合はtrue
 */
function isRetryableError(error: Error): boolean {
  const status = (error as Error & { status?: number }).status;
  const code = (error as Error & { code?: string }).code;
  
  // 429 (Rate Limit) はリトライ
  if (status === 429) return true;
  
  // 5xx サーバーエラーはリトライ
  if (typeof status === 'number' && status >= 500 && status < 600) {
    return true;
  }
  
  // ネットワークエラーはリトライ
  const retryableNetworkCodes = [
    'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED', 'ENETUNREACH'
  ];
  if (typeof code === 'string' && retryableNetworkCodes.includes(code)) {
    return true;
  }
  
  // 4xx クライアントエラー（429以外）はリトライしない
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return false;
  }
  
  // タイムアウトエラーはリトライ
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return true;
  }
  
  // その他のエラーはリトライ（保守的なアプローチ）
  return true;
}