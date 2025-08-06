import { describe, it, expect } from 'vitest';
import { LLMRequestSchema, ResponseFormat } from '../llm';

describe('LLM Response Format Support', () => {
  describe('LLMRequestSchema with responseFormat', () => {
    it('should accept valid responseFormat field', () => {
      const validRequest = {
        type: 'patient_persona_generation' as const,
        context: {},
        userPrompt: 'Generate a patient persona',
        responseFormat: {
          type: 'json_schema' as const,
          json_schema: {
            name: 'patient_persona',
            strict: true,
            schema: {
              type: 'object' as const,
              properties: {
                id: { type: 'string' as const },
                demographics: { type: 'object' as const }
              },
              required: ['id', 'demographics'],
              additionalProperties: false
            }
          }
        }
      };

      const result = LLMRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid responseFormat type', () => {
      const invalidRequest = {
        type: 'patient_persona_generation' as const,
        context: {},
        userPrompt: 'Generate a patient persona',
        responseFormat: {
          type: 'invalid_type',
          json_schema: {}
        }
      };

      const result = LLMRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept request without responseFormat (optional field)', () => {
      const requestWithoutFormat = {
        type: 'patient_persona_generation' as const,
        context: {},
        userPrompt: 'Generate a patient persona'
      };

      const result = LLMRequestSchema.safeParse(requestWithoutFormat);
      expect(result.success).toBe(true);
    });
  });

  describe('ResponseFormat type', () => {
    it('should define correct JSON schema format structure', () => {
      const responseFormat: ResponseFormat = {
        type: 'json_schema',
        json_schema: {
          name: 'test_schema',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              test: { type: 'string' }
            },
            required: ['test'],
            additionalProperties: false
          }
        }
      };

      expect(responseFormat.type).toBe('json_schema');
      expect(responseFormat.json_schema.strict).toBe(true);
      expect(responseFormat.json_schema.schema.additionalProperties).toBe(false);
    });
  });
});