import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PatientStore } from '@/types/state';
import type { PatientPersona, VitalSigns, Condition } from '@/types/patient';
import type { PatientId } from '@/types/core';
import { createISODate } from '@/types/core';
import { MedicalValidationService } from '@/types/medical-validation-service';
import type { InteractionKnowledgeBase, AuditLogger, NotificationService } from '@/types/drug-interaction-service';
import { loadPatientData } from '@/services/patient-api';
import { getConfig } from '@/config/defaults';

export const usePatientStore = create<PatientStore>()(
  immer((set, get) => ({
    // State
    patients: {},
    activePatientId: null,
    loading: false,
    error: null,
    
    // Actions
    setPatients: (patients) => set((state) => {
      state.patients = patients;
      state.error = null;
    }),
    
    addPatient: (patient) => set((state) => {
      state.patients[patient.id] = patient;
      state.error = null;
    }),
    
    updatePatient: (id, updates) => set((state) => {
      const patient = state.patients[id];
      if (patient) {
        state.patients[id] = { ...patient, ...updates };
      }
      state.error = null;
    }),
    
    removePatient: (id) => set((state) => {
      delete state.patients[id];
      if (state.activePatientId === id) {
        state.activePatientId = null;
      }
      state.error = null;
    }),
    
    setActivePatient: (id) => set((state) => {
      state.activePatientId = id;
      state.error = null;
    }),
    
    loadPatient: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });
      
      try {
        // patient-api serviceを使用してデータを取得
        const patientData = await loadPatientData(id);
        
        set((state) => {
          state.patients[id] = patientData;
          state.loading = false;
        });
        
        return patientData;
      } catch (e) {
        set((state) => {
          state.error = e instanceof Error ? e.message : '患者データの読み込みに失敗しました';
          state.loading = false;
        });
        throw e;
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
      // 設定から適切な依存関係を取得
      getConfig();
      // バリデーションサービスは利用可能な場合のみ使用
      try {
        const validationService = get().validationService as MedicalValidationService | undefined;
        if (validationService && typeof validationService.validateVitalSigns === 'function') {
          const age = new Date().getFullYear() - new Date(patient.demographics.dateOfBirth).getFullYear();
          const validationResult = validationService.validateVitalSigns(vitals, age, patient.demographics.gender);
          if (!validationResult.isValid) {
            set((state) => {
              state.error = `異常なバイタルサイン: ${validationResult.errors.map((e: { message: string }) => e.message).join(', ')}`;
            });
            return;
          }
        }
      } catch (validationError) {
        // バリデーションエラーは警告として記録し、処理を続行
        console.warn('バイタルサインバリデーションエラー:', validationError);
      }
      
      set((state) => {
        const patient = state.patients[id];
        if (patient) {
          // 新しいバイタルサインを設定
          patient.vitalSigns.baseline = vitals;
        }
        state.error = null;
      });
      
      // バリデーション完了
    },
    
    addPatientSymptom: (id, symptom) => {
      set((state) => {
        const patient = state.patients[id];
        if (patient) {
          // 症状をcurrentConditionsに追加
          if (typeof symptom === 'string') {
            const newCondition: Condition = {
              name: symptom,
              diagnosedDate: createISODate(new Date().toISOString().split('T')[0]),
              severity: 'moderate',
              isActive: true
            };
            patient.currentConditions.push(newCondition);
          } else if (symptom && typeof symptom === 'object' && 'name' in symptom) {
            patient.currentConditions.push(symptom as Condition);
          }
          state.error = null;
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