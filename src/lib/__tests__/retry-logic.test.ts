import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callOpenAIWithRetry, exponentialBackoff } from '../retry-logic';

// medicalRateLimiterをモック
vi.mock('../rate-limiter', () => ({
  medicalRateLimiter: {
    takeToken: vi.fn(() => 0), // デフォルトではレート制限なし
  }
}));

// setTimeoutをモック（テスト中は即座に実行）
vi.stubGlobal('setTimeout', vi.fn((cb: () => void) => {
  cb(); // 即座にコールバックを実行
  return 1;
}));

describe('callOpenAIWithRetry', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('基本的なリトライ機能', () => {
    it('成功時は即座に結果を返す', async () => {
      const mockFunction = vi.fn().mockResolvedValue('success');
      
      const result = await callOpenAIWithRetry(mockFunction);
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('失敗後にリトライして成功する', async () => {
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue('success');
      
      const result = await callOpenAIWithRetry(mockFunction);
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });

    it('最大リトライ回数（デフォルト3回）を超えると失敗する', async () => {
      const mockFunction = vi.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(callOpenAIWithRetry(mockFunction)).rejects.toThrow('Persistent error');
      expect(mockFunction).toHaveBeenCalledTimes(3);
    });

    it('カスタムリトライ回数を指定できる', async () => {
      const mockFunction = vi.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(callOpenAIWithRetry(mockFunction, 5)).rejects.toThrow('Persistent error');
      expect(mockFunction).toHaveBeenCalledTimes(5);
    });
  });

  describe('ジェネリック型サポート', () => {
    it('型安全性を保持する', async () => {
      interface TestResult {
        id: number;
        name: string;
      }
      
      const mockFunction = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      
      const result: TestResult = await callOpenAIWithRetry<TestResult>(mockFunction);
      
      expect(result.id).toBe(1);
      expect(result.name).toBe('test');
    });
  });

  describe('レート制限チェック', () => {
    it('レート制限がある場合は待機してからリトライする', async () => {
      const { medicalRateLimiter } = await import('../rate-limiter');
      vi.mocked(medicalRateLimiter.takeToken).mockReturnValue(1000); // 1秒待機
      
      const mockFunction = vi.fn().mockResolvedValue('success');
      
      await callOpenAIWithRetry(mockFunction);
      
      expect(medicalRateLimiter.takeToken).toHaveBeenCalled();
      expect(mockFunction).toHaveBeenCalled();
    });
  });

  describe('リトライ可能エラーの判定', () => {
    it('429エラー（Rate Limit）はリトライする', async () => {
      const error429 = new Error('Rate limit exceeded');
      (error429 as Error & { status: number }).status = 429;
      
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(error429)
        .mockResolvedValue('success');
      
      const result = await callOpenAIWithRetry(mockFunction);
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });

    it('5xxサーバーエラーはリトライする', async () => {
      const error500 = new Error('Internal server error');
      (error500 as Error & { status: number }).status = 500;
      
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(error500)
        .mockResolvedValue('success');
      
      const result = await callOpenAIWithRetry(mockFunction);
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });

    it('4xxクライアントエラー（429以外）はリトライしない', async () => {
      const error400 = new Error('Bad request');
      (error400 as Error & { status: number }).status = 400;
      
      const mockFunction = vi.fn().mockRejectedValue(error400);
      
      await expect(callOpenAIWithRetry(mockFunction)).rejects.toThrow('Bad request');
      expect(mockFunction).toHaveBeenCalledTimes(1); // リトライしない
    });

    it('ネットワークエラーはリトライする', async () => {
      const networkError = new Error('Network error');
      (networkError as Error & { code: string }).code = 'ECONNRESET';
      
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');
      
      const result = await callOpenAIWithRetry(mockFunction);
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('ログ出力とデバッグ機能', () => {
    it('デバッグ用の関数名がログに出力される', async () => {
      const mockFunction = vi.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(callOpenAIWithRetry(mockFunction, 1, 'testFunction')).rejects.toThrow('Test error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'testFunction: All 1 attempts failed. Last error:',
        'Test error'
      );
    });
  });
});

describe('exponentialBackoff', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let mockDateNow: ReturnType<typeof vi.spyOn>;
  let mockMathRandom: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1000000);
    mockMathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    mockDateNow.mockRestore();
    mockMathRandom.mockRestore();
  });

  describe('Full-jitter exponential backoff計算', () => {
    it('指数バックオフの基本計算が正しい', async () => {
      // attempt 1: baseDelay = min(60000, 1000 * 2^0) = 1000ms
      // jitteredDelay = 0.5 * 1000 = 500ms
      await exponentialBackoff(1);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Retrying attempt 1, waiting 500ms'
      );
    });

    it('試行回数に応じて遅延時間が指数的に増加する', async () => {
      // attempt 2: baseDelay = min(60000, 1000 * 2^1) = 2000ms
      // jitteredDelay = 0.5 * 2000 = 1000ms
      await exponentialBackoff(2);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Retrying attempt 2, waiting 1000ms'
      );
    });

    it('最大遅延時間60秒を超えない', async () => {
      // attempt 10: baseDelay = min(60000, 1000 * 2^9) = min(60000, 512000) = 60000ms
      // jitteredDelay = 0.5 * 60000 = 30000ms
      await exponentialBackoff(10);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Retrying attempt 10, waiting 30000ms'
      );
    });

    it('jitterによりランダムな遅延が適用される', async () => {
      mockMathRandom.mockReturnValue(0.25);
      
      // attempt 1: baseDelay = 1000ms, jitteredDelay = 0.25 * 1000 = 250ms
      await exponentialBackoff(1);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('250ms')
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なattempt値でエラーを投げる', async () => {
      await expect(exponentialBackoff(0)).rejects.toThrow('Attempt number must be positive');
      await expect(exponentialBackoff(-1)).rejects.toThrow('Attempt number must be positive');
    });
  });

  describe('強化されたエラー判定', () => {
    it('タイムアウトエラーはリトライする', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue('success');
      
      const result = await callOpenAIWithRetry(mockFunction);
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });

    it('より多くのネットワークエラーコードに対応', async () => {
      const errors = [
        { code: 'ECONNREFUSED', message: 'Connection refused' },
        { code: 'ENETUNREACH', message: 'Network unreachable' }
      ];
      
      for (const errorInfo of errors) {
        const networkError = new Error(errorInfo.message);
        (networkError as Error & { code: string }).code = errorInfo.code;
        
        const mockFunction = vi.fn()
          .mockRejectedValueOnce(networkError)
          .mockResolvedValue('success');
        
        const result = await callOpenAIWithRetry(mockFunction);
        
        expect(result).toBe('success');
        expect(mockFunction).toHaveBeenCalledTimes(2);
        
        vi.clearAllMocks();
      }
    });
  });
});