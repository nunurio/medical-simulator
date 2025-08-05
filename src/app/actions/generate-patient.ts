'use server';

import { z } from 'zod';
import { Department, DifficultyLevel } from '@/types/state';
import { PatientPersona } from '@/types/patient';
import { callOpenAIWithRetry } from '@/lib/retry-logic';

export interface GeneratePatientActionParams {
  department: Department;
  difficulty: DifficultyLevel;
  mode: 'outpatient';
}

export interface GeneratePatientActionResult {
  success: boolean;
  data?: PatientPersona;
  error?: string;
}

const GeneratePatientSchema = z.object({
  department: z.string().min(1, 'Department is required'),
  difficulty: z.string().min(1, 'Difficulty is required'),
  mode: z.literal('outpatient'),
});

type ValidatedInput = z.infer<typeof GeneratePatientSchema>;

export async function generatePatientAction(
  prevState: GeneratePatientActionResult | undefined,
  formData: FormData
): Promise<GeneratePatientActionResult> {
  // バリデーション
  const rawData = {
    department: formData.get('department'),
    difficulty: formData.get('difficulty'),
    mode: formData.get('mode'),
  };

  const validationResult = GeneratePatientSchema.safeParse(rawData);

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.message,
    };
  }

  return await callPatientGenerationAPI(validationResult.data);
}

/**
 * API呼び出しを実行する関数（リトライロジック付き）
 */
async function callPatientGenerationAPI(
  params: ValidatedInput
): Promise<GeneratePatientActionResult> {
  const API_TIMEOUT = 30000; // 30秒タイムアウト
  const MAX_RETRIES = 3;
  
  try {
    const apiResponse = await callOpenAIWithRetry(
      async () => {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/patients/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            specialty: params.department,
            difficulty: params.difficulty,
            mode: params.mode,
          }),
          signal: AbortSignal.timeout(API_TIMEOUT),
        });

        if (!response.ok) {
          const errorMessage = await getErrorMessage(response);
          throw new Error(`API request failed (${response.status}): ${errorMessage}`);
        }

        return await response.json();
      },
      MAX_RETRIES,
      'generatePatientAction'
    );
    
    return {
      success: true,
      data: apiResponse.patient,
    };
  } catch (error) {
    const errorMessage = getFormattedErrorMessage(error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * APIベースURLを取得
 */
function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * レスポンスからエラーメッセージを取得
 */
async function getErrorMessage(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData.error || errorData.message || 'Unknown API error';
  } catch {
    return response.statusText || 'Unknown error';
  }
}

/**
 * エラーオブジェクトから適切なエラーメッセージを取得
 */
function getFormattedErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'Request timeout: The patient generation took too long. Please try again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred while generating patient data';
}