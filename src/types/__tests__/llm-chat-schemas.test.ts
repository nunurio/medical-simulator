import { describe, it, expect } from 'vitest';
import { 
  ChatResponseJsonSchema,
  EmotionalTone,
  ChatRequestSchema,
  ChatResponseSchema,
  PatientContextSchema,
  ConversationHistorySchema,
  MedicalValidationResultSchema,
  convertZodSchemaToJsonSchema
} from '../llm-chat-schemas';
import { z } from 'zod';

describe('LLM Chat Schemas - TDD Implementation', () => {
  describe('ChatResponseJsonSchema', () => {
    it('should define valid schema structure for Structured Outputs', () => {
      // Red: テストは失敗するはず（まだ実装されていないため）
      expect(ChatResponseJsonSchema).toBeDefined();
      expect(ChatResponseJsonSchema.type).toBe('json_schema');
      expect(ChatResponseJsonSchema.json_schema.strict).toBe(true);
      expect(ChatResponseJsonSchema.json_schema.schema.additionalProperties).toBe(false);
    });

    it('should include required fields in schema', () => {
      const requiredFields = ['response', 'emotionalTone', 'symptoms', 'medicalConcerns', 'requiresFollowUp'];
      expect(ChatResponseJsonSchema.json_schema.schema.required).toEqual(
        expect.arrayContaining(requiredFields)
      );
    });

    it('should define correct property types', () => {
      const properties = ChatResponseJsonSchema.json_schema.schema.properties;
      
      expect(properties.response.type).toBe('string');
      expect(properties.emotionalTone.type).toBe('string');
      expect(properties.symptoms.type).toBe('array');
      expect(properties.symptoms.items.type).toBe('string');
      expect(properties.medicalConcerns.type).toBe('array');
      expect(properties.medicalConcerns.items.type).toBe('string');
      expect(properties.requiresFollowUp.type).toBe('boolean');
    });
  });

  describe('EmotionalTone enum', () => {
    it('should include medical simulation appropriate values', () => {
      const expectedValues = ['anxious', 'pain', 'calm', 'distressed', 'confused', 'cooperative'];
      expectedValues.forEach(value => {
        expect(EmotionalTone.options).toContain(value);
      });
    });
  });

  describe('ChatRequestSchema', () => {
    it('should validate valid chat request', () => {
      const validRequest = {
        message: 'I have a headache',
        patientContext: {
          id: 'patient-123',
          demographics: { firstName: 'John', lastName: 'Doe' },
          currentConditions: []
        },
        conversationHistory: []
      };

      expect(() => ChatRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject invalid chat request', () => {
      const invalidRequest = {
        message: '', // 空の文字列は無効
        patientContext: null
      };

      expect(() => ChatRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('ChatResponseSchema', () => {
    it('should validate valid chat response', () => {
      const validResponse = {
        response: 'I understand you have a headache. How long have you been experiencing this?',
        emotionalTone: 'calm',
        symptoms: ['headache'],
        medicalConcerns: ['possible migraine'],
        requiresFollowUp: true
      };

      expect(() => ChatResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should reject response with invalid emotional tone', () => {
      const invalidResponse = {
        response: 'Test response',
        emotionalTone: 'invalid_tone',
        symptoms: [],
        medicalConcerns: [],
        requiresFollowUp: false
      };

      expect(() => ChatResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('PatientContextSchema', () => {
    it('should validate complete patient context', () => {
      const validContext = {
        id: 'patient-123',
        demographics: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          bloodType: 'O+'
        },
        currentConditions: [],
        medications: [],
        allergies: [],
        chiefComplaint: 'Headache',
        sessionContext: {
          currentTime: '2025-01-01T10:00:00Z',
          sessionId: 'session-123'
        }
      };

      expect(() => PatientContextSchema.parse(validContext)).not.toThrow();
    });
  });

  describe('convertZodSchemaToJsonSchema utility', () => {
    it('should convert basic types to valid JSON Schema structure', () => {
      const testSchema = z.object({
        name: z.string(),
        age: z.number(),
        isActive: z.boolean()
      });

      const jsonSchema = convertZodSchemaToJsonSchema(testSchema);
      
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.strict).toBe(true);
      expect(jsonSchema.additionalProperties).toBe(false);
      expect(jsonSchema.properties).toBeDefined();
      expect(jsonSchema.required).toBeDefined();
    });

    it('should handle fallback for unknown schema types', () => {
      const emptySchema = z.unknown();
      const jsonSchema = convertZodSchemaToJsonSchema(emptySchema);
      
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.additionalProperties).toBe(false);
      expect(jsonSchema.strict).toBe(true);
    });
  });

  describe('Schema integration tests', () => {
    it('should work with existing LLMService types', () => {
      // このテストは既存のLLMServiceとの統合を確認
      const mockLLMResponse = {
        response: 'I see you\'re experiencing pain. Can you describe where it hurts?',
        emotionalTone: 'pain',
        symptoms: ['pain', 'discomfort'],
        medicalConcerns: ['pain assessment needed'],
        requiresFollowUp: true
      };

      expect(() => ChatResponseSchema.parse(mockLLMResponse)).not.toThrow();
    });
  });
});