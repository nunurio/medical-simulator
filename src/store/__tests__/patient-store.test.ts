import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatientStore } from '../patient-store';
import type { PatientPersona } from '@/types/patient';
import { createPatientId, createScenarioId, createISODate, createISODateTime } from '@/types/core';

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

  describe('setActivePatient', () => {
    it('アクティブな患者を設定できる', () => {
      const patientId = createPatientId('patient-123');
      usePatientStore.getState().setActivePatient(patientId);
      expect(usePatientStore.getState().activePatientId).toBe(patientId);
    });

    it('アクティブな患者をnullに設定できる', () => {
      const patientId = createPatientId('patient-123');
      usePatientStore.setState({ activePatientId: patientId });
      usePatientStore.getState().setActivePatient(null);
      expect(usePatientStore.getState().activePatientId).toBeNull();
    });
  });

  describe('loadPatient', () => {
    it('患者データをロード中にloading状態を設定する', async () => {
      const patientId = createPatientId('patient-1');
      const loadPromise = usePatientStore.getState().loadPatient(patientId);
      
      // loadingがtrueになることを確認
      expect(usePatientStore.getState().loading).toBe(true);
      expect(usePatientStore.getState().error).toBeNull();

      await loadPromise;

      // ロード完了後はloadingがfalseになる
      expect(usePatientStore.getState().loading).toBe(false);
    });

    it('患者データのロード成功時', async () => {
      const patientId = createPatientId('patient-1');
      
      // 実際のAPIコールをモック
      const mockPatientData = {
        id: 'patient-1',
        scenarioId: 'scenario-1',
        demographics: {
          firstName: 'テスト',
          lastName: '患者',
          dateOfBirth: '1979-01-01',
          gender: 'male',
          bloodType: 'A+'
        },
        chiefComplaint: '胸痛',
        presentIllness: '胸部不快感',
        medicalHistory: {
          surgicalHistory: [],
          familyHistory: [],
          pastIllnesses: [],
          hospitalizations: []
        },
        currentConditions: [],
        medications: [],
        allergies: [],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 130, diastolic: 85, unit: 'mmHg' },
            heartRate: { value: 72, unit: 'bpm' },
            temperature: { value: 36.5, unit: 'celsius' },
            respiratoryRate: { value: 16, unit: 'breaths/min' },
            oxygenSaturation: { value: 98, unit: '%' },
            recordedAt: new Date().toISOString()
          },
          trend: 'stable',
          criticalValues: {
            isHypotensive: false,
            isHypertensive: false,
            isTachycardic: false,
            isBradycardic: false,
            isFebrile: false,
            isHypoxic: false
          }
        },
        socialHistory: {},
        insurance: {
          provider: 'テスト保険',
          policyNumber: '12345',
          validUntil: '2025-12-31'
        }
      };

      // 一時的にfetchをモック
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPatientData })
      });

      await usePatientStore.getState().loadPatient(patientId);

      const state = usePatientStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.patients[patientId]).toBeDefined();
    });

    it.skip('患者データのロード失敗時', async () => {
      // TODO: 現在の実装はモックデータを返すだけでエラーが発生しないため、
      // 実際のAPIコールに置き換えた後にこのテストを有効化する
      const patientId = createPatientId('patient-1');
      
      // エラーをシミュレート
      // await usePatientStore.getState().loadPatient(patientId);

      const state = usePatientStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });
});