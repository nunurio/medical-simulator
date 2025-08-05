/**
 * Patient API Service のテスト
 * t-wada式TDD - Red フェーズ: まず失敗するテストを書く
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadPatientData } from '../patient-api';
import { createPatientId } from '../../types/core';

describe('Patient API Service', () => {
  describe('loadPatientData', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      vi.clearAllMocks();
      originalEnv = process.env.NEXT_PUBLIC_USE_MOCKS;
    });

    afterEach(() => {
      // 環境変数を元に戻す
      if (originalEnv === undefined) {
        delete process.env.NEXT_PUBLIC_USE_MOCKS;
      } else {
        process.env.NEXT_PUBLIC_USE_MOCKS = originalEnv;
      }
    });

    it('should load patient data successfully with valid PatientId', async () => {
      // Arrange（準備）
      const patientId = createPatientId('550e8400-e29b-41d4-a716-446655440001');
      
      // Act（実行）
      const result = await loadPatientData(patientId);
      
      // Assert（検証）
      expect(result).toBeDefined();
      expect(result.id).toBe(patientId);
      expect(result.demographics).toBeDefined();
      expect(result.demographics.firstName).toEqual(expect.any(String));
      expect(result.demographics.lastName).toEqual(expect.any(String));
      expect(result.vitalSigns).toBeDefined();
      expect(result.medicalHistory).toBeDefined();
    });

    it('should return PatientPersona type that matches the interface', async () => {
      // Arrange
      const patientId = createPatientId('550e8400-e29b-41d4-a716-446655440001');
      
      // Act
      const result = await loadPatientData(patientId);
      
      // Assert - PatientPersona型の必須フィールドを確認
      expect(result).toMatchObject({
        id: expect.any(String),
        scenarioId: expect.any(String),
        demographics: expect.objectContaining({
          firstName: expect.any(String),
          lastName: expect.any(String),
          dateOfBirth: expect.any(String),
          gender: expect.any(String),
          bloodType: expect.any(String),
        }),
        chiefComplaint: expect.any(String),
        presentIllness: expect.any(String),
        medicalHistory: expect.any(Object),
        currentConditions: expect.any(Array),
        medications: expect.any(Array),
        allergies: expect.any(Array),
        vitalSigns: expect.any(Object),
        socialHistory: expect.any(Object),
        insurance: expect.any(Object),
      });
    });

    describe('API mode switching', () => {
      it('should use mock data when NEXT_PUBLIC_USE_MOCKS is true', async () => {
        // Arrange
        process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
        const patientId = createPatientId('550e8400-e29b-41d4-a716-446655440001');
        
        // Act
        const result = await loadPatientData(patientId);
        
        // Assert - モックデータの特定の値をチェック
        expect(result.demographics.firstName).toBe('太郎');
        expect(result.demographics.lastName).toBe('田中');
      });

      it('should use real API when NEXT_PUBLIC_USE_MOCKS is false', async () => {
        // Arrange
        process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
        const patientId = createPatientId('550e8400-e29b-41d4-a716-446655440002');
        
        // Mock fetch for real API
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: patientId,
            scenarioId: 'real-scenario-001',
            demographics: {
              firstName: 'John',
              lastName: 'Doe',
              dateOfBirth: '1980-01-01',
              gender: 'male',
              bloodType: 'O+',
            },
            chiefComplaint: 'Real API chest pain',
            presentIllness: 'Real API present illness',
            medicalHistory: { surgicalHistory: [], familyHistory: [], pastIllnesses: [], hospitalizations: [] },
            currentConditions: [],
            medications: [],
            allergies: [],
            vitalSigns: {
              baseline: {
                bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' },
                heartRate: { value: 70, unit: 'bpm' },
                temperature: { value: 36.5, unit: 'celsius' },
                respiratoryRate: { value: 16, unit: 'breaths/min' },
                oxygenSaturation: { value: 98, unit: '%' },
                recordedAt: '2025-01-01T10:00:00Z',
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
            socialHistory: {},
            insurance: { provider: 'Real Insurance', policyNumber: 'RI-123456', validUntil: '2025-12-31' },
          }),
        });
        
        // Act
        const result = await loadPatientData(patientId);
        
        // Assert - 実APIから返されるデータをチェック
        expect(result.demographics.firstName).toBe('John');
        expect(result.demographics.lastName).toBe('Doe');
        expect(result.chiefComplaint).toBe('Real API chest pain');
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/patients/${patientId}`),
          expect.any(Object)
        );
      });

      it('should default to mock mode when NEXT_PUBLIC_USE_MOCKS is undefined', async () => {
        // Arrange
        delete process.env.NEXT_PUBLIC_USE_MOCKS;
        const patientId = createPatientId('550e8400-e29b-41d4-a716-446655440001');
        
        // Act
        const result = await loadPatientData(patientId);
        
        // Assert - デフォルトでモックデータを使用
        expect(result.demographics.firstName).toBe('太郎');
        expect(result.demographics.lastName).toBe('田中');
      });
    });

    describe('Error handling and retry functionality', () => {
      it('should throw error when API returns 404', async () => {
        // Arrange
        process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
        const patientId = createPatientId('non-existent-patient-id');
        
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });
        
        // Act & Assert
        await expect(loadPatientData(patientId)).rejects.toThrow(
          'Failed to load patient data: 404 Not Found'
        );
      });

      it('should throw error when API returns 500', async () => {
        // Arrange
        process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
        const patientId = createPatientId('server-error-patient-id');
        
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });
        
        // Act & Assert
        await expect(loadPatientData(patientId)).rejects.toThrow(
          'Failed to load patient data: 500 Internal Server Error'
        );
      });

      it('should retry up to 3 times on network error', async () => {
        // Arrange
        process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
        const patientId = createPatientId('network-error-patient-id');
        
        global.fetch = vi.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              id: patientId,
              scenarioId: 'retry-scenario-001',
              demographics: {
                firstName: 'Retry',
                lastName: 'Success',
                dateOfBirth: '1990-01-01',
                gender: 'male',
                bloodType: 'B+',
              },
              chiefComplaint: 'Successfully retrieved after retry',
              presentIllness: 'Retry test present illness',
              medicalHistory: { surgicalHistory: [], familyHistory: [], pastIllnesses: [], hospitalizations: [] },
              currentConditions: [],
              medications: [],
              allergies: [],
              vitalSigns: {
                baseline: {
                  bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' },
                  heartRate: { value: 70, unit: 'bpm' },
                  temperature: { value: 36.5, unit: 'celsius' },
                  respiratoryRate: { value: 16, unit: 'breaths/min' },
                  oxygenSaturation: { value: 98, unit: '%' },
                  recordedAt: '2025-01-01T10:00:00Z',
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
              socialHistory: {},
              insurance: { provider: 'Retry Insurance', policyNumber: 'RT-123456', validUntil: '2025-12-31' },
            }),
          });
        
        // Act
        const result = await loadPatientData(patientId);
        
        // Assert
        expect(result.demographics.firstName).toBe('Retry');
        expect(result.demographics.lastName).toBe('Success');
        expect(result.chiefComplaint).toBe('Successfully retrieved after retry');
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });

      it('should throw error after maximum retry attempts', async () => {
        // Arrange
        process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
        const patientId = createPatientId('persistent-error-patient-id');
        
        global.fetch = vi.fn()
          .mockRejectedValue(new Error('Persistent network error'));
        
        // Act & Assert
        await expect(loadPatientData(patientId)).rejects.toThrow(
          'Failed to load patient data after 3 attempts: Persistent network error'
        );
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });

      it('should validate response data structure', async () => {
        // Arrange
        process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
        const patientId = createPatientId('invalid-response-patient-id');
        
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            // 不完全なレスポンスデータ
            id: patientId,
            demographics: {
              firstName: 'Invalid',
              // 必須フィールドが不足
            },
          }),
        });
        
        // Act & Assert
        await expect(loadPatientData(patientId)).rejects.toThrow(
          'Invalid patient data structure received from API'
        );
      });
    });
  });
});