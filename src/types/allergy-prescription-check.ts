import { Allergy } from './patient-validation';
import { Prescription } from './drug-interaction';

// アレルギーと薬物のマッピング
export interface AllergyDrugMapping {
  allergen: string;
  relatedDrugIds: string[]; // RxNormコードのリスト
  crossReactivity: number; // 0.0 - 1.0 (交差反応性の確率)
}

// アレルギーと処方薬の衝突
export interface AllergyPrescriptionConflict {
  allergen: string;
  conflictingDrugId: string;
  crossReactivity: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

// リスクレベルの判定
function determineRiskLevel(
  allergy: Allergy,
  crossReactivity: number
): 'low' | 'medium' | 'high' {
  // アナフィラキシーは常に高リスク
  if (allergy.reaction === 'anaphylaxis') {
    return 'high';
  }
  
  // 重篤度と交差反応性に基づく判定
  if (allergy.severity === 'severe') {
    return crossReactivity >= 0.5 ? 'high' : 'medium';
  }
  
  if (allergy.severity === 'moderate') {
    if (crossReactivity >= 0.8) return 'high';
    if (crossReactivity >= 0.3) return 'medium';
    return 'low';
  }
  
  // 軽度のアレルギー
  if (crossReactivity >= 0.8) return 'medium';
  return 'low';
}

// 推奨事項の生成
function generateRecommendation(
  allergy: Allergy,
  crossReactivity: number,
  riskLevel: 'low' | 'medium' | 'high'
): string {
  if (riskLevel === 'high') {
    if (allergy.reaction === 'anaphylaxis') {
      return `⚠️ 絶対禁忌: ${allergy.allergen}に対するアナフィラキシー歴があります。この薬物は生命を脅かす反応を引き起こす可能性があります。代替薬を使用してください。`;
    }
    return `⚠️ 高リスク: ${allergy.allergen}に対する重篤なアレルギー歴があります（交差反応性: ${(crossReactivity * 100).toFixed(0)}%）。代替薬の使用を強く推奨します。`;
  }
  
  if (riskLevel === 'medium') {
    return `注意: ${allergy.allergen}に対するアレルギー歴があります（交差反応性: ${(crossReactivity * 100).toFixed(0)}%）。慎重投与が必要です。患者の状態を注意深くモニタリングしてください。`;
  }
  
  return `情報: ${allergy.allergen}に対する軽度のアレルギー歴があります（交差反応性: ${(crossReactivity * 100).toFixed(0)}%）。投与は可能ですが、初回投与時は注意してください。`;
}

// アレルギーと処方薬の衝突をチェック
export function checkAllergyPrescriptionConflicts(
  allergies: Allergy[],
  prescriptions: Prescription[],
  allergyDrugMappings: AllergyDrugMapping[]
): AllergyPrescriptionConflict[] {
  const conflicts: AllergyPrescriptionConflict[] = [];
  
  // 各アレルギーについて処方薬との衝突をチェック
  for (const allergy of allergies) {
    // アレルゲンに関連する薬物マッピングを検索
    const mapping = allergyDrugMappings.find(
      m => m.allergen === allergy.allergen
    );
    
    if (!mapping) {
      // マッピングがない場合は薬物アレルギーではない（食物アレルギー等）
      continue;
    }
    
    // 処方薬との衝突をチェック
    for (const prescription of prescriptions) {
      if (mapping.relatedDrugIds.includes(prescription.drugId)) {
        const riskLevel = determineRiskLevel(allergy, mapping.crossReactivity);
        const recommendation = generateRecommendation(
          allergy,
          mapping.crossReactivity,
          riskLevel
        );
        
        conflicts.push({
          allergen: allergy.allergen,
          conflictingDrugId: prescription.drugId,
          crossReactivity: mapping.crossReactivity,
          riskLevel,
          recommendation
        });
      }
    }
  }
  
  return conflicts;
}