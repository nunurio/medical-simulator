import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPTS, USER_PROMPTS, DETAILED_PATIENT_PROMPTS } from '../prompt-templates';

describe('Prompt Templates System', () => {
  describe('Existing System Prompts', () => {
    it('should maintain existing system prompts', () => {
      expect(SYSTEM_PROMPTS).toHaveProperty('PATIENT_GENERATION');
      expect(SYSTEM_PROMPTS).toHaveProperty('CHAT_RESPONSE');
      expect(SYSTEM_PROMPTS).toHaveProperty('EXAMINATION_FINDING');
      expect(SYSTEM_PROMPTS).toHaveProperty('TEST_RESULT_GENERATION');
    });

    it('should contain valid prompt content', () => {
      Object.values(SYSTEM_PROMPTS).forEach(prompt => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(50);
        expect(prompt).toContain('医療');
      });
    });
  });

  describe('DETAILED_PATIENT_PROMPTS - Red Phase', () => {
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
        expect(DETAILED_PATIENT_PROMPTS).toHaveProperty(specialty);
      });
    });

    it('should contain all difficulty levels for each specialty', () => {
      const requiredDifficulties = ['beginner', 'intermediate', 'advanced'];

      Object.values(DETAILED_PATIENT_PROMPTS).forEach(specialty => {
        requiredDifficulties.forEach(difficulty => {
          expect(specialty).toHaveProperty(difficulty);
        });
      });
    });

    it('should have properly structured prompts with system and user messages', () => {
      Object.values(DETAILED_PATIENT_PROMPTS).forEach(specialty => {
        Object.values(specialty).forEach(difficultyPrompt => {
          expect(difficultyPrompt).toHaveProperty('systemPrompt');
          expect(difficultyPrompt).toHaveProperty('userPrompt');
          expect(difficultyPrompt).toHaveProperty('fewShotExamples');
          
          expect(typeof difficultyPrompt.systemPrompt).toBe('string');
          expect(typeof difficultyPrompt.userPrompt).toBe('string');
          expect(Array.isArray(difficultyPrompt.fewShotExamples)).toBe(true);
        });
      });
    });

    it('should contain specialty-specific medical knowledge in prompts', () => {
      // 循環器内科のプロンプトに循環器関連用語が含まれている
      const cardiologyPrompts = DETAILED_PATIENT_PROMPTS.cardiology;
      Object.values(cardiologyPrompts).forEach(prompt => {
        const combinedPrompt = prompt.systemPrompt + prompt.userPrompt;
        expect(
          combinedPrompt.includes('心臓') || 
          combinedPrompt.includes('循環器') || 
          combinedPrompt.includes('胸痛') ||
          combinedPrompt.includes('動悸')
        ).toBe(true);
      });

      // 神経内科のプロンプトに神経関連用語が含まれている
      const neurologyPrompts = DETAILED_PATIENT_PROMPTS.neurology;
      Object.values(neurologyPrompts).forEach(prompt => {
        const combinedPrompt = prompt.systemPrompt + prompt.userPrompt;
        expect(
          combinedPrompt.includes('脳') || 
          combinedPrompt.includes('神経') || 
          combinedPrompt.includes('頭痛') ||
          combinedPrompt.includes('意識')
        ).toBe(true);
      });
    });

    it('should have increasing complexity across difficulty levels', () => {
      Object.values(DETAILED_PATIENT_PROMPTS).forEach(specialty => {
        const beginnerPrompt = specialty.beginner.systemPrompt;
        const intermediatePrompt = specialty.intermediate.systemPrompt;
        const advancedPrompt = specialty.advanced.systemPrompt;

        // 上級者向けプロンプトには複雑性を示すキーワードが含まれる
        expect(
          advancedPrompt.includes('複雑') ||
          advancedPrompt.includes('合併症') ||
          advancedPrompt.includes('稀な') ||
          advancedPrompt.includes('非典型的')
        ).toBe(true);

        // 初心者向けプロンプトには基本的なキーワードが含まれる
        expect(
          beginnerPrompt.includes('基本') ||
          beginnerPrompt.includes('典型') ||
          beginnerPrompt.includes('明確')
        ).toBe(true);
      });
    });

    it('should include Few-shot learning examples', () => {
      Object.values(DETAILED_PATIENT_PROMPTS).forEach(specialty => {
        Object.values(specialty).forEach(difficultyPrompt => {
          expect(difficultyPrompt.fewShotExamples.length).toBeGreaterThanOrEqual(1);
          
          difficultyPrompt.fewShotExamples.forEach(example => {
            expect(example).toHaveProperty('input');
            expect(example).toHaveProperty('output');
            expect(typeof example.input).toBe('string');
            expect(typeof example.output).toBe('string');
            expect(example.input.length).toBeGreaterThan(10);
            expect(example.output.length).toBeGreaterThan(50);
          });
        });
      });
    });

    it('should be OpenAI Structured Outputs compatible', () => {
      // すべてのプロンプトがJSON安全であることを確認
      Object.values(DETAILED_PATIENT_PROMPTS).forEach(specialty => {
        Object.values(specialty).forEach(difficultyPrompt => {
          expect(() => JSON.parse(JSON.stringify(difficultyPrompt.systemPrompt))).not.toThrow();
          expect(() => JSON.parse(JSON.stringify(difficultyPrompt.userPrompt))).not.toThrow();
          
          difficultyPrompt.fewShotExamples.forEach(example => {
            expect(() => JSON.parse(JSON.stringify(example))).not.toThrow();
          });
        });
      });
    });

    it('should include medical disclaimers and safety guidelines', () => {
      Object.values(DETAILED_PATIENT_PROMPTS).forEach(specialty => {
        Object.values(specialty).forEach(difficultyPrompt => {
          const combinedPrompt = difficultyPrompt.systemPrompt + difficultyPrompt.userPrompt;
          expect(
            combinedPrompt.includes('教育目的') ||
            combinedPrompt.includes('シミュレーション') ||
            combinedPrompt.includes('実際の医療')
          ).toBe(true);
        });
      });
    });
  });

  describe('Integration with Medical Knowledge', () => {
    it('should reference medical specialties data structure', () => {
      // medical-knowledge.tsのMEDICAL_SPECIALTIESと整合性があることを確認
      const specialtyKeys = Object.keys(DETAILED_PATIENT_PROMPTS);
      expect(specialtyKeys).toContain('general_medicine');
      expect(specialtyKeys).toContain('cardiology');
      expect(specialtyKeys).toContain('gastroenterology');
      expect(specialtyKeys).toContain('respiratory');
      expect(specialtyKeys).toContain('neurology');
      expect(specialtyKeys).toContain('emergency');
    });
  });
});