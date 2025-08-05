'use client'

import React, { ReactNode } from 'react'
import { usePatientStore } from '@/store/patient-store'
import { useUIStore } from '@/store/ui-store'

interface SimulationLayoutProps {
  children: ReactNode
}

export default function SimulationLayout({ children }: SimulationLayoutProps) {
  const { patients, activePatientId, loading, error } = usePatientStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const activePatient = activePatientId ? patients[activePatientId] : null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドバー */}
      <aside
        role="complementary"
        aria-label="患者情報サイドバー"
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden hidden sm:block`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">患者情報</h2>
            <button
              onClick={toggleSidebar}
              aria-label="サイドバーを切り替え"
              className="p-2 hover:bg-gray-100 rounded"
            >
              ☰
            </button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p>読み込み中...</p>
            </div>
          )}

          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && !activePatient && (
            <div className="text-gray-600 p-4">
              <p>患者が選択されていません</p>
              <p className="text-sm mt-2">患者を選択してシミュレーションを開始してください</p>
            </div>
          )}

          {activePatient && (
            <div className="space-y-4">
              {/* 基本情報 */}
              <div>
                <h3 className="font-medium text-gray-900">{activePatient.demographics.firstName} {activePatient.demographics.lastName}</h3>
                <p className="text-sm text-gray-600">
                  {/* 年齢を計算 */}
                  {new Date().getFullYear() - new Date(activePatient.demographics.dateOfBirth).getFullYear()}歳 {activePatient.demographics.gender === 'male' ? '男性' : '女性'}
                </p>
              </div>

              {/* 主訴 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">主訴</h4>
                <p className="text-sm text-gray-600">{activePatient.chiefComplaint}</p>
              </div>

              {/* 現在の症状 */}
              {activePatient.currentConditions && activePatient.currentConditions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">現在の症状</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {activePatient.currentConditions.map((condition, index) => (
                      <li key={index}>{condition.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* バイタルサイン */}
              {activePatient.vitalSigns?.baseline && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">バイタルサイン</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>血圧: {activePatient.vitalSigns.baseline.bloodPressure.systolic}/{activePatient.vitalSigns.baseline.bloodPressure.diastolic} mmHg</p>
                    <p>心拍数: {activePatient.vitalSigns.baseline.heartRate.value}{activePatient.vitalSigns.baseline.heartRate.unit}</p>
                    <p>体温: {activePatient.vitalSigns.baseline.temperature.value}{activePatient.vitalSigns.baseline.temperature.unit}</p>
                    <p>呼吸数: {activePatient.vitalSigns.baseline.respiratoryRate.value}{activePatient.vitalSigns.baseline.respiratoryRate.unit}</p>
                    <p>酸素飽和度: {activePatient.vitalSigns.baseline.oxygenSaturation.value}{activePatient.vitalSigns.baseline.oxygenSaturation.unit}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main
        role="main"
        aria-label="シミュレーションメイン"
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <button
            onClick={toggleSidebar}
            aria-label="サイドバーを切り替え"
            className="sm:hidden p-2 hover:bg-gray-100 rounded mr-4"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            医療シミュレーション
          </h1>
        </div>

        {/* チャットエリア */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}