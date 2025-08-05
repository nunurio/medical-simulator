'use server';

import { LLMService, type PatientContext } from '../../services/llm-service';
import { useChatStore } from '../../store/chat-store';
import { usePatientStore } from '../../store/patient-store';

export async function sendChatMessage(formData: FormData) {
  const message = formData.get('message') as string;
  const conversationId = formData.get('conversationId') as string;

  // 入力バリデーション
  if (!message?.trim() || !conversationId?.trim()) {
    return {
      success: false,
      error: 'メッセージまたは会話IDが不正です',
    };
  }

  try {
    // ストアから状態を取得
    const chatState = useChatStore.getState();
    const patientState = usePatientStore.getState();

    // 会話の存在チェック
    const conversation = chatState.conversations[conversationId];
    if (!conversation) {
      return {
        success: false,
        error: '会話が見つかりません',
      };
    }

    // アクティブな患者の取得
    const activePatient = patientState.activePatientId 
      ? patientState.patients[patientState.activePatientId]
      : null;

    if (!activePatient) {
      return {
        success: false,
        error: '患者が選択されていません',
      };
    }

    // 患者コンテキストの構築
    const patientContext: PatientContext = {
      patientId: activePatient.id,
      diagnosis: activePatient.currentConditions?.[0]?.name || '',
      condition: activePatient.chiefComplaint,
      age: new Date().getFullYear() - new Date(activePatient.demographics.dateOfBirth).getFullYear(),
      // 追加のコンテキスト情報
      conversationHistory: conversation.messages,
      encounterId: conversation.encounterId,
    };

    // LLMサービスを使用して患者応答を生成
    const llmService = LLMService.getInstance();
    const response = await llmService.generateChatResponse(message, patientContext);

    return {
      success: true,
      patientResponse: response.content,
      usage: response.usage,
    };

  } catch (error) {
    console.error('sendChatMessage error:', error);
    return {
      success: false,
      error: '患者応答の生成に失敗しました',
    };
  }
}