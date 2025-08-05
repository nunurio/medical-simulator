# Zustand ローカル状態管理システムの実装

**Date**: 2025-08-05 14:30:00
**Author**: Claude Code

## Summary

医療シミュレーターアプリケーション向けにZustandを使用した包括的なローカル状態管理システムを実装しました。患者データ、チャット、医療オーダー、シミュレーション、UI状態を管理する5つの専門ストアと、それらを統合するAppStoreを構築し、型安全性とTDD（テスト駆動開発）を重視した実装を行いました。

## Changes Made

### 新規ファイル作成
- `src/store/patient-store.ts` - 患者データ管理ストア
- `src/store/chat-store.ts` - 会話管理ストア
- `src/store/order-store.ts` - 医療オーダー管理ストア
- `src/store/simulation-store.ts` - シミュレーション状態管理ストア
- `src/store/ui-store.ts` - UI状態管理ストア
- `src/store/app-store.ts` - 全ストア統合・永続化機能
- `src/hooks/use-store.ts` - 型安全なアクセス用カスタムフック

### 主要機能
1. **PatientStore**:
   - 患者データのCRUD操作
   - 医療バリデーションサービスとの統合
   - バイタルサイン更新時の自動検証
   - エラーハンドリング機能

2. **ChatStore**:
   - 会話の作成・管理・終了
   - メッセージ追加機能
   - タイピング状態管理
   - アクティブ会話の追跡

3. **OrderStore**:
   - 医療オーダーの作成と管理
   - ステータス更新・キャンセル機能
   - 患者別オーダー検索
   - ペンディングオーダーの追跡

4. **SimulationStore**:
   - シミュレーションモード管理（外来・救急・入院）
   - 難易度設定（初級・中級・上級）
   - 診療科選択機能
   - スコア計算機能（仮実装）

5. **UIStore**:
   - テーマ管理（ライト・ダークモード）
   - サイドバー・モーダル状態管理
   - 通知システム（情報・成功・警告・エラー）

6. **AppStore**:
   - 全ストアの統合管理
   - LocalStorage永続化（選択的）
   - グローバルリセット機能
   - テスト用createAppStore関数

## Technical Details

### アーキテクチャパターン
- **Zustand v5**を使用した軽量状態管理
- **immerミドルウェア**による不変性の保証
- **TypeScript**による厳密な型安全性
- **TDD（t-wada方式）**による品質保証

### セキュリティ考慮事項
- 医療データ（PHI: Protected Health Information）の非永続化
- 患者情報は意図的にLocalStorageに保存しない設計
- UI状態とシミュレーション設定のみ永続化

### 統合パターン
```typescript
// 統合されたストアの使用例
const useAppStore = create<AppStore>()(
  persist(
    immer((set, get) => ({
      ...createPatientStore(set, get),
      ...createChatStore(set, get),
      ...createOrderStore(set, get),
      ...createSimulationStore(set, get),
      ...createUIStore(set, get),
      // グローバルリセット機能
      resetAll: () => set(() => initialState),
    })),
    {
      name: 'medical-simulator-storage',
      partialize: (state) => ({
        ui: state.ui,
        simulation: state.simulation,
      }),
    }
  )
);
```

## Lessons Learned

### 技術的課題と解決策
1. **型定義の不整合解決**:
   - `SimulationMode`: 'practice' → 'outpatient'に修正
   - `Department`: 'internal_medicine' → 'general_medicine'に統一
   - `setSpecialty` → `setDepartment`メソッド名変更

2. **医療バリデーション統合**:
   - `updatePatientVitals`実行時の自動検証機能
   - エラーと警告の適切な分離処理

3. **SSR/ハイドレーション対応**:
   - Next.js 15 App Routerとの互換性確保
   - カスタムフック`use-store.ts`による型安全なアクセス

### TDD実践の効果
- Red-Green-Refactorサイクルの厳格な適用
- 仕様変更に対する堅牢性の向上
- リファクタリング時の信頼性確保

## Future Considerations

### 改善予定項目
1. **設定の外部化**:
   - ハードコードされた値の設定ファイル化
   - 環境変数による設定管理

2. **データ管理の最適化**:
   - モックデータの分離
   - 大量データ処理時のパフォーマンス改善

3. **国際化対応**:
   - エラーメッセージの多言語化
   - UI文言の国際化準備

4. **監査機能**:
   - 状態変更の履歴追跡
   - デバッグ用ログ機能の強化

### 技術的拡張性
- リアルタイム同期機能の追加準備
- 複数ユーザー対応のための基盤構築
- 外部API統合時の状態管理パターン

### セキュリティ強化
- データ暗号化機能の検討
- アクセス制御レイヤーの追加
- 医療情報管理規制への準拠強化

## Notes

この実装により、医療シミュレーターアプリケーションの基盤となる状態管理システムが完成しました。各ストアは独立性を保ちながらも、AppStoreを通じて統合され、型安全性とパフォーマンスを両立しています。TDDアプローチにより、将来の機能拡張や仕様変更に対しても柔軟に対応できる設計となっています。