import { describe, expect, test } from 'vitest';
import { PatientPersonaSchema } from '../validation';

describe('PatientPersonaValidation', () => {
  describe('人口統計データバリデーション', () => {
    test('正常な人口統計データを受け入れる', () => {
      const validData = {
        demographics: {
          age: 45,
          gender: 'male',
          weight: 75.5,
          height: 175
        },
        medicalHistory: [],
        allergies: [],
        vitalSigns: {
          heartRate: 72,
          temperature: 36.6,
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
            unit: 'mmHg',
            takenAt: '2024-01-01T10:00:00Z',
            patientId: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      };
      
      expect(() => PatientPersonaSchema.parse(validData)).not.toThrow();
    });

    test('年齢が負の値の場合エラーを投げる', () => {
      const invalidData = {
        demographics: {
          age: -5,
          gender: 'female',
          weight: 60,
          height: 165
        },
        medicalHistory: [],
        allergies: [],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow();
    });

    test('年齢が150歳を超える場合エラーを投げる', () => {
      const invalidData = {
        demographics: {
          age: 151,
          gender: 'male',
          weight: 70,
          height: 170
        },
        medicalHistory: [],
        allergies: [],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow();
    });

    test('体重が異常に低い場合エラーを投げる', () => {
      const invalidData = {
        demographics: {
          age: 30,
          gender: 'female',
          weight: 0.3, // 300g
          height: 165
        },
        medicalHistory: [],
        allergies: [],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow();
    });

    test('身長が異常に低い場合エラーを投げる', () => {
      const invalidData = {
        demographics: {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 25 // 25cm
        },
        medicalHistory: [],
        allergies: [],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow();
    });
  });

  describe('既往歴バリデーション', () => {
    test('正しいICD-10コードを持つ既往歴を受け入れる', () => {
      const validData = {
        demographics: {
          age: 50,
          gender: 'male',
          weight: 80,
          height: 180
        },
        medicalHistory: [
          {
            condition: '高血圧症',
            icd10Code: 'I10',
            onsetDate: '2020-01-01',
            severity: 'moderate'
          },
          {
            condition: '2型糖尿病',
            icd10Code: 'E11.9',
            onsetDate: '2018-06-15',
            severity: 'mild'
          }
        ],
        allergies: [],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(validData)).not.toThrow();
    });

    test('不正なICD-10コードを拒否する', () => {
      const invalidData = {
        demographics: {
          age: 45,
          gender: 'female',
          weight: 65,
          height: 165
        },
        medicalHistory: [
          {
            condition: '高血圧症',
            icd10Code: 'INVALID-CODE', // 不正な形式
            onsetDate: '2020-01-01',
            severity: 'moderate'
          }
        ],
        allergies: [],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow();
    });

    test('不正な重症度を拒否する', () => {
      const invalidData = {
        demographics: {
          age: 45,
          gender: 'male',
          weight: 75,
          height: 175
        },
        medicalHistory: [
          {
            condition: '高血圧症',
            icd10Code: 'I10',
            onsetDate: '2020-01-01',
            severity: 'critical' as unknown // 定義されていない重症度
          }
        ],
        allergies: [],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow();
    });
  });

  describe('アレルギー情報バリデーション', () => {
    test('正しいアレルギー情報を受け入れる', () => {
      const validData = {
        demographics: {
          age: 35,
          gender: 'female',
          weight: 60,
          height: 165
        },
        medicalHistory: [],
        allergies: [
          {
            allergen: 'ペニシリン',
            reaction: 'anaphylaxis',
            severity: 'severe'
          },
          {
            allergen: '卵',
            reaction: 'rash',
            severity: 'mild'
          }
        ],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(validData)).not.toThrow();
    });

    test('不正な反応タイプを拒否する', () => {
      const invalidData = {
        demographics: {
          age: 40,
          gender: 'male',
          weight: 85,
          height: 185
        },
        medicalHistory: [],
        allergies: [
          {
            allergen: 'ナッツ',
            reaction: 'unknown' as unknown, // 定義されていない反応タイプ
            severity: 'moderate'
          }
        ],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow();
    });

    test('空のアレルゲン名を拒否する', () => {
      const invalidData = {
        demographics: {
          age: 30,
          gender: 'female',
          weight: 55,
          height: 160
        },
        medicalHistory: [],
        allergies: [
          {
            allergen: '', // 空文字列
            reaction: 'respiratory',
            severity: 'severe'
          }
        ],
        vitalSigns: {}
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow();
    });
  });

  describe('年齢に応じたバイタルサインバリデーション', () => {
    test('成人の正常なバイタルサインを持つペルソナを受け入れる', () => {
      const validData = {
        demographics: {
          age: 35,
          gender: 'male',
          weight: 75,
          height: 175
        },
        medicalHistory: [],
        allergies: [],
        vitalSigns: {
          heartRate: 75,
          temperature: 36.5,
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
            unit: 'mmHg',
            takenAt: '2024-01-01T10:00:00Z',
            patientId: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      };
      
      const result = PatientPersonaSchema.parse(validData);
      expect(result).toBeDefined();
    });

    test('新生児の高い心拍数を正常として受け入れる', () => {
      const validData = {
        demographics: {
          age: 0,
          gender: 'female',
          weight: 3.5,
          height: 50
        },
        medicalHistory: [],
        allergies: [],
        vitalSigns: {
          heartRate: 140, // 新生児には正常
          temperature: 36.8,
          bloodPressure: {
            systolic: 75,
            diastolic: 45,
            unit: 'mmHg',
            takenAt: '2024-01-01T10:00:00Z',
            patientId: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      };
      
      expect(() => PatientPersonaSchema.parse(validData)).not.toThrow();
    });

    test('成人の異常に高い心拍数を拒否する', () => {
      const invalidData = {
        demographics: {
          age: 35,
          gender: 'male',
          weight: 75,
          height: 175
        },
        medicalHistory: [],
        allergies: [],
        vitalSigns: {
          heartRate: 140, // 成人には高すぎる
          temperature: 36.5,
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
            unit: 'mmHg',
            takenAt: '2024-01-01T10:00:00Z',
            patientId: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      };
      
      expect(() => PatientPersonaSchema.parse(invalidData)).toThrow(/心拍数が高すぎます/);
    });
  });
});