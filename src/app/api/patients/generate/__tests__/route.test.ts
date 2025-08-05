import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { PatientPersonaGenerator } from '../../../../../services/patient-persona-generator';
import type { PatientPersona } from '../../../../../types/patient';
import { createPatientId, createScenarioId } from '../../../../../types/core';

// PatientPersonaGeneratorをモック
vi.mock('../../../../../services/patient-persona-generator');
const mockPatientPersonaGenerator = vi.mocked(PatientPersonaGenerator);

describe('/api/patients/generate POST', () => {
  let mockGeneratorInstance: { generatePersona: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // PatientPersonaGeneratorのインスタンスをモック
    mockGeneratorInstance = {
      generatePersona: vi.fn(),
    };
    mockPatientPersonaGenerator.mockImplementation(() => mockGeneratorInstance);
  });

  it('有効なリクエストで患者ペルソナを生成し、適切なレスポンスを返す', async () => {
    // Arrange: モックの患者ペルソナ
    const mockPatientPersona: PatientPersona = {
      id: createPatientId(''),
      scenarioId: createScenarioId(''),
      demographics: {
        firstName: '太郎',
        lastName: '田中',
        dateOfBirth: '1979-01-15' as import('@/types/core').ISODate,
        gender: 'male' as const,
        bloodType: 'A+' as import('@/types/patient').BloodType,
      },
      chiefComplaint: '胸痛',
      presentIllness: '2時間前から続く胸部圧迫感',
      medicalHistory: {
        surgicalHistory: [],
        pastIllnesses: [],
        hospitalizations: [],
        familyHistory: [],
      },
      currentConditions: [],
      medications: [],
      allergies: [],
      vitalSigns: {
        baseline: {
          bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' as const },
          heartRate: { value: 72, unit: 'bpm' as const },
          temperature: { value: 36.5, unit: 'celsius' as const },
          respiratoryRate: { value: 16, unit: 'breaths/min' as const },
          oxygenSaturation: { value: 98, unit: '%' as const },
          recordedAt: new Date().toISOString() as import('@/types/core').ISODateTime,
        },
        trend: 'stable' as const,
        criticalValues: {
          isHypotensive: false,
          isHypertensive: false,
          isTachycardic: false,
          isBradycardic: false,
          isFebrile: false,
          isHypoxic: false,
        }
      },
      socialHistory: {},
      insurance: {
        provider: 'Health Insurance Co.',
        policyNumber: 'HIC123456',
        validUntil: '2024-12-31' as import('@/types/core').ISODate,
      },
    };

    mockGeneratorInstance.generatePersona.mockResolvedValue(mockPatientPersona);

    // Act: リクエストを作成してPOSTを呼び出す
    const request = new NextRequest('http://localhost:3000/api/patients/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        specialty: 'cardiology',
        difficulty: 'intermediate',
        mode: 'outpatient',
      }),
    });

    const response = await POST(request);

    // Assert: レスポンスの確認
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toEqual({
      patient: mockPatientPersona,
      initialQuestionnaire: expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            text: expect.any(String),
            type: expect.any(String),
          }),
        ]),
      }),
      modelConfiguration: expect.objectContaining({
        temperature: expect.any(Number),
        maxTokens: expect.any(Number),
      }),
    });

    // PatientPersonaGeneratorが正しく呼び出されたことを確認
    expect(mockGeneratorInstance.generatePersona).toHaveBeenCalledWith({
      specialty: 'cardiology',
      difficulty: 'intermediate',
      mode: 'outpatient',
    });
  });

  it('無効なリクエストボディで400エラーを返す', async () => {
    // Act: 無効なリクエストボディでPOSTを呼び出す
    const request = new NextRequest('http://localhost:3000/api/patients/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        specialty: 'invalid_specialty', // 無効な診療科
        difficulty: 'invalid', // 無効な難易度
        mode: 'invalid_mode', // 無効なモード
      }),
    });

    const response = await POST(request);

    // Assert: バリデーションエラーが返される
    expect(response.status).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toEqual({
      error: 'Validation failed',
      details: expect.any(Array),
    });
  });

  it('必須フィールドが欠けている場合に400エラーを返す', async () => {
    // Act: 必須フィールドが欠けているリクエスト
    const request = new NextRequest('http://localhost:3000/api/patients/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // specialty が欠けている
        difficulty: 'beginner',
        // mode が欠けている
      }),
    });

    const response = await POST(request);

    // Assert: バリデーションエラーが返される
    expect(response.status).toBe(400);
    
    const responseData = await response.json();
    expect(responseData.error).toBe('Validation failed');
    expect(responseData.details).toEqual(expect.any(Array));
    expect(responseData.details.length).toBeGreaterThan(0);
  });

  it('PatientPersonaGeneratorでエラーが発生した場合に500エラーを返す', async () => {
    // Arrange: PatientPersonaGeneratorがエラーを投げる
    mockGeneratorInstance.generatePersona.mockRejectedValue(new Error('LLM service error'));

    // Act: 有効なリクエストでPOSTを呼び出す
    const request = new NextRequest('http://localhost:3000/api/patients/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        specialty: 'cardiology',
        difficulty: 'beginner',
        mode: 'outpatient',
      }),
    });

    const response = await POST(request);

    // Assert: サーバーエラーが返される
    expect(response.status).toBe(500);
    
    const responseData = await response.json();
    expect(responseData).toEqual({
      error: 'Failed to generate patient persona',
      message: 'LLM service error',
    });
  });

  it('JSON形式でないリクエストボディで400エラーを返す', async () => {
    // Act: JSON形式でないリクエストボディ
    const request = new NextRequest('http://localhost:3000/api/patients/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    const response = await POST(request);

    // Assert: JSONパースエラーが返される
    expect(response.status).toBe(400);
    
    const responseData = await response.json();
    expect(responseData.error).toContain('Invalid JSON');
  });
});