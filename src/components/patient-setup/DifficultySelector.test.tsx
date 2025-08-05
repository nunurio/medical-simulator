import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DifficultySelector } from './DifficultySelector'

describe('DifficultySelector', () => {
  it('難易度を選択できる', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(
      <DifficultySelector
        value="beginner"
        onChange={mockOnChange}
      />
    )
    
    // 難易度のカードが表示されているか確認
    expect(screen.getByRole('radiogroup', { name: '難易度選択' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /初級/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /中級/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /上級/ })).toBeInTheDocument()
    
    // 中級を選択
    const intermediateCard = screen.getByRole('radio', { name: /中級/ })
    await user.click(intermediateCard)
    
    expect(mockOnChange).toHaveBeenCalledWith('intermediate')
  })

  it('選択中の難易度がハイライト表示される', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DifficultySelector
        value="advanced"
        onChange={mockOnChange}
      />
    )
    
    const selectedCard = screen.getByRole('radio', { name: /上級/ })
    expect(selectedCard).toHaveAttribute('aria-checked', 'true')
  })

  it('各難易度の特徴が表示される', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DifficultySelector
        value="beginner"
        onChange={mockOnChange}
      />
    )
    
    // 初級の特徴
    expect(screen.getByText(/基本的な症例/)).toBeInTheDocument()
    expect(screen.getByText(/合併症少ない/)).toBeInTheDocument()
    
    // 中級の特徴
    expect(screen.getByText(/複数の疾患/)).toBeInTheDocument()
    expect(screen.getByText(/標準的な複雑さ/)).toBeInTheDocument()
    
    // 上級の特徴
    expect(screen.getByText(/非典型的症状/)).toBeInTheDocument()
    expect(screen.getByText(/診断困難/)).toBeInTheDocument()
    expect(screen.getByText(/時間制約あり/)).toBeInTheDocument()
  })

  it('disabled状態で操作を無効化する', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(
      <DifficultySelector
        value="beginner"
        onChange={mockOnChange}
        disabled={true}
      />
    )
    
    const intermediateCard = screen.getByRole('radio', { name: /中級/ })
    await user.click(intermediateCard)
    
    expect(mockOnChange).not.toHaveBeenCalled()
    expect(intermediateCard).toHaveAttribute('aria-disabled', 'true')
  })

  it('キーボードナビゲーションが機能する', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(
      <DifficultySelector
        value="beginner"
        onChange={mockOnChange}
      />
    )
    
    // 中級のradioボタンにフォーカスしてSpaceキーで選択
    const intermediateRadio = screen.getByRole('radio', { name: /中級/ })
    intermediateRadio.focus()
    await user.keyboard(' ')
    
    expect(mockOnChange).toHaveBeenCalledWith('intermediate')
  })
})