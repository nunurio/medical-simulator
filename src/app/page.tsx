'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PatientSetupForm } from '@/components/patient-setup/PatientSetupForm'

export default function Home() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handlePatientGenerationSuccess = useCallback(() => {
    setIsNavigating(true)
    router.push('/simulation')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8 lg:p-12">
      <main className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            医療トレーニングシミュレーター
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            診療科と難易度を選択してシミュレーションを開始してください
          </p>
        </div>
        
        {isNavigating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium text-gray-900">シミュレーションページに移動中...</span>
            </div>
          </div>
        )}
        
        <PatientSetupForm onSuccess={handlePatientGenerationSuccess} />
      </main>
    </div>
  );
}
