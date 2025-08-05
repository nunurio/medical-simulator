'use client'

import { useState, useCallback } from 'react'
import { usePatientStore } from '@/store/patient-store'
import { useUIStore } from '@/store/ui-store'
import { generatePatientAction } from '@/app/actions/generate-patient'
import type { Department, DifficultyLevel } from '@/types/state'

export interface GeneratePatientParams {
  department: Department
  difficulty: DifficultyLevel
}

export interface UsePatientGenerationReturn {
  generatePatient: (params: GeneratePatientParams, onSuccess?: () => void) => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
}

/**
 * 患者生成を管理するカスタムフック
 * 
 * Server Action (generatePatientAction)を呼び出し、
 * 既存のZustandストア（patient-store、ui-store）と連携して
 * 患者データの生成と通知を管理します。
 * 
 * @returns {UsePatientGenerationReturn} 患者生成機能とその状態
 */
export function usePatientGeneration(): UsePatientGenerationReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { addPatient } = usePatientStore()
  const { addNotification } = useUIStore()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const generatePatient = useCallback(async (params: GeneratePatientParams, onSuccess?: () => void): Promise<void> => {
    // 入力パラメータの検証
    if (!params.department || !params.difficulty) {
      const errorMessage = '診療科と難易度は必須です'
      setError(errorMessage)
      addNotification({
        type: 'error',
        message: errorMessage
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // FormDataを作成（useActionStateパターンとの連携を考慮）
      const formData = new FormData()
      formData.append('department', params.department)
      formData.append('difficulty', params.difficulty)
      formData.append('mode', 'outpatient')

      // Server Actionを呼び出し
      const result = await generatePatientAction(undefined, formData)

      if (result.success && result.data) {
        // 成功時：患者データをストアに保存
        addPatient(result.data)
        
        // 成功通知を表示
        addNotification({
          type: 'success',
          message: '患者が正常に生成されました',
          duration: 3000
        })

        // 成功コールバックを呼び出し
        onSuccess?.()
      } else {
        // エラー時：エラーメッセージを設定
        const errorMessage = result.error || '患者生成に失敗しました'
        setError(errorMessage)
        
        // エラー通知を表示
        addNotification({
          type: 'error',
          message: errorMessage,
          duration: 5000
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : '予期しないエラーが発生しました'
      
      setError(errorMessage)
      
      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }, [addPatient, addNotification])

  return {
    generatePatient,
    loading,
    error,
    clearError
  }
}