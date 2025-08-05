import React from 'react'
import { DIFFICULTY_PROFILES, type DifficultyLevel } from '@/config/medical-knowledge'
import { Card } from '@/components/ui/Card'

interface DifficultySelectorProps {
  value: DifficultyLevel
  onChange: (value: DifficultyLevel) => void
  disabled?: boolean
}

const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
}

const difficultyFeatures: Record<DifficultyLevel, string[]> = {
  beginner: ['基本的な症例', '合併症少ない'],
  intermediate: ['複数の疾患', '標準的な複雑さ'],
  advanced: ['非典型的症状', '診断困難', '時間制約あり'],
}

const difficultyColors: Record<DifficultyLevel, { bg: string; border: string; icon: string }> = {
  beginner: { 
    bg: 'bg-green-50', 
    border: 'border-green-500', 
    icon: 'text-green-600' 
  },
  intermediate: { 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-500', 
    icon: 'text-yellow-600' 
  },
  advanced: { 
    bg: 'bg-red-50', 
    border: 'border-red-500', 
    icon: 'text-red-600' 
  },
}

const difficultyIcons: Record<DifficultyLevel, string> = {
  beginner: '🟢',
  intermediate: '🟡', 
  advanced: '🔴',
}

export function DifficultySelector({ value, onChange, disabled = false }: DifficultySelectorProps) {
  return (
    <div role="radiogroup" aria-label="難易度選択" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.keys(DIFFICULTY_PROFILES).map((key) => {
        const difficultyKey = key as DifficultyLevel
        const isSelected = value === difficultyKey
        const colors = difficultyColors[difficultyKey]
        
        return (
          <Card 
            key={difficultyKey}
            className={`
              relative cursor-pointer transition-all duration-200 hover:shadow-md
              ${isSelected ? `${colors.border} ${colors.bg}` : 'border-gray-200 hover:border-gray-300'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !disabled && onChange(difficultyKey)}
          >
            <input
              type="radio"
              id={difficultyKey}
              name="difficulty"
              value={difficultyKey}
              checked={isSelected}
              onChange={() => onChange(difficultyKey)}
              disabled={disabled}
              aria-disabled={disabled}
              aria-checked={isSelected}
              className="sr-only"
            />
            <label 
              htmlFor={difficultyKey}
              className="block p-6 cursor-pointer text-center"
            >
              <div className="text-4xl mb-3">
                {difficultyIcons[difficultyKey]}
              </div>
              <div className="font-bold text-xl mb-3 text-gray-900">
                {difficultyLabels[difficultyKey]}
              </div>
              <div className="space-y-1">
                {difficultyFeatures[difficultyKey].map((feature, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {feature}
                  </div>
                ))}
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-4 h-4 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              )}
            </label>
          </Card>
        )
      })}
    </div>
  )
}