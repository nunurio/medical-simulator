// バリデーションユーティリティ
export * from './validation-utils';

// 基本バリデーション（既存の型との衝突を避ける）
export {
  BloodPressureSchema,
  type AgeGroup,
  type HeartRateRange,
  getHeartRateRange,
  createAgeAwareVitalSignsSchema
} from './validation';

// 患者バリデーション（スキーマのみエクスポート、型は既存のものを使用）
export {
  DemographicsSchema,
  MedicalHistorySchema,
  AllergySchema,
  PatientPersonaSchema,
  type Demographics
} from './patient-validation';

// 薬物相互作用
export {
  RouteOfAdministration,
  FrequencySchema,
  PrescriptionSchema,
  InteractionSeverity,
  DrugInteractionSchema,
  type DrugInteraction,
  checkDrugInteractions
} from './drug-interaction';

// 薬物相互作用サービス
export {
  type DrugInteractionCheckResult,
  type InteractionKnowledgeBase,
  type AuditLogger,
  type NotificationService,
  type InteractionCheckEvent,
  type CriticalAlert,
  DrugInteractionService
} from './drug-interaction-service';

// アレルギー処方箋チェック
export {
  type AllergyDrugMapping,
  type AllergyPrescriptionConflict,
  checkAllergyPrescriptionConflicts
} from './allergy-prescription-check';

// 統合医療バリデーションサービス
export {
  type MedicalValidationResult,
  type ValidationError,
  type ValidationWarning,
  MedicalValidationService
} from './medical-validation-service';