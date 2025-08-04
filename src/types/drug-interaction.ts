import { z } from 'zod';
import { 
  uuidSchema,
  VALIDATION_MESSAGES,
  MEDICAL_CODES
} from './validation-utils';

// 投与経路の定義
export const RouteOfAdministration = z.enum(['PO', 'IV', 'IM', 'SC', 'topical']);
export type RouteOfAdministration = z.infer<typeof RouteOfAdministration>;

// 投与頻度の定義（一般的な医療略語）
export const FrequencySchema = z.string().regex(
  /^(q\d+h|BID|TID|QID|PRN|QD|QOD|QHS|AC|PC)$/,
  { message: '投与頻度は標準的な医療略語形式である必要があります（例: BID, TID, q8h）' }
);

// 処方箋スキーマ
export const PrescriptionSchema = z.object({
  patientId: uuidSchema,
  drugId: z.string()
    .min(1, { message: VALIDATION_MESSAGES.REQUIRED('薬物ID') })
    .regex(MEDICAL_CODES.RXNORM_REGEX, { 
      message: 'RxNormコード形式である必要があります（数字のみ）' 
    }),
  dose: z.number()
    .positive({ message: '用量は正の数である必要があります' }),
  units: z.string()
    .min(1, { message: VALIDATION_MESSAGES.REQUIRED('単位') }),
  route: RouteOfAdministration,
  frequency: FrequencySchema,
  startDate: z.date(),
  endDate: z.date().optional()
}).refine(data => !data.endDate || data.endDate > data.startDate, {
  message: "終了日は開始日より後でなければなりません",
  path: ["endDate"]
});

// 薬物相互作用の重症度
export const InteractionSeverity = z.enum(['minor', 'moderate', 'major', 'contraindicated']);
export type InteractionSeverity = z.infer<typeof InteractionSeverity>;

// 薬物相互作用スキーマ
export const DrugInteractionSchema = z.object({
  id: z.string().min(1),
  drugIds: z.array(z.string())
    .min(2, { message: '相互作用には少なくとも2つの薬物が必要です' }),
  severity: InteractionSeverity,
  mechanism: z.string().min(1, { 
    message: VALIDATION_MESSAGES.REQUIRED('相互作用機序') 
  }),
  clinicalEffect: z.string().min(1, { 
    message: VALIDATION_MESSAGES.REQUIRED('臨床的影響') 
  }),
  recommendation: z.string().min(1, { 
    message: VALIDATION_MESSAGES.REQUIRED('推奨事項') 
  })
});

// 型定義のエクスポート
export type Prescription = z.infer<typeof PrescriptionSchema>;
export type DrugInteraction = z.infer<typeof DrugInteractionSchema>;

// 薬物相互作用チェック関数
export function checkDrugInteractions(
  prescriptions: Prescription[],
  knownInteractions: DrugInteraction[]
): DrugInteraction[] {
  // 処方箋から薬物IDのリストを抽出
  const drugIds = prescriptions.map(p => p.drugId);
  
  // 該当する相互作用を検出
  const detectedInteractions = knownInteractions.filter(interaction => {
    // 相互作用に含まれるすべての薬物が処方箋リストに存在するか確認
    return interaction.drugIds.every(drugId => drugIds.includes(drugId));
  });
  
  return detectedInteractions;
}