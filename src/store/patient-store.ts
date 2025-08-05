import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PatientStore, PatientId, PatientPersona, VitalSigns } from '@/types/state';
import { MedicalValidationService } from '@/types/medical-validation-service';

export const usePatientStore = create<PatientStore>()(
  immer((set, get) => ({
    // State
    patients: {},
    activePatientId: null,
    loadingPatientId: null,
    error: null,
    
    // Actions
    setActivePatient: (id) => set((state) => {
      state.activePatientId = id;
      state.error = null;
    }),
    
    loadPatient: async (id) => {
      set((state) => {
        state.loadingPatientId = id;
        state.error = null;
      });
      
      try {
        // TODO: 実際のAPIコールに置き換える
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // モックデータ
        const mockPatient: PatientPersona = {
          id,
          scenarioId: 'scenario-1' as any,
          demographics: {
            name: 'テスト患者',
            age: 45,
            gender: 'male',
            dateOfBirth: '1979-01-01',
            bloodType: 'A',
          },
          chiefComplaint: '胸痛',
          presentIllness: '3時間前から胸部圧迫感',
          medicalHistory: {
            pastIllnesses: [],
            surgeries: [],
            familyHistory: [],
          },
          currentConditions: [],
          medications: [],
          allergies: [],
          vitalSigns: {
            current: {
              bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' },
              heartRate: { value: 72, unit: 'bpm' },
              temperature: { value: 36.5, unit: '°C' },
              respiratoryRate: { value: 16, unit: '/min' },
              oxygenSaturation: { value: 98, unit: '%' },
              timestamp: new Date().toISOString(),
            },
            history: [],
          },
          socialHistory: {
            smokingStatus: 'never',
            alcoholUse: 'occasional',
            occupation: 'office worker',
          },
          insurance: {
            provider: 'Health Insurance Co.',
            policyNumber: '123456789',
            groupNumber: 'GRP001',
          },
        };
        
        set((state) => {
          state.patients[id] = mockPatient;
          state.loadingPatientId = null;
        });
        
        return mockPatient;
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : '患者データの読み込みに失敗しました';
          state.loadingPatientId = null;
        });
        throw error;
      }
    },
    
    updatePatientVitals: (id, vitals) => {
      const patient = get().patients[id];
      if (!patient) {
        set((state) => {
          state.error = `患者ID ${id} が見つかりません`;
        });
        return;
      }
      
      // 医療バリデーション
      const validationResult = MedicalValidationService.validateVitalSigns(vitals);
      if (!validationResult.isValid) {
        set((state) => {
          state.error = validationResult.errors.join(', ');
        });
        return;
      }
      
      set((state) => {
        const patient = state.patients[id];
        if (patient) {
          // 履歴に現在の値を追加
          patient.vitalSigns.history.push({
            ...patient.vitalSigns.current,
            timestamp: new Date().toISOString(),
          });
          
          // 新しい値を設定
          patient.vitalSigns.current = {
            ...vitals,
            timestamp: new Date().toISOString(),
          };
        }
        state.error = null;
      });
      
      // 警告がある場合は通知（エラーとは別処理）
      if (validationResult.warnings.length > 0) {
        console.warn('バイタルサイン警告:', validationResult.warnings);
      }
    },
    
    addPatientSymptom: (id, symptom) => {
      set((state) => {
        const patient = state.patients[id];
        if (patient) {
          // TODO: 症状の追加実装
          console.log('症状追加:', symptom);
        } else {
          state.error = `患者ID ${id} が見つかりません`;
        }
      });
    },
    
    clearPatientError: () => set((state) => {
      state.error = null;
    }),
  }))
);