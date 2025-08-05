import React from 'react'
import { PatientSetupForm } from '@/components/patient-setup/PatientSetupForm'

export default function Home() {
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
        <PatientSetupForm />
      </main>
    </div>
  );
}
