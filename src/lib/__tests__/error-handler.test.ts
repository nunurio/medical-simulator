import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCorrelationId, getUserFriendlyMessage, logWithoutPHI, handleAPIError } from '../error-handler';

describe('generateCorrelationId', () => {
  it('should generate a UUID v4 format correlation ID', () => {
    const correlationId = generateCorrelationId();
    
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    expect(correlationId).toMatch(uuidV4Regex);
  });

  it('should generate unique IDs on multiple calls', () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    
    expect(id1).not.toBe(id2);
  });

  it('should return a string', () => {
    const correlationId = generateCorrelationId();
    
    expect(typeof correlationId).toBe('string');
  });
});

describe('getUserFriendlyMessage', () => {
  it('should return rate limit message for 429 status', () => {
    const message = getUserFriendlyMessage(429);
    
    expect(message).toBe('リクエスト制限に達しました。しばらく待ってから再試行してください。');
  });

  it('should return service unavailable message for 500 status', () => {
    const message = getUserFriendlyMessage(500);
    
    expect(message).toBe('AIサービスが一時的に利用できません。しばらく待ってから再試行してください。');
  });

  it('should return service unavailable message for 503 status', () => {
    const message = getUserFriendlyMessage(503);
    
    expect(message).toBe('AIサービスが一時的に利用できません。しばらく待ってから再試行してください。');
  });

  it('should return authentication error message for 401 status', () => {
    const message = getUserFriendlyMessage(401);
    
    expect(message).toBe('アクセス認証に問題があります。管理者にお問い合わせください。');
  });

  it('should return bad request message for 400 status', () => {
    const message = getUserFriendlyMessage(400);
    
    expect(message).toBe('不正なリクエストです。入力内容を確認してください。');
  });

  it('should return default message for unknown status codes', () => {
    const message = getUserFriendlyMessage(999); // Use an actually unknown status code
    
    expect(message).toBe('予期しないエラーが発生しました。サポートにお問い合わせください。');
  });

  it('should return default message for undefined status', () => {
    const message = getUserFriendlyMessage(undefined);
    
    expect(message).toBe('予期しないエラーが発生しました。サポートにお問い合わせください。');
  });
});

describe('logWithoutPHI', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should log error without PHI fields', () => {
    const errorData = {
      message: 'API Error',
      statusCode: 500,
      patientName: 'John Doe',  // PHI field
      email: 'john@example.com',  // PHI field
      requestId: 'req-123'
    };
    const correlationId = 'corr-123';

    logWithoutPHI('error', errorData, correlationId);

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    
    const logCall = consoleLogSpy.mock.calls[0][0] as string;
    const logObject = JSON.parse(logCall);
    
    expect(logObject).toEqual({
      level: 'error',
      timestamp: expect.any(String),
      correlationId: 'corr-123',
      data: {
        message: 'API Error',
        statusCode: 500,
        requestId: 'req-123'
        // PHI fields should be excluded
      }
    });
  });

  it('should include timestamp in ISO format', () => {
    const errorData = { message: 'Test error' };
    const correlationId = 'corr-123';

    logWithoutPHI('error', errorData, correlationId);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"timestamp"')
    );

    const logCall = consoleLogSpy.mock.calls[0][0] as string;
    const logObject = JSON.parse(logCall);
    
    // ISO形式のタイムスタンプかどうか確認
    expect(new Date(logObject.timestamp)).toBeInstanceOf(Date);
  });

  it('should exclude common PHI fields', () => {
    const errorData = {
      message: 'Test error',
      patientName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '123-456-7890',
      ssn: '123-45-6789',
      medicalRecordNumber: 'MRN123',
      dateOfBirth: '1990-01-01',
      address: '123 Main St',
      insuranceNumber: 'INS456',
      allowedField: 'This should remain'
    };
    const correlationId = 'corr-456';

    logWithoutPHI('warn', errorData, correlationId);

    const logCall = consoleLogSpy.mock.calls[0][0] as string;
    const logObject = JSON.parse(logCall);

    expect(logObject.data).toEqual({
      message: 'Test error',
      allowedField: 'This should remain'
    });
  });

  it('should handle null and undefined data', () => {
    logWithoutPHI('info', null, 'corr-789');
    logWithoutPHI('info', undefined, 'corr-790');

    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    
    const logCall1 = consoleLogSpy.mock.calls[0][0] as string;
    const logObject1 = JSON.parse(logCall1);
    expect(logObject1.data).toBeNull();

    const logCall2 = consoleLogSpy.mock.calls[1][0] as string;
    const logObject2 = JSON.parse(logCall2);
    expect(logObject2.data).toBeUndefined();
  });
});

describe('handleAPIError', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return structured error response with correlation ID', () => {
    const error = new Error('OpenAI API Error');
    const statusCode = 429;

    const result = handleAPIError(error, statusCode);

    expect(result).toEqual({
      success: false,
      error: 'リクエスト制限に達しました。しばらく待ってから再試行してください。',
      correlationId: expect.any(String),
      retryable: true
    });

    // UUID v4形式のcorrelationIdかどうか確認
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(result.correlationId).toMatch(uuidV4Regex);
  });

  it('should determine retryable status correctly', () => {
    // Retryable errors
    expect(handleAPIError(new Error('Rate limit'), 429).retryable).toBe(true);
    expect(handleAPIError(new Error('Server error'), 500).retryable).toBe(true);
    expect(handleAPIError(new Error('Service unavailable'), 503).retryable).toBe(true);

    // Non-retryable errors
    expect(handleAPIError(new Error('Unauthorized'), 401).retryable).toBe(false);
    expect(handleAPIError(new Error('Bad request'), 400).retryable).toBe(false);
  });

  it('should log error without PHI fields', () => {
    const error = new Error('Test error');
    const statusCode = 500;

    handleAPIError(error, statusCode);

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    
    const logCall = consoleLogSpy.mock.calls[0][0] as string;
    const logObject = JSON.parse(logCall);
    
    expect(logObject.level).toBe('error');
    expect(logObject.data).toEqual({
      message: 'Test error',
      statusCode: 500,
      stack: expect.any(String)
    });
    expect(logObject.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should handle error with PHI data correctly', () => {
    const errorWithPHI = new Error('Database error') as Error & {
      patientName?: string;
      email?: string;
      requestId?: string;
    };
    errorWithPHI.patientName = 'John Doe';  // PHI field
    errorWithPHI.email = 'john@example.com';  // PHI field
    errorWithPHI.requestId = 'req-456';  // Safe field

    const result = handleAPIError(errorWithPHI, 500);

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);

    // ログからPHI情報が除外されていることを確認
    const logCall = consoleLogSpy.mock.calls[0][0] as string;
    const logObject = JSON.parse(logCall);
    
    expect(logObject.data.patientName).toBeUndefined();
    expect(logObject.data.email).toBeUndefined();
    expect(logObject.data.requestId).toBe('req-456');
  });

  it('should handle undefined status code', () => {
    const error = new Error('Unknown error');

    const result = handleAPIError(error);

    expect(result).toEqual({
      success: false,
      error: '予期しないエラーが発生しました。サポートにお問い合わせください。',
      correlationId: expect.any(String),
      retryable: false
    });
  });
});