import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatientStore } from '../patient-store';
import type { Patient, VitalSigns } from '@/types/state';
import { MedicalValidationService } from '@/types/medical-validation-service';

describe('PatientStore', () => {
  beforeEach(() => {
    // Zustandのストアをリセット
    usePatientStore.setState({
      patients: {},
      activePatientId: null,
      loading: false,
      error: null,
    });
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const state = usePatientStore.getState();
      
      expect(state.patients).toEqual({});
      expect(state.activePatientId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setPatients', () => {
    it('患者リストを設定できる', () => {
      const mockPatients: Record<string, Patient> = {
        'patient-1': {
          id: 'patient-1',
          name: '田中太郎',
          age: 45,
          gender: 'male',
          medicalHistory: ['高血圧'],
          currentMedications: ['アムロジピン'],
          vitals: {
            heartRate: 72,
            bloodPressure: { systolic: 130, diastolic: 85 },
            temperature: 36.5,
            respiratoryRate: 16,
            oxygenSaturation: 98,
            timestamp: new Date()
          }
        },
        'patient-2': {
          id: 'patient-2',
          name: '佐藤花子',
          age: 38,
          gender: 'female',
          medicalHistory: ['糖尿病'],
          currentMedications: ['メトホルミン'],
          vitals: {
            heartRate: 68,
            bloodPressure: { systolic: 120, diastolic: 80 },
            temperature: 36.8,
            respiratoryRate: 14,
            oxygenSaturation: 99,
            timestamp: new Date()
          }
        }
      };

      usePatientStore.getState().setPatients(mockPatients);
      
      expect(usePatientStore.getState().patients).toEqual(mockPatients);
    });
  });

  describe('addPatient', () => {
    it('新しい患者を追加できる', () => {
      const newPatient: Patient = {
        id: 'patient-3',
        name: '鈴木一郎',
        age: 52,
        gender: 'male',
        medicalHistory: ['高脂血症'],
        currentMedications: ['スタチン'],
        vitals: {
          heartRate: 75,
          bloodPressure: { systolic: 135, diastolic: 88 },
          temperature: 36.6,
          respiratoryRate: 15,
          oxygenSaturation: 97,
          timestamp: new Date()
        }
      };

      usePatientStore.getState().addPatient(newPatient);
      
      const state = usePatientStore.getState();
      expect(state.patients['patient-3']).toEqual(newPatient);
      expect(Object.keys(state.patients)).toHaveLength(1);
    });

    it('既存の患者がいる場合でも追加できる', () => {
      const existingPatient: Patient = {
        id: 'patient-1',
        name: '既存患者',
        age: 40,
        gender: 'female',
        medicalHistory: [],
        currentMedications: [],
        vitals: {
          heartRate: 70,
          bloodPressure: { systolic: 120, diastolic: 80 },
          temperature: 36.5,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          timestamp: new Date()
        }
      };

      usePatientStore.setState({ patients: { 'patient-1': existingPatient } });

      const newPatient: Patient = {
        id: 'patient-2',
        name: '新規患者',
        age: 35,
        gender: 'male',
        medicalHistory: [],
        currentMedications: [],
        vitals: {
          heartRate: 72,
          bloodPressure: { systolic: 125, diastolic: 82 },
          temperature: 36.6,
          respiratoryRate: 14,
          oxygenSaturation: 99,
          timestamp: new Date()
        }
      };

      usePatientStore.getState().addPatient(newPatient);
      
      const state = usePatientStore.getState();
      expect(Object.keys(state.patients)).toHaveLength(2);
      expect(state.patients['patient-1']).toEqual(existingPatient);
      expect(state.patients['patient-2']).toEqual(newPatient);
    });
  });

  describe('updatePatient', () => {
    it('患者情報を更新できる', () => {
      const patient: Patient = {
        id: 'patient-1',
        name: '更新前',
        age: 30,
        gender: 'male',
        medicalHistory: [],
        currentMedications: [],
        vitals: {
          heartRate: 70,
          bloodPressure: { systolic: 120, diastolic: 80 },
          temperature: 36.5,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          timestamp: new Date()
        }
      };

      usePatientStore.setState({ patients: { 'patient-1': patient } });

      usePatientStore.getState().updatePatient('patient-1', {
        name: '更新後',
        age: 31,
        medicalHistory: ['アレルギー']
      });

      const updatedPatient = usePatientStore.getState().patients['patient-1'];
      expect(updatedPatient.name).toBe('更新後');
      expect(updatedPatient.age).toBe(31);
      expect(updatedPatient.medicalHistory).toEqual(['アレルギー']);
      expect(updatedPatient.vitals).toEqual(patient.vitals); // vitalsは変更されない
    });

    it('存在しない患者を更新してもエラーにならない', () => {
      usePatientStore.getState().updatePatient('non-existent', { name: '存在しない' });
      
      const state = usePatientStore.getState();
      expect(state.patients['non-existent']).toBeUndefined();
    });
  });

  describe('removePatient', () => {
    it('患者を削除できる', () => {
      const patients: Record<string, Patient> = {
        'patient-1': {
          id: 'patient-1',
          name: '患者1',
          age: 40,
          gender: 'male',
          medicalHistory: [],
          currentMedications: [],
          vitals: {
            heartRate: 70,
            bloodPressure: { systolic: 120, diastolic: 80 },
            temperature: 36.5,
            respiratoryRate: 16,
            oxygenSaturation: 98,
            timestamp: new Date()
          }
        },
        'patient-2': {
          id: 'patient-2',
          name: '患者2',
          age: 35,
          gender: 'female',
          medicalHistory: [],
          currentMedications: [],
          vitals: {
            heartRate: 72,
            bloodPressure: { systolic: 118, diastolic: 78 },
            temperature: 36.6,
            respiratoryRate: 14,
            oxygenSaturation: 99,
            timestamp: new Date()
          }
        }
      };

      usePatientStore.setState({ patients });

      usePatientStore.getState().removePatient('patient-1');

      const state = usePatientStore.getState();
      expect(state.patients['patient-1']).toBeUndefined();
      expect(state.patients['patient-2']).toBeDefined();
      expect(Object.keys(state.patients)).toHaveLength(1);
    });

    it('存在しない患者を削除してもエラーにならない', () => {
      usePatientStore.getState().removePatient('non-existent');
      expect(usePatientStore.getState().patients).toEqual({});
    });
  });

  describe('setActivePatient', () => {
    it('アクティブな患者を設定できる', () => {
      usePatientStore.getState().setActivePatient('patient-123');
      expect(usePatientStore.getState().activePatientId).toBe('patient-123');
    });

    it('アクティブな患者をnullに設定できる', () => {
      usePatientStore.setState({ activePatientId: 'patient-123' });
      usePatientStore.getState().setActivePatient(null);
      expect(usePatientStore.getState().activePatientId).toBeNull();
    });
  });

  describe('updatePatientVitals', () => {
    it('正常なバイタルサインを更新できる', () => {
      const patient: Patient = {
        id: 'patient-1',
        name: 'テスト患者',
        age: 40,
        gender: 'male',
        medicalHistory: [],
        currentMedications: [],
        vitals: {
          heartRate: 70,
          bloodPressure: { systolic: 120, diastolic: 80 },
          temperature: 36.5,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          timestamp: new Date()
        }
      };

      usePatientStore.setState({ patients: { 'patient-1': patient } });

      const newVitals: VitalSigns = {
        heartRate: 72,
        bloodPressure: { systolic: 125, diastolic: 82 },
        temperature: 36.8,
        respiratoryRate: 18,
        oxygenSaturation: 97,
        timestamp: new Date()
      };

      usePatientStore.getState().updatePatientVitals('patient-1', newVitals);

      const updatedPatient = usePatientStore.getState().patients['patient-1'];
      expect(updatedPatient.vitals).toEqual(newVitals);
    });

    it('異常なバイタルサインでエラーを設定する', () => {
      const patient: Patient = {
        id: 'patient-1',
        name: 'テスト患者',
        age: 40,
        gender: 'male',
        medicalHistory: [],
        currentMedications: [],
        vitals: {
          heartRate: 70,
          bloodPressure: { systolic: 120, diastolic: 80 },
          temperature: 36.5,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          timestamp: new Date()
        }
      };

      usePatientStore.setState({ patients: { 'patient-1': patient } });

      const abnormalVitals: VitalSigns = {
        heartRate: 200, // 異常に高い
        bloodPressure: { systolic: 200, diastolic: 120 }, // 高血圧
        temperature: 40.0, // 高熱
        respiratoryRate: 30, // 頻呼吸
        oxygenSaturation: 85, // 低酸素
        timestamp: new Date()
      };

      usePatientStore.getState().updatePatientVitals('patient-1', abnormalVitals);

      // バイタルは更新される
      const updatedPatient = usePatientStore.getState().patients['patient-1'];
      expect(updatedPatient.vitals).toEqual(abnormalVitals);

      // エラーメッセージが設定される
      const state = usePatientStore.getState();
      expect(state.error).toContain('異常なバイタルサイン');
    });

    it('存在しない患者のバイタル更新はエラーにならない', () => {
      const vitals: VitalSigns = {
        heartRate: 70,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 36.5,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        timestamp: new Date()
      };

      usePatientStore.getState().updatePatientVitals('non-existent', vitals);
      
      const state = usePatientStore.getState();
      expect(state.patients['non-existent']).toBeUndefined();
      expect(state.error).toBeNull();
    });
  });

  describe('loadPatient', () => {
    it('患者データをロード中にloading状態を設定する', async () => {
      const loadPromise = usePatientStore.getState().loadPatient('patient-1');
      
      // loadingがtrueになることを確認
      expect(usePatientStore.getState().loading).toBe(true);
      expect(usePatientStore.getState().error).toBeNull();

      await loadPromise;

      // ロード完了後はloadingがfalseになる
      expect(usePatientStore.getState().loading).toBe(false);
    });

    it('患者データのロード成功時', async () => {
      // 実際のAPIコールをモック
      const mockPatient: Patient = {
        id: 'patient-1',
        name: 'API取得患者',
        age: 45,
        gender: 'male',
        medicalHistory: ['糖尿病'],
        currentMedications: ['インスリン'],
        vitals: {
          heartRate: 75,
          bloodPressure: { systolic: 130, diastolic: 85 },
          temperature: 36.7,
          respiratoryRate: 16,
          oxygenSaturation: 97,
          timestamp: new Date()
        }
      };

      // 一時的にfetchをモック
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPatient })
      });

      await usePatientStore.getState().loadPatient('patient-1');

      const state = usePatientStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.patients['patient-1']).toEqual(mockPatient);
    });

    it('患者データのロード失敗時', async () => {
      // エラーをシミュレート
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await usePatientStore.getState().loadPatient('patient-1');

      const state = usePatientStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });
});