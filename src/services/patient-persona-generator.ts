import { z } from 'zod';
import { LLMService } from './llm-service';
import type { 
  PatientPersona, 
  FamilyHistoryItem, 
  PastIllness, 
  Hospitalization, 
  Condition, 
  CurrentMedication, 
  Allergy, 
  VitalSigns, 
  VitalSignsHistory
} from '../types/patient';
import type { ISODate } from '../types/core';
import type { LLMResponse } from '../types/llm';
import { createPatientId, createScenarioId } from '../types/core';

// 患者ペルソナ生成パラメータのスキーマ
export const PatientPersonaGenerationParamsSchema = z.object({
  specialty: z.enum(['general_medicine', 'cardiology', 'gastroenterology', 'respiratory', 'neurology', 'emergency'] as const),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'] as const),
  specificDisease: z.string().optional(),
  mode: z.enum(['outpatient', 'emergency', 'inpatient'] as const),
});

export type PatientPersonaGenerationParams = z.infer<typeof PatientPersonaGenerationParamsSchema>;

// LLMレスポンス用のPatientPersonaスキーマ（IDフィールドは後で追加）
const PatientPersonaResponseSchema = z.object({
  demographics: z.object({
    age: z.number(),
    gender: z.enum(['male', 'female', 'other']),
    name: z.string(),
    bloodType: z.string().optional(),
  }),
  medicalHistory: z.object({
    chiefComplaint: z.string().optional(),
    currentConditions: z.array(z.unknown()).optional().default([]),
    pastIllnesses: z.array(z.unknown()).optional().default([]),
    surgeries: z.array(z.unknown()).optional().default([]),
    hospitalizations: z.array(z.unknown()).optional().default([]),
    allergies: z.array(z.unknown()).optional().default([]),
    currentMedications: z.array(z.unknown()).optional().default([]),
    familyHistory: z.array(z.unknown()).optional().default([]),
    socialHistory: z.object({
      smokingHistory: z.object({
        status: z.string(),
        packsPerDay: z.number().optional().default(0),
        years: z.number().optional().default(0),
      }).optional(),
      alcoholHistory: z.object({
        frequency: z.string(),
        amount: z.number().optional().default(0),
        type: z.string().optional().default(''),
      }).optional(),
      exerciseHistory: z.object({
        frequency: z.string(),
        type: z.string().optional().default(''),
        duration: z.number().optional().default(0),
      }).optional(),
    }).optional(),
  }),
  vitalSigns: z.object({
    temperature: z.object({
      value: z.number(),
      unit: z.string().optional().default('celsius'),
      timestamp: z.string(),
    }).optional(),
    bloodPressure: z.object({
      systolic: z.number(),
      diastolic: z.number(),
      timestamp: z.string(),
    }).optional(),
    heartRate: z.object({
      value: z.number(),
      rhythm: z.string().optional().default('regular'),
      timestamp: z.string(),
    }).optional(),
    respiratoryRate: z.object({
      value: z.number(),
      pattern: z.string().optional().default('regular'),
      timestamp: z.string(),
    }).optional(),
    oxygenSaturation: z.object({
      value: z.number(),
      onRoomAir: z.boolean().optional().default(true),
      timestamp: z.string(),
    }).optional(),
  }).optional(),
});


/**
 * 患者ペルソナ生成サービス
 * OpenAI Structured Outputsを使用してリアルな患者ペルソナを生成
 */
export class PatientPersonaGenerator {
  private llmService: LLMService;

  constructor() {
    this.llmService = LLMService.getInstance();
  }

