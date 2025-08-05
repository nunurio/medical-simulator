import { z } from 'zod';
import { PatientPersona, PatientId, ScenarioId } from './index';

// 既存の型定義をインポート（現在未使用だが将来の拡張のため保持）
// import type { Department, DifficultyLevel, SimulationMode } from './state';

// GeneratePatientRequest schema with proper enum values
export const GeneratePatientRequestSchema = z.object({
  specialty: z.enum(['general_medicine', 'cardiology', 'gastroenterology', 'respiratory', 'neurology', 'emergency'] as const),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'] as const),
  mode: z.enum(['outpatient', 'emergency', 'inpatient'] as const),
  specificDisease: z.string().optional(),
});

export type GeneratePatientRequest = z.infer<typeof GeneratePatientRequestSchema>;

export interface GeneratePatientResponse {
  patient: PatientPersona & {
    id: PatientId;
    scenarioId: ScenarioId;
  };
  initialQuestionnaire: InitialQuestionnaire;
  modelConfiguration: ModelConfiguration;
}

// Question types
export type QuestionType = 'open_ended' | 'multiple_choice' | 'scale' | 'yes_no';

// Base question interface
interface BaseQuestion {
  readonly id: string;
  readonly text: string;
  readonly type: QuestionType;
  readonly required: boolean;
}

// Specific question types
export interface OpenEndedQuestion extends BaseQuestion {
  type: 'open_ended';
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  readonly options: string[];
}

export interface ScaleQuestion extends BaseQuestion {
  type: 'scale';
  readonly scaleMin: number;
  readonly scaleMax: number;
  readonly scaleLabel?: string;
}

export interface YesNoQuestion extends BaseQuestion {
  type: 'yes_no';
}

export type Question = OpenEndedQuestion | MultipleChoiceQuestion | ScaleQuestion | YesNoQuestion;

// Question schemas
const BaseQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  required: z.boolean(),
});

const OpenEndedQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('open_ended'),
});

const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('multiple_choice'),
  options: z.array(z.string().min(1)).min(1),
});

const ScaleQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('scale'),
  scaleMin: z.number().int(),
  scaleMax: z.number().int(),
  scaleLabel: z.string().optional(),
}).refine(data => data.scaleMax > data.scaleMin, {
  message: "scaleMaxはscaleMinより大きくなければなりません",
  path: ["scaleMax"]
});

const YesNoQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('yes_no'),
});

const QuestionSchema = z.discriminatedUnion('type', [
  OpenEndedQuestionSchema,
  MultipleChoiceQuestionSchema,
  ScaleQuestionSchema,
  YesNoQuestionSchema,
]);

export interface InitialQuestionnaire {
  readonly questions: Question[];
}

export const InitialQuestionnaireSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
});

// Model Configuration
export interface ModelConfiguration {
  readonly temperature: number;
  readonly maxTokens: number;
  readonly model: string;
  readonly promptTemplate: string;
  readonly systemPrompt?: string;
  readonly frequencyPenalty?: number;
  readonly presencePenalty?: number;
}

export const ModelConfigurationSchema = z.object({
  temperature: z.number()
    .min(0, { message: "temperatureは0以上である必要があります" })
    .max(1, { message: "temperatureは1以下である必要があります" }),
  maxTokens: z.number()
    .int({ message: "maxTokensは整数である必要があります" })
    .positive({ message: "maxTokensは正の数である必要があります" }),
  model: z.string().min(1, { message: "model名は必須です" }),
  promptTemplate: z.string().min(1, { message: "promptTemplateは必須です" }),
  systemPrompt: z.string().optional(),
  frequencyPenalty: z.number()
    .min(-2, { message: "frequencyPenaltyは-2以上である必要があります" })
    .max(2, { message: "frequencyPenaltyは2以下である必要があります" })
    .optional(),
  presencePenalty: z.number()
    .min(-2, { message: "presencePenaltyは-2以上である必要があります" })
    .max(2, { message: "presencePenaltyは2以下である必要があります" })
    .optional(),
});

// GeneratePatientResponse schema
export const GeneratePatientResponseSchema = z.object({
  patient: z.object({
    id: z.string(), // PatientId validation
    scenarioId: z.string(), // ScenarioId validation
    // PatientPersona fields - simplified for now, would need to import actual PatientPersona schema
    demographics: z.object({
      firstName: z.string(),
      lastName: z.string(),
      dateOfBirth: z.string(),
      gender: z.enum(['male', 'female', 'other', 'unknown']),
      bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    }),
    vitalSigns: z.object({
      bloodPressure: z.object({
        systolic: z.number(),
        diastolic: z.number(),
        unit: z.literal('mmHg'),
      }),
      heartRate: z.object({
        value: z.number(),
        unit: z.literal('bpm'),
      }),
      temperature: z.object({
        value: z.number(),
        unit: z.enum(['celsius', 'fahrenheit']),
      }),
      respiratoryRate: z.object({
        value: z.number(),
        unit: z.literal('breaths/min'),
      }),
      oxygenSaturation: z.object({
        value: z.number(),
        unit: z.literal('%'),
      }),
      recordedAt: z.string(),
    }),
    currentMedications: z.array(z.any()),
    allergies: z.array(z.any()),
    medicalHistory: z.object({
      surgicalHistory: z.array(z.any()),
      familyHistory: z.array(z.any()),
      pastIllnesses: z.array(z.any()),
      hospitalizations: z.array(z.any()),
    }),
    currentConditions: z.array(z.any()),
    socialHistory: z.object({}),
    insuranceInfo: z.object({
      provider: z.string(),
      policyNumber: z.string(),
      validUntil: z.string(),
    }),
  }),
  initialQuestionnaire: InitialQuestionnaireSchema,
  modelConfiguration: ModelConfigurationSchema,
});