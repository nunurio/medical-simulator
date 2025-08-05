import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { usePatientGeneration } from '../usePatientGeneration'

// Zustandストアのモック
vi.mock('@/store/patient-store', () => ({
  usePatientStore: vi.fn()
}))

vi.mock('@/store/ui-store', () => ({
  useUIStore: vi.fn()
}))

vi.mock('@/store/simulation-store', () => ({
  useSimulationStore: vi.fn()
}))

// Server Actionのモック
vi.mock('@/app/actions/generate-patient', () => ({
  generatePatientAction: vi.fn()
}))

import { usePatientStore } from '@/store/patient-store'
import { useUIStore } from '@/store/ui-store'
import { generatePatientAction } from '@/app/actions/generate-patient'

describe('usePatientGeneration', () => {
  const mockAddPatient = vi.fn()
  const mockAddNotification = vi.fn()
  const mockGeneratePatientAction = vi.mocked(generatePatientAction)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Zustandストアのモック設定
    vi.mocked(usePatientStore).mockReturnValue({
      addPatient: mockAddPatient,
      patients: {},
      activePatientId: null,
      loading: false,
      error: null,
      setPatients: vi.fn(),
      updatePatient: vi.fn(),
      removePatient: vi.fn(),
      setActivePatient: vi.fn(),
      loadPatient: vi.fn(),
      updatePatientVitals: vi.fn(),
      addPatientSymptom: vi.fn(),
      clearPatientError: vi.fn()
    })

    vi.mocked(useUIStore).mockReturnValue({
      addNotification: mockAddNotification,
      theme: 'light',
      sidebarOpen: true,
      activeTab: '',
      modals: { orderModal: false, resultModal: false, helpModal: false },
      notifications: [],
      setTheme: vi.fn(),
      toggleSidebar: vi.fn(),
      setActiveTab: vi.fn(),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      removeNotification: vi.fn()
    })
  })

  describe('初期状態', () => {
    it('適切な初期値を返す', () => {
      const { result } = renderHook(() => usePatientGeneration())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(typeof result.current.generatePatient).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
  })

  describe('generatePatient関数', () => {
    it('患者生成の成功時にストアを更新し、成功通知を表示する', async () => {
      const mockPatientData = {
        id: 'patient-001',
        demographics: {
          name: '田中太郎',
          age: 45,
          gender: 'male' as const,
          dateOfBirth: '1979-01-15' as const
        },
        currentConditions: [],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 120, diastolic: 80 },
            heartRate: 72,
            temperature: 36.5,
            respiratoryRate: 16,
            oxygenSaturation: 98
          }
        },
        medicalHistory: { allergies: [], medications: [], surgeries: [] },
        socialHistory: { smokingStatus: 'never', alcoholUse: 'none' },
        familyHistory: []
      }

      mockGeneratePatientAction.mockResolvedValue({
        success: true,
        data: mockPatientData
      })

      const { result } = renderHook(() => usePatientGeneration())

      await act(async () => {
        await result.current.generatePatient({
          department: 'general_medicine',
          difficulty: 'beginner'
        })
      })

      expect(mockGeneratePatientAction).toHaveBeenCalledWith(
        undefined,
        expect.any(FormData)
      )
      expect(mockAddPatient).toHaveBeenCalledWith(mockPatientData)
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        message: '患者が正常に生成されました',
        duration: 3000
      })
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('患者生成の失敗時にエラー状態を更新し、エラー通知を表示する', async () => {
      const errorMessage = '患者生成に失敗しました'
      mockGeneratePatientAction.mockResolvedValue({
        success: false,
        error: errorMessage
      })

      const { result } = renderHook(() => usePatientGeneration())

      await act(async () => {
        await result.current.generatePatient({
          department: 'cardiology',
          difficulty: 'intermediate'
        })
      })

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        message: errorMessage,
        duration: 5000
      })
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.loading).toBe(false)
      expect(mockAddPatient).not.toHaveBeenCalled()
    })

    it('ローディング状態を適切に管理する', async () => {
      let resolvePromise: (value: import('@/app/actions/generate-patient').GeneratePatientActionResult) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockGeneratePatientAction.mockReturnValue(pendingPromise)

      const { result } = renderHook(() => usePatientGeneration())

      expect(result.current.loading).toBe(false)

      // 非同期実行開始
      act(() => {
        result.current.generatePatient({
          department: 'emergency',
          difficulty: 'advanced'
        })
      })

      expect(result.current.loading).toBe(true)

      // Promise解決
      await act(async () => {
        resolvePromise!({
          success: true,
          data: { id: 'test-patient' }
        })
        await pendingPromise
      })

      expect(result.current.loading).toBe(false)
    })

    it('不正なパラメータでバリデーションエラーを表示する', async () => {
      const { result } = renderHook(() => usePatientGeneration())

      await act(async () => {
        await result.current.generatePatient({
          department: '' as import('@/types/state').Department,
          difficulty: 'beginner'
        })
      })

      expect(result.current.error).toBe('診療科と難易度は必須です')
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        message: '診療科と難易度は必須です'
      })
      expect(mockGeneratePatientAction).not.toHaveBeenCalled()
      expect(mockAddPatient).not.toHaveBeenCalled()
    })

    it('clearError関数でエラー状態をクリアできる', async () => {
      const { result } = renderHook(() => usePatientGeneration())

      // まずエラー状態を作る
      await act(async () => {
        await result.current.generatePatient({
          department: '' as import('@/types/state').Department,
          difficulty: 'beginner'
        })
      })

      expect(result.current.error).toBe('診療科と難易度は必須です')

      // エラーをクリア
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })

    it('複数回呼び出しても正しく動作する', async () => {
      const mockPatientData1 = {
        id: 'patient-001',
        demographics: { name: '田中太郎', age: 45, gender: 'male' as const, dateOfBirth: '1979-01-15' as const },
        currentConditions: [],
        vitalSigns: { baseline: { bloodPressure: { systolic: 120, diastolic: 80 }, heartRate: 72, temperature: 36.5, respiratoryRate: 16, oxygenSaturation: 98 } },
        medicalHistory: { allergies: [], medications: [], surgeries: [] },
        socialHistory: { smokingStatus: 'never', alcoholUse: 'none' },
        familyHistory: []
      }

      const mockPatientData2 = {
        id: 'patient-002',
        demographics: { name: '山田花子', age: 32, gender: 'female' as const, dateOfBirth: '1992-06-20' as const },
        currentConditions: [],
        vitalSigns: { baseline: { bloodPressure: { systolic: 110, diastolic: 70 }, heartRate: 68, temperature: 36.3, respiratoryRate: 14, oxygenSaturation: 99 } },
        medicalHistory: { allergies: [], medications: [], surgeries: [] },
        socialHistory: { smokingStatus: 'never', alcoholUse: 'none' },
        familyHistory: []
      }

      mockGeneratePatientAction
        .mockResolvedValueOnce({ success: true, data: mockPatientData1 })
        .mockResolvedValueOnce({ success: true, data: mockPatientData2 })

      const { result } = renderHook(() => usePatientGeneration())

      // 1回目の呼び出し
      await act(async () => {
        await result.current.generatePatient({
          department: 'general_medicine',
          difficulty: 'beginner'
        })
      })

      expect(mockAddPatient).toHaveBeenCalledWith(mockPatientData1)

      // 2回目の呼び出し
      await act(async () => {
        await result.current.generatePatient({
          department: 'cardiology',
          difficulty: 'intermediate'
        })
      })

      expect(mockAddPatient).toHaveBeenCalledWith(mockPatientData2)
      expect(mockGeneratePatientAction).toHaveBeenCalledTimes(2)
      expect(mockAddNotification).toHaveBeenCalledTimes(2)
    })

    it('予期しないエラーを適切にハンドリングする', async () => {
      const networkError = new Error('Network connection failed')
      mockGeneratePatientAction.mockRejectedValue(networkError)

      const { result } = renderHook(() => usePatientGeneration())

      await act(async () => {
        await result.current.generatePatient({
          department: 'emergency',
          difficulty: 'advanced'
        })
      })

      expect(result.current.error).toBe('Network connection failed')
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Network connection failed',
        duration: 5000
      })
      expect(result.current.loading).toBe(false)
      expect(mockAddPatient).not.toHaveBeenCalled()
    })

    it('成功時にonSuccessコールバックが呼び出される', async () => {
      const mockOnSuccess = vi.fn()
      const mockPatientData = {
        id: 'patient-001',
        demographics: {
          name: '田中太郎',
          age: 45,
          gender: 'male' as const,
          dateOfBirth: '1979-01-15' as const
        },
        currentConditions: [],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 120, diastolic: 80 },
            heartRate: 72,
            temperature: 36.5,
            respiratoryRate: 16,
            oxygenSaturation: 98
          }
        },
        medicalHistory: { allergies: [], medications: [], surgeries: [] },
        socialHistory: { smokingStatus: 'never', alcoholUse: 'none' },
        familyHistory: []
      }

      mockGeneratePatientAction.mockResolvedValue({
        success: true,
        data: mockPatientData
      })

      const { result } = renderHook(() => usePatientGeneration())

      await act(async () => {
        await result.current.generatePatient({
          department: 'general_medicine',
          difficulty: 'beginner'
        }, mockOnSuccess)
      })

      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
      expect(mockAddPatient).toHaveBeenCalledWith(mockPatientData)
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        message: '患者が正常に生成されました',
        duration: 3000
      })
    })

    it('失敗時にonSuccessコールバックが呼び出されない', async () => {
      const mockOnSuccess = vi.fn()
      const errorMessage = '患者生成に失敗しました'
      
      mockGeneratePatientAction.mockResolvedValue({
        success: false,
        error: errorMessage
      })

      const { result } = renderHook(() => usePatientGeneration())

      await act(async () => {
        await result.current.generatePatient({
          department: 'cardiology',
          difficulty: 'intermediate'
        }, mockOnSuccess)
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(result.current.error).toBe(errorMessage)
    })

    it('onSuccessコールバックが未提供でも正常に動作する', async () => {
      const mockPatientData = {
        id: 'patient-001',
        demographics: {
          name: '田中太郎',
          age: 45,
          gender: 'male' as const,
          dateOfBirth: '1979-01-15' as const
        },
        currentConditions: [],
        vitalSigns: {
          baseline: {
            bloodPressure: { systolic: 120, diastolic: 80 },
            heartRate: 72,
            temperature: 36.5,
            respiratoryRate: 16,
            oxygenSaturation: 98
          }
        },
        medicalHistory: { allergies: [], medications: [], surgeries: [] },
        socialHistory: { smokingStatus: 'never', alcoholUse: 'none' },
        familyHistory: []
      }

      mockGeneratePatientAction.mockResolvedValue({
        success: true,
        data: mockPatientData
      })

      const { result } = renderHook(() => usePatientGeneration())

      await act(async () => {
        await result.current.generatePatient({
          department: 'general_medicine',
          difficulty: 'beginner'
        })
      })

      expect(mockAddPatient).toHaveBeenCalledWith(mockPatientData)
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        message: '患者が正常に生成されました',
        duration: 3000
      })
    })
  })
})