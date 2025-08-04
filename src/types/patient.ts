/**
 * Patient-related type definitions for the medical simulator application.
 */

import type { PatientId, ScenarioId, ProviderId, ISODate, ISODateTime } from './core';

// Basic demographic types
export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface PatientDemographics {
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: ISODate;
  readonly gender: Gender;
  readonly bloodType: BloodType;
  readonly phoneNumber?: string;
  readonly email?: string;
  readonly emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  readonly name: string;
  readonly relationship: string;
  readonly phoneNumber: string;
}

// Vital signs types
export interface VitalSigns {
  readonly bloodPressure: BloodPressure;
  readonly heartRate: HeartRate;
  readonly temperature: Temperature;
  readonly respiratoryRate: RespiratoryRate;
  readonly oxygenSaturation: OxygenSaturation;
  readonly recordedAt: ISODateTime;
}

export interface BloodPressure {
  readonly systolic: number;
  readonly diastolic: number;
  readonly unit: 'mmHg';
}

export interface HeartRate {
  readonly value: number;
  readonly unit: 'bpm';
}

export interface Temperature {
  readonly value: number;
  readonly unit: 'celsius' | 'fahrenheit';
}

export interface RespiratoryRate {
  readonly value: number;
  readonly unit: 'breaths/min';
}

export interface OxygenSaturation {
  readonly value: number;
  readonly unit: '%';
}

export type VitalTrend = 'improving' | 'stable' | 'worsening';

export interface VitalSignsHistory {
  readonly baseline: VitalSigns;
  readonly trend: VitalTrend;
  readonly criticalValues: CriticalVitalSigns;
}

export interface CriticalVitalSigns {
  readonly isHypotensive: boolean;
  readonly isHypertensive: boolean;
  readonly isTachycardic: boolean;
  readonly isBradycardic: boolean;
  readonly isFebrile: boolean;
  readonly isHypoxic: boolean;
}

// Allergy types
export type AllergyType = 'medication' | 'food' | 'environmental' | 'other';
export type AllergyReaction = 'anaphylaxis' | 'angioedema' | 'rash' | 'urticaria' | 'respiratory' | 'gastrointestinal' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe';

export interface Allergy {
  readonly allergen: string;
  readonly type: AllergyType;
  readonly reaction: AllergyReaction;
  readonly severity: AllergySeverity;
  readonly onsetDate?: ISODate;
  readonly notes?: string;
}

// Medication types
export type MedicationUnit = 'mg' | 'g' | 'mcg' | 'ml' | 'units' | 'tablets' | 'capsules';
export type MedicationFrequency = 'once_daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'as_needed' | 'every_8_hours' | 'every_12_hours';

export interface CurrentMedication {
  readonly name: string;
  readonly genericName?: string;
  readonly dosage: number;
  readonly unit: MedicationUnit;
  readonly frequency: MedicationFrequency;
  readonly route: string;
  readonly startDate: ISODate;
  readonly endDate?: ISODate;
  readonly prescribedFor: string;
  readonly prescribedBy: ProviderId;
}

// Medical history types
export interface MedicalHistory {
  readonly surgicalHistory: Surgery[];
  readonly familyHistory: FamilyHistoryItem[];
  readonly pastIllnesses: PastIllness[];
  readonly hospitalizations: Hospitalization[];
}

export interface Surgery {
  readonly procedure: string;
  readonly date: ISODate;
  readonly hospital?: string;
  readonly complications?: string;
}

export interface FamilyHistoryItem {
  readonly relation: string;
  readonly condition: string;
  readonly ageAtDiagnosis?: number;
  readonly notes?: string;
}

export interface PastIllness {
  readonly condition: string;
  readonly diagnosedDate: ISODate;
  readonly status: 'resolved' | 'ongoing' | 'controlled';
  readonly treatment?: string;
}

export interface Hospitalization {
  readonly reason: string;
  readonly admissionDate: ISODate;
  readonly dischargeDate: ISODate;
  readonly hospital: string;
  readonly summary?: string;
}

// Current conditions
export interface Condition {
  readonly name: string;
  readonly icdCode?: string;
  readonly diagnosedDate: ISODate;
  readonly severity: 'mild' | 'moderate' | 'severe';
  readonly isActive: boolean;
}

// Social history types
export interface SocialHistory {
  readonly smoking?: SmokingHistory;
  readonly alcohol?: AlcoholHistory;
  readonly occupation?: string;
  readonly exercise?: ExerciseHistory;
}

export interface SmokingHistory {
  readonly status: 'never' | 'former' | 'current';
  readonly packsPerDay?: number;
  readonly yearsSmoking?: number;
  readonly quitDate?: ISODate;
}

export interface AlcoholHistory {
  readonly status: 'never' | 'former' | 'occasional' | 'regular';
  readonly drinksPerWeek?: number;
  readonly quitDate?: ISODate;
}

export interface ExerciseHistory {
  readonly frequency: 'sedentary' | 'light' | 'moderate' | 'active';
  readonly minutesPerWeek?: number;
  readonly types?: string[];
}

// Insurance information
export interface InsuranceInfo {
  readonly provider: string;
  readonly policyNumber: string;
  readonly validUntil: ISODate;
  readonly copayment?: number;
}

// Main patient persona type
export interface PatientPersona {
  readonly id: PatientId;
  readonly scenarioId: ScenarioId;
  readonly demographics: PatientDemographics;
  readonly chiefComplaint: string;
  readonly presentIllness: string;
  readonly medicalHistory: MedicalHistory;
  readonly currentConditions: Condition[];
  readonly medications: CurrentMedication[];
  readonly allergies: Allergy[];
  readonly vitalSigns: VitalSignsHistory;
  readonly socialHistory: SocialHistory;
  readonly insurance: InsuranceInfo;
}