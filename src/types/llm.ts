import { z } from 'zod';
import { VALIDATION_MESSAGES } from './validation-utils';
import { LLM_CONSTANTS } from '@/config/constants';
import type { PatientPersona } from './patient';
import type { ChatMessage } from './chat';
import type { EncounterId } from './core';

/**
 * LLMプロンプトタイプ
 * 医療シミュレーションアプリケーションで使用される各種LLMタスクを定義
 */
export const LLMPromptTypeSchema = z.enum([
  'patient_generation',         // 患者ペルソナ生成
  'patient_persona_generation', // 患者ペルソナ生成（OpenAI o3用）  
  'chat_response',             // チャット応答
  'examination_finding',       // 診察所見
  'test_result_generation',    // 検査結果生成
  'clinical_update',           // 臨床更新
]);

export type LLMPromptType = z.infer<typeof LLMPromptTypeSchema>;

/**
 * LLMリクエストスキーマ
 * LLMへのリクエストの構造と制約を定義
 */
/**
 * OpenAI Structured Outputs用のResponseFormat型定義
 */
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: false;
    };
  };
}

/**
 * ResponseFormatスキーマ
 */
export const ResponseFormatSchema = z.object({
  type: z.literal('json_schema'),
  json_schema: z.object({
    name: z.string(),
    strict: z.literal(true),
    schema: z.object({
      type: z.literal('object'),
       
      properties: z.record(z.string(), z.object({
        type: z.string()
      }).passthrough() as unknown),
      required: z.array(z.string()),
      additionalProperties: z.literal(false)
    })
  })
});
export const LLMRequestSchema = z.object({
  type: LLMPromptTypeSchema,
  context: z.record(z.string(), z.unknown()),
  systemPrompt: z.string().optional(),
  userPrompt: z.string({
    message: VALIDATION_MESSAGES.REQUIRED('ユーザープロンプト'),
  }),
  temperature: z.number()
    .min(LLM_CONSTANTS.TEMPERATURE_MIN, { message: VALIDATION_MESSAGES.RANGE.TOO_LOW('温度パラメータ', LLM_CONSTANTS.TEMPERATURE_MIN) })
    .max(LLM_CONSTANTS.TEMPERATURE_MAX, { message: VALIDATION_MESSAGES.RANGE.TOO_HIGH('温度パラメータ', LLM_CONSTANTS.TEMPERATURE_MAX) })
    .optional(),
  maxTokens: z.number()
    .positive({ message: VALIDATION_MESSAGES.RANGE.TOO_LOW('最大トークン数', 1) })
    .int({ message: VALIDATION_MESSAGES.FORMAT.INVALID('最大トークン数', '整数') })
    .optional(),
  responseFormat: ResponseFormatSchema.optional(),
});

export type LLMRequest = z.infer<typeof LLMRequestSchema>;

/**
 * LLMレスポンススキーマ
 * LLMからのレスポンスの構造と制約を定義
 */
export const LLMResponseSchema = z.object({
  content: z.string({
    message: VALIDATION_MESSAGES.REQUIRED('レスポンス内容'),
  }),
  usage: z.object({
    promptTokens: z.number()
      .int({ message: VALIDATION_MESSAGES.FORMAT.INVALID('プロンプトトークン数', '整数') })
      .nonnegative({ message: VALIDATION_MESSAGES.RANGE.TOO_LOW('プロンプトトークン数', 0) }),
    completionTokens: z.number()
      .int({ message: VALIDATION_MESSAGES.FORMAT.INVALID('完了トークン数', '整数') })
      .nonnegative({ message: VALIDATION_MESSAGES.RANGE.TOO_LOW('完了トークン数', 0) }),
    totalTokens: z.number()
      .int({ message: VALIDATION_MESSAGES.FORMAT.INVALID('総トークン数', '整数') })
      .nonnegative({ message: VALIDATION_MESSAGES.RANGE.TOO_LOW('総トークン数', 0) }),
  }).optional(),
  model: z.string({
    message: VALIDATION_MESSAGES.REQUIRED('モデル名'),
  }),
  finishReason: z.string().optional(),
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

/**
 * Patient Context for Chat Response Generation
 * LLMによるチャット応答生成時に使用される患者コンテキスト
 */
export interface PatientContext {
  patient: PatientPersona;
  conversationHistory: ChatMessage[];
  encounterId: EncounterId;
  sessionContext: {
    currentTime: string;
    sessionId: string;
  };
}

/**
 * LLMエラークラス
 * LLM関連のエラーを構造化して管理するためのカスタムエラークラス
 */
export class LLMError extends Error {
  public readonly name = 'LLMError';
  
  constructor(
    message: string,
    public readonly code: 'RATE_LIMIT' | 'API_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR',
    public readonly statusCode?: number,
    public readonly retryAfter?: number
  ) {
    super(message);
    Object.setPrototypeOf(this, LLMError.prototype);
  }
}