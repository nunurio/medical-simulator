import React from 'react'
import { MEDICAL_SPECIALTIES, type MedicalSpecialtyKey } from '@/config/medical-knowledge'
import { Card } from '@/components/ui/Card'

interface DepartmentSelectorProps {
  value: MedicalSpecialtyKey
  onChange: (value: MedicalSpecialtyKey) => void
  disabled?: boolean
}

const departmentLabels: Record<MedicalSpecialtyKey, string> = {
  general_medicine: '一般内科',
  cardiology: '循環器科',
  gastroenterology: '消化器科',
  respiratory: '呼吸器科',
  neurology: '神経科',
  emergency: '救急科',
}

export function DepartmentSelector({ value, onChange, disabled = false }: DepartmentSelectorProps) {
  return (
    <div role="radiogroup" aria-label="診療科選択" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(MEDICAL_SPECIALTIES).map(([key, specialty]) => {
        const isSelected = value === key
        
        return (
          <Card 
            key={key}
            className={`
              relative cursor-pointer transition-all duration-200 hover:shadow-md
              ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !disabled && onChange(key as MedicalSpecialtyKey)}
          >
            <input
              type="radio"
              id={key}
              name="department"
              value={key}
              checked={isSelected}
              onChange={() => onChange(key as MedicalSpecialtyKey)}
              disabled={disabled}
              aria-disabled={disabled}
              aria-checked={isSelected}
              className="sr-only"
            />
            <label 
              htmlFor={key}
              className="block p-4 cursor-pointer"
            >
              <div className="font-semibold text-lg mb-2 text-gray-900">
                {departmentLabels[key as MedicalSpecialtyKey]}
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">
                {specialty.commonDiseases.slice(0, 3).join('、')}
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