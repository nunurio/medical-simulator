import { z } from 'zod';

// 環境変数のスキーマ定義
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_BASE: z.string().url().optional(),
  NEXT_PUBLIC_USE_MOCKS: z.enum(['true', 'false']).optional(),
});

export type Environment = z.infer<typeof envSchema>;

// シミュレーション設定のスキーマ
const simulationConfigSchema = z.object({
  mode: z.enum(['outpatient', 'emergency', 'surgery', 'ward']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  department: z.enum(['general_medicine', 'cardiology', 'neurology', 'surgery', 'pediatrics']),
});

// UI設定のスキーマ
const uiConfigSchema = z.object({
  theme: z.enum(['light', 'dark']),
  sidebar: z.object({
    isOpen: z.boolean(),
  }),
});

// API設定のスキーマ
const apiConfigSchema = z.object({
  baseUrl: z.string().url(),
  useMocks: z.boolean(),
});

// UUID正規表現パターン
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// モック患者データのスキーマ
const mockPatientSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'Invalid UUID format'),
  name: z.string().min(1),
  age: z.number().int().min(0).max(150),
  condition: z.string().min(1),
});

// 型エクスポート
export type SimulationConfig = z.infer<typeof simulationConfigSchema>;
export type UIConfig = z.infer<typeof uiConfigSchema>;
export type APIConfig = z.infer<typeof apiConfigSchema>;
export type MockPatient = z.infer<typeof mockPatientSchema>;

// 全体の設定スキーマ
const configSchema = z.object({
  simulation: simulationConfigSchema,
  ui: uiConfigSchema,
  api: apiConfigSchema,
  mockPatients: z.array(mockPatientSchema),
});

export type AppConfig = z.infer<typeof configSchema>;

// デフォルト設定
const defaultConfig: AppConfig = {
  simulation: {
    mode: 'outpatient',
    difficulty: 'beginner',
    department: 'general_medicine',
  },
  ui: {
    theme: 'light',
    sidebar: {
      isOpen: true,
    },
  },
  api: {
    baseUrl: 'http://localhost:3000/api',
    useMocks: true,
  },
  mockPatients: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: '田中太郎',
      age: 45,
      condition: '高血圧',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: '佐藤花子',
      age: 32,
      condition: '糖尿病',
    },
  ],
};

// 設定オブジェクト（キャッシュ用）
let cachedConfig: AppConfig | null = null;

// 環境変数を解析して設定を構築
function buildConfig(): AppConfig {
  const env = envSchema.parse(process.env);
  
  // デフォルト設定をベースに環境変数で上書き
  const config: AppConfig = {
    ...defaultConfig,
    api: {
      ...defaultConfig.api,
      baseUrl: env.NEXT_PUBLIC_API_BASE || defaultConfig.api.baseUrl,
      useMocks: env.NEXT_PUBLIC_USE_MOCKS === 'false' ? false : defaultConfig.api.useMocks,
    },
  };

  // スキーマ検証
  return configSchema.parse(config);
}

// 設定を取得
export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = buildConfig();
  }
  return cachedConfig;
}

// 設定をリセット（テスト用）
export function resetConfig(): void {
  cachedConfig = null;
}

// デフォルトエクスポート
export const appConfig = getConfig();