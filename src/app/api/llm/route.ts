import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { LLMRequestSchema } from '@/types/llm';
import { LLMService } from '@/services/llm-service';
import { handleAPIError } from '@/lib/error-handler';
import { MEDICAL_DISCLAIMERS } from '@/config/constants';

/**
 * LLM API エンドポイント
 * 医療シミュレーションに特化したLLMリクエストを処理します
 * 
 * @param req - Next.js リクエストオブジェクト
 * @returns 構造化されたLLMレスポンス（disclaimer付き）
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // リクエストボディの取得とJSONパース
    const body = await req.json();
    
    // Zodスキーマによる厳密なバリデーション
    const validated = LLMRequestSchema.parse(body);
    
    // LLMサービスの呼び出し
    const llmService = LLMService.getInstance();
    const response = await llmService.generateCompletion(validated);
    
    // 医療アプリケーション向けレスポンスの構築
    const medicalResponse = {
      ...response,
      // 医療免責事項の追加
      disclaimer: MEDICAL_DISCLAIMERS.SIMULATION_WARNING,
      // タイムスタンプの追加（監査証跡用）
      timestamp: new Date().toISOString(),
      // リクエストタイプの記録（ログ分析用）
      requestType: validated.type,
    };
    
    // CORSヘッダーの設定（必要に応じて）
    return NextResponse.json(medicalResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // TODO: 本番環境では適切なCORSポリシーを設定
        // 'Access-Control-Allow-Origin': 'https://yourdomain.com',
      },
    });
  } catch (error) {
    // エラータイプの判定とHTTPステータスコードの決定
    let statusCode = 500;
    
    if (error instanceof ZodError) {
      // バリデーションエラー
      statusCode = 400;
    } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
      // JSONパースエラー
      statusCode = 400;
    } else if (error instanceof Error) {
      // その他のエラータイプのチェック
      if (error.message.includes('Rate limit') || error.message.includes('quota')) {
        statusCode = 429; // Too Many Requests
      } else if (error.message.includes('Unauthorized') || error.message.includes('API key')) {
        statusCode = 401; // Unauthorized
      }
    }
    
    // 統一されたエラーハンドリング
    const apiErrorResult = handleAPIError(error as Error, statusCode);
    
    return NextResponse.json(apiErrorResult, { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }
}