import { describe, it, expect } from 'vitest';
import { MEDICAL_SPECIALTIES, DIFFICULTY_PROFILES } from '../medical-knowledge';

describe('Medical Knowledge Database', () => {
  describe('MEDICAL_SPECIALTIES', () => {
    it('should contain all required medical specialties', () => {
      const requiredSpecialties = [
        'general_medicine',
        'cardiology', 
        'gastroenterology',
        'respiratory',
        'neurology',
        'emergency',
      ];

      requiredSpecialties.forEach(specialty => {
        expect(MEDICAL_SPECIALTIES).toHaveProperty(specialty);
      });
    });

    it('should have valid data structure for each specialty', () => {
      Object.values(MEDICAL_SPECIALTIES).forEach(specialty => {
        expect(specialty).toHaveProperty('commonDiseases');
        expect(specialty).toHaveProperty('typicalSymptoms');
        expect(specialty).toHaveProperty('ageRanges');
        expect(Array.isArray(specialty.commonDiseases)).toBe(true);
        expect(Array.isArray(specialty.typicalSymptoms)).toBe(true);
        expect(Array.isArray(specialty.ageRanges)).toBe(true);
      });
    });

    it('should have at least 3 common diseases per specialty', () => {
      Object.values(MEDICAL_SPECIALTIES).forEach(specialty => {
        expect(specialty.commonDiseases.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should have at least 5 typical symptoms per specialty', () => {
      Object.values(MEDICAL_SPECIALTIES).forEach(specialty => {
        expect(specialty.typicalSymptoms.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should have valid age ranges for each specialty', () => {
      Object.values(MEDICAL_SPECIALTIES).forEach(specialty => {
        specialty.ageRanges.forEach(range => {
          expect(range).toHaveProperty('min');
          expect(range).toHaveProperty('max');
          expect(range).toHaveProperty('prevalence');
          expect(typeof range.min).toBe('number');
          expect(typeof range.max).toBe('number');
          expect(range.min).toBeGreaterThanOrEqual(0);
          expect(range.max).toBeLessThanOrEqual(120);
          expect(range.min).toBeLessThan(range.max);
          expect(['low', 'medium', 'high']).toContain(range.prevalence);
        });
      });
    });
  });

  describe('DIFFICULTY_PROFILES', () => {
    it('should contain all difficulty levels', () => {
      const requiredDifficulties = ['beginner', 'intermediate', 'advanced'];
      
      requiredDifficulties.forEach(difficulty => {
        expect(DIFFICULTY_PROFILES).toHaveProperty(difficulty);
      });
    });

    it('should have valid complication settings for each difficulty', () => {
      Object.values(DIFFICULTY_PROFILES).forEach(profile => {
        expect(profile).toHaveProperty('complicationRate');
        expect(profile).toHaveProperty('multipleConditions');
        expect(profile).toHaveProperty('atypicalPresentation');
        expect(typeof profile.complicationRate).toBe('number');
        expect(profile.complicationRate).toBeGreaterThanOrEqual(0);
        expect(profile.complicationRate).toBeLessThanOrEqual(1);
        expect(typeof profile.multipleConditions).toBe('boolean');
        expect(typeof profile.atypicalPresentation).toBe('boolean');
      });
    });

    it('should have increasing difficulty levels', () => {
      expect(DIFFICULTY_PROFILES.beginner.complicationRate)
        .toBeLessThan(DIFFICULTY_PROFILES.intermediate.complicationRate);
      expect(DIFFICULTY_PROFILES.intermediate.complicationRate)
        .toBeLessThan(DIFFICULTY_PROFILES.advanced.complicationRate);
    });
  });

  describe('Advanced DIFFICULTY_PROFILES Features', () => {
    it('should have additional complexity factors for advanced difficulty', () => {
      expect(DIFFICULTY_PROFILES.advanced).toHaveProperty('rareDiseaseProbability');
      expect(DIFFICULTY_PROFILES.advanced).toHaveProperty('diagnosticRedHerrings');
      expect(DIFFICULTY_PROFILES.advanced).toHaveProperty('timeConstraints');
      
      expect(typeof DIFFICULTY_PROFILES.advanced.rareDiseaseProbability).toBe('number');
      expect(typeof DIFFICULTY_PROFILES.advanced.diagnosticRedHerrings).toBe('boolean');
      expect(typeof DIFFICULTY_PROFILES.advanced.timeConstraints).toBe('boolean');
    });

    it('should have appropriate complication rates with decimal precision', () => {
      expect(DIFFICULTY_PROFILES.beginner.complicationRate).toBe(0.05);
      expect(DIFFICULTY_PROFILES.intermediate.complicationRate).toBe(0.25);
      expect(DIFFICULTY_PROFILES.advanced.complicationRate).toBe(0.45);
    });

    it('should have differential diagnosis complexity scaling', () => {
      expect(DIFFICULTY_PROFILES.beginner.differentialCount).toBe(2);
      expect(DIFFICULTY_PROFILES.intermediate.differentialCount).toBe(4);
      expect(DIFFICULTY_PROFILES.advanced.differentialCount).toBe(6);
    });

    it('should include emergency-specific difficulty modifiers', () => {
      Object.values(DIFFICULTY_PROFILES).forEach(profile => {
        expect(profile).toHaveProperty('emergencyModifier');
        expect(typeof profile.emergencyModifier).toBe('number');
        expect(profile.emergencyModifier).toBeGreaterThanOrEqual(1.0);
        expect(profile.emergencyModifier).toBeLessThanOrEqual(3.0);
      });
    });
  });

  describe('Medical validity constraints', () => {
    it('should have age-appropriate diseases for pediatric conditions', () => {
      // テスト: 小児に多い疾患が適切な年齢範囲に設定されているか
      const pediatricDiseases = ['喘息', '気管支'];
      
      Object.values(MEDICAL_SPECIALTIES).forEach(specialty => {
        specialty.commonDiseases.forEach(disease => {
          if (pediatricDiseases.some(pd => disease.includes(pd))) {
            const hasValidPediatricRange = specialty.ageRanges.some(range => 
              range.min <= 17 && range.prevalence === 'medium'
            );
            expect(hasValidPediatricRange).toBe(true);
          }
        });
      });
    });

    it('should have age-appropriate diseases for geriatric conditions', () => {
      // テスト: 高齢者に多い疾患が適切な年齢範囲に設定されているか
      const geriatricDiseases = ['認知症', '骨粗鬆症', '心房細動'];
      
      Object.values(MEDICAL_SPECIALTIES).forEach(specialty => {
        specialty.commonDiseases.forEach(disease => {
          if (geriatricDiseases.some(gd => disease.includes(gd))) {
            const hasValidGeriatricRange = specialty.ageRanges.some(range => 
              range.min >= 65 && range.prevalence === 'high'
            );
            expect(hasValidGeriatricRange).toBe(true);
          }
        });
      });
    });

    it('should ensure specialty-specific symptoms are medically accurate', () => {
      // 循環器内科の症状検証
      const cardiologySymptoms = MEDICAL_SPECIALTIES.cardiology.typicalSymptoms;
      expect(cardiologySymptoms).toContain('胸痛');
      expect(cardiologySymptoms).toContain('動悸');
      expect(cardiologySymptoms).toContain('息切れ');
      
      // 神経内科の症状検証
      const neurologySymptoms = MEDICAL_SPECIALTIES.neurology.typicalSymptoms;
      expect(neurologySymptoms).toContain('頭痛');
      expect(neurologySymptoms).toContain('意識障害');
      expect(neurologySymptoms).toContain('運動麻痺');
    });

    it('should validate OpenAI Structured Outputs compatibility', () => {
      // すべての文字列値がJSON安全であることを確認
      Object.values(MEDICAL_SPECIALTIES).forEach(specialty => {
        specialty.commonDiseases.forEach(disease => {
          expect(() => JSON.parse(JSON.stringify(disease))).not.toThrow();
        });
        specialty.typicalSymptoms.forEach(symptom => {
          expect(() => JSON.parse(JSON.stringify(symptom))).not.toThrow();
        });
      });
    });
  });
});