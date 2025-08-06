'use client'

import React, { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { usePatientStore } from '@/store/patient-store'
import { createEncounterId } from '@/types/core'
import dynamic from 'next/dynamic'

// ChatInterfaceコンポーネントを動的インポート（別のエージェントが実装予定）
const ChatInterface = dynamic(
  () => import('@/components/chat/ChatInterface'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">チャット機能を読み込み中...</div>
      </div>
    ),
    ssr: false,
  }
)

export default function SimulationPage() {
  const { patients, activePatientId, loading, error } = usePatientStore()

  const activePatient = activePatientId ? patients[activePatientId] : null

  // 患者が選択されていない場合、ホームにリダイレクト
  useEffect(() => {
    if (!loading && (!activePatientId || !activePatient)) {
      redirect('/')
    }
  }, [activePatientId, activePatient, loading])

  // ローディング状態
  if (loading) {
    return (
      <div
        role="status"
        aria-label="読み込み中"
        className="flex flex-col items-center justify-center h-full bg-white"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">シミュレーションを準備中...</p>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-8">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            シミュレーションの開始に失敗しました
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => redirect('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  // 患者が選択されている場合、チャットインターフェースを表示
  // EncounterIdは患者IDから生成（実際の実装では別のロジックが必要かもしれません）
  const encounterId = createEncounterId(`encounter-${activePatientId}`)
  
  return (
    <div
      role="region"
      aria-label="シミュレーション画面"
      className="h-full bg-white"
    >
      <ChatInterface encounterId={encounterId} />
    </div>
  )
}