/**
 * Core branded types for the medical simulator application.
 * Branded types provide compile-time type safety for string identifiers.
 */

// Branded type utility
export type Branded<T, Brand extends string> = T & { __brand: Brand };

// Core ID types
export type PatientId = Branded<string, "PatientId">;
export type EncounterId = Branded<string, "EncounterId">;
export type OrderId = Branded<string, "OrderId">;
export type ProviderId = Branded<string, "ProviderId">;
export type ScenarioId = Branded<string, "ScenarioId">;

// Date/Time types
export type ISODate = Branded<string, "ISODate">;
export type ISODateTime = Branded<string, "ISODateTime">;

// Factory functions for creating branded types
export const createPatientId = (id: string): PatientId => id as PatientId;
export const createEncounterId = (id: string): EncounterId => id as EncounterId;
export const createOrderId = (id: string): OrderId => id as OrderId;
export const createProviderId = (id: string): ProviderId => id as ProviderId;
export const createScenarioId = (id: string): ScenarioId => id as ScenarioId;

/**
 * Creates a branded ISODate type with validation
 * @param date - Date string in YYYY-MM-DD format
 * @throws {Error} If date format is invalid
 */
export const createISODate = (date: string): ISODate => {
  if (!isValidISODate(date)) {
    throw new Error(`Invalid ISO date format: ${date}. Expected format: YYYY-MM-DD`);
  }
  return date as ISODate;
};

/**
 * Creates a branded ISODateTime type with validation
 * @param dateTime - DateTime string in ISO 8601 format
 * @throws {Error} If datetime format is invalid
 */
export const createISODateTime = (dateTime: string): ISODateTime => {
  if (!isValidISODateTime(dateTime)) {
    throw new Error(`Invalid ISO datetime format: ${dateTime}. Expected ISO 8601 format`);
  }
  return dateTime as ISODateTime;
};

/**
 * Validates ISO date format (YYYY-MM-DD)
 */
export const isValidISODate = (date: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  
  const dateObj = new Date(date);
  const [year, month, day] = date.split('-').map(Number);
  
  return dateObj.getFullYear() === year &&
         dateObj.getMonth() === month - 1 &&
         dateObj.getDate() === day;
};

/**
 * Validates ISO datetime format (ISO 8601)
 */
export const isValidISODateTime = (dateTime: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
  if (!regex.test(dateTime)) return false;
  
  const dateObj = new Date(dateTime);
  return !isNaN(dateObj.getTime());
};

// Utility types
export type Optional<T> = T | null | undefined;
export type NonOptional<T> = T extends null | undefined ? never : T;