import { z } from 'zod';

// 医学的定数
export const MEDICAL_CONSTANTS = {
  BLOOD_PRESSURE: {
    SYSTOLIC_MIN: 40,
    SYSTOLIC_MAX: 300,
    DIASTOLIC_MIN: 30,
    DIASTOLIC_MAX: 200,
  },
  TEMPERATURE: {
    MIN: 35.0,
    MAX: 42.0,
  },
  HEART_RATE: {
    INFANT: { MIN: 100, MAX: 160 },
    CHILD: { MIN: 70, MAX: 120 },
    ADULT: { MIN: 60, MAX: 100 },
    ELDERLY: { MIN: 60, MAX: 100 },
  },
  RESPIRATORY_RATE: {
    INFANT: { MIN: 30, MAX: 60 },
    CHILD: { MIN: 20, MAX: 30 },
    ADULT: { MIN: 12, MAX: 20 },
    ELDERLY: { MIN: 12, MAX: 25 },
  },
} as const;

// 共通の日時バリデーション
export const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
export const dateTimeSchema = z.string().regex(
  ISO8601_REGEX,
  { message: '日時はISO 8601形式（YYYY-MM-DDTHH:mm:ssZ）である必要があります' }
);

// 共通のUUIDバリデーション
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidSchema = z.string().regex(
  UUID_REGEX,
  { message: '有効なUUID形式である必要があります' }
);

// 医学コード定数
export const MEDICAL_CODES = {
  // ICD-10診断コードの正規表現
  ICD10_REGEX: /^[A-Z]\d{2}(\.\d{1,3})?$/,
  // RxNormドラッグコードの形式（数字のみ）
  RXNORM_REGEX: /^\d+$/,
  // SNOMED CTコードの形式
  SNOMED_REGEX: /^\d{6,18}$/,
} as const;

// バリデーションメッセージテンプレート
export const VALIDATION_MESSAGES = {
  RANGE: {
    TOO_LOW: (field: string, min: number, unit?: string) => 
      `${field}が低すぎます（最小: ${min}${unit ? unit : ''}）`,
    TOO_HIGH: (field: string, max: number, unit?: string) => 
      `${field}が高すぎます（最大: ${max}${unit ? unit : ''}）`,
    OUT_OF_RANGE: (field: string, min: number, max: number, unit?: string) => 
      `${field}は${min}から${max}${unit ? unit : ''}の範囲内である必要があります`,
  },
  FORMAT: {
    INVALID: (field: string, format: string) => 
      `${field}の形式が不正です。${format}形式で入力してください`,
  },
  REQUIRED: (field: string) => `${field}は必須です`,
} as const;