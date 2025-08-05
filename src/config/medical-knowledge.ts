/**
 * 診療科別の医学知識データベース
 * OpenAI Structured Outputs（strict mode）対応
 */

// 厳密型定義
export type PrevalenceLevel = 'low' | 'medium' | 'high';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type MedicalSpecialtyKey = 
  | 'general_medicine'
  | 'cardiology'
  | 'gastroenterology'
  | 'respiratory'
  | 'neurology'
  | 'emergency';

export interface AgeRange {
  /** 最小年齢 (0-120) */
  readonly min: number;
  /** 最大年齢 (0-120) */
  readonly max: number;
  /** 疾患の有病率レベル */
  readonly prevalence: PrevalenceLevel;
}

export interface MedicalSpecialty {
  /** 一般的な疾患リスト（最低3つ必要） */
  readonly commonDiseases: readonly string[];
  /** 典型的な症状リスト（最低5つ必要） */
  readonly typicalSymptoms: readonly string[];
  /** 年齢範囲別の有病率 */
  readonly ageRanges: readonly AgeRange[];
}

export interface DifficultyProfile {
  /** 合併症発生率 (0.0-1.0) */
  readonly complicationRate: number;
  /** 複数疾患の併存 */
  readonly multipleConditions: boolean;
  /** 非典型的な症状呈示 */
  readonly atypicalPresentation: boolean;
  /** 稀少疾患の可能性 (上級者のみ) */
  readonly rareDiseaseProbability?: number;
  /** 診断の誤誘導因子 (上級者のみ) */
  readonly diagnosticRedHerrings?: boolean;
  /** 時間制約の有無 (上級者のみ) */
  readonly timeConstraints?: boolean;
  /** 鑑別診断数 */
  readonly differentialCount: number;
  /** 救急科での難易度修正係数 (1.0-3.0) */
  readonly emergencyModifier: number;
}

// 診療科別医学知識データベース（詳細実装 - 三角測量）
export const MEDICAL_SPECIALTIES: Record<MedicalSpecialtyKey, MedicalSpecialty> = {
  general_medicine: {
    commonDiseases: [
      '高血圧症',
      '2型糖尿病',
      '脂質異常症',
      '慢性腎臓病',
      '骨粗鬆症',
      'うつ病',
      '甲状腺機能低下症',
    ],
    typicalSymptoms: [
      '全身倦怠感',
      '頭痛',
      'めまい',
      '息切れ',
      '動悸',
      '胸部不快感',
      '食欲不振',
      '体重減少',
      '不眠',
    ],
    ageRanges: [
      { min: 20, max: 39, prevalence: 'low' },
      { min: 40, max: 64, prevalence: 'medium' },
      { min: 65, max: 84, prevalence: 'high' },
      { min: 85, max: 120, prevalence: 'high' },
    ],
  },
  cardiology: {
    commonDiseases: [
      '心房細動',
      '狭心症',
      '急性心筋梗塞',
      '慢性心不全',
      '大動脈弁狭窄症',
      '高血圧性心疾患',
      '心房中隔欠損症',
    ],
    typicalSymptoms: [
      '胸痛',
      '胸部圧迫感',
      '動悸',
      '息切れ',
      '下肢浮腫',
      '失神',
      '冷汗',
      '悪心',
      '左肩の痛み',
    ],
    ageRanges: [
      { min: 30, max: 49, prevalence: 'low' },
      { min: 50, max: 69, prevalence: 'medium' },
      { min: 70, max: 84, prevalence: 'high' },
      { min: 85, max: 120, prevalence: 'high' },
    ],
  },
  gastroenterology: {
    commonDiseases: [
      '胃食道逆流症',
      'ヘリコバクター・ピロリ感染症',
      '消化性潰瘍',
      '炎症性腸疾患',
      '大腸癌',
      '肝硬変',
      '急性膵炎',
    ],
    typicalSymptoms: [
      '腹痛',
      '心窩部痛',
      '嘔気',
      '嘔吐',
      '下痢',
      '便秘',
      '腹部膨満感',
      '食後の不快感',
      '体重減少',
    ],
    ageRanges: [
      { min: 20, max: 39, prevalence: 'medium' },
      { min: 40, max: 59, prevalence: 'medium' },
      { min: 60, max: 79, prevalence: 'high' },
      { min: 80, max: 120, prevalence: 'high' },
    ],
  },
  respiratory: {
    commonDiseases: [
      '気管支喘息',
      '慢性閉塞性肺疾患（COPD）',
      '市中肺炎',
      '間質性肺炎',
      '肺癌',
      '睡眠時無呼吸症候群',
      '肺塞栓症',
    ],
    typicalSymptoms: [
      '咳嗽',
      '喀痰',
      '息切れ',
      '呼吸困難',
      '胸痛',
      '発熱',
      '喘鳴',
      '血痰',
      '夜間呼吸困難',
    ],
    ageRanges: [
      { min: 0, max: 17, prevalence: 'medium' }, // 小児喘息
      { min: 18, max: 39, prevalence: 'medium' },
      { min: 40, max: 64, prevalence: 'medium' },
      { min: 65, max: 120, prevalence: 'high' },
    ],
  },
  neurology: {
    commonDiseases: [
      '脳血管障害（脳梗塞）',
      'アルツハイマー型認知症',
      'パーキンソン病',
      '片頭痛',
      'てんかん',
      '多発性硬化症',
      '末梢神経障害',
    ],
    typicalSymptoms: [
      '頭痛',
      'めまい',
      '意識障害',
      '運動麻痺',
      '感覚障害',
      '言語障害',
      '記憶障害',
      '振戦',
      '歩行障害',
    ],
    ageRanges: [
      { min: 20, max: 39, prevalence: 'low' },
      { min: 40, max: 64, prevalence: 'medium' },
      { min: 65, max: 84, prevalence: 'high' },
      { min: 85, max: 120, prevalence: 'high' },
    ],
  },
  emergency: {
    commonDiseases: [
      '急性腹症',
      '外傷（骨折、脳外傷）',
      '急性中毒',
      '心肺停止',
      'ショック',
      '急性冠症候群',
      '脳卒中',
    ],
    typicalSymptoms: [
      '意識障害',
      '血圧低下',
      '頻脈',
      '呼吸困難',
      '痙攣',
      '激しい疼痛',
      '嘔吐',
      '発熱',
      'チアノーゼ',
    ],
    ageRanges: [
      { min: 0, max: 17, prevalence: 'medium' }, // 小児救急
      { min: 18, max: 39, prevalence: 'medium' },
      { min: 40, max: 64, prevalence: 'medium' },
      { min: 65, max: 120, prevalence: 'high' }, // 高齢者救急
    ],
  },
};

