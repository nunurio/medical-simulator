import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { PatientPersonaGenerator } from '../../../../../services/patient-persona-generator';
import type { PatientPersona, Gender } from '../../../../../types/patient';
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
        age: 45,
        gender: 'male' as const,
        name: '田中太郎',
        bloodType: 'A',
        patientId: createPatientId(''),
      },
      chiefComplaint: '胸痛',
      presentIllness: '2時間前から続く胸部圧迫感',
      medicalHistory: {
        chiefComplaint: '胸痛',
        currentConditions: [],
        pastIllnesses: [],
        surgeries: [],
        hospitalizations: [],
        allergies: [],
        currentMedications: [],
        familyHistory: [],
        socialHistory: {
          smokingHistory: { status: 'former', packsPerDay: 1, years: 20 },
          alcoholHistory: { frequency: 'occasional', amount: 2, type: 'beer' },
          exerciseHistory: { frequency: 'rarely', type: '', duration: 0 },
        },
      },
      currentConditions: [],
      medications: [],
      allergies: [],
      vitalSigns: {
        current: {
          temperature: { value: 36.8, unit: 'celsius', timestamp: new Date().toISOString() },
          bloodPressure: { systolic: 140, diastolic: 90, timestamp: new Date().toISOString() },
          heartRate: { value: 88, rhythm: 'regular', timestamp: new Date().toISOString() },
          respiratoryRate: { value: 18, pattern: 'regular', timestamp: new Date().toISOString() },
          oxygenSaturation: { value: 97, onRoomAir: true, timestamp: new Date().toISOString() },
        },
        history: [],
      },
      socialHistory: {
        smokingHistory: { status: 'former', packsPerDay: 1, years: 20 },
        alcoholHistory: { frequency: 'occasional', amount: 2, type: 'beer' },
        exerciseHistory: { frequency: 'rarely', type: '', duration: 0 },
      },
      insurance: {
        provider: 'Health Insurance Co.',
        policyNumber: 'HIC123456',
        groupNumber: 'GRP789',
        effectiveDate: '2023-01-01T00:00:00.000Z',
        expirationDate: '2024-12-31T23:59:59.999Z',
      },
    };

    mockGeneratorInstance.generatePersona.mockResolvedValue(mockPatientPersona);

    // Act: リクエストを作成してPOSTを呼び出す
    const request = new Request('http://localhost:3000/api/patients/generate', {
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
    const request = new Request('http://localhost:3000/api/patients/generate', {
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
    const request = new Request('http://localhost:3000/api/patients/generate', {
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
    const request = new Request('http://localhost:3000/api/patients/generate', {
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
    const request = new Request('http://localhost:3000/api/patients/generate', {
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