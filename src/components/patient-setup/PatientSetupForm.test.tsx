import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PatientSetupForm } from './PatientSetupForm'

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

describe('PatientSetupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseUIStore.mockReturnValue({
      addNotification: vi.fn(),
      notifications: [],
    })
    
    mockUseSimulationStore.mockReturnValue({
      department: 'general_medicine',
      difficulty: 'beginner',
      setDepartment: vi.fn(),
      setDifficulty: vi.fn(),
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

  it('診療科と難易度選択フォームが表示される', () => {
    render(<PatientSetupForm />)
    
    // フォーム要素が表示されているか確認
    expect(screen.getByRole('form', { name: '患者設定フォーム' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: '診療科選択' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: '難易度選択' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '患者を生成' })).toBeInTheDocument()
  })

  it('フォーム送信時にServer Actionが呼び出される', async () => {
    const user = userEvent.setup()
    
    render(<PatientSetupForm />)
    
    // 循環器科を選択
    const cardiologyOption = screen.getByRole('radio', { name: /循環器科/ })
    await user.click(cardiologyOption)
    
    // 中級を選択
    const intermediateOption = screen.getByRole('radio', { name: /中級/ })
    await user.click(intermediateOption)
    
    // フォーム送信
    const submitButton = screen.getByRole('button', { name: '患者を生成' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockGeneratePatientAction).toHaveBeenCalledWith(
        undefined,
        expect.any(FormData)
      )
    })
  })

  it('送信中はローディング状態を表示する', async () => {
    const user = userEvent.setup()
    
    // Server Actionを遅延させる
    mockGeneratePatientAction.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
    )
    
    render(<PatientSetupForm />)
    
    const submitButton = screen.getByRole('button', { name: '患者を生成' })
    await user.click(submitButton)
    
    // ローディングスピナーまたはローディングテキストが表示される
    expect(screen.getByText(/生成中/)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('エラー時にエラーメッセージを表示する', async () => {
    const user = userEvent.setup()
    
    mockGeneratePatientAction.mockResolvedValue({
      success: false,
      error: 'テストエラーメッセージ',
    })
    
    render(<PatientSetupForm />)
    
    const submitButton = screen.getByRole('button', { name: '患者を生成' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument()
    })
  })

  it('成功時に通知を表示する', async () => {
    const user = userEvent.setup()
    const mockAddNotification = vi.fn()
    
    mockUseUIStore.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
    })
    
    render(<PatientSetupForm />)
    
    const submitButton = screen.getByRole('button', { name: '患者を生成' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        message: '患者が正常に生成されました',
        duration: 3000
      })
    })
  })

  it('onSuccessコールバックプロップが提供された場合、成功時に呼び出される', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = vi.fn()
    const mockAddNotification = vi.fn()
    
    mockUseUIStore.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
    })
    
    render(<PatientSetupForm onSuccess={mockOnSuccess} />)
    
    const submitButton = screen.getByRole('button', { name: '患者を生成' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('onSuccessコールバックが提供されていない場合でも正常に動作する', async () => {
    const user = userEvent.setup()
    const mockAddNotification = vi.fn()
    
    mockUseUIStore.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
    })
    
    render(<PatientSetupForm />)
    
    const submitButton = screen.getByRole('button', { name: '患者を生成' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        message: '患者が正常に生成されました',
        duration: 3000
      })
    })
  })
})