import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePatientAction } from '../generate-patient';

// Fetch APIをモック
global.fetch = vi.fn();

// retry-logicをモック
vi.mock('@/lib/retry-logic', () => ({
  callOpenAIWithRetry: vi.fn(),
}));

describe('generatePatientAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined as a function', () => {
    expect(generatePatientAction).toBeDefined();
    expect(typeof generatePatientAction).toBe('function');
  });

  it('should return error when department is missing', async () => {
    const formData = new FormData();
    formData.append('difficulty', 'beginner');
    formData.append('mode', 'outpatient');

    const result = await generatePatientAction({}, formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('department');
  });

  it('should return error when difficulty is missing', async () => {
    const formData = new FormData();
    formData.append('department', 'internal-medicine');
    formData.append('mode', 'outpatient');

    const result = await generatePatientAction({}, formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('difficulty');
  });

  it('should successfully call API and return patient data', async () => {
    const { callOpenAIWithRetry } = await import('@/lib/retry-logic');
    
    const mockPatientResponse = {
      patient: {
        id: 'patient-123',
        scenarioId: 'scenario-456',
        demographics: { age: 45, gender: 'male' },
        chiefComplaint: 'Chest pain',
      },
      initialQuestionnaire: {},
      modelConfiguration: {},
    };

    // callOpenAIWithRetryが成功するようにモック
    vi.mocked(callOpenAIWithRetry).mockResolvedValueOnce(mockPatientResponse);

    const formData = new FormData();
    formData.append('department', 'internal-medicine');
    formData.append('difficulty', 'beginner');
    formData.append('mode', 'outpatient');

    const result = await generatePatientAction({}, formData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(callOpenAIWithRetry).toHaveBeenCalledWith(
      expect.any(Function),
      3,
      'generatePatientAction'
    );
  });

  it('should handle API error responses', async () => {
    const { callOpenAIWithRetry } = await import('@/lib/retry-logic');
    
    // callOpenAIWithRetryがエラーを投げるようにモック
    vi.mocked(callOpenAIWithRetry).mockRejectedValueOnce(
      new Error('API request failed: 500')
    );

    const formData = new FormData();
    formData.append('department', 'internal-medicine');
    formData.append('difficulty', 'beginner');
    formData.append('mode', 'outpatient');

    const result = await generatePatientAction({}, formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('API request failed: 500');
  });

  it('should handle network errors', async () => {
    const { callOpenAIWithRetry } = await import('@/lib/retry-logic');
    
    // callOpenAIWithRetryがネットワークエラーを投げるようにモック
    vi.mocked(callOpenAIWithRetry).mockRejectedValueOnce(
      new Error('Network error')
    );

    const formData = new FormData();
    formData.append('department', 'internal-medicine');
    formData.append('difficulty', 'beginner');
    formData.append('mode', 'outpatient');

    const result = await generatePatientAction({}, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should use retry logic for API calls', async () => {
    const { callOpenAIWithRetry } = await import('@/lib/retry-logic');
    
    const mockPatientResponse = {
      patient: {
        id: 'patient-123',
        scenarioId: 'scenario-456',
        demographics: { age: 45, gender: 'male' },
        chiefComplaint: 'Chest pain',
      },
      initialQuestionnaire: {},
      modelConfiguration: {},
    };

    // callOpenAIWithRetryが成功するようにモック
    vi.mocked(callOpenAIWithRetry).mockResolvedValueOnce(mockPatientResponse);

    const formData = new FormData();
    formData.append('department', 'internal-medicine');
    formData.append('difficulty', 'beginner');
    formData.append('mode', 'outpatient');

    const result = await generatePatientAction({}, formData);

    expect(result.success).toBe(true);
    // リトライロジックが呼ばれることを確認
    expect(callOpenAIWithRetry).toHaveBeenCalledWith(
      expect.any(Function),
      3,
      'generatePatientAction'
    );
  });
});