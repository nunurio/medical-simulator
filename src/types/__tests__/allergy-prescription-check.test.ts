import { describe, expect, test } from 'vitest';
import { 
  checkAllergyPrescriptionConflicts,
  AllergyPrescriptionConflict,
  AllergyDrugMapping
} from '../allergy-prescription-check';
import { Allergy } from '../patient-validation';
import { Prescription } from '../drug-interaction';

describe('AllergyPrescriptionCheck', () => {
  const testAllergyDrugMappings: AllergyDrugMapping[] = [
    {
      allergen: 'ペニシリン',
      relatedDrugIds: ['1049502', '1049529', '1049533'], // アモキシシリン等のRxNormコード
      crossReactivity: 1.0 // 100%交差反応性
    },
    {
      allergen: 'サルファ剤',
      relatedDrugIds: ['202433', '202434'], // スルファメトキサゾール等
      crossReactivity: 1.0
    },
    {
      allergen: 'アスピリン',
      relatedDrugIds: ['1191', '1193'], // アスピリン製剤
      crossReactivity: 1.0
    },
    {
      allergen: 'NSAIDs',
      relatedDrugIds: ['5640', '5641', '1191'], // イブプロフェン、アスピリン等
      crossReactivity: 0.3 // 30%交差反応性
    }
  ];

  test('アレルギーと処方薬の直接的な衝突を検出する', () => {
    const allergies: Allergy[] = [
      {
        allergen: 'ペニシリン',
        reaction: 'anaphylaxis',
        severity: 'severe'
      }
    ];

    const prescriptions: Prescription[] = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '1049502', // アモキシシリン（ペニシリン系）
        dose: 500,
        units: 'mg',
        route: 'PO',
        frequency: 'TID',
        startDate: new Date('2024-01-01')
      }
    ];

    const conflicts = checkAllergyPrescriptionConflicts(
      allergies,
      prescriptions,
      testAllergyDrugMappings
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].allergen).toBe('ペニシリン');
    expect(conflicts[0].conflictingDrugId).toBe('1049502');
    expect(conflicts[0].riskLevel).toBe('high');
    expect(conflicts[0].recommendation).toContain('絶対禁忌');
  });

  test('交差反応性のあるアレルギーを検出する', () => {
    const allergies: Allergy[] = [
      {
        allergen: 'NSAIDs',
        reaction: 'respiratory',
        severity: 'moderate'
      }
    ];

    const prescriptions: Prescription[] = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '1191', // アスピリン（NSAIDsの一種）
        dose: 81,
        units: 'mg',
        route: 'PO',
        frequency: 'QD',
        startDate: new Date('2024-01-01')
      }
    ];

    const conflicts = checkAllergyPrescriptionConflicts(
      allergies,
      prescriptions,
      testAllergyDrugMappings
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].crossReactivity).toBe(0.3);
    expect(conflicts[0].riskLevel).toBe('medium');
  });

  test('アレルギーがない場合は衝突なし', () => {
    const allergies: Allergy[] = [];

    const prescriptions: Prescription[] = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '1049502',
        dose: 500,
        units: 'mg',
        route: 'PO',
        frequency: 'TID',
        startDate: new Date('2024-01-01')
      }
    ];

    const conflicts = checkAllergyPrescriptionConflicts(
      allergies,
      prescriptions,
      testAllergyDrugMappings
    );

    expect(conflicts).toHaveLength(0);
  });

  test('関連性のないアレルギーは衝突を起こさない', () => {
    const allergies: Allergy[] = [
      {
        allergen: '卵',
        reaction: 'rash',
        severity: 'mild'
      }
    ];

    const prescriptions: Prescription[] = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '1049502', // ペニシリン系
        dose: 500,
        units: 'mg',
        route: 'PO',
        frequency: 'TID',
        startDate: new Date('2024-01-01')
      }
    ];

    const conflicts = checkAllergyPrescriptionConflicts(
      allergies,
      prescriptions,
      testAllergyDrugMappings
    );

    expect(conflicts).toHaveLength(0);
  });

  test('複数のアレルギーと処方薬の衝突を検出する', () => {
    const allergies: Allergy[] = [
      {
        allergen: 'ペニシリン',
        reaction: 'anaphylaxis',
        severity: 'severe'
      },
      {
        allergen: 'サルファ剤',
        reaction: 'rash',
        severity: 'moderate'
      }
    ];

    const prescriptions: Prescription[] = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '1049502', // ペニシリン系
        dose: 500,
        units: 'mg',
        route: 'PO',
        frequency: 'TID',
        startDate: new Date('2024-01-01')
      },
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '202433', // サルファ剤
        dose: 800,
        units: 'mg',
        route: 'PO',
        frequency: 'BID',
        startDate: new Date('2024-01-01')
      }
    ];

    const conflicts = checkAllergyPrescriptionConflicts(
      allergies,
      prescriptions,
      testAllergyDrugMappings
    );

    expect(conflicts).toHaveLength(2);
    expect(conflicts.map(c => c.allergen)).toContain('ペニシリン');
    expect(conflicts.map(c => c.allergen)).toContain('サルファ剤');
  });

  test('重篤なアレルギー反応がある場合は高リスクと判定する', () => {
    const allergies: Allergy[] = [
      {
        allergen: 'ペニシリン',
        reaction: 'anaphylaxis', // アナフィラキシー
        severity: 'severe'
      }
    ];

    const prescriptions: Prescription[] = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '1049529', // ペニシリン系薬剤
        dose: 250,
        units: 'mg',
        route: 'IV',
        frequency: 'q6h',
        startDate: new Date('2024-01-01')
      }
    ];

    const conflicts = checkAllergyPrescriptionConflicts(
      allergies,
      prescriptions,
      testAllergyDrugMappings
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].riskLevel).toBe('high');
    expect(conflicts[0].recommendation).toContain('絶対禁忌');
    expect(conflicts[0].recommendation).toContain('生命を脅かす');
  });

  test('軽度のアレルギー反応でも交差反応性が高い場合は中リスクと判定する', () => {
    const allergies: Allergy[] = [
      {
        allergen: 'サルファ剤',
        reaction: 'rash',
        severity: 'mild'
      }
    ];

    const prescriptions: Prescription[] = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '202434', // サルファ剤（100%交差反応性）
        dose: 400,
        units: 'mg',
        route: 'PO',
        frequency: 'BID',
        startDate: new Date('2024-01-01')
      }
    ];

    const conflicts = checkAllergyPrescriptionConflicts(
      allergies,
      prescriptions,
      testAllergyDrugMappings
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].riskLevel).toBe('medium');
    expect(conflicts[0].recommendation).toContain('慎重投与');
  });
});