# LLMレスポンスのJSONパース処理改善

**Date**: 2025-08-06 16:38:22
**Author**: Claude Code

## Summary
LLM（大規模言語モデル）からのレスポンス処理において、JSON形式の応答を確実にパースできるよう改善を実施。プロンプトテンプレートでJSON形式を明確に指定し、レスポンス処理側ではマークダウンや余分な文字を自動削除する堅牢なクリーニング処理を実装した。

## Changes Made

### src/config/prompt-templates.ts
- **SYSTEM_PROMPTSのPATIENT_GENERATION**に明確なJSON応答フォーマットの指示を追加
  - JSON構造の具体的な定義を含む詳細な応答フォーマットを明記
  - demographics、medicalHistory各フィールドの構造を明示
- **USER_PROMPTSのPATIENT_GENERATION**にJSON形式での応答を強調するメッセージを追加
  - 「重要: 応答は必ず有効なJSONのみを返してください。追加の説明やマークダウンは含めないでください。」を明記

### src/services/patient-persona-generator.ts
- **parseResponseメソッド**にロバストなJSONクリーニング処理を実装：
  - マークダウンコードブロック（```json、```）の削除処理を追加
  - JSON開始位置（`{`）の自動検出機能を追加
  - JSON終了位置（`}`）の自動検出機能を追加
  - 前後の余分な文字列を自動削除する処理を実装
- **エラーハンドリングの改善**：
  - SyntaxError時に元のレスポンス内容とクリーニング後内容をログ出力
  - ZodError時に詳細なバリデーションエラー内容をログ出力
  - より具体的なエラーメッセージを提供

## Technical Details

### JSONクリーニング処理の実装
```typescript
// マークダウンのコードブロックを削除
cleanedContent = cleanedContent.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');

// JSON開始位置の自動検出
const jsonStartIndex = cleanedContent.search(/\{/);
if (jsonStartIndex > 0) {
  cleanedContent = cleanedContent.substring(jsonStartIndex);
}

// JSON終了位置の自動検出
const jsonEndIndex = cleanedContent.lastIndexOf('}');
if (jsonEndIndex > -1 && jsonEndIndex < cleanedContent.length - 1) {
  cleanedContent = cleanedContent.substring(0, jsonEndIndex + 1);
}
```

### プロンプトテンプレートの改善
- システムプロンプトでJSON構造の詳細を明示
- ユーザープロンプトでJSON形式応答を強調
- 説明文やマークダウンの混入を防ぐ指示を追加

## Lessons Learned

### LLMレスポンスの特性
- LLMは指示に関わらずマークダウンや説明文を含むレスポンスを返すことがある
- プロンプトでの指示だけでなく、レスポンス側での前処理が重要
- JSON構造が正しくても、前後に余分な文字が含まれることが多い

### 堅牢なパース処理の重要性
- 純粋なJSONを期待するのではなく、混在したテキストからJSONを抽出する設計が必要
- エラー時のデバッグ情報を充実させることで、問題の特定と解決が効率化される
- バリデーション処理（Zod）とパース処理を分離することで、エラーの原因を明確にできる

## Future Considerations

### パフォーマンス最適化
- 正規表現処理の最適化を検討
- レスポンスサイズに応じた処理の調整

### エラーハンドリング強化
- より詳細なエラー分類とリトライ戦略の実装
- 部分的なJSONの修復機能の検討

### プロンプトエンジニアリング
- LLM固有の応答パターンに基づくプロンプト最適化
- Few-shot学習によるJSON応答精度向上の検討

## Known Limitations
- 極端に複雑なマークダウン構造を含むレスポンスには対応していない
- JSON内にマークダウンコードブロック記号（```）が含まれる場合の処理は未対応
- ネストした複数のJSONオブジェクトが含まれる場合の処理は最初のオブジェクトのみを抽出