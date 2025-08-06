import { describe, it, expect, beforeEach } from 'vitest';
import { MedicalTerminologyValidator } from '../medical-terminology-validator';

describe('MedicalTerminologyValidator', () => {
  let validator: MedicalTerminologyValidator;

  beforeEach(() => {
    validator = new MedicalTerminologyValidator();
  });

  describe('validateResponse', () => {
    it('should pass valid patient responses', async () => {
      const validResponse = 'I have been feeling dizzy and nauseous since this morning.';

      const result = await validator.validateResponse(validResponse);

      expect(result.isValid).toBe(true);
      expect(result.filteredContent).toBe(validResponse);
      expect(result.warnings).toHaveLength(0);
    });

    it('should filter prohibited medical advice terms', async () => {
      const responseWithAdvice = 'You should take aspirin and see a cardiologist immediately.';

      const result = await validator.validateResponse(responseWithAdvice);

      expect(result.isValid).toBe(true);
      expect(result.filteredContent).not.toContain('should take aspirin');
      expect(result.filteredContent).not.toContain('see a cardiologist');
      expect(result.warnings).toContain('Removed medical advice: medication recommendation');
      expect(result.warnings).toContain('Removed medical advice: specialist referral');
    });

    it('should filter diagnosis terms', async () => {
      const responseWithDiagnosis = 'I think I have pneumonia and diabetes.';

      const result = await validator.validateResponse(responseWithDiagnosis);

      expect(result.isValid).toBe(true);
      expect(result.filteredContent).not.toContain('I have pneumonia');
      expect(result.filteredContent).not.toContain('I have diabetes');
      expect(result.warnings).toContain('Removed prohibited term: medical diagnosis');
    });

    it('should filter treatment recommendations', async () => {
      const responseWithTreatment = 'You need surgery and should start chemotherapy.';

      const result = await validator.validateResponse(responseWithTreatment);

      expect(result.isValid).toBe(true);
      expect(result.filteredContent).not.toContain('need surgery');
      expect(result.filteredContent).not.toContain('start chemotherapy');
      expect(result.warnings).toContain('Removed medical advice: treatment recommendation');
    });

    it('should reject response if too much content is filtered', async () => {
      // Create a response where almost all content would be filtered
      const responseAllProhibited = 'cancer surgery chemotherapy treatment medication therapy diagnosis';

      const result = await validator.validateResponse(responseAllProhibited);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Response contained too much prohibited medical content');
    });

    it('should handle emergency situation terminology appropriately', async () => {
      const emergencyResponse = 'I feel like I am having a heart attack and cannot breathe.';

      const result = await validator.validateResponse(emergencyResponse);

      expect(result.isValid).toBe(true);
      expect(result.filteredContent).toContain('chest pain');
      expect(result.filteredContent).toContain('difficulty breathing');
      expect(result.warnings).toContain('Converted emergency terminology to symptoms');
    });

    it('should preserve symptom descriptions', async () => {
      const symptomResponse = 'I have chest pain, shortness of breath, and feel dizzy.';

      const result = await validator.validateResponse(symptomResponse);

      expect(result.isValid).toBe(true);
      expect(result.filteredContent).toBe(symptomResponse);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('filterProhibitedTerms', () => {
    it('should filter medication names and advice', () => {
      const text = 'Take ibuprofen 400mg twice daily for pain relief.';

      const result = validator.filterProhibitedTerms(text);

      expect(result.filtered).not.toContain('ibuprofen');
      expect(result.filtered).not.toContain('400mg');
      expect(result.warnings).toContain('Removed medical advice: medication recommendation');
    });

    it('should filter diagnostic terms', () => {
      const text = 'This looks like appendicitis or gastroenteritis.';

      const result = validator.filterProhibitedTerms(text);

      expect(result.filtered).not.toContain('appendicitis');
      expect(result.filtered).not.toContain('gastroenteritis');
      expect(result.warnings).toContain('Removed prohibited term: medical diagnosis');
    });

    it('should preserve allowed medical terminology', () => {
      const text = 'I experience nausea, headache, and fatigue regularly.';

      const result = validator.filterProhibitedTerms(text);

      expect(result.filtered).toBe(text);
      expect(result.warnings).toHaveLength(0);
    });
  });
});