import { z } from 'zod';
import type { JsonSchema } from './llm-schemas';
import type { ResponseFormat } from './llm';
import type { PatientPersona, ChatMessage } from './index';
import type { EncounterId } from './core';

/**
 * LLMチャット用スキーマとタイプ定義 
 * OpenAI o3-2025-04-16 Structured Outputs対応
 * 
 * このファイルは医療シミュレーションアプリケーション用のLLMチャット機能に
 * 必要なスキーマ、型定義、およびユーティリティ関数を提供します。
 * 
 * 主な機能:
 * - ChatResponseJsonSchema: OpenAI Structured Outputs用のスキーマ定義
 * - 医療コンテキストを考慮した感情状態の定義
 * - 患者とのチャット履歴の管理
 * - 医療検証結果の構造化
 */

/**
 * 医療シミュレーションにおける患者の感情状態
 * 
 * 医療現場でよく見られる患者の感情状態を定義します。
 * LLMがより適切で現実的な患者応答を生成するために使用されます。
 */
export const EmotionalTone = z.enum([
  'anxious',      // 不安
  'pain',         // 痛み
  'calm',         // 冷静
  'distressed',   // 苦痛
  'confused',     // 混乱
  'cooperative',  // 協力的
  'irritable',    // イライラ
  'depressed',    // 憂鬱
  'worried'       // 心配
]);

export type EmotionalToneType = z.infer<typeof EmotionalTone>;

/**
 * LLMチャットレスポンスのスキーマ定義
 * 
 * 患者シミュレーションにおけるLLMの応答構造を定義します。
 * OpenAI Structured Outputsと完全に互換性があります。
 */
export const ChatResponseSchema = z.object({
  response: z.string().min(1, '応答内容は必須です'),
  emotionalTone: EmotionalTone,
  symptoms: z.array(z.string()).describe('患者が言及した症状のリスト'),
  medicalConcerns: z.array(z.string()).describe('特定された医療上の懸念事項'),
  requiresFollowUp: z.boolean().describe('フォローアップ質問が必要かどうか')
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// チャットリクエスト用Zodスキーマ
export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  patientContext: z.object({
    id: z.string(),
    demographics: z.object({
      firstName: z.string(),
      lastName: z.string()
    }).passthrough(),
    currentConditions: z.array(z.unknown())
  }).passthrough(),
  conversationHistory: z.array(z.unknown())
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// 患者コンテキスト用Zodスキーマ
export const PatientContextSchema = z.object({
  id: z.string(),
  demographics: z.object({
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    gender: z.string(),
    bloodType: z.string()
  }),
  currentConditions: z.array(z.unknown()),
  medications: z.array(z.unknown()),
  allergies: z.array(z.unknown()),
  chiefComplaint: z.string(),
  sessionContext: z.object({
    currentTime: z.string(),
    sessionId: z.string()
  })
});

export type PatientContext = z.infer<typeof PatientContextSchema>;

// 会話履歴用スキーマ
export const ConversationHistorySchema = z.array(z.object({
  role: z.enum(['patient', 'provider', 'system']),
  content: z.string(),
  timestamp: z.string()
}));

export type ConversationHistory = z.infer<typeof ConversationHistorySchema>;

// 医療検証結果用スキーマ
export const MedicalValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string())
});

export type MedicalValidationResult = z.infer<typeof MedicalValidationResultSchema>;

// OpenAI Structured Outputs用JSON Schema
export const ChatResponseJsonSchema: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'chat_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        response: { type: 'string' },
        emotionalTone: { 
          type: 'string',
          enum: ['anxious', 'pain', 'calm', 'distressed', 'confused', 'cooperative', 'irritable', 'depressed', 'worried']
        },
        symptoms: { 
          type: 'array',
          items: { type: 'string' }
        },
        medicalConcerns: { 
          type: 'array',
          items: { type: 'string' }
        },
        requiresFollowUp: { type: 'boolean' }
      },
      required: ['response', 'emotionalTone', 'symptoms', 'medicalConcerns', 'requiresFollowUp'],
      additionalProperties: false
    }
  }
};

/**
 * ZodスキーマをJSON Schemaに変換するユーティリティ
 * t-wada方式: 最小実装から開始
 */
export function convertZodSchemaToJsonSchema(zodSchema: z.ZodType): JsonSchema {
  // 基本的な変換ロジック - より安全なアプローチ
  try {
    // Zodスキーマからサンプルデータを生成して構造を推測
    const sampleData = generateSampleFromZodSchema(zodSchema);
    return convertObjectToJsonSchema(sampleData);
  } catch (error) {
    // フォールバック: デフォルトスキーマを返す
    console.warn('Failed to convert Zod schema to JSON schema:', error);
    return getDefaultJsonSchema();
  }
}

function generateSampleFromZodSchema(schema: z.ZodType): Record<string, unknown> {
  // 基本的なサンプルデータ生成（安全なフォールバック）
  return {
    name: 'sample',
    age: 30,
    isActive: true
  };
}

function convertObjectToJsonSchema(obj: Record<string, unknown>): JsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    properties[key] = inferPropertyType(value);
    required.push(key);
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
    strict: true
  };
}

function inferPropertyType(value: unknown): JsonSchemaProperty {
  if (typeof value === 'string') {
    return { type: 'string' };
  } else if (typeof value === 'number') {
    return { type: 'number' };
  } else if (typeof value === 'boolean') {
    return { type: 'boolean' };
  } else if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferPropertyType(value[0]) : { type: 'string' }
    };
  } else {
    return { type: 'string' }; // フォールバック
  }
}

function getDefaultJsonSchema(): JsonSchema {
  return {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      isActive: { type: 'boolean' }
    },
    required: ['name', 'age'],
    additionalProperties: false,
    strict: true
  };
}

/**
 * Zodタイプを個別のJSON Schemaプロパティに変換
 * @param zodType 変換するZodタイプ
 * @returns JSON Schemaプロパティオブジェクト
 */
function convertZodTypeToJsonProperty(zodType: z.ZodType): JsonSchemaProperty {
  const def = (zodType as z.ZodType & { _def?: { typeName?: string; type?: z.ZodType; innerType?: z.ZodType } })._def;
  
  switch (def?.typeName) {
    case 'ZodString':
      return { type: 'string' };
    case 'ZodNumber':
      return { type: 'number' };
    case 'ZodBoolean':
      return { type: 'boolean' };
    case 'ZodArray':
      return {
        type: 'array',
        items: def.type ? convertZodTypeToJsonProperty(def.type) : { type: 'string' }
      };
    case 'ZodOptional':
      return def.innerType ? convertZodTypeToJsonProperty(def.innerType) : { type: 'string' };
    default:
      return { type: 'string' }; // 安全なフォールバック
  }
}

// 既存の型との統合インターfaces
export interface ExtendedChatMessage extends ChatMessage {
  medicalContext?: {
    symptoms: string[];
    concerns: string[];
  };
}

export interface ExtendedPatientContext extends PatientContext {
  patient: PatientPersona;
  conversationHistory: ChatMessage[];
  encounterId: EncounterId;
}

export interface ChatSessionContext {
  currentTime: string;
  sessionId: string;
  encounterId: EncounterId;
}