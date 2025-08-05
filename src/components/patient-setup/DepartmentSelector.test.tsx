import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DepartmentSelector } from './DepartmentSelector'

describe('DepartmentSelector', () => {
  it('診療科を選択できる', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(
      <DepartmentSelector
        value="general_medicine"
        onChange={mockOnChange}
      />
    )
    
    // 診療科のカードが表示されているか確認
    expect(screen.getByRole('radiogroup', { name: '診療科選択' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /一般内科/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /循環器科/ })).toBeInTheDocument()
    
    // 循環器科を選択
    const cardiologyCard = screen.getByRole('radio', { name: /循環器科/ })
    await user.click(cardiologyCard)
    
    expect(mockOnChange).toHaveBeenCalledWith('cardiology')
  })

  it('選択中の診療科がハイライト表示される', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DepartmentSelector
        value="cardiology"
        onChange={mockOnChange}
      />
    )
    
    const selectedCard = screen.getByRole('radio', { name: /循環器科/ })
    expect(selectedCard).toHaveAttribute('aria-checked', 'true')
  })

  it('診療科の説明が表示される', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DepartmentSelector
        value="general_medicine"
        onChange={mockOnChange}
      />
    )
    
    // 一般内科の一般的な疾患が表示されているか確認
    expect(screen.getByText(/高血圧症/)).toBeInTheDocument()
    expect(screen.getByText(/2型糖尿病/)).toBeInTheDocument()
  })

  it('disabled状態で操作を無効化する', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(
      <DepartmentSelector
        value="general_medicine"
        onChange={mockOnChange}
        disabled={true}
      />
    )
    
    const cardiologyCard = screen.getByRole('radio', { name: /循環器科/ })
    await user.click(cardiologyCard)
    
    expect(mockOnChange).not.toHaveBeenCalled()
    expect(cardiologyCard).toHaveAttribute('aria-disabled', 'true')
  })

  it('キーボードナビゲーションが機能する', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(
      <DepartmentSelector
        value="general_medicine"
        onChange={mockOnChange}
      />
    )
    
    // 循環器科のradioボタンにフォーカスしてSpaceキーで選択
    const cardiologyRadio = screen.getByRole('radio', { name: /循環器科/ })
    cardiologyRadio.focus()
    await user.keyboard(' ')
    
    expect(mockOnChange).toHaveBeenCalledWith('cardiology')
  })
})