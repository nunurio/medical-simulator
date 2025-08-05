/**
 * Patient API Service
 * 患者データの取得とAPIとの通信を担当
 */

import type { PatientId } from '../types/core';
import type { PatientPersona } from '../types/patient';
import { createScenarioId, createISODate, createProviderId, createISODateTime } from '../types/core';
import { getConfig } from '../config/defaults';

/**
 * モックデータの取得
 */
async function loadPatientDataMock(id: PatientId): Promise<PatientPersona> {
  return {
    id,
    scenarioId: createScenarioId('scenario-001'),
    demographics: {
      firstName: '太郎',
      lastName: '田中',
      dateOfBirth: createISODate('1978-05-15'),
      gender: 'male',
      bloodType: 'A+',
      phoneNumber: '+81-90-1234-5678',
      email: 'tanaka.taro@example.com',
      emergencyContact: {
        name: '田中花子',
        relationship: '配偶者',
        phoneNumber: '+81-90-8765-4321',
      },
    },
    chiefComplaint: '胸の痛み',
    presentIllness: '3日前から続く胸痛、労作時に増強',
    medicalHistory: {
      surgicalHistory: [],
      familyHistory: [
        {
          relation: '父',
          condition: '心筋梗塞',
          ageAtDiagnosis: 65,
          notes: '60歳時に初回発症',
        },
      ],
      pastIllnesses: [
        {
          condition: '高血圧',
          diagnosedDate: createISODate('2018-03-15'),
          status: 'controlled',
          treatment: 'ACE阻害薬',
        },
      ],
      hospitalizations: [],
    },
    currentConditions: [
      {
        name: '高血圧',
        icdCode: 'I10',
        diagnosedDate: createISODate('2018-03-15'),
        severity: 'moderate',
        isActive: true,
      },
    ],
    medications: [
      {
        name: 'リシノプリル',
        genericName: 'Lisinopril',
        dosage: 10,
        unit: 'mg',
        frequency: 'once_daily',
        route: '経口',
        startDate: createISODate('2018-03-15'),
        prescribedFor: '高血圧',
        prescribedBy: createProviderId('provider-001'),
      },
    ],
    allergies: [
      {
        allergen: 'ペニシリン',
        type: 'medication',
        reaction: 'rash',
        severity: 'moderate',
        onsetDate: createISODate('2010-07-20'),
        notes: '皮疹が出現',
      },
    ],
    vitalSigns: {
      baseline: {
        bloodPressure: {
          systolic: 140,
          diastolic: 90,
          unit: 'mmHg',
        },
        heartRate: {
          value: 75,
          unit: 'bpm',
        },
        temperature: {
          value: 36.5,
          unit: 'celsius',
        },
        respiratoryRate: {
          value: 16,
          unit: 'breaths/min',
        },
        oxygenSaturation: {
          value: 98,
          unit: '%',
        },
        recordedAt: createISODateTime('2025-01-01T10:00:00Z'),
      },
      trend: 'stable',
      criticalValues: {
        isHypotensive: false,
        isHypertensive: true,
        isTachycardic: false,
        isBradycardic: false,
        isFebrile: false,
        isHypoxic: false,
      },
    },
    socialHistory: {
      smoking: {
        status: 'former',
        packsPerDay: 1,
        yearsSmoking: 20,
        quitDate: createISODate('2015-01-01'),
      },
      alcohol: {
        status: 'occasional',
        drinksPerWeek: 2,
      },
      occupation: 'サラリーマン',
      exercise: {
        frequency: 'light',
        minutesPerWeek: 90,
        types: ['ウォーキング'],
      },
    },
    insurance: {
      provider: '健康保険組合',
      policyNumber: 'HC-123456789',
      validUntil: createISODate('2025-12-31'),
      copayment: 3000,
    },
  };
}

/**
 * リトライ機能付きのfetch実行
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) {
        throw new Error(`Failed to load patient data after ${maxRetries} attempts: ${lastError.message}`);
      }
      
      // 指数バックオフで待機時間を増加
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // TypeScriptの型安全性のため（実際にはここに到達しない）
  throw lastError!;
}

/**
 * 患者データの基本バリデーション
 */
function validatePatientData(data: unknown): asserts data is PatientPersona {
  // 必須フィールドの存在チェック
  const requiredFields = [
    'id', 'scenarioId', 'demographics', 'chiefComplaint', 
    'presentIllness', 'medicalHistory', 'currentConditions', 
    'medications', 'allergies', 'vitalSigns', 'socialHistory', 'insurance'
  ];
  
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid patient data structure received from API');
  }
  
  const dataObj = data as Record<string, unknown>;
  
  for (const field of requiredFields) {
    if (!(field in dataObj) || dataObj[field] === null || dataObj[field] === undefined) {
      throw new Error('Invalid patient data structure received from API');
    }
  }
  
  // demographics内の必須フィールドチェック
  const requiredDemographics = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'bloodType'];
  const demographics = dataObj.demographics as Record<string, unknown>;
  
  if (typeof demographics !== 'object' || demographics === null) {
    throw new Error('Invalid patient data structure received from API');
  }
  
  for (const field of requiredDemographics) {
    if (!(field in demographics) || !demographics[field]) {
      throw new Error('Invalid patient data structure received from API');
    }
  }
}

/**
 * 実APIからのデータ取得
 */
async function loadPatientDataProd(id: PatientId): Promise<PatientPersona> {
  const config = getConfig();
  
  try {
    const response = await fetchWithRetry(`${config.api.baseUrl}/patients/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load patient data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // データ構造の検証
    validatePatientData(data);
    
    return data as PatientPersona;
  } catch (error) {
    // ネットワークエラーやバリデーションエラーをそのまま再スロー
    throw error;
  }
}

/**
 * 患者データを読み込む（動的モード切り替え対応）
 * @param id - PatientId ブランド型  
 * @returns Promise<PatientPersona> - 患者ペルソナデータ
 */
export async function loadPatientData(id: PatientId): Promise<PatientPersona> {
  // 実行時に環境変数をチェック（テスト時の動的切り替えに対応）
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';
  return useMocks ? loadPatientDataMock(id) : loadPatientDataProd(id);
}