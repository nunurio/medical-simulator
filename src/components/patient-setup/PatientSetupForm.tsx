'use client'

import React from 'react'
import { DepartmentSelector } from './DepartmentSelector'
import { DifficultySelector } from './DifficultySelector'
import { useSimulationStore } from '@/store/simulation-store'
import { usePatientGeneration } from '@/hooks/usePatientGeneration'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import type { MedicalSpecialtyKey, DifficultyLevel } from '@/config/medical-knowledge'

export interface PatientSetupFormProps {
  /**
   * 患者生成成功時に呼び出されるコールバック関数
   * 通常はページ遷移やモーダル表示などのUI変更に使用する
   */
  onSuccess?: () => void
}

export function PatientSetupForm({ onSuccess }: PatientSetupFormProps) {
  const { department, difficulty, setDepartment, setDifficulty } = useSimulationStore()
  const { generatePatient, loading, error } = usePatientGeneration()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    await generatePatient({
      department,
      difficulty
    }, onSuccess)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">患者設定</h1>
        <p className="text-gray-600">診療科と難易度を選択して、シミュレーション用の患者を生成します</p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} aria-label="患者設定フォーム" className="space-y-10">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                1
              </div>
              <h2 className="text-xl font-semibold text-gray-900">診療科を選択</h2>
            </div>
            <DepartmentSelector 
              value={department}
              onChange={(value: MedicalSpecialtyKey) => setDepartment(value)}
              disabled={loading}
            />
          </div>

          <div className="border-t pt-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                2
              </div>
              <h2 className="text-xl font-semibold text-gray-900">難易度を選択</h2>
            </div>
            <DifficultySelector 
              value={difficulty}
              onChange={(value: DifficultyLevel) => setDifficulty(value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-red-800">エラー</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          <div className="border-t pt-8">
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 text-lg"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    患者を生成中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    患者を生成
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}