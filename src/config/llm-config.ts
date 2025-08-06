import { z } from 'zod';
import { LLM_CONSTANTS, RATE_LIMIT_CONSTANTS, RETRY_CONSTANTS, O3_MODELS, O3ModelType } from './constants';

// リトライ設定のスキーマ
const retriesConfigSchema = z.object({
  maxAttempts: z.number().int().positive().default(RETRY_CONSTANTS.DEFAULT_MAX_RETRIES),
  initialDelay: z.number().positive().default(RETRY_CONSTANTS.BASE_DELAY_MS),
  maxDelay: z.number().positive().default(RETRY_CONSTANTS.MAX_DELAY_MS),
  backoffFactor: z.number().positive().default(RETRY_CONSTANTS.BACKOFF_FACTOR),
});

// レート制限設定のスキーマ
const rateLimitConfigSchema = z.object({
  requestsPerMinute: z.number().int().positive().default(RATE_LIMIT_CONSTANTS.REQUESTS_PER_MINUTE * 60),
  tokensPerMinute: z.number().int().positive().default(90000),
});

// LLM設定のスキーマ定義
export const llmConfigSchema = z.object({
  apiKey: z.string().min(1),
  model: z.string().default(LLM_CONSTANTS.DEFAULT_MODEL),
  temperature: z.number().min(LLM_CONSTANTS.TEMPERATURE_MIN).max(LLM_CONSTANTS.TEMPERATURE_MAX).default(LLM_CONSTANTS.DEFAULT_TEMPERATURE),
  maxTokens: z.number().int().positive().default(LLM_CONSTANTS.DEFAULT_MAX_TOKENS),
  maxCompletionTokens: z.number().int().positive().default(LLM_CONSTANTS.DEFAULT_MAX_COMPLETION_TOKENS),
  retries: retriesConfigSchema,
  rateLimit: rateLimitConfigSchema,
});

export type LLMConfig = z.infer<typeof llmConfigSchema>;
export type RetriesConfig = z.infer<typeof retriesConfigSchema>;
export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

// 環境変数スキーマ
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().optional(),
  OPENAI_ORG_ID: z.string().optional(),
  OPENAI_RPM_LIMIT: z.string().optional(),
  OPENAI_TPM_LIMIT: z.string().optional(),
  DEFAULT_MAX_COMPLETION_TOKENS: z.string().optional(),
});

// 設定オブジェクト（キャッシュ用）
let cachedLLMConfig: LLMConfig | null = null;

// デフォルト設定（医療アプリケーション向けの保守的な値）
const defaultLLMConfig: Omit<LLMConfig, 'apiKey'> = {
  model: LLM_CONSTANTS.DEFAULT_MODEL,
  temperature: LLM_CONSTANTS.DEFAULT_TEMPERATURE, // 医療アプリケーション向けの保守的なデフォルト値
  maxTokens: LLM_CONSTANTS.DEFAULT_MAX_TOKENS,
  maxCompletionTokens: LLM_CONSTANTS.DEFAULT_MAX_COMPLETION_TOKENS,
  retries: {
    maxAttempts: RETRY_CONSTANTS.DEFAULT_MAX_RETRIES,
    initialDelay: RETRY_CONSTANTS.BASE_DELAY_MS,
    maxDelay: RETRY_CONSTANTS.MAX_DELAY_MS,
    backoffFactor: RETRY_CONSTANTS.BACKOFF_FACTOR,
  },
  rateLimit: {
    requestsPerMinute: RATE_LIMIT_CONSTANTS.REQUESTS_PER_MINUTE * 60,
    tokensPerMinute: 90000,
  },
};

// 環境変数を解析してLLM設定を構築
function buildLLMConfig(): LLMConfig {
  const env = envSchema.parse(process.env);
  
  // デフォルト設定をベースに環境変数で上書き
  const config: LLMConfig = {
    ...defaultLLMConfig,
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL || defaultLLMConfig.model,
    maxCompletionTokens: env.DEFAULT_MAX_COMPLETION_TOKENS ? parseInt(env.DEFAULT_MAX_COMPLETION_TOKENS, 10) : defaultLLMConfig.maxCompletionTokens,
    rateLimit: {
      ...defaultLLMConfig.rateLimit,
      requestsPerMinute: env.OPENAI_RPM_LIMIT ? parseInt(env.OPENAI_RPM_LIMIT, 10) : defaultLLMConfig.rateLimit.requestsPerMinute,
      tokensPerMinute: env.OPENAI_TPM_LIMIT ? parseInt(env.OPENAI_TPM_LIMIT, 10) : defaultLLMConfig.rateLimit.tokensPerMinute,
    },
  };

  // スキーマ検証
  return llmConfigSchema.parse(config);
}

// LLM設定を取得
export function getLLMConfig(): LLMConfig {
  if (!cachedLLMConfig) {
    cachedLLMConfig = buildLLMConfig();
  }
  return cachedLLMConfig;
}

// 設定をリセット（テスト用）
export function resetLLMConfig(): void {
  cachedLLMConfig = null;
}

// o3モデル判定ロジック（型安全性を強化）
export function isO3Model(model: string | null | undefined): model is O3ModelType {
  if (!model) return false;
  
  return Object.values(O3_MODELS).includes(model as O3ModelType);
}

// デフォルトエクスポートは遅延評価にする
export function getDefaultLLMConfig(): LLMConfig {
  return getLLMConfig();
}