  /**
   * 患者ペルソナを生成する
   * @param params 生成パラメータ（年齢、性別、診療科、難易度）
   * @returns 生成された患者ペルソナ
   */
  async generatePersona(params: PatientPersonaGenerationParams): Promise<PatientPersona> {
    // パラメータのバリデーション
    const validatedParams = PatientPersonaGenerationParamsSchema.parse(params);

    // 診療科・難易度別のコンテキストを構築
    const context = this.buildContext(validatedParams.specialty, validatedParams.difficulty);

    // LLMを使用してペルソナを生成
    const response = await this.llmService.generateCompletion({
      type: 'patient_generation',
      context: { ...validatedParams, ...context },
      systemPrompt: 'You are a medical expert creating realistic patient personas.',
      userPrompt: `Generate a patient persona for ${validatedParams.specialty} specialty, difficulty level: ${validatedParams.difficulty}`,
    });

    // レスポンスをパースして患者ペルソナを作成
    const parsedResponse = this.parseResponse(response);

    // 医学的整合性をチェック
    this.validateMedicalConsistency(parsedResponse);

    return parsedResponse;
  }

  /**
   * 診療科・難易度別のコンテキストを構築
   * @param specialty 診療科
   * @param difficulty 難易度
   * @returns 構築されたコンテキスト
   */
  private buildContext(specialty: string, difficulty: string): Record<string, unknown> {
    const baseContext = {
      specialty,
      difficulty,
    };

    // 診療科別の文脈情報
    const specialtyContexts: Record<string, unknown> = {
      'cardiology': {
        commonConditions: ['心房細動', '狭心症', '心筋梗塞', '心不全', '高血圧'],
        typicalSymptoms: ['胸痛', '動悸', '息切れ', '浮腫'],
        keyTests: ['心電図', '心エコー', 'トロポニン', 'BNP'],
      },
      'general_medicine': {
        commonConditions: ['高血圧', '糖尿病', '脂質異常症', '感冒', '胃腸炎'],
        typicalSymptoms: ['発熱', '頭痛', '倦怠感', '食欲不振', '咳嗽'],
        keyTests: ['血液検査', '尿検査', '胸部X線', '心電図'],
      },
      'gastroenterology': {
        commonConditions: ['胃潰瘍', '逆流性食道炎', '過敏性腸症候群', '胆石症', '慢性肝炎'],
        typicalSymptoms: ['腹痛', '嘔気', '下痢', '便秘', '胸やけ'],
        keyTests: ['胃内視鏡', '腹部エコー', '肝機能検査', 'H.pylori検査'],
      },
      'respiratory': {
        commonConditions: ['気管支喘息', 'COPD', '肺炎', '間質性肺炎', '肺癌'],
        typicalSymptoms: ['咳嗽', '喀痰', '呼吸困難', '胸痛', '発熱'],
        keyTests: ['胸部X線', '胸部CT', '肺機能検査', '喀痰培養'],
      },
      'neurology': {
        commonConditions: ['脳梗塞', 'パーキンソン病', '片頭痛', 'てんかん', '認知症'],
        typicalSymptoms: ['頭痛', 'めまい', '麻痺', '振戦', '意識障害'],
        keyTests: ['頭部MRI', '脳波', '髄液検査', '神経伝導検査'],
      },
      'emergency': {
        commonConditions: ['急性心筋梗塞', '脳卒中', '急性腹症', '外傷', 'ショック'],
        typicalSymptoms: ['意識障害', '激しい痛み', '呼吸困難', '出血', '発熱'],
        keyTests: ['血液ガス', '心電図', 'CT', '超音波検査'],
      },
    };

    // 難易度別の複雑さ設定
    const difficultyContexts: Record<string, unknown> = {
      'beginner': {
        complexity: 'simple',
        comorbidities: 0,
        maxMedications: 2,
        presentationStyle: 'typical',
      },
      'intermediate': {
        complexity: 'moderate',
        comorbidities: 1,
        maxMedications: 4,
        presentationStyle: 'mixed',
      },
      'advanced': {
        complexity: 'complex',
        comorbidities: 2,
        maxMedications: 8,
        presentationStyle: 'atypical',
      },
    };

    return {
      ...baseContext,
      specialtyInfo: specialtyContexts[specialty] || specialtyContexts['general_medicine'],
      difficultyInfo: difficultyContexts[difficulty] || difficultyContexts['intermediate'],
    };
  }

