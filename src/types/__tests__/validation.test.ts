import { describe, expect, test } from 'vitest';
import { 
  BloodPressureSchema,
  createAgeAwareVitalSignsSchema,
  getHeartRateRange
} from '../validation';

describe('BloodPressureValidation', () => {
  test('正常な血圧値を受け入れる', () => {
    const validData = {
      systolic: 120,
      diastolic: 80,
      unit: 'mmHg' as const,
      takenAt: '2024-01-01T10:00:00Z',
      patientId: '123e4567-e89b-12d3-a456-426614174000'
    };
    
    expect(() => BloodPressureSchema.parse(validData)).not.toThrow();
  });

  test('拡張期血圧が収縮期血圧以上の場合エラーを投げる', () => {
    const invalidData = {
      systolic: 120,
      diastolic: 130, // 異常値
      unit: 'mmHg' as const,
      takenAt: '2024-01-01T10:00:00Z',
      patientId: '123e4567-e89b-12d3-a456-426614174000'
    };
    
    expect(() => BloodPressureSchema.parse(invalidData)).toThrow();
  });

  test('収縮期血圧が異常に低い場合エラーを投げる', () => {
    const invalidData = {
      systolic: 30, // 異常に低い
      diastolic: 20,
      unit: 'mmHg' as const,
      takenAt: '2024-01-01T10:00:00Z',
      patientId: '123e4567-e89b-12d3-a456-426614174000'
    };
    
    expect(() => BloodPressureSchema.parse(invalidData)).toThrow();
  });

  test('収縮期血圧が異常に高い場合エラーを投げる', () => {
    const invalidData = {
      systolic: 310, // 異常に高い
      diastolic: 150,
      unit: 'mmHg' as const,
      takenAt: '2024-01-01T10:00:00Z',
      patientId: '123e4567-e89b-12d3-a456-426614174000'
    };
    
    expect(() => BloodPressureSchema.parse(invalidData)).toThrow();
  });

  test('単位がmmHg以外の場合エラーを投げる', () => {
    const invalidData = {
      systolic: 120,
      diastolic: 80,
      unit: 'psi' as unknown, // 不正な単位
      takenAt: '2024-01-01T10:00:00Z',
      patientId: '123e4567-e89b-12d3-a456-426614174000'
    };
    
    expect(() => BloodPressureSchema.parse(invalidData)).toThrow();
  });

  test('日時が不正な形式の場合エラーを投げる', () => {
    const invalidData = {
      systolic: 120,
      diastolic: 80,
      unit: 'mmHg' as const,
      takenAt: 'invalid-date', // 不正な日時形式
      patientId: '123e4567-e89b-12d3-a456-426614174000'
    };
    
    expect(() => BloodPressureSchema.parse(invalidData)).toThrow();
  });

  test('患者IDが不正なUUID形式の場合エラーを投げる', () => {
    const invalidData = {
      systolic: 120,
      diastolic: 80,
      unit: 'mmHg' as const,
      takenAt: '2024-01-01T10:00:00Z',
      patientId: 'invalid-uuid' // 不正なUUID
    };
    
    expect(() => BloodPressureSchema.parse(invalidData)).toThrow();
  });
});

describe('VitalSignsValidation', () => {
  describe('年齢別心拍数範囲', () => {
    test('新生児の心拍数範囲を正しく取得する', () => {
      const range = getHeartRateRange(0, 'all');
      expect(range.min).toBe(100);
      expect(range.max).toBe(160);
    });

    test('成人の心拍数範囲を正しく取得する', () => {
      const range = getHeartRateRange(30, 'all');
      expect(range.min).toBe(60);
      expect(range.max).toBe(100);
    });

    test('高齢者の心拍数範囲を正しく取得する', () => {
      const range = getHeartRateRange(70, 'all');
      expect(range.min).toBe(60);
      expect(range.max).toBe(100);
    });
  });

  describe('年齢別バイタルサインバリデーション', () => {
    test('成人の正常なバイタルサインを受け入れる', () => {
      const schema = createAgeAwareVitalSignsSchema(30, 'male');
      const validData = {
        heartRate: 75,
        temperature: 36.5,
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          unit: 'mmHg',
          takenAt: '2024-01-01T10:00:00Z',
          patientId: '123e4567-e89b-12d3-a456-426614174000'
        }
      };
      
      expect(() => schema.parse(validData)).not.toThrow();
    });

    test('成人の異常に高い心拍数を拒否する', () => {
      const schema = createAgeAwareVitalSignsSchema(30, 'male');
      const invalidData = {
        heartRate: 150, // 成人には高すぎる
        temperature: 36.5,
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          unit: 'mmHg',
          takenAt: '2024-01-01T10:00:00Z',
          patientId: '123e4567-e89b-12d3-a456-426614174000'
        }
      };
      
      expect(() => schema.parse(invalidData)).toThrow(/心拍数が高すぎます/);
    });

    test('新生児の正常な心拍数を受け入れる', () => {
      const schema = createAgeAwareVitalSignsSchema(0, 'all');
      const validData = {
        heartRate: 130, // 新生児には正常
        temperature: 36.8,
        bloodPressure: {
          systolic: 80,
          diastolic: 45,
          unit: 'mmHg',
          takenAt: '2024-01-01T10:00:00Z',
          patientId: '123e4567-e89b-12d3-a456-426614174000'
        }
      };
      
      expect(() => schema.parse(validData)).not.toThrow();
    });

    test('体温が低すぎる場合エラーを投げる', () => {
      const schema = createAgeAwareVitalSignsSchema(30, 'female');
      const invalidData = {
        heartRate: 75,
        temperature: 34.5, // 低体温症
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          unit: 'mmHg',
          takenAt: '2024-01-01T10:00:00Z',
          patientId: '123e4567-e89b-12d3-a456-426614174000'
        }
      };
      
      expect(() => schema.parse(invalidData)).toThrow(/体温が低すぎます/);
    });

    test('体温が高すぎる場合エラーを投げる', () => {
      const schema = createAgeAwareVitalSignsSchema(30, 'female');
      const invalidData = {
        heartRate: 75,
        temperature: 42.5, // 異常高体温
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          unit: 'mmHg',
          takenAt: '2024-01-01T10:00:00Z',
          patientId: '123e4567-e89b-12d3-a456-426614174000'
        }
      };
      
      expect(() => schema.parse(invalidData)).toThrow(/体温が高すぎます/);
    });
  });
});