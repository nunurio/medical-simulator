import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MessageInput } from './MessageInput'

describe('MessageInput', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('テキスト入力が正しく動作する', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('メッセージを入力してください...')
    await user.type(input, 'テストメッセージ')
    
    expect(input).toHaveValue('テストメッセージ')
  })

  it('送信ボタンクリックでonSubmitが呼ばれる', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('メッセージを入力してください...')
    const submitButton = screen.getByRole('button', { name: '送信' })
    
    await user.type(input, 'テストメッセージ')
    await user.click(submitButton)
    
    expect(mockOnSubmit).toHaveBeenCalledWith('テストメッセージ')
    expect(input).toHaveValue('')
  })

  it('Enterキーで送信される', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('メッセージを入力してください...')
    
    await user.type(input, 'テストメッセージ')
    await user.keyboard('{Enter}')
    
    expect(mockOnSubmit).toHaveBeenCalledWith('テストメッセージ')
    expect(input).toHaveValue('')
  })

  it('Ctrl+Enterで送信される', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('メッセージを入力してください...')
    
    await user.type(input, 'テストメッセージ')
    await user.keyboard('{Control>}{Enter}{/Control}')
    
    expect(mockOnSubmit).toHaveBeenCalledWith('テストメッセージ')
  })

  it('空の入力では送信されない', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: '送信' })
    
    await user.click(submitButton)
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('isTypingコールバックが動作する', async () => {
    const mockOnTypingChange = vi.fn()
    const user = userEvent.setup()
    render(<MessageInput onSubmit={mockOnSubmit} onTypingChange={mockOnTypingChange} />)
    
    const input = screen.getByPlaceholderText('メッセージを入力してください...')
    
    await user.type(input, 'a')
    expect(mockOnTypingChange).toHaveBeenCalledWith(true)
    
    await user.clear(input)
    expect(mockOnTypingChange).toHaveBeenCalledWith(false)
  })
})