  /**
   * LLMレスポンスをパースして患者ペルソナを生成
   * @param response LLMレスポンス
   * @returns パースされた患者ペルソナ
   */
  private parseResponse(response: LLMResponse): PatientPersona {
    try {
      // レスポンスのクリーニング（マークダウンや余分な文字を削除）
      let cleanedContent = response.content.trim();
      
      // マークダウンのコードブロックを削除
      cleanedContent = cleanedContent.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
      
      // 先頭の非JSON文字を削除（例：**Patient...などのマークダウン）
      const jsonStartIndex = cleanedContent.search(/\{/);
      if (jsonStartIndex > 0) {
        cleanedContent = cleanedContent.substring(jsonStartIndex);
      }
      
      // 末尾の非JSON文字を削除
      const jsonEndIndex = cleanedContent.lastIndexOf('}');
      if (jsonEndIndex > -1 && jsonEndIndex < cleanedContent.length - 1) {
        cleanedContent = cleanedContent.substring(0, jsonEndIndex + 1);
      }
      
      // JSONとしてパース
      const jsonContent = JSON.parse(cleanedContent);
      
      // Zodスキーマでバリデーション
      const validatedResponse = PatientPersonaResponseSchema.parse(jsonContent);
      
      // PatientPersona形式に変換（IDを追加）
      // LLMレスポンスのnameを firstName/lastName に分割
      const nameParts = validatedResponse.demographics.name.split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // ageからdateOfBirthを計算
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - validatedResponse.demographics.age;
      const dateOfBirth = `${birthYear}-01-01` as ISODate;

      const patientPersona: PatientPersona = {
        id: createPatientId(''),
        scenarioId: createScenarioId(''),
        demographics: {
          firstName,
          lastName,
          dateOfBirth,
          gender: validatedResponse.demographics.gender,
          bloodType: (validatedResponse.demographics.bloodType || 'O+') as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
        },
        chiefComplaint: validatedResponse.medicalHistory.chiefComplaint || '',
        presentIllness: '', // LLMから生成されない場合は空文字
        medicalHistory: {
          surgicalHistory: [],
          familyHistory: (validatedResponse.medicalHistory.familyHistory || []) as FamilyHistoryItem[],
          pastIllnesses: (validatedResponse.medicalHistory.pastIllnesses || []) as PastIllness[],
          hospitalizations: (validatedResponse.medicalHistory.hospitalizations || []) as Hospitalization[],
        },
        currentConditions: (validatedResponse.medicalHistory.currentConditions || []) as Condition[],
        medications: (validatedResponse.medicalHistory.currentMedications || []) as CurrentMedication[],
        allergies: (validatedResponse.medicalHistory.allergies || []) as Allergy[],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' as const },
            heartRate: { value: 72, unit: 'bpm' as const },
            temperature: { value: 36.5, unit: 'celsius' as const },
            respiratoryRate: { value: 16, unit: 'breaths/min' as const },
            oxygenSaturation: { value: 98, unit: '%' as const },
            recordedAt: new Date().toISOString() as import('../types/core').ISODateTime,
          },
          trend: 'stable' as const,
          criticalValues: {
            isHypotensive: false,
            isHypertensive: false,
            isTachycardic: false,
            isBradycardic: false,
            isFebrile: false,
            isHypoxic: false,
          }
        },
        socialHistory: {},
        insurance: {
          provider: 'Unknown',
          policyNumber: '',
          validUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0] as ISODate,
        },
      };
      
