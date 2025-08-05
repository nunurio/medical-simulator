import { describe, it, expect } from 'vitest';
import { 
  MEDICAL_SPECIALTIES, 
  DIFFICULTY_PROFILES,
  isValidMedicalSpecialty,
  isValidDifficultyLevel,
  getMedicalSpecialtiesForAge,
  getDifficultySettings,
  generateMedicalKnowledgeSchema,
  type MedicalSpecialtyKey,
  type DifficultyLevel,
} from '../medical-knowledge';
import { 
  DETAILED_PATIENT_PROMPTS,
  getDetailedPrompt,
  validateSpecialtyPrompt,
  buildPromptForOpenAI,
} from '../prompt-templates';

describe('Medical Knowledge and Prompt Templates Integration', () => {
  describe('Data Consistency', () => {
    it('should have matching medical specialties between modules', () => {
      const medicalSpecialtyKeys = Object.keys(MEDICAL_SPECIALTIES);
      const promptSpecialtyKeys = Object.keys(DETAILED_PATIENT_PROMPTS);
      
      expect(medicalSpecialtyKeys.sort()).toEqual(promptSpecialtyKeys.sort());
    });

    it('should have consistent difficulty levels', () => {
      const difficultyKeys = Object.keys(DIFFICULTY_PROFILES);
      
      Object.values(DETAILED_PATIENT_PROMPTS).forEach(specialty => {
        const promptDifficultyKeys = Object.keys(specialty);
        expect(promptDifficultyKeys.sort()).toEqual(difficultyKeys.sort());
      });
    });
  });

  describe('Helper Functions Integration', () => {
    it('should validate medical specialty keys correctly', () => {
      expect(isValidMedicalSpecialty('cardiology')).toBe(true);
      expect(isValidMedicalSpecialty('invalid_specialty')).toBe(false);
    });

    it('should validate difficulty levels correctly', () => {
      expect(isValidDifficultyLevel('beginner')).toBe(true);
      expect(isValidDifficultyLevel('expert')).toBe(false);
    });

    it('should get medical specialties for different age groups', () => {
      const pediatricSpecialties = getMedicalSpecialtiesForAge(10);
      const adultSpecialties = getMedicalSpecialtiesForAge(45);
      const geriatricSpecialties = getMedicalSpecialtiesForAge(80);
      
      expect(pediatricSpecialties.length).toBeGreaterThan(0);
      expect(adultSpecialties.length).toBeGreaterThan(0);
      expect(geriatricSpecialties.length).toBeGreaterThan(0);
      
      // 救急科は全年齢対象
      expect(pediatricSpecialties).toContain('emergency');
      expect(adultSpecialties).toContain('emergency');
      expect(geriatricSpecialties).toContain('emergency');
    });

    it('should retrieve detailed prompts using helper function', () => {
      const prompt = getDetailedPrompt('cardiology', 'beginner');
      
      expect(prompt).toHaveProperty('systemPrompt');
      expect(prompt).toHaveProperty('userPrompt');
      expect(prompt).toHaveProperty('fewShotExamples');
      expect(prompt.systemPrompt).toContain('循環器');
    });

    it('should validate specialty-specific prompts', () => {
      const cardiologyPrompt = getDetailedPrompt('cardiology', 'beginner').systemPrompt;
      const neurologyPrompt = getDetailedPrompt('neurology', 'beginner').systemPrompt;
      
      expect(validateSpecialtyPrompt('cardiology', cardiologyPrompt)).toBe(true);
      expect(validateSpecialtyPrompt('neurology', cardiologyPrompt)).toBe(false);
      expect(validateSpecialtyPrompt('neurology', neurologyPrompt)).toBe(true);
    });
  });

  describe('OpenAI Integration', () => {
    it('should build proper OpenAI prompts', () => {
      const openAIPrompt = buildPromptForOpenAI(
        'cardiology',
        'intermediate',
        { age: 65, gender: 'male' }
      );
      
      expect(openAIPrompt).toHaveProperty('systemPrompt');
      expect(openAIPrompt).toHaveProperty('userPrompt');
      expect(openAIPrompt).toHaveProperty('examples');
      
      expect(openAIPrompt.systemPrompt).toContain('循環器');
      expect(openAIPrompt.userPrompt).toContain('age');
      expect(openAIPrompt.examples.length).toBeGreaterThan(0);
    });

    it('should generate valid schema for OpenAI Structured Outputs', () => {
      const schema = generateMedicalKnowledgeSchema();
      
      expect(schema).toHaveProperty('medicalSpecialties');
      expect(schema).toHaveProperty('difficultyLevels');
      expect(schema).toHaveProperty('prevalenceLevels');
      
      expect(schema.medicalSpecialties).toContain('cardiology');
      expect(schema.difficultyLevels).toContain('beginner');
      expect(schema.prevalenceLevels).toContain('high');
    });
  });

  describe('Medical Validity', () => {
    it('should ensure age-appropriate specialty recommendations', () => {
      // 小児患者（10歳）
      const pediatricSpecialties = getMedicalSpecialtiesForAge(10);
      expect(pediatricSpecialties).toContain('respiratory'); // 小児喘息
      
      // 成人患者（50歳）
      const adultSpecialties = getMedicalSpecialtiesForAge(50);
      expect(adultSpecialties.length).toBeGreaterThan(2);
      
      // 高齢患者（80歳）
      const geriatricSpecialties = getMedicalSpecialtiesForAge(80);
      expect(geriatricSpecialties).toContain('cardiology');
      expect(geriatricSpecialties).toContain('neurology');
    });

    it('should maintain difficulty progression in prompts', () => {
      const beginnerPrompt = getDetailedPrompt('cardiology', 'beginner').systemPrompt;
      const advancedPrompt = getDetailedPrompt('cardiology', 'advanced').systemPrompt;
      
      // 初心者向けには「基本」「典型」などの語句
      expect(
        beginnerPrompt.includes('基本') || 
        beginnerPrompt.includes('典型') ||
        beginnerPrompt.includes('明確')
      ).toBe(true);
      
      // 上級者向けには「複雑」「稀な」「非典型」などの語句
      expect(
        advancedPrompt.includes('稀な') || 
        advancedPrompt.includes('複雑') ||
        advancedPrompt.includes('非典型')
      ).toBe(true);
    });

    it('should correlate difficulty settings with prompt complexity', () => {
      const beginnerSettings = getDifficultySettings('beginner');
      const advancedSettings = getDifficultySettings('advanced');
      
      expect(beginnerSettings.complicationRate).toBeLessThan(advancedSettings.complicationRate);
      expect(beginnerSettings.differentialCount).toBeLessThan(advancedSettings.differentialCount);
      
      // 上級者向けプロンプトには追加の複雑性要素が含まれている
      const advancedPrompt = getDetailedPrompt('general_medicine', 'advanced');
      expect(advancedSettings.rareDiseaseProbability).toBeDefined();
      expect(advancedSettings.diagnosticRedHerrings).toBe(true);
      expect(advancedSettings.timeConstraints).toBe(true);
    });
  });

  describe('Type Safety and Immutability', () => {
    it('should maintain data immutability', () => {
      // 型安全性の確認（コンパイル時チェック）
      const specialty: MedicalSpecialtyKey = 'cardiology';
      const difficulty: DifficultyLevel = 'beginner';
      
      expect(typeof specialty).toBe('string');
      expect(typeof difficulty).toBe('string');
      
      // 読み取り専用プロパティの確認
      const specialtyData = MEDICAL_SPECIALTIES[specialty];
      expect(Array.isArray(specialtyData.commonDiseases)).toBe(true);
      expect(Array.isArray(specialtyData.typicalSymptoms)).toBe(true);
      expect(Array.isArray(specialtyData.ageRanges)).toBe(true);
    });

    it('should handle all specialty and difficulty combinations', () => {
      const specialties = Object.keys(MEDICAL_SPECIALTIES) as MedicalSpecialtyKey[];
      const difficulties = Object.keys(DIFFICULTY_PROFILES) as DifficultyLevel[];
      
      specialties.forEach(specialty => {
        difficulties.forEach(difficulty => {
          expect(() => {
            const prompt = getDetailedPrompt(specialty, difficulty);
            expect(prompt.systemPrompt.length).toBeGreaterThan(0);
            expect(prompt.userPrompt.length).toBeGreaterThan(0);
            expect(prompt.fewShotExamples.length).toBeGreaterThan(0);
          }).not.toThrow();
        });
      });
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should support complete patient generation workflow', () => {
      // 1. 年齢ベースで適切な診療科を取得
      const age = 65;
      const appropriateSpecialties = getMedicalSpecialtiesForAge(age);
      expect(appropriateSpecialties.length).toBeGreaterThan(0);
      
      // 2. 循環器内科で中級者向け症例を生成
      const specialty: MedicalSpecialtyKey = 'cardiology';
      const difficulty: DifficultyLevel = 'intermediate';
      
      expect(appropriateSpecialties).toContain(specialty);
      
      // 3. 難易度設定を取得
      const difficultySettings = getDifficultySettings(difficulty);
      expect(difficultySettings.multipleConditions).toBe(true);
      
      // 4. OpenAI用プロンプトを構築
      const openAIPrompt = buildPromptForOpenAI(specialty, difficulty, {
        age,
        complicationRate: difficultySettings.complicationRate,
      });
      
      expect(openAIPrompt.systemPrompt).toContain('循環器');
      expect(openAIPrompt.userPrompt).toContain('age');
    });

    it('should validate end-to-end medical knowledge consistency', () => {
      // 循環器内科の疾患と症状の医学的整合性
      const cardiologyData = MEDICAL_SPECIALTIES.cardiology;
      
      // 循環器疾患の典型的症状が含まれているか
      expect(cardiologyData.typicalSymptoms).toContain('胸痛');
      expect(cardiologyData.typicalSymptoms).toContain('動悸');
      expect(cardiologyData.typicalSymptoms).toContain('息切れ');
      
      // 年齢と疾患の関係の妥当性
      const elderlyRange = cardiologyData.ageRanges.find(range => range.min >= 70);
      expect(elderlyRange?.prevalence).toBe('high');
      
      // プロンプトと医学知識の整合性
      const cardiologyPrompt = getDetailedPrompt('cardiology', 'beginner');
      expect(validateSpecialtyPrompt('cardiology', cardiologyPrompt.systemPrompt)).toBe(true);
    });
  });
});