// 難易度別プロファイル（詳細実装 - Green phase）
export const DIFFICULTY_PROFILES: Record<DifficultyLevel, DifficultyProfile> = {
  beginner: {
    complicationRate: 0.05,
    multipleConditions: false,
    atypicalPresentation: false,
    differentialCount: 2,
    emergencyModifier: 1.0,
  },
  intermediate: {
    complicationRate: 0.25,
    multipleConditions: true,
    atypicalPresentation: false,
    differentialCount: 4,
    emergencyModifier: 1.5,
  },
  advanced: {
    complicationRate: 0.45,
    multipleConditions: true,
    atypicalPresentation: true,
    rareDiseaseProbability: 0.15,
    diagnosticRedHerrings: true,
    timeConstraints: true,
    differentialCount: 6,
    emergencyModifier: 2.0,
  },
} as const;

// ヘルパー関数
/**
 * 指定された診療科が存在するかチェック
 */
export function isValidMedicalSpecialty(specialty: string): specialty is MedicalSpecialtyKey {
  return specialty in MEDICAL_SPECIALTIES;
}

/**
 * 指定された難易度が存在するかチェック
 */
export function isValidDifficultyLevel(difficulty: string): difficulty is DifficultyLevel {
  return difficulty in DIFFICULTY_PROFILES;
}

/**
 * 年齢に基づいて適切な診療科を取得
 */
export function getMedicalSpecialtiesForAge(age: number): MedicalSpecialtyKey[] {
  return (Object.keys(MEDICAL_SPECIALTIES) as MedicalSpecialtyKey[]).filter(specialty => {
    const specialtyData = MEDICAL_SPECIALTIES[specialty];
    return specialtyData.ageRanges.some(range => 
      age >= range.min && age <= range.max && range.prevalence !== 'low'
    );
  });
}

/**
 * 難易度に応じた設定を取得
 */
export function getDifficultySettings(difficulty: DifficultyLevel) {
  return DIFFICULTY_PROFILES[difficulty];
}

/**
 * OpenAI Structured Outputs用のスキーマ生成
 */
export function generateMedicalKnowledgeSchema() {
  return {
    medicalSpecialties: Object.keys(MEDICAL_SPECIALTIES),
    difficultyLevels: Object.keys(DIFFICULTY_PROFILES),
    prevalenceLevels: ['low', 'medium', 'high'] as const,
  };
}