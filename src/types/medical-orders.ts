/**
 * Medical order type definitions for the medical simulator application.
 */

import type { PatientId, OrderId, ProviderId, ISODateTime } from './core';

// Base order interface
interface BaseOrder {
  readonly id: OrderId;
  readonly patientId: PatientId;
  readonly orderedBy: ProviderId;
  readonly orderedAt: ISODateTime;
  readonly status: OrderStatus;
  readonly priority: OrderPriority;
  readonly notes?: string;
}

// Order status types
export type OrderStatus = 
  | 'draft'
  | 'pending'
  | 'active'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold'
  | 'expired';

// Order priority types
export type OrderPriority = 'routine' | 'urgent' | 'stat' | 'asap';

// Medical order discriminated union
export type MedicalOrder = 
  | Prescription
  | LabOrder
  | ImagingOrder
  | ReferralOrder
  | TherapyOrder;

// Prescription order
export interface Prescription extends BaseOrder {
  orderType: 'prescription';
  medication: MedicationDetails;
  dosage: Dosage;
  frequency: DosageFrequency;
  duration: TreatmentDuration;
  refills: number;
  substitutionAllowed: boolean;
  instructions?: string;
}

export interface MedicationDetails {
  readonly name: string;
  readonly genericName?: string;
  readonly strength: string;
  readonly form: string;
}

export interface Dosage {
  readonly amount: number;
  readonly unit: string;
}

export type DosageFrequency = 
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'every_8_hours'
  | 'every_12_hours'
  | 'as_needed'
  | 'before_meals'
  | 'after_meals'
  | 'at_bedtime';

export interface TreatmentDuration {
  readonly value: number;
  readonly unit: 'days' | 'weeks' | 'months';
}

// Lab order
export interface LabOrder extends BaseOrder {
  orderType: 'lab';
  tests: LabTest[];
  fastingRequired: boolean;
  specimenType: SpecimenType;
  specialInstructions?: string;
}

export interface LabTest {
  readonly testCode: string;
  readonly testName: string;
  readonly category: LabTestCategory;
}

export type LabTestCategory = 
  | 'hematology'
  | 'chemistry'
  | 'microbiology'
  | 'immunology'
  | 'pathology'
  | 'genetics';

export type SpecimenType = 
  | 'blood'
  | 'urine'
  | 'stool'
  | 'sputum'
  | 'csf'
  | 'tissue'
  | 'swab';

// Imaging order
export interface ImagingOrder extends BaseOrder {
  orderType: 'imaging';
  imagingType: ImagingType;
  modality: ImagingModality;
  bodyPart: string;
  indication: string;
  clinicalHistory?: string;
  contrast?: ContrastInfo;
}

export type ImagingType = 'xray' | 'ct' | 'mri' | 'ultrasound' | 'pet' | 'nuclear';
export type ImagingModality = 'plain' | 'contrast' | 'doppler' | 'functional';

export interface ContrastInfo {
  readonly required: boolean;
  readonly type?: string;
  readonly allergies?: boolean;
}

// Referral order
export interface ReferralOrder extends BaseOrder {
  orderType: 'referral';
  specialty: string;
  reason: ReferralReason;
  clinicalSummary: string;
  urgency?: string;
  preferredProvider?: string;
}

export type ReferralReason = 'evaluation' | 'treatment' | 'consultation' | 'second_opinion';

// Therapy order
export interface TherapyOrder extends BaseOrder {
  orderType: 'therapy';
  therapyType: TherapyType;
  frequency: string;
  duration: TreatmentDuration;
  goals: string[];
  precautions?: string;
}

export type TherapyType = 'physical' | 'occupational' | 'speech' | 'respiratory' | 'cardiac';