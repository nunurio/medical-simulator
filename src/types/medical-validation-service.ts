import { z } from 'zod';
import { 
  PatientPersona,
  PatientPersonaSchema,
  Allergy
} from './patient-validation';
import {
  BloodPressure,
  BloodPressureSchema,
  VitalSigns,
  createAgeAwareVitalSignsSchema
} from './validation';
import {
  Prescription,
  PrescriptionSchema,
} from './drug-interaction';
import {
  DrugInteractionService,
  DrugInteractionCheckResult,
  InteractionKnowledgeBase,
  AuditLogger,
  NotificationService
} from './drug-interaction-service';
import {
  checkAllergyPrescriptionConflicts,
  AllergyPrescriptionConflict,
  AllergyDrugMapping
} from './allergy-prescription-check';

// 総合的な医療バリデーション結果
export interface MedicalValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  drugInteractions: DrugInteractionCheckResult | null;
  allergyConflicts: AllergyPrescriptionConflict[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'warning';
}

// 医療バリデーションサービス
export class MedicalValidationService {
  private drugInteractionService: DrugInteractionService;
  
  constructor(
    private knowledgeBase: InteractionKnowledgeBase,
    private auditLogger: AuditLogger,
    private notificationService: NotificationService,
    private allergyDrugMappings: AllergyDrugMapping[]
  ) {
    this.drugInteractionService = new DrugInteractionService(
      knowledgeBase,
      auditLogger,
      notificationService
    );
  }

  // 患者ペルソナの総合的バリデーション
  async validatePatientPersona(data: unknown): Promise<{
    isValid: boolean;
    patient?: PatientPersona;
    errors: ValidationError[];
  }> {
    try {
      const patient = PatientPersonaSchema.parse(data);
      return {
        isValid: true,
        patient,
        errors: []
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.issues.map(e => ({
          code: 'VALIDATION_ERROR',
          message: e.message,
          field: e.path.join('.'),
          severity: 'error' as const
        }));
        return {
          isValid: false,
          errors
        };
      }
      throw error;
    }
  }

  // バイタルサインの年齢別バリデーション
  validateVitalSigns(
    vitalSigns: unknown,
    age: number,
    gender: 'male' | 'female' | 'other' | 'unknown' | 'all'
  ): {
    isValid: boolean;
    vitalSigns?: VitalSigns;
    errors: ValidationError[];
  } {
    try {
      const schema = createAgeAwareVitalSignsSchema(age, gender);
      const validatedVitalSigns = schema.parse(vitalSigns);
      return {
        isValid: true,
        vitalSigns: validatedVitalSigns,
        errors: []
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.issues.map(e => ({
          code: 'VITAL_SIGNS_ERROR',
          message: e.message,
          field: e.path.join('.'),
          severity: 'error' as const
        }));
        return {
          isValid: false,
          errors
        };
      }
      throw error;
    }
  }

  // 新しい処方の総合的バリデーション
  async validateNewPrescription(
    patientId: string,
    newPrescription: unknown,
    existingPrescriptions: Prescription[],
    patientAllergies: Allergy[]
  ): Promise<MedicalValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let drugInteractionResult: DrugInteractionCheckResult | null = null;
    let allergyConflicts: AllergyPrescriptionConflict[] = [];

    try {
      // 1. 処方箋の基本バリデーション
      const validatedPrescription = PrescriptionSchema.parse(newPrescription);

      // 2. 薬物相互作用チェック
      drugInteractionResult = await this.drugInteractionService.validateAndCheckInteractions(
        patientId,
        validatedPrescription,
        existingPrescriptions
      );

      if (!drugInteractionResult.isValid) {
        drugInteractionResult.criticalInteractions.forEach(interaction => {
          errors.push({
            code: 'CRITICAL_DRUG_INTERACTION',
            message: `重大な薬物相互作用: ${interaction.clinicalEffect}`,
            severity: 'error'
          });
        });
      }

      // 中程度の相互作用は警告として扱う
      drugInteractionResult.interactions
        .filter(i => i.severity === 'moderate')
        .forEach(interaction => {
          warnings.push({
            code: 'MODERATE_DRUG_INTERACTION',
            message: `薬物相互作用の注意: ${interaction.clinicalEffect}`,
            severity: 'warning'
          });
        });

      // 3. アレルギーと処方薬の照合
      const allPrescriptions = [...existingPrescriptions, validatedPrescription];
      allergyConflicts = checkAllergyPrescriptionConflicts(
        patientAllergies,
        allPrescriptions,
        this.allergyDrugMappings
      );

      // 高リスクのアレルギー衝突はエラー
      allergyConflicts
        .filter(c => c.riskLevel === 'high')
        .forEach(conflict => {
          errors.push({
            code: 'HIGH_RISK_ALLERGY_CONFLICT',
            message: conflict.recommendation,
            severity: 'error'
          });
        });

      // 中リスクのアレルギー衝突は警告
      allergyConflicts
        .filter(c => c.riskLevel === 'medium')
        .forEach(conflict => {
          warnings.push({
            code: 'MEDIUM_RISK_ALLERGY_CONFLICT',
            message: conflict.recommendation,
            severity: 'warning'
          });
        });

    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach(e => {
          errors.push({
            code: 'PRESCRIPTION_VALIDATION_ERROR',
            message: e.message,
            field: e.path.join('.'),
            severity: 'error'
          });
        });
      } else {
        throw error;
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      drugInteractions: drugInteractionResult,
      allergyConflicts
    };
  }

  // 血圧測定値のバリデーション
  validateBloodPressure(data: unknown): {
    isValid: boolean;
    bloodPressure?: BloodPressure;
    errors: ValidationError[];
  } {
    try {
      const bloodPressure = BloodPressureSchema.parse(data);
      return {
        isValid: true,
        bloodPressure,
        errors: []
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.issues.map(e => ({
          code: 'BLOOD_PRESSURE_ERROR',
          message: e.message,
          field: e.path.join('.'),
          severity: 'error' as const
        }));
        return {
          isValid: false,
          errors
        };
      }
      throw error;
    }
  }

  // 包括的な安全性チェック
  async performComprehensiveSafetyCheck(
    patient: PatientPersona,
    prescriptions: Prescription[]
  ): Promise<{
    isSafe: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // 1. アレルギーチェック
    const allergyConflicts = checkAllergyPrescriptionConflicts(
      patient.allergies,
      prescriptions,
      this.allergyDrugMappings
    );
    
    allergyConflicts.forEach(conflict => {
      if (conflict.riskLevel === 'high') {
        issues.push(`高リスクアレルギー: ${conflict.allergen}`);
      }
      recommendations.push(conflict.recommendation);
    });
    
    // 2. 薬物相互作用チェック
    const interactions = await this.drugInteractionService.checkPrescriptionInteractions(
      prescriptions
    );
    
    interactions.forEach(interaction => {
      if (['major', 'contraindicated'].includes(interaction.severity)) {
        issues.push(`重大な薬物相互作用: ${interaction.mechanism}`);
      }
      recommendations.push(interaction.recommendation);
    });
    
    // 3. 年齢に応じた用量チェック（簡易版）
    const { age } = patient.demographics;
    if (age < 12 || age > 65) {
      recommendations.push(
        '年齢を考慮した用量調整が必要な可能性があります。'
      );
    }
    
    const isSafe = issues.length === 0;
    
    return {
      isSafe,
      issues,
      recommendations: [...new Set(recommendations)] // 重複除去
    };
  }
}