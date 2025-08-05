import { randomUUID } from 'crypto';
import { HTTP_STATUS } from '@/config/constants';

/**
 * ログレベルの型定義
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * HTTPステータスコードの型定義（主要なもの）
 */
export type HTTPStatusCode = 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503 | 504;

/**
 * PHI (Protected Health Information) として除外すべきフィールド
 */
const PHI_FIELDS = [
  'patientName',
  'email',
  'phone',
  'ssn',
  'medicalRecordNumber',
  'dateOfBirth',
  'address',
  'insuranceNumber'
] as const;

/**
 * リトライ可能なステータスコード
 */
const RETRYABLE_STATUS_CODES: readonly number[] = [
  HTTP_STATUS.TOO_MANY_REQUESTS,
  HTTP_STATUS.INTERNAL_SERVER_ERROR,
  HTTP_STATUS.SERVICE_UNAVAILABLE,
  HTTP_STATUS.GATEWAY_TIMEOUT
];

/**
 * エラーメッセージのマッピング（医療アプリケーション向け）
 */
const ERROR_MESSAGES: Record<number | 'default', string> = {
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'リクエスト制限に達しました。しばらく待ってから再試行してください。',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'AIサービスが一時的に利用できません。しばらく待ってから再試行してください。',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'AIサービスが一時的に利用できません。しばらく待ってから再試行してください。',
  [HTTP_STATUS.UNAUTHORIZED]: 'アクセス認証に問題があります。管理者にお問い合わせください。',
  [HTTP_STATUS.NOT_FOUND]: 'リクエストされたリソースが見つかりません。',
  [HTTP_STATUS.BAD_REQUEST]: '不正なリクエストです。入力内容を確認してください。',
  [HTTP_STATUS.BAD_GATEWAY]: 'ゲートウェイエラーが発生しました。しばらく待ってから再試行してください。',
  [HTTP_STATUS.GATEWAY_TIMEOUT]: 'タイムアウトが発生しました。しばらく待ってから再試行してください。',
  default: '予期しないエラーが発生しました。サポートにお問い合わせください。'
} as const;

/**
 * ユニークなcorrelation IDを生成します（UUID v4形式）
 * @returns UUID v4形式の文字列
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * ステータスコードに応じたユーザーフレンドリーなメッセージを返します
 * @param statusCode HTTPステータスコード
 * @returns ユーザー向けエラーメッセージ
 */
export function getUserFriendlyMessage(statusCode?: number): string {
  if (!statusCode) {
    return ERROR_MESSAGES.default;
  }
  
  return ERROR_MESSAGES[statusCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default;
}

/**
 * ログエントリの型定義
 */
interface LogEntry {
  level: LogLevel;
  timestamp: string;
  correlationId: string;
  data: unknown;
}

/**
 * APIエラーの結果を表す型
 */
export interface APIErrorResult {
  success: false;
  error: string;
  correlationId: string;
  retryable: boolean;
}

/**
 * PHIフィールドかどうかを判定します
 * @param key オブジェクトのキー
 * @returns PHIフィールドの場合true
 */
function isPHIField(key: string): boolean {
  return PHI_FIELDS.includes(key as typeof PHI_FIELDS[number]);
}

/**
 * オブジェクトからPHIフィールドを除外します
 * @param data 元のデータオブジェクト
 * @returns PHIフィールドが除外されたオブジェクト
 */
function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== 'object' || data === null) {
    return data;
  }

  return Object.keys(data).reduce((acc, key) => {
    if (!isPHIField(key)) {
      acc[key] = (data as Record<string, unknown>)[key];
    }
    return acc;
  }, {} as Record<string, unknown>);
}

/**
 * PHIを除外したログ記録を行います
 * @param level ログレベル
 * @param data ログデータ
 * @param correlationId 関連ID
 */
export function logWithoutPHI(
  level: LogLevel,
  data: unknown,
  correlationId: string
): void {
  const logEntry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    correlationId,
    data: sanitizeData(data)
  };

  console.log(JSON.stringify(logEntry));
}

/**
 * ステータスコードがリトライ可能かどうかを判定します
 * @param statusCode HTTPステータスコード
 * @returns リトライ可能な場合true
 */
function isRetryableStatus(statusCode?: number): boolean {
  return statusCode ? RETRYABLE_STATUS_CODES.includes(statusCode) : false;
}

/**
 * OpenAI APIエラーを包括的に処理します
 * @param error エラーオブジェクト
 * @param statusCode HTTPステータスコード
 * @returns 構造化されたエラーレスポンス
 */
export function handleAPIError(error: Error, statusCode?: number): APIErrorResult {
  const correlationId = generateCorrelationId();
  const userMessage = getUserFriendlyMessage(statusCode);
  const retryable = isRetryableStatus(statusCode);
  
  // エラー情報をPHIを除外してログ記録
  const errorData = {
    message: error.message,
    statusCode,
    stack: error.stack,
    // Include other error properties but exclude message to avoid duplication
    ...Object.fromEntries(
      Object.entries(error).filter(([key]) => key !== 'message' && key !== 'stack')
    )
  };
  
  logWithoutPHI('error', errorData, correlationId);
  
  return {
    success: false,
    error: userMessage,
    correlationId,
    retryable
  };
}