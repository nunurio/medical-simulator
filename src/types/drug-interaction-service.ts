import { 
  Prescription, 
  DrugInteraction,
  PrescriptionSchema,
  DrugInteractionSchema
} from './drug-interaction';

// 薬物相互作用チェック結果
export interface DrugInteractionCheckResult {
  isValid: boolean;
  interactions: DrugInteraction[];
  criticalInteractions: DrugInteraction[];
  recommendations: string[];
}

// 薬物相互作用知識ベースのインターフェース
export interface InteractionKnowledgeBase {
  findInteractions(drugIds: string[]): Promise<DrugInteraction[]>;
}

// 監査ログのインターフェース
export interface AuditLogger {
  logInteractionCheck(event: InteractionCheckEvent): Promise<void>;
  logCriticalInteraction(interaction: DrugInteraction, patientId: string): Promise<void>;
}

// 通知サービスのインターフェース
export interface NotificationService {
  sendCriticalAlert(alert: CriticalAlert): Promise<void>;
}

// イベント型定義
export interface InteractionCheckEvent {
  patientId: string;
  prescriptionIds: string[];
  interactionsFound: number;
  criticalInteractionsFound: number;
  timestamp: Date;
}

export interface CriticalAlert {
  type: 'CRITICAL_DRUG_INTERACTION';
  patientId: string;
  interactions: DrugInteraction[];
  requiresImmediateAttention: boolean;
}

// 薬物相互作用サービス
export class DrugInteractionService {
  constructor(
    private knowledgeBase: InteractionKnowledgeBase,
    private auditLogger: AuditLogger,
    private notificationService: NotificationService
  ) {}

  async validateAndCheckInteractions(
    patientId: string,
    newPrescription: unknown,
    existingPrescriptions: Prescription[]
  ): Promise<DrugInteractionCheckResult> {
    // 1. 新処方のバリデーション
    const validatedPrescription = PrescriptionSchema.parse(newPrescription);
    
    // 2. 全処方リストの作成
    const allPrescriptions = [...existingPrescriptions, validatedPrescription];
    const drugIds = allPrescriptions.map(p => p.drugId);
    
    // 3. 相互作用チェック実行
    const interactions = await this.knowledgeBase.findInteractions(drugIds);
    
    // 4. 重大な相互作用の分類
    const criticalInteractions = interactions.filter(
      i => ['major', 'contraindicated'].includes(i.severity)
    );
    
    // 5. 重大な相互作用の処理
    if (criticalInteractions.length > 0) {
      await this.handleCriticalInteractions(patientId, criticalInteractions);
    }
    
    // 6. 監査ログ記録
    await this.auditLogger.logInteractionCheck({
      patientId,
      prescriptionIds: drugIds,
      interactionsFound: interactions.length,
      criticalInteractionsFound: criticalInteractions.length,
      timestamp: new Date()
    });
    
    // 7. 結果の返却
    return {
      isValid: criticalInteractions.length === 0,
      interactions,
      criticalInteractions,
      recommendations: this.generateRecommendations(interactions)
    };
  }

  private async handleCriticalInteractions(
    patientId: string,
    interactions: DrugInteraction[]
  ): Promise<void> {
    // 各重大な相互作用のログ記録
    for (const interaction of interactions) {
      await this.auditLogger.logCriticalInteraction(interaction, patientId);
    }
    
    // 医療スタッフへの緊急通知
    await this.notificationService.sendCriticalAlert({
      type: 'CRITICAL_DRUG_INTERACTION',
      patientId,
      interactions,
      requiresImmediateAttention: true
    });
  }

  private generateRecommendations(interactions: DrugInteraction[]): string[] {
    const recommendations: string[] = [];
    
    for (const interaction of interactions) {
      recommendations.push(interaction.recommendation);
      
      // 重症度に基づく追加推奨事項
      switch (interaction.severity) {
        case 'contraindicated':
          recommendations.push(
            '⚠️ 緊急対応: この薬物の組み合わせは禁忌です。直ちに代替薬を検討してください。'
          );
          break;
        case 'major':
          recommendations.push(
            '⚠️ 重要: 重大な相互作用のリスクがあります。慎重なモニタリングが必要です。'
          );
          break;
        case 'moderate':
          recommendations.push(
            '注意: 中程度の相互作用があります。患者の状態を定期的に評価してください。'
          );
          break;
        case 'minor':
          recommendations.push(
            '情報: 軽微な相互作用があります。必要に応じてモニタリングしてください。'
          );
          break;
      }
    }
    
    return [...new Set(recommendations)]; // 重複を除去
  }

  // 処方箋リストから相互作用を検出するヘルパーメソッド
  async checkPrescriptionInteractions(
    prescriptions: Prescription[]
  ): Promise<DrugInteraction[]> {
    const drugIds = prescriptions.map(p => p.drugId);
    return await this.knowledgeBase.findInteractions(drugIds);
  }

  // バリデーションヘルパーメソッド
  validatePrescription(prescription: unknown): Prescription {
    return PrescriptionSchema.parse(prescription);
  }

  validateDrugInteraction(interaction: unknown): DrugInteraction {
    return DrugInteractionSchema.parse(interaction);
  }
}