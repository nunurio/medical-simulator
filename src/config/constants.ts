/**
 * アプリケーション全体の定数定義
 */

// o3モデル関連の定数
export const O3_MODELS = {
  O3: 'o3-2025-04-16',
  O3_MINI: 'o3-mini-2025-01-31',
  O3_PRO: 'o3-pro-2025-01-31',
} as const;

// LLM関連の定数
export const LLM_CONSTANTS = {
  DEFAULT_MODEL: process.env.DEFAULT_LLM_MODEL || O3_MODELS.O3,
  DEFAULT_TEMPERATURE: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
  DEFAULT_MAX_TOKENS: parseInt(process.env.DEFAULT_MAX_TOKENS || '2000', 10),
  DEFAULT_MAX_COMPLETION_TOKENS: parseInt(process.env.DEFAULT_MAX_COMPLETION_TOKENS || '4096', 10),
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  // o3モデルバリエーション（後方互換性のため残す）
  O3_MODEL: O3_MODELS.O3,
  O3_MINI_MODEL: O3_MODELS.O3_MINI,
  O3_PRO_MODEL: O3_MODELS.O3_PRO,
} as const;

// 型定義
export type O3ModelType = typeof O3_MODELS[keyof typeof O3_MODELS];

// レート制限関連の定数
export const RATE_LIMIT_CONSTANTS = {
  CAPACITY: parseInt(process.env.RATE_LIMIT_CAPACITY || '20', 10),
  REQUESTS_PER_MINUTE: parseInt(process.env.RATE_LIMIT_RPM || '10', 10),
} as const;

// リトライ関連の定数
export const RETRY_CONSTANTS = {
  DEFAULT_MAX_RETRIES: parseInt(process.env.DEFAULT_MAX_RETRIES || '3', 10),
  BASE_DELAY_MS: parseInt(process.env.RETRY_BASE_DELAY_MS || '1000', 10),
  MAX_DELAY_MS: parseInt(process.env.RETRY_MAX_DELAY_MS || '60000', 10),
  BACKOFF_FACTOR: 2,
} as const;

// HTTPステータスコード
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// 医療免責事項
export const MEDICAL_DISCLAIMERS = {
  SIMULATION_WARNING: process.env.MEDICAL_DISCLAIMER || 
    '⚠️ この情報は医療シミュレーション教育目的のみです。実際の医療相談は必ず医師にお問い合わせください。',
} as const;