import { describe, expect, test } from 'vitest';
import { 
  PrescriptionSchema,
  DrugInteractionSchema,
  DrugInteraction,
  checkDrugInteractions
} from '../drug-interaction';

describe('PrescriptionValidation', () => {
  test('正常な処方箋データを受け入れる', () => {
    const validData = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      drugId: '123456', // RxNorm Code
      dose: 500,
      units: 'mg',
      route: 'PO',
      frequency: 'BID',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-10')
    };
    
    expect(() => PrescriptionSchema.parse(validData)).not.toThrow();
  });

  test('終了日が開始日より前の場合エラーを投げる', () => {
    const invalidData = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      drugId: '123456',
      dose: 500,
      units: 'mg',
      route: 'PO',
      frequency: 'BID',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-01') // 開始日より前
    };
    
    expect(() => PrescriptionSchema.parse(invalidData)).toThrow(/終了日は開始日より後でなければなりません/);
  });

  test('不正な投与経路を拒否する', () => {
    const invalidData = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      drugId: '123456',
      dose: 500,
      units: 'mg',
      route: 'inhaled' as unknown, // 定義されていない経路
      frequency: 'BID',
      startDate: new Date('2024-01-01')
    };
    
    expect(() => PrescriptionSchema.parse(invalidData)).toThrow();
  });

  test('不正な投与頻度を拒否する', () => {
    const invalidData = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      drugId: '123456',
      dose: 500,
      units: 'mg',
      route: 'PO',
      frequency: 'every day', // 不正な形式
      startDate: new Date('2024-01-01')
    };
    
    expect(() => PrescriptionSchema.parse(invalidData)).toThrow();
  });

  test('負の用量を拒否する', () => {
    const invalidData = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      drugId: '123456',
      dose: -100, // 負の値
      units: 'mg',
      route: 'PO',
      frequency: 'BID',
      startDate: new Date('2024-01-01')
    };
    
    expect(() => PrescriptionSchema.parse(invalidData)).toThrow();
  });

  test('空の薬物IDを拒否する', () => {
    const invalidData = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      drugId: '', // 空文字列
      dose: 500,
      units: 'mg',
      route: 'PO',
      frequency: 'BID',
      startDate: new Date('2024-01-01')
    };
    
    expect(() => PrescriptionSchema.parse(invalidData)).toThrow();
  });
});

describe('DrugInteractionValidation', () => {
  test('正常な薬物相互作用データを受け入れる', () => {
    const validData = {
      id: 'interaction-001',
      drugIds: ['123456', '789012'],
      severity: 'major',
      mechanism: '薬物代謝酵素の競合阻害',
      clinicalEffect: '薬物Aの血中濃度が上昇し、副作用リスクが増加',
      recommendation: '代替薬の検討または用量調整が必要'
    };
    
    expect(() => DrugInteractionSchema.parse(validData)).not.toThrow();
  });

  test('単一の薬物IDでエラーを投げる', () => {
    const invalidData = {
      id: 'interaction-001',
      drugIds: ['123456'], // 相互作用には最低2つの薬物が必要
      severity: 'major',
      mechanism: '薬物代謝酵素の競合阻害',
      clinicalEffect: '薬物Aの血中濃度が上昇',
      recommendation: '代替薬の検討'
    };
    
    expect(() => DrugInteractionSchema.parse(invalidData)).toThrow(/少なくとも2つの薬物が必要です/);
  });

  test('不正な重症度を拒否する', () => {
    const invalidData = {
      id: 'interaction-001',
      drugIds: ['123456', '789012'],
      severity: 'extreme' as unknown, // 定義されていない重症度
      mechanism: '薬物代謝酵素の競合阻害',
      clinicalEffect: '薬物Aの血中濃度が上昇',
      recommendation: '代替薬の検討'
    };
    
    expect(() => DrugInteractionSchema.parse(invalidData)).toThrow();
  });
});

describe('DrugInteractionCheck', () => {
  test('相互作用がない処方箋リストを正常に処理する', () => {
    const prescriptions = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '123456',
        dose: 500,
        units: 'mg',
        route: 'PO' as const,
        frequency: 'BID',
        startDate: new Date('2024-01-01')
      }
    ];

    const knownInteractions: DrugInteraction[] = [];
    
    const result = checkDrugInteractions(prescriptions, knownInteractions);
    expect(result).toHaveLength(0);
  });

  test('既知の相互作用を検出する', () => {
    const prescriptions = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '123456',
        dose: 500,
        units: 'mg',
        route: 'PO' as const,
        frequency: 'BID',
        startDate: new Date('2024-01-01')
      },
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '789012',
        dose: 100,
        units: 'mg',
        route: 'PO' as const,
        frequency: 'QID',
        startDate: new Date('2024-01-01')
      }
    ];

    const knownInteractions = [
      {
        id: 'interaction-001',
        drugIds: ['123456', '789012'],
        severity: 'major' as const,
        mechanism: '薬物代謝酵素の競合阻害',
        clinicalEffect: '薬物Aの血中濃度が上昇し、副作用リスクが増加',
        recommendation: '代替薬の検討または用量調整が必要'
      }
    ];
    
    const result = checkDrugInteractions(prescriptions, knownInteractions);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('major');
  });

  test('禁忌の組み合わせを検出する', () => {
    const prescriptions = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '111111',
        dose: 50,
        units: 'mg',
        route: 'PO' as const,
        frequency: 'BID',
        startDate: new Date('2024-01-01')
      },
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '222222',
        dose: 100,
        units: 'mg',
        route: 'PO' as const,
        frequency: 'TID',
        startDate: new Date('2024-01-01')
      }
    ];

    const knownInteractions = [
      {
        id: 'interaction-002',
        drugIds: ['111111', '222222'],
        severity: 'contraindicated' as const,
        mechanism: '重篤な心室性不整脈のリスク',
        clinicalEffect: '生命を脅かす不整脈を引き起こす可能性',
        recommendation: '併用は絶対禁忌。代替薬への変更が必須'
      }
    ];
    
    const result = checkDrugInteractions(prescriptions, knownInteractions);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('contraindicated');
  });

  test('複数の相互作用を検出する', () => {
    const prescriptions = [
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '111111',
        dose: 50,
        units: 'mg',
        route: 'PO' as const,
        frequency: 'BID',
        startDate: new Date('2024-01-01')
      },
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '222222',
        dose: 100,
        units: 'mg',
        route: 'PO' as const,
        frequency: 'TID',
        startDate: new Date('2024-01-01')
      },
      {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        drugId: '333333',
        dose: 200,
        units: 'mg',
        route: 'PO' as const,
        frequency: 'QID',
        startDate: new Date('2024-01-01')
      }
    ];

    const knownInteractions = [
      {
        id: 'interaction-003',
        drugIds: ['111111', '222222'],
        severity: 'moderate' as const,
        mechanism: '薬物代謝の競合',
        clinicalEffect: '効果の減弱可能性',
        recommendation: 'モニタリング強化'
      },
      {
        id: 'interaction-004',
        drugIds: ['222222', '333333'],
        severity: 'major' as const,
        mechanism: '腎機能への相乗的影響',
        clinicalEffect: '腎障害のリスク増加',
        recommendation: '腎機能の定期的モニタリングが必要'
      }
    ];
    
    const result = checkDrugInteractions(prescriptions, knownInteractions);
    expect(result).toHaveLength(2);
  });
});