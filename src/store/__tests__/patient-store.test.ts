import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatientStore } from '../patient-store';
import type { PatientPersona } from '@/types/patient';
import { createPatientId, createScenarioId, createISODate, createISODateTime } from '@/types/core';
import * as patientApi from '@/services/patient-api';

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

    it('patient-api serviceを使用して患者データをロードする', async () => {
      const patientId = createPatientId('patient-1');
      const mockPatient: PatientPersona = {
        id: patientId,
        scenarioId: createScenarioId('scenario-1'),
        demographics: {
          firstName: 'API',
          lastName: 'Patient',
          gender: 'male',
          dateOfBirth: createISODate('1980-01-01'),
          bloodType: 'B+',
        },
        chiefComplaint: 'API Test',
        presentIllness: 'Test case',
        medicalHistory: {
          surgicalHistory: [],
          familyHistory: [],
          pastIllnesses: [],
          hospitalizations: [],
        },
        currentConditions: [],
        medications: [],
        allergies: [],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' },
            heartRate: { value: 75, unit: 'bpm' },
            temperature: { value: 36.5, unit: 'celsius' },
            respiratoryRate: { value: 18, unit: 'breaths/min' },
            oxygenSaturation: { value: 99, unit: '%' },
            recordedAt: createISODateTime(new Date().toISOString()),
          },
          trend: 'stable',
          criticalValues: {
            isHypotensive: false,
            isHypertensive: false,
            isTachycardic: false,
            isBradycardic: false,
            isFebrile: false,
            isHypoxic: false,
          },
        },
        socialHistory: {
          smoking: { status: 'never' },
          alcohol: { status: 'never' },
          occupation: 'engineer',
        },
        insurance: {
          provider: 'Test Insurance',
          policyNumber: 'TEST123',
          validUntil: createISODate('2025-12-31'),
        },
      };

      // patient-api serviceをモック
      const loadPatientDataSpy = vi.spyOn(patientApi, 'loadPatientData').mockResolvedValue(mockPatient);

      await usePatientStore.getState().loadPatient(patientId);

      // patient-api serviceが呼び出されることを確認
      expect(loadPatientDataSpy).toHaveBeenCalledWith(patientId);
      
      const state = usePatientStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.patients[patientId]).toEqual(mockPatient);
      
      loadPatientDataSpy.mockRestore();
    });

    it('patient-api serviceのエラーハンドリング', async () => {
      const patientId = createPatientId('patient-error');
      const errorMessage = 'API Error: Failed to load patient data';
      
      // patient-api serviceがエラーを投げるようにモック
      const loadPatientDataSpy = vi.spyOn(patientApi, 'loadPatientData').mockRejectedValue(new Error(errorMessage));

      await expect(usePatientStore.getState().loadPatient(patientId)).rejects.toThrow(errorMessage);

      const state = usePatientStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.patients[patientId]).toBeUndefined();
      
      loadPatientDataSpy.mockRestore();
    });
  });
});