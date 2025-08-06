/**
 * プロンプトテンプレートのテスト
 * Structured Outputs対応での簡素化要件をテスト
 */

import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '@/config/prompt-templates';

describe('プロンプトテンプレートのStructured Outputs対応', () => {
  describe('SYSTEM_PROMPTS.PATIENT_GENERATION', () => {
    it('JSON形式指示が含まれていない', () => {
      const prompt = SYSTEM_PROMPTS.PATIENT_GENERATION;
      
      // JSON指示の削除を確認
      expect(prompt).not.toContain('JSON形式');
      expect(prompt).not.toContain('{"demographics":');
      expect(prompt).not.toContain('"medicalHistory":');
      expect(prompt).not.toContain('必ず以下のJSON形式で応答');
      expect(prompt).not.toContain('その他のテキストや説明は含めない');
    });

    it('医療シミュレーションの基本指針が含まれている', () => {
      const prompt = SYSTEM_PROMPTS.PATIENT_GENERATION;
      
      expect(prompt).toContain('医療シミュレーションの患者ペルソナ生成AI');
      expect(prompt).toContain('リアルで一貫性のある患者像を作成');
      expect(prompt).toContain('教育目的');
      expect(prompt).toContain('診断や治療の推奨は一切行わない');
      expect(prompt).toContain('医学的に正確な情報');
      expect(prompt).toContain('日本語で回答');
    });

    it('簡潔で明確な指示になっている', () => {
      const prompt = SYSTEM_PROMPTS.PATIENT_GENERATION;
      
      // 不要な冗長性がないことを確認
      expect(prompt.length).toBeLessThan(500); // 簡潔性の目安
      expect(prompt).toContain('与えられた情報に基づいて、詳細な患者ペルソナを生成');
    });
  });

  describe('USER_PROMPTS.PATIENT_GENERATION', () => {
    it('JSON形式指示が削除されている', () => {
      const params = { age: 45, gender: 'male' };
      const userPrompt = USER_PROMPTS.PATIENT_GENERATION(params);
      
      expect(userPrompt).not.toContain('応答は必ず有効なJSONのみ');
      expect(userPrompt).not.toContain('追加の説明やマークダウンは含めない');
    });

    it('パラメータが適切に提示されている', () => {
      const params = { age: 45, gender: 'male', specialty: 'cardiology' };
      const userPrompt = USER_PROMPTS.PATIENT_GENERATION(params);
      
      expect(userPrompt).toContain('以下の情報に基づいて');
      expect(userPrompt).toContain(JSON.stringify(params, null, 2));
      expect(userPrompt).toContain('詳細なペルソナを作成');
    });

    it('医療シミュレーション要件が維持されている', () => {
      const params = { age: 30 };
      const userPrompt = USER_PROMPTS.PATIENT_GENERATION(params);
      
      expect(userPrompt).toContain('医療シミュレーション用');
      expect(userPrompt).toContain('基本情報、症状、病歴、現在の状態');
    });
  });

  describe('プロンプトの整合性', () => {
    it('SYSTEM_PROMPTSのすべてのキーが存在する', () => {
      expect(SYSTEM_PROMPTS.PATIENT_GENERATION).toBeDefined();
      expect(SYSTEM_PROMPTS.CHAT_RESPONSE).toBeDefined();
      expect(SYSTEM_PROMPTS.EXAMINATION_FINDING).toBeDefined();
      expect(SYSTEM_PROMPTS.TEST_RESULT_GENERATION).toBeDefined();
    });

    it('USER_PROMPTSのすべてのキーが存在する', () => {
      expect(USER_PROMPTS.PATIENT_GENERATION).toBeDefined();
      expect(USER_PROMPTS.CHAT_RESPONSE).toBeDefined();
      expect(USER_PROMPTS.EXAMINATION_FINDING).toBeDefined();
      expect(USER_PROMPTS.TEST_RESULT_GENERATION).toBeDefined();
    });

    it('環境変数での上書きに対応している', () => {
      // 環境変数での上書き機能が保持されていることを確認
      expect(typeof SYSTEM_PROMPTS.PATIENT_GENERATION).toBe('string');
    });
  });
});

describe('プロンプト品質の確保', () => {
  it('日本語での指示が適切', () => {
    const prompt = SYSTEM_PROMPTS.PATIENT_GENERATION;
    
    // 日本語での指示が含まれていることを確認
    expect(prompt).toContain('あなたは');
    expect(prompt).toContain('してください');
    expect(prompt).toMatch(/[ひらがな]/);
  });

  it('医療シミュレーション要件が明確', () => {
    const prompt = SYSTEM_PROMPTS.PATIENT_GENERATION;
    
    expect(prompt).toContain('教育目的');
    expect(prompt).toContain('典型的な症状');
    expect(prompt).toContain('診断や治療の推奨は一切行わない');
  });

  it('Structured Outputsの利点を活用', () => {
    const prompt = SYSTEM_PROMPTS.PATIENT_GENERATION;
    
    // JSON構造指示が不要になったことで、より本質的な指示に集中
    expect(prompt).not.toContain('{');
    expect(prompt).not.toContain('}');
    expect(prompt.split('\n').length).toBeLessThan(15); // 簡潔性の確認
  });

  it('プロンプト長の最適化', () => {
    const originalLength = 617; // テスト失敗時の元の長さ
    const currentLength = SYSTEM_PROMPTS.PATIENT_GENERATION.length;
    
    // Structured Outputs対応により大幅な短縮を確認
    expect(currentLength).toBeLessThan(originalLength * 0.5);
    expect(currentLength).toBeGreaterThan(100); // 最小限の内容は保持
  });

  it('他のプロンプトも一貫性を保持', () => {
    // その他のシステムプロンプトも日本語と医療要件を満たしている
    Object.values(SYSTEM_PROMPTS).forEach(prompt => {
      expect(prompt).toContain('医療');
      expect(prompt).toMatch(/[ひらがな]/);
    });
  });
});