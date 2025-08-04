import { z } from 'zod';
import { 
  MEDICAL_CODES, 
  VALIDATION_MESSAGES 
} from './validation-utils';
import { Gender, createAgeAwareVitalSignsSchema } from './validation';

// 人口統計データスキーマ
export const DemographicsSchema = z.object({
  age: z.number()
    .int()
    .min(0, { message: VALIDATION_MESSAGES.RANGE.TOO_LOW('年齢', 0) })
    .max(150, { message: VALIDATION_MESSAGES.RANGE.TOO_HIGH('年齢', 150) }),
  gender: z.enum(['male', 'female', 'other', 'unknown']),
  weight: z.number()
    .min(0.5, { message: VALIDATION_MESSAGES.RANGE.TOO_LOW('体重', 0.5, 'kg') })
    .max(500, { message: VALIDATION_MESSAGES.RANGE.TOO_HIGH('体重', 500, 'kg') }), // kg
  height: z.number()
    .min(30, { message: VALIDATION_MESSAGES.RANGE.TOO_LOW('身長', 30, 'cm') })
    .max(300, { message: VALIDATION_MESSAGES.RANGE.TOO_HIGH('身長', 300, 'cm') }), // cm
});

// 既往歴スキーマ
export const MedicalHistorySchema = z.object({
  condition: z.string().min(1, { message: VALIDATION_MESSAGES.REQUIRED('病名') }),
  icd10Code: z.string().regex(
    MEDICAL_CODES.ICD10_REGEX,
    { message: VALIDATION_MESSAGES.FORMAT.INVALID('ICD-10コード', '例: I10, E11.9') }
  ),
  onsetDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    { message: VALIDATION_MESSAGES.FORMAT.INVALID('日付', 'YYYY-MM-DD') }
  ).optional(),
  severity: z.enum(['mild', 'moderate', 'severe'])
});

// アレルギー情報スキーマ
export const AllergySchema = z.object({
  allergen: z.string().min(1, { message: VALIDATION_MESSAGES.REQUIRED('アレルゲン名') }),
  reaction: z.enum(['rash', 'anaphylaxis', 'respiratory', 'gastrointestinal']),
  severity: z.enum(['mild', 'moderate', 'severe'])
});

// 患者ペルソナバリデーションスキーマ
export const PatientPersonaSchema = z.object({
  demographics: DemographicsSchema,
  medicalHistory: z.array(MedicalHistorySchema),
  allergies: z.array(AllergySchema),
  vitalSigns: z.any() // 動的にバリデーション
}).superRefine((data, ctx) => {
  // 年齢に応じたバイタルサインバリデーション
  if (data.vitalSigns && Object.keys(data.vitalSigns).length > 0) {
    const { age, gender } = data.demographics;
    const vitalSignsSchema = createAgeAwareVitalSignsSchema(age, gender as Gender);
    
    const result = vitalSignsSchema.safeParse(data.vitalSigns);
    if (!result.success) {
      result.error.issues.forEach(issue => {
        ctx.addIssue({
          code: 'custom',
          message: issue.message,
          path: ['vitalSigns', ...issue.path]
        });
      });
    }
  }
});

// 型定義のエクスポート
export type Demographics = z.infer<typeof DemographicsSchema>;
export type MedicalHistory = z.infer<typeof MedicalHistorySchema>;
export type Allergy = z.infer<typeof AllergySchema>;
export type PatientPersona = z.infer<typeof PatientPersonaSchema>;