import { describe, it, expect } from 'vitest';
import type { 
  PatientId, 
  EncounterId, 
  OrderId, 
  ProviderId,
  ScenarioId,
  ISODate, 
  ISODateTime
} from '../core';
import {
  createPatientId,
  createEncounterId,
  createOrderId,
  createProviderId,
  createScenarioId,
  createISODate,
  createISODateTime,
  isValidISODate,
  isValidISODateTime
} from '../core';

describe('Core Branded Types', () => {
  describe('ID Types', () => {
    it('should create branded PatientId', () => {
      const id = createPatientId('patient-123');
      expect(id).toBe('patient-123');
      
      // Type test - should compile
      const patientId: PatientId = id;
      expect(patientId).toBeDefined();
    });

    it('should create branded EncounterId', () => {
      const id = createEncounterId('encounter-456');
      expect(id).toBe('encounter-456');
      
      // Type test - should compile
      const encounterId: EncounterId = id;
      expect(encounterId).toBeDefined();
    });

    it('should create branded OrderId', () => {
      const id = createOrderId('order-789');
      expect(id).toBe('order-789');
      
      // Type test - should compile
      const orderId: OrderId = id;
      expect(orderId).toBeDefined();
    });

    it('should create branded ProviderId', () => {
      const id = createProviderId('provider-101');
      expect(id).toBe('provider-101');
      
      // Type test - should compile
      const providerId: ProviderId = id;
      expect(providerId).toBeDefined();
    });

    it('should create branded ScenarioId', () => {
      const id = createScenarioId('scenario-202');
      expect(id).toBe('scenario-202');
      
      // Type test - should compile
      const scenarioId: ScenarioId = id;
      expect(scenarioId).toBeDefined();
    });
  });

  describe('Date/Time Types', () => {
    it('should create branded ISODate with valid format', () => {
      const date = createISODate('2024-03-15');
      expect(date).toBe('2024-03-15');
      
      // Type test - should compile
      const isoDate: ISODate = date;
      expect(isoDate).toBeDefined();
    });

    it('should throw error for invalid ISODate format', () => {
      expect(() => createISODate('not-a-date')).toThrow('Invalid ISO date format');
      expect(() => createISODate('2024-13-01')).toThrow('Invalid ISO date format');
      expect(() => createISODate('2024-02-30')).toThrow('Invalid ISO date format');
    });

    it('should create branded ISODateTime with valid format', () => {
      const dateTime = createISODateTime('2024-03-15T10:30:00Z');
      expect(dateTime).toBe('2024-03-15T10:30:00Z');
      
      // Type test - should compile
      const isoDateTime: ISODateTime = dateTime;
      expect(isoDateTime).toBeDefined();
    });

    it('should throw error for invalid ISODateTime format', () => {
      expect(() => createISODateTime('not-a-datetime')).toThrow('Invalid ISO datetime format');
      expect(() => createISODateTime('2024-03-15T25:00:00Z')).toThrow('Invalid ISO datetime format');
    });

    it('should validate ISO date format', () => {
      expect(isValidISODate('2024-03-15')).toBe(true);
      expect(isValidISODate('2024-13-01')).toBe(false);
      expect(isValidISODate('2024-02-30')).toBe(false);
      expect(isValidISODate('not-a-date')).toBe(false);
    });

    it('should validate ISO datetime format', () => {
      expect(isValidISODateTime('2024-03-15T10:30:00Z')).toBe(true);
      expect(isValidISODateTime('2024-03-15T10:30:00+09:00')).toBe(true);
      expect(isValidISODateTime('2024-03-15T25:00:00Z')).toBe(false);
      expect(isValidISODateTime('not-a-datetime')).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type distinction between branded types', () => {
      const patientId = createPatientId('id-123');
      const orderId = createOrderId('id-123');
      
      // Even though the underlying values are the same, they should be different types
      expect(patientId).toBe('id-123');
      expect(orderId).toBe('id-123');
      
      // This test verifies that TypeScript treats them as different types
      // (This is a compile-time check, runtime values will be the same)
    });
  });
});