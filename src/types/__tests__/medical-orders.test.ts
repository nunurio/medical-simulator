import { describe, it, expect } from 'vitest';
import type {
  MedicalOrder,
  Prescription,
  LabOrder,
  ImagingOrder,
  ReferralOrder,
  TherapyOrder,
  OrderStatus,
  OrderPriority,
  MedicationDetails,
  Dosage,
  DosageFrequency,
  TreatmentDuration,
  LabTest,
  LabTestCategory,
  SpecimenType,
  ImagingType,
  ImagingModality,
  ReferralReason,
  TherapyType
} from '../medical-orders';
import type { PatientId, OrderId, ProviderId, ISODateTime } from '../core';
import { createPatientId, createOrderId, createProviderId, createISODateTime } from '../core';

describe('Medical Orders Types', () => {
  describe('Prescription Orders', () => {
    it('should create prescription order', () => {
      const prescription: Prescription = {
        id: createOrderId('order-001'),
        orderType: 'prescription',
        patientId: createPatientId('patient-001'),
        orderedBy: createProviderId('dr-001'),
        orderedAt: createISODateTime('2024-03-15T10:00:00Z'),
        status: 'active',
        priority: 'routine',
        medication: {
          name: 'アムロジピン',
          genericName: 'amlodipine',
          strength: '5mg',
          form: 'tablet'
        },
        dosage: {
          amount: 1,
          unit: 'tablet'
        },
        frequency: 'once_daily',
        duration: {
          value: 30,
          unit: 'days'
        },
        refills: 3,
        substitutionAllowed: true,
        instructions: '朝食後に服用'
      };

      expect(prescription.orderType).toBe('prescription');
      expect(prescription.medication.name).toBe('アムロジピン');
      expect(prescription.dosage.amount).toBe(1);
      expect(prescription.frequency).toBe('once_daily');
      expect(prescription.refills).toBe(3);
    });

    it('should support dosage frequencies', () => {
      const frequencies: DosageFrequency[] = [
        'once_daily',
        'twice_daily',
        'three_times_daily',
        'four_times_daily',
        'every_8_hours',
        'every_12_hours',
        'as_needed',
        'before_meals',
        'after_meals',
        'at_bedtime'
      ];
      
      frequencies.forEach(freq => {
        expect([
          'once_daily',
          'twice_daily',
          'three_times_daily',
          'four_times_daily',
          'every_8_hours',
          'every_12_hours',
          'as_needed',
          'before_meals',
          'after_meals',
          'at_bedtime'
        ]).toContain(freq);
      });
    });
  });

  describe('Lab Orders', () => {
    it('should create lab order', () => {
      const labOrder: LabOrder = {
        id: createOrderId('order-002'),
        orderType: 'lab',
        patientId: createPatientId('patient-001'),
        orderedBy: createProviderId('dr-001'),
        orderedAt: createISODateTime('2024-03-15T10:00:00Z'),
        status: 'pending',
        priority: 'stat',
        tests: [
          {
            testCode: 'CBC',
            testName: '血算',
            category: 'hematology'
          },
          {
            testCode: 'CRP',
            testName: 'C反応性蛋白',
            category: 'chemistry'
          }
        ],
        fastingRequired: false,
        specimenType: 'blood',
        specialInstructions: '緊急で結果が必要'
      };

      expect(labOrder.orderType).toBe('lab');
      expect(labOrder.tests).toHaveLength(2);
      expect(labOrder.tests[0].testCode).toBe('CBC');
      expect(labOrder.priority).toBe('stat');
      expect(labOrder.specimenType).toBe('blood');
    });

    it('should support lab test categories', () => {
      const categories: LabTestCategory[] = [
        'hematology',
        'chemistry',
        'microbiology',
        'immunology',
        'pathology',
        'genetics'
      ];
      
      categories.forEach(cat => {
        expect([
          'hematology',
          'chemistry',
          'microbiology',
          'immunology',
          'pathology',
          'genetics'
        ]).toContain(cat);
      });
    });

    it('should support specimen types', () => {
      const specimens: SpecimenType[] = [
        'blood',
        'urine',
        'stool',
        'sputum',
        'csf',
        'tissue',
        'swab'
      ];
      
      specimens.forEach(spec => {
        expect([
          'blood',
          'urine',
          'stool',
          'sputum',
          'csf',
          'tissue',
          'swab'
        ]).toContain(spec);
      });
    });
  });

  describe('Imaging Orders', () => {
    it('should create imaging order', () => {
      const imagingOrder: ImagingOrder = {
        id: createOrderId('order-003'),
        orderType: 'imaging',
        patientId: createPatientId('patient-001'),
        orderedBy: createProviderId('dr-001'),
        orderedAt: createISODateTime('2024-03-15T10:00:00Z'),
        status: 'scheduled',
        priority: 'urgent',
        imagingType: 'ct',
        modality: 'contrast',
        bodyPart: 'chest',
        indication: '胸痛の精査',
        clinicalHistory: '2日前から労作時胸痛',
        contrast: {
          required: true,
          type: 'iodine',
          allergies: false
        }
      };

      expect(imagingOrder.orderType).toBe('imaging');
      expect(imagingOrder.imagingType).toBe('ct');
      expect(imagingOrder.modality).toBe('contrast');
      expect(imagingOrder.bodyPart).toBe('chest');
      expect(imagingOrder.contrast?.required).toBe(true);
    });

    it('should support imaging types', () => {
      const types: ImagingType[] = ['xray', 'ct', 'mri', 'ultrasound', 'pet', 'nuclear'];
      types.forEach(type => {
        expect(['xray', 'ct', 'mri', 'ultrasound', 'pet', 'nuclear']).toContain(type);
      });
    });

    it('should support imaging modalities', () => {
      const modalities: ImagingModality[] = ['plain', 'contrast', 'doppler', 'functional'];
      modalities.forEach(mod => {
        expect(['plain', 'contrast', 'doppler', 'functional']).toContain(mod);
      });
    });
  });

  describe('Referral Orders', () => {
    it('should create referral order', () => {
      const referralOrder: ReferralOrder = {
        id: createOrderId('order-004'),
        orderType: 'referral',
        patientId: createPatientId('patient-001'),
        orderedBy: createProviderId('dr-001'),
        orderedAt: createISODateTime('2024-03-15T10:00:00Z'),
        status: 'pending',
        priority: 'routine',
        specialty: '循環器内科',
        reason: 'evaluation',
        clinicalSummary: '労作時胸痛の精査をお願いします',
        urgency: '2週間以内',
        preferredProvider: '山田心臓クリニック'
      };

      expect(referralOrder.orderType).toBe('referral');
      expect(referralOrder.specialty).toBe('循環器内科');
      expect(referralOrder.reason).toBe('evaluation');
      expect(referralOrder.urgency).toBe('2週間以内');
    });

    it('should support referral reasons', () => {
      const reasons: ReferralReason[] = ['evaluation', 'treatment', 'consultation', 'second_opinion'];
      reasons.forEach(reason => {
        expect(['evaluation', 'treatment', 'consultation', 'second_opinion']).toContain(reason);
      });
    });
  });

  describe('Therapy Orders', () => {
    it('should create therapy order', () => {
      const therapyOrder: TherapyOrder = {
        id: createOrderId('order-005'),
        orderType: 'therapy',
        patientId: createPatientId('patient-001'),
        orderedBy: createProviderId('dr-001'),
        orderedAt: createISODateTime('2024-03-15T10:00:00Z'),
        status: 'active',
        priority: 'routine',
        therapyType: 'physical',
        frequency: '週3回',
        duration: {
          value: 4,
          unit: 'weeks'
        },
        goals: ['歩行能力の改善', '筋力強化'],
        precautions: '心疾患あり、運動強度に注意'
      };

      expect(therapyOrder.orderType).toBe('therapy');
      expect(therapyOrder.therapyType).toBe('physical');
      expect(therapyOrder.goals).toContain('歩行能力の改善');
      expect(therapyOrder.duration.value).toBe(4);
    });

    it('should support therapy types', () => {
      const types: TherapyType[] = ['physical', 'occupational', 'speech', 'respiratory', 'cardiac'];
      types.forEach(type => {
        expect(['physical', 'occupational', 'speech', 'respiratory', 'cardiac']).toContain(type);
      });
    });
  });

  describe('Order Management', () => {
    it('should support order statuses', () => {
      const statuses: OrderStatus[] = [
        'draft',
        'pending',
        'active',
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'on_hold',
        'expired'
      ];
      
      statuses.forEach(status => {
        expect([
          'draft',
          'pending',
          'active',
          'scheduled',
          'in_progress',
          'completed',
          'cancelled',
          'on_hold',
          'expired'
        ]).toContain(status);
      });
    });

    it('should support order priorities', () => {
      const priorities: OrderPriority[] = ['routine', 'urgent', 'stat', 'asap'];
      priorities.forEach(priority => {
        expect(['routine', 'urgent', 'stat', 'asap']).toContain(priority);
      });
    });
  });
});