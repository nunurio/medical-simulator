import { describe, it, expect } from 'vitest';
import type {
  PatientPersona,
  PatientDemographics,
  MedicalHistory,
  VitalSigns,
  VitalSignsHistory,
  Allergy,
  CurrentMedication,
  SocialHistory,
  InsuranceInfo,
  Gender,
  BloodType,
  AllergyReaction,
  AllergyType,
  MedicationUnit,
  MedicationFrequency
} from '../patient';
import type { PatientId, ScenarioId, ProviderId, ISODate, ISODateTime } from '../core';
import { createPatientId, createScenarioId, createProviderId, createISODate, createISODateTime } from '../core';

describe('Patient Types', () => {
  describe('Patient Demographics', () => {
    it('should create valid patient demographics', () => {
      const demographics: PatientDemographics = {
        firstName: '太郎',
        lastName: '山田',
        dateOfBirth: createISODate('1980-05-15'),
        gender: 'male',
        bloodType: 'A+',
        phoneNumber: '090-1234-5678',
        email: 'taro.yamada@example.com',
        emergencyContact: {
          name: '山田 花子',
          relationship: '妻',
          phoneNumber: '090-8765-4321'
        }
      };

      expect(demographics.firstName).toBe('太郎');
      expect(demographics.gender).toBe('male');
      expect(demographics.bloodType).toBe('A+');
    });

    it('should support gender types', () => {
      const genders: Gender[] = ['male', 'female', 'other', 'unknown'];
      genders.forEach(gender => {
        expect(['male', 'female', 'other', 'unknown']).toContain(gender);
      });
    });

    it('should support blood types', () => {
      const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      bloodTypes.forEach(bloodType => {
        expect(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).toContain(bloodType);
      });
    });
  });

  describe('Vital Signs', () => {
    it('should create valid vital signs', () => {
      const vitals: VitalSigns = {
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          unit: 'mmHg'
        },
        heartRate: {
          value: 72,
          unit: 'bpm'
        },
        temperature: {
          value: 36.5,
          unit: 'celsius'
        },
        respiratoryRate: {
          value: 16,
          unit: 'breaths/min'
        },
        oxygenSaturation: {
          value: 98,
          unit: '%'
        },
        recordedAt: createISODateTime('2024-03-15T10:00:00Z')
      };

      expect(vitals.bloodPressure.systolic).toBe(120);
      expect(vitals.heartRate.value).toBe(72);
      expect(vitals.temperature.unit).toBe('celsius');
    });

    it('should create vital signs history', () => {
      const baseline: VitalSigns = {
        bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' },
        heartRate: { value: 72, unit: 'bpm' },
        temperature: { value: 36.5, unit: 'celsius' },
        respiratoryRate: { value: 16, unit: 'breaths/min' },
        oxygenSaturation: { value: 98, unit: '%' },
        recordedAt: createISODateTime('2024-03-15T10:00:00Z')
      };

      const vitalHistory: VitalSignsHistory = {
        baseline,
        trend: 'stable',
        criticalValues: {
          isHypotensive: false,
          isHypertensive: false,
          isTachycardic: false,
          isBradycardic: false,
          isFebrile: false,
          isHypoxic: false
        }
      };

      expect(vitalHistory.trend).toBe('stable');
      expect(vitalHistory.criticalValues.isHypertensive).toBe(false);
    });
  });

  describe('Allergies', () => {
    it('should create allergy record', () => {
      const allergy: Allergy = {
        allergen: 'ペニシリン',
        type: 'medication',
        reaction: 'anaphylaxis',
        severity: 'severe',
        onsetDate: createISODate('2020-01-15'),
        notes: '投与後15分で症状出現'
      };

      expect(allergy.allergen).toBe('ペニシリン');
      expect(allergy.type).toBe('medication');
      expect(allergy.reaction).toBe('anaphylaxis');
      expect(allergy.severity).toBe('severe');
    });

    it('should support allergy types', () => {
      const types: AllergyType[] = ['medication', 'food', 'environmental', 'other'];
      types.forEach(type => {
        expect(['medication', 'food', 'environmental', 'other']).toContain(type);
      });
    });

    it('should support allergy reactions', () => {
      const reactions: AllergyReaction[] = ['anaphylaxis', 'angioedema', 'rash', 'urticaria', 'respiratory', 'gastrointestinal', 'other'];
      reactions.forEach(reaction => {
        expect(['anaphylaxis', 'angioedema', 'rash', 'urticaria', 'respiratory', 'gastrointestinal', 'other']).toContain(reaction);
      });
    });
  });

  describe('Medications', () => {
    it('should create current medication record', () => {
      const medication: CurrentMedication = {
        name: 'アムロジピン',
        genericName: 'amlodipine',
        dosage: 5,
        unit: 'mg',
        frequency: 'once_daily',
        route: '経口',
        startDate: createISODate('2023-06-01'),
        prescribedFor: '高血圧症',
        prescribedBy: createProviderId('dr-001')
      };

      expect(medication.name).toBe('アムロジピン');
      expect(medication.dosage).toBe(5);
      expect(medication.unit).toBe('mg');
      expect(medication.frequency).toBe('once_daily');
    });

    it('should support medication units', () => {
      const units: MedicationUnit[] = ['mg', 'g', 'mcg', 'ml', 'units', 'tablets', 'capsules'];
      units.forEach(unit => {
        expect(['mg', 'g', 'mcg', 'ml', 'units', 'tablets', 'capsules']).toContain(unit);
      });
    });

    it('should support medication frequencies', () => {
      const frequencies: MedicationFrequency[] = ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'every_8_hours', 'every_12_hours'];
      frequencies.forEach(frequency => {
        expect(['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'every_8_hours', 'every_12_hours']).toContain(frequency);
      });
    });
  });

  describe('Patient Persona', () => {
    it('should create complete patient persona', () => {
      const patientId = createPatientId('patient-001');
      const scenarioId = createScenarioId('scenario-001');

      const persona: PatientPersona = {
        id: patientId,
        scenarioId: scenarioId,
        demographics: {
          firstName: '太郎',
          lastName: '山田',
          dateOfBirth: createISODate('1980-05-15'),
          gender: 'male',
          bloodType: 'A+',
          phoneNumber: '090-1234-5678',
          email: 'taro.yamada@example.com'
        },
        chiefComplaint: '胸痛と息切れ',
        presentIllness: '2日前から労作時の胸痛あり。本日朝から安静時にも症状出現。',
        medicalHistory: {
          surgicalHistory: [],
          familyHistory: [
            { relation: '父', condition: '心筋梗塞', ageAtDiagnosis: 55 }
          ],
          pastIllnesses: [
            { condition: '高血圧症', diagnosedDate: createISODate('2020-01-01'), status: 'ongoing' }
          ],
          hospitalizations: []
        },
        currentConditions: [],
        medications: [],
        allergies: [],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 140, diastolic: 90, unit: 'mmHg' },
            heartRate: { value: 88, unit: 'bpm' },
            temperature: { value: 36.8, unit: 'celsius' },
            respiratoryRate: { value: 20, unit: 'breaths/min' },
            oxygenSaturation: { value: 96, unit: '%' },
            recordedAt: createISODateTime('2024-03-15T09:00:00Z')
          },
          trend: 'worsening',
          criticalValues: {
            isHypotensive: false,
            isHypertensive: true,
            isTachycardic: false,
            isBradycardic: false,
            isFebrile: false,
            isHypoxic: false
          }
        },
        socialHistory: {
          smoking: { status: 'former', packsPerDay: 1, yearsSmoking: 20, quitDate: createISODate('2022-01-01') },
          alcohol: { status: 'occasional', drinksPerWeek: 2 },
          occupation: 'オフィスワーカー',
          exercise: { frequency: 'sedentary', minutesPerWeek: 0 }
        },
        insurance: {
          provider: '国民健康保険',
          policyNumber: '1234567890',
          validUntil: createISODate('2025-03-31')
        }
      };

      expect(persona.id).toBe(patientId);
      expect(persona.demographics.firstName).toBe('太郎');
      expect(persona.chiefComplaint).toBe('胸痛と息切れ');
      expect(persona.vitalSigns.baseline.bloodPressure.systolic).toBe(140);
      expect(persona.vitalSigns.trend).toBe('worsening');
      expect(persona.socialHistory?.smoking?.status).toBe('former');
    });
  });
});