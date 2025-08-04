import { z } from 'zod';
import { 
  MEDICAL_CONSTANTS, 
  dateTimeSchema, 
  uuidSchema,
  VALIDATION_MESSAGES 
} from './validation-utils';

// 血圧バリデーションスキーマ
export const BloodPressureSchema = z.object({
  systolic: z
    .number()
    .int()
    .min(MEDICAL_CONSTANTS.BLOOD_PRESSURE.SYSTOLIC_MIN, {
      message: VALIDATION_MESSAGES.RANGE.TOO_LOW('収縮期血圧', MEDICAL_CONSTANTS.BLOOD_PRESSURE.SYSTOLIC_MIN, 'mmHg')
    })
    .max(MEDICAL_CONSTANTS.BLOOD_PRESSURE.SYSTOLIC_MAX, {
      message: VALIDATION_MESSAGES.RANGE.TOO_HIGH('収縮期血圧', MEDICAL_CONSTANTS.BLOOD_PRESSURE.SYSTOLIC_MAX, 'mmHg')
    }),
  diastolic: z
    .number()
    .int()
    .min(MEDICAL_CONSTANTS.BLOOD_PRESSURE.DIASTOLIC_MIN, {
      message: VALIDATION_MESSAGES.RANGE.TOO_LOW('拡張期血圧', MEDICAL_CONSTANTS.BLOOD_PRESSURE.DIASTOLIC_MIN, 'mmHg')
    })
    .max(MEDICAL_CONSTANTS.BLOOD_PRESSURE.DIASTOLIC_MAX, {
      message: VALIDATION_MESSAGES.RANGE.TOO_HIGH('拡張期血圧', MEDICAL_CONSTANTS.BLOOD_PRESSURE.DIASTOLIC_MAX, 'mmHg')
    }),
  unit: z.literal('mmHg'),
  takenAt: dateTimeSchema,
  patientId: uuidSchema
}).refine(data => data.diastolic < data.systolic, {
  message: "拡張期血圧は収縮期血圧より低くなければなりません",
  path: ["diastolic"]
});

export type BloodPressure = z.infer<typeof BloodPressureSchema>;

// 年齢グループの定義
export type AgeGroup = 'infant' | 'child' | 'adult' | 'elderly';
export type Gender = 'male' | 'female' | 'other' | 'unknown' | 'all';

// 心拍数の正常範囲
export interface HeartRateRange {
  min: number;
  max: number;
}

// 年齢から年齢グループを判定
function getAgeGroup(age: number): AgeGroup {
  if (age < 1) return 'infant';
  if (age < 12) return 'child';
  if (age < 65) return 'adult';
  return 'elderly';
}

// 年齢別・性別別の心拍数正常範囲を取得
export function getHeartRateRange(age: number, gender: Gender): HeartRateRange {
  const ageGroup = getAgeGroup(age);
  
  // 基本の年齢別範囲
  const baseRanges: Record<AgeGroup, HeartRateRange> = {
    infant: { min: 100, max: 160 },
    child: { min: 70, max: 120 },
    adult: { min: 60, max: 100 },
    elderly: { min: 60, max: 100 }
  };
  
  const range = { ...baseRanges[ageGroup] };
  
  // 性別による調整（将来的に性別固有の調整が必要な場合に備えて）
  if (gender === 'female' && ageGroup === 'adult') {
    // 女性の成人は一般的に心拍数がやや高め
    range.max = 105;
  }
  
  return range;
}



// 年齢別バイタルサインバリデーションスキーマを作成
export const createAgeAwareVitalSignsSchema = (age: number, gender: Gender) => {
  const heartRateRange = getHeartRateRange(age, gender);
  
  return z.object({
    heartRate: z
      .number()
      .int()
      .min(heartRateRange.min, {
        message: `心拍数が低すぎます（最小: ${heartRateRange.min}）`
      })
      .max(heartRateRange.max, {
        message: `心拍数が高すぎます（最大: ${heartRateRange.max}）`
      }),
    temperature: z
      .number()
      .min(MEDICAL_CONSTANTS.TEMPERATURE.MIN, {
        message: VALIDATION_MESSAGES.RANGE.TOO_LOW('体温', MEDICAL_CONSTANTS.TEMPERATURE.MIN, '°C')
      })
      .max(MEDICAL_CONSTANTS.TEMPERATURE.MAX, {
        message: VALIDATION_MESSAGES.RANGE.TOO_HIGH('体温', MEDICAL_CONSTANTS.TEMPERATURE.MAX, '°C')
      }),
    bloodPressure: BloodPressureSchema
  });
};

export type VitalSigns = z.infer<ReturnType<typeof createAgeAwareVitalSignsSchema>>;

// 患者バリデーションは patient-validation.ts に移動
export { 
  PatientPersonaSchema,
  type PatientPersona,
  type Demographics,
  type MedicalHistory,
  type Allergy
} from './patient-validation';