import { NextRequest, NextResponse } from 'next/server';
import { PatientPersonaGenerator } from '../../../../services/patient-persona-generator';
import { GeneratePatientRequestSchema } from '../../../../types/api';


// 初期問診票の質問項目
const generateInitialQuestionnaire = (specialty: string, _difficulty: string) => {
  const baseQuestions = [
    {
      id: 'chief_complaint',
      text: '今日はどのような症状でいらっしゃいましたか？',
      type: 'open_text',
      required: true,
    },
    {
      id: 'symptom_duration',
      text: 'その症状はいつ頃から始まりましたか？',
      type: 'select',
      options: ['今日', '昨日', '数日前', '1週間前', '1ヶ月前', 'それ以上前'],
      required: true,
    },
    {
      id: 'pain_scale',
      text: '痛みの程度を10段階で評価してください（0：痛みなし、10：我慢できない痛み）',
      type: 'scale',
      min: 0,
      max: 10,
      required: true,
    },
  ];

  // 診療科別の追加質問
  const departmentQuestions: Record<string, unknown[]> = {
    'cardiology': [
      {
        id: 'chest_pain_location',
        text: '胸の痛みはどの部分にありますか？',
        type: 'multiple_choice',
        options: ['胸の中央', '左胸', '右胸', '背中に放散'],
      },
      {
        id: 'shortness_of_breath',
        text: '息切れはありますか？',
        type: 'yes_no',
      },
    ],
    'orthopedics': [
      {
        id: 'movement_limitation',
        text: '関節の動きに制限はありますか？',
        type: 'yes_no',
      },
      {
        id: 'swelling',
        text: '腫れはありますか？',
        type: 'yes_no',
      },
    ],
  };

  return {
    questions: [
      ...baseQuestions,
      ...(departmentQuestions[specialty] || []),
    ],
  };
};

// モデル設定
const getModelConfiguration = (difficulty: string) => {
  const configurations: Record<string, unknown> = {
    'beginner': {
      temperature: 0.3,
      maxTokens: 1000,
      complexity: 'low',
    },
    'intermediate': {
      temperature: 0.5,
      maxTokens: 1500,
      complexity: 'medium',
    },
    'advanced': {
      temperature: 0.7,
      maxTokens: 2000,
      complexity: 'high',
    },
  };

  return configurations[difficulty] || configurations['intermediate'];
};

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを解析
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // リクエストのバリデーション
    const validationResult = GeneratePatientRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorDetails = validationResult.error?.errors?.map(e => {
        const field = e.path && e.path.length > 0 ? e.path.join('.') : 'unknown field';
        return `${field}: ${e.message}`;
      }) || ['Unknown validation error'];
      
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errorDetails,
        },
        { status: 400 }
      );
    }

    const validatedParams = validationResult.data;
    
    // PatientPersonaGeneratorを使用してペルソナを生成
    const generator = new PatientPersonaGenerator();
    const patient = await generator.generatePersona(validatedParams);

    // 初期問診票を生成
    const initialQuestionnaire = generateInitialQuestionnaire(
      validatedParams.specialty,
      validatedParams.difficulty
    );

    // モデル設定を取得
    const modelConfiguration = getModelConfiguration(validatedParams.difficulty);

    // レスポンスを返す
    return NextResponse.json({
      patient,
      initialQuestionnaire,
      modelConfiguration,
    });
  } catch (error: unknown) {
    console.error('Error generating patient persona:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate patient persona',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}