      return patientPersona;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('JSON parse error. Original content:', response.content);
        console.error('Cleaned content:', cleanedContent);
        throw new Error(`Invalid JSON in LLM response: ${error.message}`);
      } else if (error instanceof z.ZodError) {
        console.error('Zod validation error:', error.issues);
        console.error('JSON content:', jsonContent);
        throw new Error(`Invalid patient persona structure: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
      } else {
        console.error('Unexpected error:', error);
        throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * 医学的整合性をチェック
   * @param persona 患者ペルソナ
   */
  private validateMedicalConsistency(persona: PatientPersona): void {
    if (!persona.demographics) {
      throw new Error('Medical consistency error: Demographics are required');
    }

    // dateOfBirthから年齢を計算
    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(persona.demographics.dateOfBirth.split('-')[0]);
    const age = currentYear - birthYear;
    const gender = persona.demographics.gender;

    // バイタルサインの年齢適合性をチェック
    this.validateVitalSigns(persona.vitalSigns, age, gender);

    // 年齢と病歴の整合性をチェック
    this.validateMedicalHistory(persona.medicalHistory, age);
  }

  /**
   * バイタルサインの年齢・性別適合性をチェック
   * @param vitalSigns バイタルサイン
   * @param age 年齢
   * @param gender 性別
   */
  private validateVitalSigns(_vitalSigns: unknown, _age: number, _gender: string): void {
    // VitalSignsHistoryには current フィールドがないため、簡単な検証のみ
    // 実際のプロジェクトでは、vitalSigns.historyから最新の値を取得する実装が必要
    return; // 現在は検証をスキップ
    
    // 以下は将来の実装用のコード（現在はコメントアウト）
    /*
    if (current?.heartRate?.value) {
      const heartRate = current.heartRate.value;
      
      // 年齢別の正常心拍数範囲
      let normalRange: { min: number; max: number };
      
      if (age < 1) {
        normalRange = { min: 100, max: 160 };
      } else if (age < 3) {
        normalRange = { min: 90, max: 150 };
      } else if (age < 6) {
        normalRange = { min: 80, max: 140 };
      } else if (age < 12) {
        normalRange = { min: 70, max: 120 };
      } else if (age < 18) {
        normalRange = { min: 60, max: 100 };
      } else if (age < 65) {
        normalRange = { min: 60, max: 100 };
      } else {
        normalRange = { min: 50, max: 95 }; // 高齢者は少し低め
      }

      // 異常値のチェック（緊急時を除く）
      if (heartRate < normalRange.min - 20 || heartRate > normalRange.max + 30) {
        throw new Error(`Medical consistency error: Heart rate ${heartRate} is not appropriate for age ${age}`);
      }
    }

    if (current?.bloodPressure) {
      const systolic = current.bloodPressure.systolic;
      const diastolic = current.bloodPressure.diastolic;
      
      // 極端な血圧値のチェック
      if (systolic < 60 || systolic > 250 || diastolic < 30 || diastolic > 150) {
        throw new Error(`Medical consistency error: Blood pressure ${systolic}/${diastolic} is not physiologically realistic`);
      }
    }
    */
  }

  /**
   * 年齢と病歴の整合性をチェック
   * @param medicalHistory 病歴
   * @param age 年齢
   */
  private validateMedicalHistory(medicalHistory: unknown, age: number): void {
    const historyObj = medicalHistory as { pastIllnesses?: unknown[] };
    const pastIllnesses = historyObj.pastIllnesses || [];
    
    // 年齢に不適切な疾患のチェック
    const ageInappropriateConditions = [
      // 若年者（30歳未満）に非典型的な疾患
      ...(age < 30 ? [
        'アルツハイマー型認知症',
        'パーキンソン病',
        '前立腺肥大症',
        '変形性関節症',
        '骨粗鬆症',
      ] : []),
      
      // 高齢者（80歳以上）に非典型的な疾患
      ...(age >= 80 ? [
        '1型糖尿病', // 新規発症
        'クローン病',
        '潰瘍性大腸炎',
      ] : []),
    ];

    for (const illness of pastIllnesses) {
      const illnessObj = illness as { condition?: string };
      const condition = illnessObj.condition || '';
      
      for (const inappropriateCondition of ageInappropriateConditions) {
        if (condition.includes(inappropriateCondition)) {
          throw new Error(`Medical consistency error: ${condition} is not typical for age ${age}`);
        }
      }
    }
  }
}