/**
 * LLMService - 医療シミュレーション用LLMサービス
 * シングルトンパターンを使用してOpenAI APIとの通信を管理
 */
import OpenAI from 'openai';
import type { LLMRequest, LLMResponse } from '@/types/llm';
import { LLMRequestSchema, LLMResponseSchema } from '@/types/llm';
import { getLLMConfig, isO3Model as isO3ModelCheck } from '@/config/llm-config';
import { callOpenAIWithRetry } from '@/lib/retry-logic';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '@/config/prompt-templates';
import { PatientPersonaJsonSchema } from '@/types/llm-schemas';

// 特化メソッド用の型定義
export interface PatientPersonaParams {
  age?: number;
  gender?: string;
  chiefComplaint?: string;
  medicalHistory?: string[];
  [key: string]: unknown;
}

export interface PatientContext {
  patientId?: string;
  diagnosis?: string;
  condition?: string;
  age?: number;
  [key: string]: unknown;
}

export interface TestOrder {
  type: string;
  tests?: string[];
  [key: string]: unknown;
}

export class LLMService {
  private static instance: LLMService;
  private openaiClient: OpenAI | null = null;

  private constructor() {}

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  private async getClient(): Promise<OpenAI> {
    if (!this.openaiClient) {
      const config = getLLMConfig();
      this.openaiClient = new OpenAI({
        apiKey: config.apiKey,
        maxRetries: 0, // callOpenAIWithRetryで管理
      });
    }
    return this.openaiClient;
  }

  /**
   * OpenAI APIパラメータを構築する
   * @private
   */
  private buildApiParams(
    validatedRequest: LLMRequest, 
    config: ReturnType<typeof getLLMConfig>
  ): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
    const isO3Model = isO3ModelCheck(config.model);
    
    const apiParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: config.model,
      messages: [
        ...(validatedRequest.systemPrompt ? [{ role: 'system' as const, content: validatedRequest.systemPrompt }] : []),
        { role: 'user' as const, content: validatedRequest.userPrompt }
      ],
    };

    // o3モデルはtemperatureをサポートしないため、デフォルト値（1）のみ使用
    // 他のモデルの場合は、リクエストまたはコンフィグから取得した値を使用
    if (!isO3Model) {
      apiParams.temperature = validatedRequest.temperature ?? config.temperature;
    }

    // トークン数の設定（o3モデルはmax_completion_tokens、他はmax_tokens）
    const maxTokens = validatedRequest.maxTokens ?? config.maxTokens;
    if (isO3Model) {
      // o3モデル用のパラメータ設定
      (apiParams as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & { max_completion_tokens?: number }).max_completion_tokens = maxTokens;
    } else {
      // 通常モデル用のパラメータ設定
      apiParams.max_tokens = maxTokens;
    }

    // Structured Outputs対応
    if (validatedRequest.responseFormat) {
      apiParams.response_format = validatedRequest.responseFormat;
    }

    return apiParams;
  }

  /**
   * OpenAI APIレスポンスをLLMResponseに変換する
   * @private
   */
  private transformResponse(response: OpenAI.Chat.Completions.ChatCompletion): LLMResponse {
    const result: LLMResponse = {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
      model: response.model,
      finishReason: response.choices[0]?.finish_reason || undefined,
    };

    // レスポンスのバリデーション
    return LLMResponseSchema.parse(result);
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    // リクエストのバリデーション
    const validatedRequest = LLMRequestSchema.parse(request);
    
    const config = getLLMConfig();
    const client = await this.getClient();

    // OpenAI APIコール用の関数
    const apiCall = async (): Promise<LLMResponse> => {
      const apiParams = this.buildApiParams(validatedRequest, config);
      const response = await client.chat.completions.create(apiParams);
      return this.transformResponse(response);
    };

    // リトライ付きでAPIを実行し、結果のバリデーション
    const result = await callOpenAIWithRetry(
      apiCall,
      config.retries.maxAttempts,
      'generateCompletion'
    );

    // callOpenAIWithRetryがモックされている場合のバリデーション（テスト用）
    return LLMResponseSchema.parse(result);
  }

  /**
   * 患者ペルソナを生成する
   * @param params 患者パラメータ（年齢、性別、主訴等）
   * @returns 生成された患者ペルソナ
   */
  async generatePatientPersona(params: PatientPersonaParams): Promise<LLMResponse> {
    const systemPrompt = SYSTEM_PROMPTS.PATIENT_GENERATION;
    const userPrompt = USER_PROMPTS.PATIENT_GENERATION(params);

    return this.generateCompletion({
      type: 'patient_persona_generation',
      context: params,
      systemPrompt,
      userPrompt,
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'PatientPersona',
          strict: true,
          schema: PatientPersonaJsonSchema
        }
      }
    });
  }

  /**
   * 患者としてのチャット応答を生成する
   * @param message 医療従事者からのメッセージ
   * @param context 患者のコンテキスト情報
   * @returns 生成されたチャット応答
   */
  async generateChatResponse(message: string, context: PatientContext): Promise<LLMResponse> {
    const systemPrompt = SYSTEM_PROMPTS.CHAT_RESPONSE;
    const userPrompt = USER_PROMPTS.CHAT_RESPONSE(message, context);

    return this.generateCompletion({
      type: 'chat_response',
      context: context,
      systemPrompt,
      userPrompt,
    });
  }

  /**
   * 診察所見を生成する
   * @param bodyPart 診察する身体部位
   * @param patientContext 患者のコンテキスト情報
   * @returns 生成された診察所見
   */
  async generateExaminationFinding(bodyPart: string, patientContext: PatientContext): Promise<LLMResponse> {
    const systemPrompt = SYSTEM_PROMPTS.EXAMINATION_FINDING;
    const userPrompt = USER_PROMPTS.EXAMINATION_FINDING(bodyPart, patientContext);

    return this.generateCompletion({
      type: 'examination_finding',
      context: { bodyPart, ...patientContext },
      systemPrompt,
      userPrompt,
    });
  }

  /**
   * 検査結果を生成する
   * @param testOrder 検査オーダー情報
   * @param patientContext 患者のコンテキスト情報
   * @returns 生成された検査結果
   */
  async generateTestResult(testOrder: TestOrder, patientContext: PatientContext): Promise<LLMResponse> {
    const systemPrompt = SYSTEM_PROMPTS.TEST_RESULT_GENERATION;
    const userPrompt = USER_PROMPTS.TEST_RESULT_GENERATION(testOrder.type || '検査', { ...patientContext, testOrder });

    return this.generateCompletion({
      type: 'test_result_generation',
      context: { testOrder, ...patientContext },
      systemPrompt,
      userPrompt,
    });
  }
}