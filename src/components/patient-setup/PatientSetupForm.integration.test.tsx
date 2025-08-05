import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PatientSetupForm } from './PatientSetupForm'
import { DepartmentSelector } from './DepartmentSelector'
import { DifficultySelector } from './DifficultySelector'

// Zustandストアのモック
vi.mock('@/store/ui-store', () => ({
  useUIStore: vi.fn(() => ({
    addNotification: vi.fn(),
    notifications: [],
  })),
}))

vi.mock('@/store/simulation-store', () => ({
  useSimulationStore: vi.fn(() => ({
    department: 'general_medicine',
    difficulty: 'beginner',
    setDepartment: vi.fn(),
    setDifficulty: vi.fn(),
  })),
}))

// Server Actionのモック
vi.mock('@/app/actions/generate-patient', () => ({
  generatePatientAction: vi.fn(),
}))

import { useUIStore } from '@/store/ui-store'
import { useSimulationStore } from '@/store/simulation-store'
import { generatePatientAction } from '@/app/actions/generate-patient'

const mockUseUIStore = vi.mocked(useUIStore)
const mockUseSimulationStore = vi.mocked(useSimulationStore)
const mockGeneratePatientAction = vi.mocked(generatePatientAction)

describe('患者設定フォーム統合テスト', () => {
  let mockSetDepartment: ReturnType<typeof vi.fn>
  let mockSetDifficulty: ReturnType<typeof vi.fn>
  let mockAddNotification: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSetDepartment = vi.fn()
    mockSetDifficulty = vi.fn()
    mockAddNotification = vi.fn()
    
    mockUseUIStore.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
    })
    
    mockUseSimulationStore.mockReturnValue({
      department: 'general_medicine',
      difficulty: 'beginner',
      setDepartment: mockSetDepartment,
      setDifficulty: mockSetDifficulty,
    })

    mockGeneratePatientAction.mockResolvedValue({
      success: true,
      data: {
        id: { __brand: 'PatientId' } as import('@/types/core').PatientId,
        scenarioId: { __brand: 'ScenarioId' } as import('@/types/core').ScenarioId,
        demographics: {
          firstName: 'テスト',
          lastName: '患者',
          dateOfBirth: '1958-01-01' as import('@/types/core').ISODate,
          gender: 'male' as const,
          bloodType: 'O+' as const,
        },
        chiefComplaint: 'テスト主訴',
        presentIllness: 'テスト現病歴',
        medicalHistory: {
          surgicalHistory: [],
          familyHistory: [],
          pastIllnesses: [],
          hospitalizations: [],
        },
        currentConditions: [],
        medications: [],
        allergies: [],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' as const },
            heartRate: { value: 72, unit: 'bpm' as const },
            temperature: { value: 36.5, unit: 'celsius' as const },
            respiratoryRate: { value: 16, unit: 'breaths/min' as const },
            oxygenSaturation: { value: 98, unit: '%' as const },
            recordedAt: new Date().toISOString() as import('@/types/core').ISODateTime,
          },
          trend: 'stable' as const,
          criticalValues: {
            isHypotensive: false,
            isHypertensive: false,
            isTachycardic: false,
            isBradycardic: false,
            isFebrile: false,
            isHypoxic: false,
          }
        },
        socialHistory: {},
        insurance: {
          provider: 'テスト保険',
          policyNumber: 'TEST123',
          validUntil: '2024-12-31' as import('@/types/core').ISODate,
        },
      },
    })
  })

  it('完全なユーザージャーニー: 診療科選択→難易度選択→患者生成', async () => {
    const user = userEvent.setup()
    
    render(<PatientSetupForm />)
    
    // ステップ1: 診療科選択
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('診療科を選択')).toBeInTheDocument()
    
    const cardiologyOption = screen.getByRole('radio', { name: /循環器科/ })
    await user.click(cardiologyOption)
    
    expect(mockSetDepartment).toHaveBeenCalledWith('cardiology')
    
    // ステップ2: 難易度選択
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('難易度を選択')).toBeInTheDocument()
    
    const advancedOption = screen.getByRole('radio', { name: /上級/ })
    await user.click(advancedOption)
    
    expect(mockSetDifficulty).toHaveBeenCalledWith('advanced')
    
    // ステップ3: 患者生成
    const submitButton = screen.getByRole('button', { name: /患者を生成/ })
    expect(submitButton).toBeInTheDocument()
    
    await user.click(submitButton)
    
    // Server Actionが呼び出される
    await waitFor(() => {
      expect(mockGeneratePatientAction).toHaveBeenCalledWith(
        undefined,
        expect.any(FormData)
      )
    })
    
    // 成功通知が表示される
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'success',
      message: '患者が正常に生成されました',
      duration: 3000
    })
  })

  it('コンポーネント間の状態同期が正しく動作する', async () => {
    const user = userEvent.setup()
    
    // 初期状態を更新
    mockUseSimulationStore.mockReturnValue({
      department: 'gastroenterology',
      difficulty: 'intermediate',
      setDepartment: mockSetDepartment,
      setDifficulty: mockSetDifficulty,
    })
    
    render(<PatientSetupForm />)
    
    // 消化器科が選択されている
    const gastroOption = screen.getByRole('radio', { name: /消化器科/ })
    expect(gastroOption).toHaveAttribute('aria-checked', 'true')
    
    // 中級が選択されている
    const intermediateOption = screen.getByRole('radio', { name: /中級/ })
    expect(intermediateOption).toHaveAttribute('aria-checked', 'true')
    
    // 異なる選択肢を選択
    const neurologyOption = screen.getByRole('radio', { name: /神経科/ })
    await user.click(neurologyOption)
    
    expect(mockSetDepartment).toHaveBeenCalledWith('neurology')
  })

  it('単体のDepartmentSelectorが独立して動作する', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(
      <DepartmentSelector
        value="general_medicine"
        onChange={mockOnChange}
      />
    )
    
    const emergencyOption = screen.getByRole('radio', { name: /救急科/ })
    await user.click(emergencyOption)
    
    expect(mockOnChange).toHaveBeenCalledWith('emergency')
  })

  it('単体のDifficultySelectorが独立して動作する', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(
      <DifficultySelector
        value="beginner"
        onChange={mockOnChange}
      />
    )
    
    const advancedOption = screen.getByRole('radio', { name: /上級/ })
    await user.click(advancedOption)
    
    expect(mockOnChange).toHaveBeenCalledWith('advanced')
  })

  it('フォーム送信時に適切なFormDataが作成される', async () => {
    const user = userEvent.setup()
    
    // 特定の診療科と難易度に設定
    mockUseSimulationStore.mockReturnValue({
      department: 'respiratory',
      difficulty: 'advanced',
      setDepartment: mockSetDepartment,
      setDifficulty: mockSetDifficulty,
    })
    
    render(<PatientSetupForm />)
    
    const submitButton = screen.getByRole('button', { name: /患者を生成/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockGeneratePatientAction).toHaveBeenCalledWith(
        undefined,
        expect.any(FormData)
      )
    })
    
    // FormDataの内容を検証
    const formDataCall = mockGeneratePatientAction.mock.calls[0][1] as FormData
    expect(formDataCall.get('department')).toBe('respiratory')
    expect(formDataCall.get('difficulty')).toBe('advanced')
  })

  it('エラー状態でもフォームが正しく動作する', async () => {
    const user = userEvent.setup()
    
    mockGeneratePatientAction.mockResolvedValue({
      success: false,
      error: '統合テストエラー',
    })
    
    render(<PatientSetupForm />)
    
    const submitButton = screen.getByRole('button', { name: /患者を生成/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('統合テストエラー')).toBeInTheDocument()
    })
    
    // エラー後もフォームは操作可能
    const cardiologyOption = screen.getByRole('radio', { name: /循環器科/ })
    await user.click(cardiologyOption)
    
    expect(mockSetDepartment).toHaveBeenCalledWith('cardiology')
  })
})