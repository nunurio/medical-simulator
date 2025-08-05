import React from 'react'
import { render, screen } from '@testing-library/react'
import { TypingIndicator } from './TypingIndicator'

describe('TypingIndicator', () => {
  it('isTypingがtrueの時にタイピングインジケーターを表示する', () => {
    render(<TypingIndicator isTyping={true} />)
    
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    expect(screen.getByText('入力中')).toBeInTheDocument()
  })

  it('isTypingがfalseの時にタイピングインジケーターを表示しない', () => {
    render(<TypingIndicator isTyping={false} />)
    
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })

  it('ドットアニメーションが含まれている', () => {
    render(<TypingIndicator isTyping={true} />)
    
    const dots = screen.getAllByTestId('typing-dot')
    expect(dots).toHaveLength(3)
  })

  it('アクセシビリティ属性が正しく設定されている', () => {
    render(<TypingIndicator isTyping={true} />)
    
    const indicator = screen.getByTestId('typing-indicator')
    expect(indicator).toHaveAttribute('role', 'status')
    expect(indicator).toHaveAttribute('aria-live', 'polite')
    expect(indicator).toHaveAttribute('aria-label', '相手が入力中です')
  })

  it('カスタムクラス名が適用される', () => {
    render(<TypingIndicator isTyping={true} className="custom-class" />)
    
    const indicator = screen.getByTestId('typing-indicator')
    expect(indicator).toHaveClass('custom-class')
  })
})