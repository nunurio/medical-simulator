import { describe, it, expect } from 'vitest';
import type { PatientId, ScenarioId, ISODate, ISODateTime } from '../core';
import {
  GeneratePatientRequestSchema,
  GeneratePatientResponseSchema,
  InitialQuestionnaireSchema,
  ModelConfigurationSchema,
  type GeneratePatientRequest,
  type GeneratePatientResponse,
  type InitialQuestionnaire,
  type ModelConfiguration,
} from '../api';

describe('API Types', () => {
  describe('GeneratePatientRequest', () => {
    it('should validate valid GeneratePatientRequest', () => {
      const validRequest: GeneratePatientRequest = {
        specialty: 'cardiology',
        difficulty: 'intermediate',
        mode: 'outpatient',
      };

      expect(() => GeneratePatientRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should validate all specialty types', () => {
      const specialties = ['general_medicine', 'cardiology', 'gastroenterology', 'respiratory', 'neurology', 'emergency'];
      
      specialties.forEach(specialty => {
        const validRequest = {
          specialty,
          difficulty: 'intermediate',
          mode: 'outpatient',
        };

        expect(() => GeneratePatientRequestSchema.parse(validRequest)).not.toThrow();
      });
    });

    it('should validate all difficulty levels', () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'];
      
      difficulties.forEach(difficulty => {
        const validRequest = {
          specialty: 'cardiology',
          difficulty,
          mode: 'outpatient',
        };

        expect(() => GeneratePatientRequestSchema.parse(validRequest)).not.toThrow();
      });
    });

    it('should validate all simulation modes', () => {
      const modes = ['outpatient', 'emergency', 'inpatient'];
      
      modes.forEach(mode => {
        const validRequest = {
          specialty: 'cardiology',
          difficulty: 'intermediate',
          mode,
        };

        expect(() => GeneratePatientRequestSchema.parse(validRequest)).not.toThrow();
      });
    });

    it('should validate GeneratePatientRequest with optional specificDisease', () => {
      const validRequest: GeneratePatientRequest = {
        specialty: 'cardiology',
        difficulty: 'intermediate',
        specificDisease: '心房細動',
        mode: 'outpatient',
      };

      expect(() => GeneratePatientRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject invalid specialty', () => {
      const invalidRequest = {
        specialty: 'invalid_specialty',
        difficulty: 'intermediate',
        mode: 'outpatient',
      };

      expect(() => GeneratePatientRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject invalid difficulty level', () => {
      const invalidRequest = {
        specialty: 'cardiology',
        difficulty: 'expert',
        mode: 'outpatient',
      };

      expect(() => GeneratePatientRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject invalid simulation mode', () => {
      const invalidRequest = {
        specialty: 'cardiology',
        difficulty: 'intermediate',
        mode: 'invalid_mode',
      };

      expect(() => GeneratePatientRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('InitialQuestionnaire', () => {
    it('should validate valid InitialQuestionnaire', () => {
      const validQuestionnaire: InitialQuestionnaire = {
        questions: [
          {
            id: 'q1',
            text: 'どのような症状でお越しになりましたか？',
            type: 'open_ended',
            required: true,
          },
          {
            id: 'q2',
            text: '痛みのレベルを1-10で教えてください',
            type: 'scale',
            required: true,
            scaleMin: 1,
            scaleMax: 10,
            scaleLabel: '痛みレベル',
          },
          {
            id: 'q3',
            text: '症状はいつから始まりましたか？',
            type: 'multiple_choice',
            required: true,
            options: ['今日', '昨日', '数日前', '1週間前', 'それ以前'],
          },
        ],
      };

      expect(() => InitialQuestionnaireSchema.parse(validQuestionnaire)).not.toThrow();
    });

    it('should reject questionnaire with invalid question type', () => {
      const invalidQuestionnaire = {
        questions: [
          {
            id: 'q1',
            text: 'テスト質問',
            type: 'invalid_type',
            required: true,
          },
        ],
      };

      expect(() => InitialQuestionnaireSchema.parse(invalidQuestionnaire)).toThrow();
    });

    it('should require scale range for scale type questions', () => {
      const invalidQuestionnaire = {
        questions: [
          {
            id: 'q1',
            text: 'スケール質問',
            type: 'scale',
            required: true,
            // scaleMin/scaleMax missing
          },
        ],
      };

      expect(() => InitialQuestionnaireSchema.parse(invalidQuestionnaire)).toThrow();
    });

    it('should require options for multiple choice questions', () => {
      const invalidQuestionnaire = {
        questions: [
          {
            id: 'q1',
            text: '選択肢質問',
            type: 'multiple_choice',
            required: true,
            // options missing
          },
        ],
      };

      expect(() => InitialQuestionnaireSchema.parse(invalidQuestionnaire)).toThrow();
    });
  });

  describe('ModelConfiguration', () => {
    it('should validate valid ModelConfiguration', () => {
      const validConfig: ModelConfiguration = {
        temperature: 0.7,
        maxTokens: 2000,
        model: 'gpt-4',
        promptTemplate: 'default_patient_sim',
      };

      expect(() => ModelConfigurationSchema.parse(validConfig)).not.toThrow();
    });

    it('should reject temperature outside valid range', () => {
      const invalidConfig = {
        temperature: 2.0, // > 1.0
        maxTokens: 2000,
        model: 'gpt-4',
        promptTemplate: 'default_patient_sim',
      };

      expect(() => ModelConfigurationSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject negative maxTokens', () => {
      const invalidConfig = {
        temperature: 0.7,
        maxTokens: -100,
        model: 'gpt-4',
        promptTemplate: 'default_patient_sim',
      };

      expect(() => ModelConfigurationSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject empty model name', () => {
      const invalidConfig = {
        temperature: 0.7,
        maxTokens: 2000,
        model: '',
        promptTemplate: 'default_patient_sim',
      };

      expect(() => ModelConfigurationSchema.parse(invalidConfig)).toThrow();
    });

    it('should support optional fields', () => {
      const validConfig: ModelConfiguration = {
        temperature: 0.8,
        maxTokens: 1500,
        model: 'gpt-3.5-turbo',
        promptTemplate: 'cardiology_specialist',
        systemPrompt: 'You are a cardiology patient simulator.',
        frequencyPenalty: 0.1,
        presencePenalty: 0.2,
      };

      expect(() => ModelConfigurationSchema.parse(validConfig)).not.toThrow();
    });
  });

  describe('GeneratePatientResponse', () => {
    it('should validate valid GeneratePatientResponse', () => {
      const validResponse: GeneratePatientResponse = {
        patient: {
          id: 'patient_123' as PatientId,
          scenarioId: 'scenario_456' as ScenarioId,
          demographics: {
            firstName: '太郎',
            lastName: '山田',
            dateOfBirth: '1980-01-01' as ISODate,
            gender: 'male',
            bloodType: 'A+',
          },
          vitalSigns: {
            bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' },
            heartRate: { value: 72, unit: 'bpm' },
            temperature: { value: 36.5, unit: 'celsius' },
            respiratoryRate: { value: 16, unit: 'breaths/min' },
            oxygenSaturation: { value: 98, unit: '%' },
            recordedAt: '2023-01-01T10:00:00Z' as ISODateTime,
          },
          currentMedications: [],
          allergies: [],
          medicalHistory: {
            surgicalHistory: [],
            familyHistory: [],
            pastIllnesses: [],
            hospitalizations: [],
          },
          currentConditions: [],
          socialHistory: {},
          insuranceInfo: {
            provider: 'テスト保険',
            policyNumber: 'POL123456',
            validUntil: '2024-12-31' as ISODate,
          },
        },
        initialQuestionnaire: {
          questions: [
            {
              id: 'q1',
              text: 'どのような症状でお越しになりましたか？',
              type: 'open_ended',
              required: true,
            },
          ],
        },
        modelConfiguration: {
          temperature: 0.7,
          maxTokens: 2000,
          model: 'gpt-4',
          promptTemplate: 'default_patient_sim',
        },
      };

      expect(() => GeneratePatientResponseSchema.parse(validResponse)).not.toThrow();
    });
  });
});