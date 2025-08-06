import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { PatientPersonaJsonSchema, convertZodSchemaToJsonSchema } from '../llm-schemas';

describe('LLM Schemas - OpenAI Structured Outputs', () => {
  describe('PatientPersonaJsonSchema', () => {
    it('should be a valid JSON Schema object with strict mode enabled', () => {
      expect(PatientPersonaJsonSchema).toHaveProperty('type', 'object');
      expect(PatientPersonaJsonSchema).toHaveProperty('strict', true);
      expect(PatientPersonaJsonSchema).toHaveProperty('additionalProperties', false);
      expect(PatientPersonaJsonSchema).toHaveProperty('properties');
      expect(PatientPersonaJsonSchema).toHaveProperty('required');
    });

    it('should have all required PatientPersona fields defined', () => {
      const properties = PatientPersonaJsonSchema.properties;
      
      // 必須フィールドの存在確認
      expect(properties).toHaveProperty('id');
      expect(properties).toHaveProperty('scenarioId');
      expect(properties).toHaveProperty('demographics');
      expect(properties).toHaveProperty('chiefComplaint');
      expect(properties).toHaveProperty('presentIllness');
      expect(properties).toHaveProperty('medicalHistory');
      expect(properties).toHaveProperty('currentConditions');
      expect(properties).toHaveProperty('medications');
      expect(properties).toHaveProperty('allergies');
      expect(properties).toHaveProperty('vitalSigns');
      expect(properties).toHaveProperty('socialHistory');
      expect(properties).toHaveProperty('insurance');
    });

    it('should be compatible with zodResponseFormat helper', () => {
      // zodResponseFormatヘルパーが正常に動作することを確認
      expect(() => {
        const schema = z.object({
          id: z.string(),
          scenarioId: z.string(),
          demographics: z.object({
            age: z.number(),
            gender: z.string(),
            name: z.string()
          }),
          chiefComplaint: z.string(),
          presentIllness: z.string()
        });
        
        const responseFormat = zodResponseFormat(schema, 'patient_persona');
        expect(responseFormat).toHaveProperty('type', 'json_schema');
        expect(responseFormat.json_schema).toHaveProperty('strict', true);
      }).not.toThrow();
    });
  });

  describe('convertZodSchemaToJsonSchema', () => {
    it('should convert Zod schema to OpenAI compatible JSON Schema', () => {
      const zodSchema = z.object({
        name: z.string(),
        age: z.number(),
        isActive: z.boolean().optional()
      });

      const jsonSchema = convertZodSchemaToJsonSchema(zodSchema);
      
      expect(jsonSchema).toHaveProperty('type', 'object');
      expect(jsonSchema).toHaveProperty('strict', true);
      expect(jsonSchema).toHaveProperty('additionalProperties', false);
      expect(jsonSchema.properties).toHaveProperty('name');
      expect(jsonSchema.properties).toHaveProperty('age');
      expect(jsonSchema.properties).toHaveProperty('isActive');
      expect(jsonSchema.required).toContain('name');
      expect(jsonSchema.required).toContain('age');
      expect(jsonSchema.required).not.toContain('isActive');
    });

    it('should provide basic schema structure (TDD: minimal implementation)', () => {
      // t-wada方式TDD: 最小限の実装から開始
      // 実際のプロダクションではzodResponseFormatヘルパーを使用
      const zodSchema = z.object({
        name: z.string(),
        age: z.number(),
        isActive: z.boolean().optional()
      });

      const jsonSchema = convertZodSchemaToJsonSchema(zodSchema);
      
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.strict).toBe(true);
      expect(jsonSchema.additionalProperties).toBe(false);
      expect(jsonSchema.properties).toHaveProperty('name');
      expect(jsonSchema.properties).toHaveProperty('age');
      expect(jsonSchema.required).toContain('name');
      expect(jsonSchema.required).toContain('age');
    });

    it('should be compatible with zodResponseFormat workflow', () => {
      // 実際のワークフローをシミュレート
      const patientSchema = z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
        isActive: z.boolean().optional()
      });

      // zodResponseFormatと同等の処理をテスト
      expect(() => {
        const jsonSchema = convertZodSchemaToJsonSchema(patientSchema);
        const responseFormat = {
          type: 'json_schema' as const,
          json_schema: {
            name: 'patient',
            strict: true,
            schema: jsonSchema
          }
        };
        expect(responseFormat.json_schema.schema.strict).toBe(true);
        expect(responseFormat.json_schema.schema.additionalProperties).toBe(false);
      }).not.toThrow();
    });
  });
});