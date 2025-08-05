import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PatientStore } from '@/types/state';
import type { PatientPersona, VitalSigns } from '@/types/patient';
import type { PatientId } from '@/types/core';
import { createScenarioId, createISODate, createISODateTime } from '@/types/core';
import { MedicalValidationService } from '@/types/medical-validation-service';
import type { InteractionKnowledgeBase, AuditLogger, NotificationService } from '@/types/drug-interaction-service';

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
        // TODO: 実際のAPIコールに置き換える
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // モックデータ
        const mockPatient: PatientPersona = {
          id,
          scenarioId: createScenarioId('scenario-1'),
          demographics: {
            firstName: 'テスト',
            lastName: '患者',
            gender: 'male',
            dateOfBirth: createISODate('1979-01-01'),
            bloodType: 'A+',
          },
          chiefComplaint: '胸痛',
          presentIllness: '3時間前から胸部圧迫感',
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
              heartRate: { value: 72, unit: 'bpm' },
              temperature: { value: 36.5, unit: 'celsius' },
              respiratoryRate: { value: 16, unit: 'breaths/min' },
              oxygenSaturation: { value: 98, unit: '%' },
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
            smoking: {
              status: 'never',
            },
            alcohol: {
              status: 'occasional',
            },
            occupation: 'office worker',
          },
          insurance: {
            provider: 'Health Insurance Co.',
            policyNumber: '123456789',
            validUntil: createISODate('2025-12-31'),
          },
        };
        
        set((state) => {
          state.patients[id] = mockPatient;
          state.loading = false;
        });
        
        return mockPatient;
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : '患者データの読み込みに失敗しました';
          state.loading = false;
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
      // TODO: 実際のサービス実装時に適切な依存関係を注入する
      const medicalValidationService = new MedicalValidationService(
        {} as InteractionKnowledgeBase,
        {} as AuditLogger,
        {} as NotificationService,
        [] // allergyDrugMappings
      );
      const age = new Date().getFullYear() - new Date(patient.demographics.dateOfBirth).getFullYear();
      const validationResult = medicalValidationService.validateVitalSigns(vitals, age, patient.demographics.gender);
      if (!validationResult.isValid) {
        set((state) => {
          state.error = `異常なバイタルサイン: ${validationResult.errors.map(e => e.message).join(', ')}`;
        });
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